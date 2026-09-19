# Tampermonkey 脚本合集

把小红书 / 抖音作品一键推送到本地 [Eagle](https://eagle.cool/) 素材库的用户脚本（UserScript）。

## 脚本列表

| 脚本 | 版本 | 适用站点 | 说明 |
| --- | --- | --- | --- |
| `抖音推送eagle.user.js` | 1.6.4 | `https://*.douyin.com/*` | 作品详情页的播放器「插件」菜单、作者主页右下角浮动面板：把当前作品（视频或整套图集）推送到 Eagle，支持勾选多个作品批量推送；保留上游的下载能力 |
| `小红书推送eagle.user.js` | 1.0.5 | `www.xiaohongshu.com`、`www.rednote.com` | 作品（图文 / 视频）推送到 Eagle，可选目标文件夹与标签；支持手动输入标签、快捷键、可拖动悬浮按钮、下载当前作品 |

## 前置条件

- 浏览器 + [Tampermonkey](https://www.tampermonkey.net/)
- 本地运行 [Eagle](https://eagle.cool/) 桌面版，默认 API 地址 `http://127.0.0.1:41595`

两个脚本走同一套 Eagle 接口契约：优先调用 `/api/item/addFromURL`（Eagle 4.0 桌面版）或 `/api/v2/item/add`，运行时自动探测 API 风格并在 404 时回退；按 `url` + 文件名查重，避免重复入库；素材的来源 URL 写作品页地址，annotation 写入作者 / 发布时间 / 作品 ID 以便回溯。

## 安装

本仓库为 **private**，因此 `raw` 链接无法匿名安装、Tampermonkey 的自动更新也不可用：

1. 下载对应的 `.user.js` 文件，拖入浏览器交给 Tampermonkey 安装；
2. 或在本机克隆仓库后，用 `file://` 打开脚本完成安装。

升级时重新下载覆盖安装即可。

## 关于自动更新

两个脚本的 `@namespace` / `@downloadURL` / `@updateURL` / `@supportURL` 均指向本仓库，用于**切断与上游脚本的更新关联**，避免 Tampermonkey 把本地改动自动更新回上游版本。由于本仓库是 private，raw 链接无法匿名访问，因此自动更新实际不可用，升级仍以手动重新安装为准。

## 使用

**抖音**：作品详情页 → 播放器「插件」菜单 → 「存到 Eagle」；或作者主页右下角浮动面板 → 勾选多个作品 → 「存 Eagle」。目标文件夹与标签在「设置 → 下载器配置 → 类型选 Eagle」中配置（未选择标签时素材不会写入任何标签）。

**小红书**：打开作品页使用悬浮按钮 / 快捷键唤起面板，选择目标文件夹与标签后推送；也可单独下载当前作品。

## 来源与许可

- `抖音推送eagle.user.js` 衍生自 [zhzLuke96/douyin-dl-user-js](https://github.com/zhzLuke96/douyin-dl-user-js)（MIT），在 v1.5.15 基础上增加了 Eagle 推送能力。脚本头部保留了上游的 `@author`（zhzluke96）、`@license MIT`、`@supportURL` 等声明。
- `小红书推送eagle.user.js` 为自研脚本，复用同一套 Eagle 接口契约，只覆盖小红书 / rednote 的作品页。
