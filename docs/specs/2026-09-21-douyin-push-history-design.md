# 抖音推送记录持久化 + 作品「已推送」标记 · 设计 spec

> 日期：2026-09-21
> 适用：`抖音作品推送到eagle.user.js`（当前 1.3.2，esbuild 打包产物）
> 状态：待用户审阅
> 范围决定：**先只做抖音**，但记录 schema 预留 `platform` 字段，便于以后扩到微博 / 小红书

---

## 1. 目标与成功判据

**目标**
1. **推送记录持久化**：把「某个作品是否已推送过 Eagle、什么时候推的、推到哪个文件夹 / 带了哪些标签」存下来，跨会话、跨刷新有效。
2. **在作品上显示「已推送」**：作者主页的作品卡片、详情页，能直接看出这个作品推过没有。

**成功判据**
- 推送成功后记录写入；刷新 / 重开浏览器后仍在。
- 作者主页卡片在推送后立刻出现「已推送」徽标，刷新后仍在；虚拟滚动来回不丢、不错位。
- 控制台 `window.__dyPush.list()` 能看到结构化记录（字段完整、可读）。
- 关闭开关后既不写记录也不显示徽标。
- 现有推送 / 下载功能零回归。

**明确不做（YAGNI）**
- 不做云端同步、跨设备共享。
- 不做「Eagle 里删了素材就自动同步删除记录」（只提供手动校正入口）。
- 不做三个脚本统一（只预留字段）。
- 不改动现有推送、下载、图集、作者归类等逻辑。

---

## 2. 已核实的现状（复用的地基，均来自现产物）

| 能力 | 现状 | 位置 / 标识 |
|---|---|---|
| IndexedDB 封装 | **已有**，含 Promise 包装与 blocked 处理 | `DB_NAME = "dy-dl-profile-download-state"`、`DB_VERSION = 1`、`STORE_NAME = "profile-download-state"`、`getProfileStateDB()`、`requestResult()`、`transactionComplete()` |
| 记录清理模式 | **已有**（条数上限 + TTL） | `MAX_STORED_PROFILE_STATES = 30`、`PROFILE_STATE_TTL_MS = 90*24*60*60*1e3` |
| 配置持久化 | `localStorage` + 变更事件 | `Config` 类、`config_change` 事件、`setEagleField({...})` |
| 设置项 UI | preact（`u3` = h）+ 样式类 | `c3.row` / `c3.label` / `c3.hintText`，照抄「去重」那一排即可 |
| 卡片注入点 | **已有**，含幂等类名与点位 | `_handleProfileCard(card)`、`this.feed_card_selector_cls`、`badgeGroup`（absolute, top/left 10px, flex column）|
| 徽标工厂 | **已有** | `makeStatusBadge(className)` → 27px 圆角胶囊、`#2b2b2d` 底、白字 |
| 卡片数据 | 能拿到作品 id | `profilePageHandler.dataService._extractFeedMedia(card)` → `{ awemeId, ... }` |
| 详情页入口 | 播放器「插件」菜单 | `mediaHandler.push_current_to_eagle()` |
| 推送汇聚点 | 所有推送都走它 | `_download_media_logic(media, { downloaderOverride: "eagle", addHistory: false })` |
| 真正的推送函数 | **记录写入点** | `download_one_url()` 的 `case "eagle"` → **`eagle_push(url, filename_input, options)`**（`options.media` 含 `awemeId`）|
| 结果提示 | **已有** | `createEaglePushToast()`、`EAGLE_PUSH_TOAST_MS = 3e3` |
| 存储通道 | `@grant` 仅 `GM_xmlhttpRequest`，**无 GM_setValue** | 持久化沿用 IndexedDB / localStorage（既定路线）|

> 结论：两个需求都不是"从零做"，而是**在现成的存储封装 + 现成的卡片徽标体系上扩展**。

---

## 3. 设计

### 3.1 记录存储（M1）

**方案**：复用同一个 IndexedDB，新增 store；`DB_VERSION` 由 `1` 升到 `2`，在 `onupgradeneeded` 里**幂等**创建新 store（不动原 `profile-download-state`）。

```js
var PUSH_DB_NAME = "dy-dl-profile-download-state";   // 同一个 DB
var PUSH_DB_VERSION = 2;                              // 1 -> 2
var PUSH_STORE = "push-records";
// onupgradeneeded 内：
if (!db.objectStoreNames.contains(PUSH_STORE)) {
  const st = db.createObjectStore(PUSH_STORE, { keyPath: "key" });   // key = `${platform}:${awemeId}`
  st.createIndex("by-pushedAt", "pushedAt");
}
```

**记录结构**（`platform` 预留扩展位）

```ts
{
  key: "douyin:7301234567890123456",  // 主键：platform:awemeId
  platform: "douyin",
  awemeId: "7301234567890123456",
  pushedAt: 1789000000000,            // 最近一次成功推送时间
  pushCount: 1,                       // 成功推送次数（重复推送累加）
  folderId: "", folderName: "",       // 目标文件夹
  tags: [],                           // 本次推送带的标签
  name: "作者_20260921_作品名",        // 素材名（用于回溯 Eagle 里的文件）
  mediaType: "video" | "image",
  mediaCount: 1,                      // 本次推送的媒体数（图集 > 1）
  pageUrl: "https://www.douyin.com/video/7301...",
  apiStyle: "v1" | "v2",              // 实际使用的 Eagle API 风格
  itemIds: []                         // v2 才有素材 id；v1 为空数组
}
```

**清理策略**（沿用既有模式）
- `MAX_PUSH_RECORDS`（默认 `5000`）：超出按 `pushedAt` 最旧淘汰。
- `PUSH_RECORD_TTL_MS`：默认 `365 天`；设置里可选「永久保留」（`0` 表示不过期）。
- 清理时机：写入后低频触发（例如每 50 次写入或每 24h 一次），避免每次写都全表扫。

**内存缓存**：`Map<awemeId, record>`；启动时全量加载一次，写入时同步更新 —— 卡片渲染必须**同步**判断，不能每次 await IDB。

**读写 API**（模块内单例，风格对齐 `_ProfileDownloadState`）

```js
PushHistory.add(media, { folderId, folderName, tags, name, mediaType, mediaCount, apiStyle, itemIds })
PushHistory.get(awemeId)      // 同步，走缓存
PushHistory.has(awemeId)      // 同步
PushHistory.remove(awemeId)
PushHistory.clear()
PushHistory.list()            // 全部记录（按 pushedAt 倒序）
PushHistory.stats()           // { count, oldest, newest }
PushHistory.init()            // 打开 DB + 预热缓存（幂等）
```

**写入点**：`eagle_push()` 返回 `{ ok: true }` 的分支
- 只记成功；失败不写（保持「已推送」语义单一）。失败信息继续交给现有 toast。
- 注意 `_download_media_logic` 传下来的 `options.media` 就是 `_extractFeedMedia` 的结果，`awemeId` 一定存在；若确实拿不到 id 则跳过写入并 `console.warn`。

**调试入口**（便于你自查 / 验收）

```js
window.__dyPush = {
  list(), get(id), has(id), remove(id), clear(), stats(), version: "1"
}
```

### 3.2 卡片与详情页的「已推送」标记（M2）

**作者主页卡片**：在 `_handleProfileCard(card)` 里，现有 `badgeGroup` 内追加一枚徽标。

```js
const rec = PushHistory.get(awemeId);
if (rec && Config.global.features.push_badge !== false) {
  const el = makeStatusBadge("dy-dl-feed-pushed");     // 复用现有工厂
  el.textContent = rec.pushCount > 1 ? `已推送 ×${rec.pushCount}` : "已推送";
  el.title = `推送到「${rec.folderName || "库根目录"}」· ${new Date(rec.pushedAt).toLocaleString()}`;
  statusRow.appendChild(el);
}
```

- 视觉：沿用 27px 胶囊，但用**绿色系**（`background: #1f6f3f`）与现有黑底状态徽标区分。
- 幂等：类名 `dy-dl-feed-pushed` 参与现有 `feed_card_selector_cls` 同级判断；卡片被复用（虚拟滚动）时，**按当前 `awemeId` 重建**而不是只判断"有没有徽标"。
- 推送成功后**立即更新**：`refreshPushedBadge(awemeId)` —— 找到页面中该 id 的卡片并重跑一次徽标渲染，无需刷新。
- 点击徽标（可选增强，二期）：弹出小层显示推送时间 / 文件夹 / 标签 / 次数；一期先用 `title` 属性。

**详情页**：`push_current_to_eagle()` 成功后，把「已推送」状态显示在现有 `dy-dl-video-btn` 附近（复用同一个 `makeStatusBadge`），并在 `current_media.awemeId` 命中记录时于菜单项旁标注。

**抗覆盖**：抖音卡片会被重渲染 / 复用，沿用 `github-cn` 里验证过的思路 —— 幂等类名 + 复用检测（记录卡片当前的 `awemeId`，不一致就重建徽标）+ 现有 `MutationObserver` 再次触发注入。

### 3.3 设置项与清理入口（M3）

加在现有 Eagle 配置区（`renderEagleFields` 的「去重」那一排下方），照抄 `c3.row` 结构：

| 设置 | 键 | 类型 | 默认 |
|---|---|---|---|
| 记录已推送的作品 | `push_history` | 开关 | 开 |
| 卡片显示「已推送」徽标 | `push_badge` | 开关 | 开 |
| 记录保留时长 | `push_record_ttl` | 单选：365 天 / 永久 | 365 天 |
| 清空推送记录 | — | 按钮（显示当前条数，二次确认后清空并移除页面徽标）| — |

按钮文案建议：`清空推送记录（当前 N 条）`。

### 3.4 与现有 `skip_existing` 的关系

- `skip_existing`：查 **Eagle 库**（来源 URL + 文件名子串）→ 权威但慢，每次推送都要请求 Eagle。
- 本地记录：快、离线可用，但可能与 Eagle 实际状态不一致（用户手动删过素材）。
- **两者互补，默认都开**：
  - 推送前置判断优先用本地记录（快路径），命中即跳过并 toast 提示「本地记录显示已推送」。
  - 若本地未命中但 `skip_existing` 在 Eagle 里查到 → 视为已推送，**补写记录**（把记录校正到与 Eagle 一致）。
  - 提供「以 Eagle 为准重建记录」的手动入口（二期可选）。

---

## 4. 实现约束与技术细节

1. **在打包产物上改**：所有修改用"精确锚点 + 命中唯一性校验"的方式做（沿用本项目既有流程），改完必须 `node --check`。
2. **产物变量名已 mangle**：新增代码只能复用**同一作用域内已存在**的标识符（如 `makeStatusBadge`、`c3.row`、`u3`、`Config`、`getProfileStateDB`、`requestResult`、`transactionComplete`）；不要假设存在未被引用的内部名。
3. **DB 版本升级**：`onupgradeneeded` 里创建 store 必须幂等；`onblocked`（其他标签页占用旧版本）已有处理，升级期间不抛到用户可见的报错。
4. **Eagle v1 的 `addFromURL` 不返回素材 id** → `itemIds` 留空数组；v2 才填。不要依赖它做去重。
5. **`localStorage` 配置容量**：新增开关都进 `Config`，键名前缀沿用现有风格（`eagle.*` 域）。
6. **不写 `GM_setValue`**：`@grant` 不含该权限，且现有代码不用它，保持一致。

---

## 5. 验收方式

**自动化（我能跑的）**
- `node --check 抖音作品推送到eagle.user.js`（语法）
- 锚点唯一性校验（每次替换 `count == 1`）
- 静态自检：新增标识符全部来自同一作用域的既有名字（避免引用不存在的 mangle 名）

**真机手测清单（需要你执行，我无法访问抖音）**
1. 作者主页推送 1 个作品 → 卡片出现「已推送」徽标。
2. 刷新页面 → 徽标仍在（持久化生效）。
3. 控制台 `__dyPush.list()` → 记录字段完整（id / 时间 / 文件夹 / 素材名）。
4. `__dyPush.stats()` → 条数正确。
5. 详情页推送 → 详情页出现「已推送」状态。
6. 同一作品再推一次 → `pushCount` 变 2，徽标显示「已推送 ×2」。
7. 虚拟滚动（滚到列表下方再回来）→ 徽标不丢、不错位。
8. 关闭「卡片显示徽标」→ 徽标即刻消失；关闭「记录」→ 再推送不写记录。
9. 「清空推送记录」→ `__dyPush.list()` 为空、页面徽标消失。
10. 回归：不勾选任何标签推送、图集推送、作者名归类，行为与 1.3.2 一致。

---

## 6. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| 抖音卡片虚拟滚动 / 重渲染 | 徽标错位或丢失 | 幂等类名 + 按 `awemeId` 重建 + 复用现有 `MutationObserver` |
| 打包产物上改动 | 误伤其他逻辑 | 精确锚点 + `count == 1` 校验 + `node --check`；改动集中在新增函数与两处调用点 |
| IndexedDB 升级被 blocked | 记录层不可用 | 已有 `onblocked` 处理；记录层失败时**降级为不写不显示**，绝不影响推送主流程 |
| 记录与 Eagle 实际状态漂移 | 显示"已推送"但 Eagle 里没有 | 以 Eagle 为准的补写/校正逻辑（3.4）+ 手动删除单条记录的入口 |
| 我无法实测抖音 | 视觉与交互需迭代 | 先做 M1（可确定性验证）、再做 M2；每步给你可执行的验证命令 |
| 详情页 / 主页 DOM 与代码假设不符 | 徽标不出现 | 保留开关可一键关闭；必要时你先给我一份真实卡片 DOM 片段 |

---

## 7. 交付节奏与版本

- 版本：抖音 `1.3.2` → **`1.4.0`**（新增功能，走 minor）
- 三个提交，每个都可独立回滚：
  1. **M1 记录层**：IDB store + 读写 API + 写入点 + `__dyPush` 调试入口（无 UI 变化）
  2. **M2 徽标**：卡片 + 详情页标记、推送后即时刷新、抗覆盖
  3. **M3 设置与清理**：4 个设置项 + 清空记录 + README 同步
- 每个提交后：`node --check` → push → GitHub API 复核远端内容
- README 需同步：脚本表版本、抖音说明段加「推送记录与已推送标记」

---

## 8. 工作量估计

| 阶段 | 新增代码 | 说明 |
|---|---|---|
| M1 记录层 | ~150 行 | 照抄现有 IndexedDB 封装模式，风险最低 |
| M2 徽标 | ~150 行 | 复用 `makeStatusBadge` 与 `badgeGroup`，主要成本在复用/重渲染的处理 |
| M3 设置与清理 | ~100 行 | 照抄现有设置行 + 一个确认弹层 |
| 合计 | **~400 行** | 我 1–2 轮实现 + 1 轮验证；你 1–2 轮真机反馈 |

---

## 9. 待你确认的点

1. **记录保留策略**：默认 365 天 + 上限 5000 条，是否合适？（也可选"永久保留"作为默认）
2. **徽标文案**：`已推送` / `已推送 ×2`，是否够用？要不要显示文件夹名（`已推送 → 我喜欢的`）？
3. **是否要"本地记录命中即跳过推送"**：默认建议**只在 toast 里提示并仍然推送**（用户若手动推第二遍是有意的），还是直接跳过？
4. **详情页标记位置**：放在播放器右侧按钮组（现有 `.dy-dl-video-btn` 旁）是否可以？
