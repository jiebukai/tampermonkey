# Tampermonkey 脚本合集

把小红书 / 抖音作品一键推送到本地 [Eagle](https://eagle.cool/) 素材库的用户脚本（UserScript）。

## 脚本列表

| 脚本 | 版本 | 适用站点 | 说明 |
| --- | --- | --- | --- |
| `抖音推送eagle.user.js` | 1.3.0 | `https://*.douyin.com/*` | 作品详情页的播放器「插件」菜单、作者主页右下角浮动面板：把当前作品（视频或整套图集）推送到 Eagle，支持勾选多个作品批量推送；可按作者名归类（追加为标签，或在目标文件夹下自动建同名子文件夹）；动图（实况）格式可选高清图（webp）/ 动图（mp4）/ 两者都要；可开启「下载原图」（图片优先取原图地址，取不到自动回退到展示图）；保留上游的下载能力 |
| `小红书推送eagle.user.js` | 1.0.1 | `www.xiaohongshu.com`、`www.rednote.com` | 作品（图文 / 视频）推送到 Eagle，可选目标文件夹与标签；支持手动输入标签、快捷键、可拖动悬浮按钮、下载当前作品 |

## 前置条件

- 浏览器 + [Tampermonkey](https://www.tampermonkey.net/)
- 本地运行 [Eagle](https://eagle.cool/) 桌面版，默认 API 地址 `http://127.0.0.1:41595`

两个脚本走同一套 Eagle 接口契约：优先调用 `/api/item/addFromURL`（Eagle 4.0 桌面版）或 `/api/v2/item/add`，运行时自动探测 API 风格并在 404 时回退；按 `url` + 文件名查重，避免重复入库；素材的来源 URL 写作品页地址，annotation 写入作者 / 发布时间 / 作品 ID 以便回溯。

## 安装

本仓库为 **public**，可直接用 raw 链接安装（Tampermonkey「实用工具 → 从 URL 安装」），或下载文件后拖入浏览器：

| 脚本 | 安装链接 |
| --- | --- |
| 抖音图集/视频推送eagle | <https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E6%8A%96%E9%9F%B3%E6%8E%A8%E9%80%81eagle.user.js> |
| 小红书图集/视频推送eagle | <https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E6%8E%A8%E9%80%81eagle.user.js> |

## 关于自动更新

两个脚本的 `@namespace` / `@downloadURL` / `@updateURL` / `@supportURL` 均指向本仓库，用于**切断与上游脚本的更新关联**，避免 Tampermonkey 把本地改动自动更新回上游版本。仓库为 public，raw 链接可匿名访问，因此 Tampermonkey 会按 `@version` 比较并自动更新到本仓库发布的新版本。

## 使用

**抖音**：作品详情页 → 播放器「插件」菜单 → 「存到 Eagle」；或作者主页右下角浮动面板 → 勾选多个作品 → 「存 Eagle」。目标文件夹与标签在「设置 → 下载器配置 → 类型选 Eagle」中配置（未选择标签时素材不会写入任何标签）。

**小红书**：打开作品页使用悬浮按钮 / 快捷键唤起面板，选择目标文件夹与标签后推送；也可单独下载当前作品。

## 来源与许可

- `抖音推送eagle.user.js` 衍生自 [zhzLuke96/douyin-dl-user-js](https://github.com/zhzLuke96/douyin-dl-user-js)（MIT），在 v1.5.15 基础上增加了 Eagle 推送能力。脚本头部保留了 `@license MIT` 声明，上游作者与来源说明保留在脚本头部注释块中。
- `小红书推送eagle.user.js` 为自研脚本，复用同一套 Eagle 接口契约，只覆盖小红书 / rednote 的作品页。
