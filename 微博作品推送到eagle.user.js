// ==UserScript==
// @name            微博作品推送到eagle
// @namespace       https://github.com/jiebukai/tampermonkey
// @version         1.0.18
// @description     把微博作品（图集 / 视频 / 动图）推送到 Eagle 素材库：可选目标文件夹与标签、可按作者名归类、支持快捷键与当前页批量推送、自动跳过已推送过的素材
// @author          jiebukai
// @match           https://weibo.com/*
// @match           https://www.weibo.com/*
// @match           https://s.weibo.com/*
// @icon            https://weibo.com/favicon.ico
// @license         MIT
// @supportURL      https://github.com/jiebukai/tampermonkey/issues
// @homepageURL     https://github.com/jiebukai/tampermonkey
// @downloadURL     https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E5%BE%AE%E5%8D%9A%E4%BD%9C%E5%93%81%E6%8E%A8%E9%80%81%E5%88%B0eagle.user.js
// @updateURL       https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E5%BE%AE%E5%8D%9A%E4%BD%9C%E5%93%81%E6%8E%A8%E9%80%81%E5%88%B0eagle.user.js
// @grant           GM_xmlhttpRequest
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @connect         *
// @run-at          document-idle
// ==/UserScript==

/*
 * 微博 → Eagle 素材库 推送脚本
 * 维护：jiebukai（仓库 https://github.com/jiebukai/tampermonkey）
 *
 * 功能
 * ----
 * 1. 微博详情页 / 时间线 / 搜索页的每条微博注入「存到 Eagle」按钮；
 * 2. 覆盖图集（多图）、单视频、动图（live photo = 静态图 + 短视频）、图文视频混排；
 * 3. 推送面板里可选目标文件夹与标签，选完即记住；
 * 4. 可按作者名归类：追加为标签，或在目标文件夹下自动建同名子文件夹；
 * 5. 默认按「来源页面 URL + 文件名」跳过 Eagle 中已存在的素材；
 * 6. 微博 CDN 有防盗链，推送时自动带 Referer / User-Agent（走 Eagle 的 headers 参数）；
 * 7. 快捷键（默认 S）推送当前详情页作品；右下角悬浮按钮可批量推送当前页可见作品。
 *
 * 媒体提取逻辑参考 vacabun/weibo-dl（MIT）：图片取 pic_infos[].largest.url、
 * 视频取 page_info.media_info.playback_list[0].play_info.url（兜底 stream_url）、
 * 动图取 pic.video、混排取 mix_media_info.items，转发帖取 retweeted_status。
 *
 * Eagle API 契约与本仓库抖音/小红书脚本保持一致：/api/item/addFromURL（v1，folderIds）
 * 或 /api/v2/item/add（v2，folders）、/api/item/list?url= 查重、
 * /api/folder/list + /api/folder/create 管理文件夹，运行时自动探测 API 风格并在 404 时回退。
 */
(function () {
  "use strict";

  /* ============================ 0. 常量与工具 ============================ */

  const EAGLE_DEFAULT_BASE_URL = "http://127.0.0.1:41595";
  const CFG_KEY = "wb-eagle-push-config";
  const LOG_PREFIX = "[wb-eagle]";

  // 需要补 Referer / UA 的媒体域名（微博 CDN 有防盗链）
  const MEDIA_HOST_SUFFIXES = [
    "sinaimg.cn", "sinaimg.com", "weibocdn.com", "weibo.com",
    "wbcdn.cn", "weibocdn.cn", "video.weibo.com", "f.video.weibocdn.com"
  ];

  // 微博图片 URL 里比 large 小的尺寸段（orj720 / mw1000 这类也要覆盖到，所以用 \d+ 通配）
  const UPSCALE_PATTERN = /\/(?:square|thumbnail|bmiddle|small|mw\d+|thumb\d+|orj\d+|wap\d+)\//i;

  const DEFAULT_FILENAME_TEMPLATE = "{username}-{YYYY}{MM}{DD}_{HH}{mm}{ss}-{index}-{content}";

  const DEFAULT_CFG = {
    eagle_base_url: EAGLE_DEFAULT_BASE_URL,
    folder_id: "",
    folder_name: "",
    tags: [],
    skip_existing: true,
    send_referer: true,
    upscale_image: true,
    video_with_cover: true,
    animated_mode: "video", // 动图（pic.video）：video | image | both
    author_as_tag: false,
    author_as_folder: false,
    filename_template: DEFAULT_FILENAME_TEMPLATE,
    // 是否把博文发布时间写进 Eagle 的「添加日期」（addFromURL 的 modificationTime）。
    // 默认关：Eagle 的「添加日期」保持真实入库时间，博文时间只写进文件名与注释。
    set_added_date: false,
    enable_shortcut: true,
    push_shortcut: "s"
  };

  const log = function () {
    const args = Array.prototype.slice.call(arguments);
    console.log.apply(console, [LOG_PREFIX].concat(args));
  };
  const warn = function () {
    const args = Array.prototype.slice.call(arguments);
    console.warn.apply(console, [LOG_PREFIX].concat(args));
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        const value = attrs[key];
        if (value == null || value === false) return;
        if (key === "style" && typeof value === "object") {
          Object.assign(node.style, value);
        } else if (key === "text") {
          node.textContent = String(value);
        } else if (key === "html") {
          node.innerHTML = String(value);
        } else if (key === "checked" || key === "value" || key === "disabled" || key === "selected") {
          // 这些是 property 语义：用 setAttribute 只在初始渲染生效，读回来还是旧值
          try {
            node[key] = value;
          } catch (err) {
            node.setAttribute(key, String(value));
          }
        } else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          node.setAttribute(key, String(value));
        }
      });
    }
    (Array.isArray(children) ? children : children ? [children] : []).forEach((child) => {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /* ============================ 1. 配置 ============================ */

  function gmGet(key, fallback) {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
    } catch (err) { /* ignore */ }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function gmSet(key, value) {
    try {
      if (typeof GM_setValue === "function") { GM_setValue(key, value); return; }
    } catch (err) { /* ignore */ }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* ignore */ }
  }

  function loadCfg() {
    const saved = gmGet(CFG_KEY, {}) || {};
    const merged = Object.assign({}, DEFAULT_CFG, saved);
    if (!Array.isArray(merged.tags)) merged.tags = [];
    return merged;
  }

  let cfg = loadCfg();

  function saveCfg() {
    gmSet(CFG_KEY, cfg);
  }

  function setCfg(patch) {
    Object.assign(cfg, patch);
    saveCfg();
  }

  /* ============================ 2. 微博数据解析 ============================ */

  /** 从链接或属性里抠出微博 id（mblogid 或 idstr） */
  const ID_NUMERIC = /^\d{8,}$/;           // 微博数字 id（idstr / mid）
  const ID_MBLOG = /^[A-Za-z0-9]{6,12}$/;  // 字母数字短 id（mblogid）

  /**
   * 从链接里抠出微博 id。
   *
   * 注意：不能用“路径最后一段就是 id”当兜底 —— 头像/昵称链接指向用户主页
   * （…/u/1234567890），那样取到的是 uid，接口查不到，表现成“获取微博数据失败”。
   */
  function parseStatusId(text) {
    const raw = String(text || "");
    const m =
      raw.match(/\/(?:status|detail)\/([A-Za-z0-9]+)/) ||
      raw.match(/[?&](?:id|mid)=([A-Za-z0-9]+)/) ||
      raw.match(/weibo\.com\/(?:u\/)?\d+\/([A-Za-z0-9]{6,})\/?(?:[?#]|$)/);
    return m ? m[1] : "";
  }

  /**
   * 微博图片 URL 的档位提升：把比 large 小的段换成 large。
   * original / woriginal 本身就是原图，保持不动（否则会降级）。
   */
  function normalizeImageUrl(url, upscale) {
    let out = String(url || "").trim();
    if (!out) return "";
    out = out.replace(/^http:\/\//i, "https://");
    if (!upscale) return out;
    if (/\/w?original\//i.test(out)) return out;
    return out.replace(UPSCALE_PATTERN, "/large/");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** 按模板生成素材名（占位符见 README；不合法字符会被替换） */
  function buildFilename(template, ctx) {
    const tpl = String(template || DEFAULT_FILENAME_TEMPLATE);
    let out = tpl;
    Object.keys(ctx).forEach((key) => {
      const value = ctx[key] == null ? "" : String(ctx[key]);
      out = out.split("{" + key + "}").join(value);
    });
    out = out
      .replace(/\u200B/g, "")
      .replace(/[<>*"|:?/\\\n\r\t]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    return out || "weibo";
  }

  function formatTimeParts(createdAt) {
    let date = null;
    if (typeof createdAt === "number" && createdAt > 0) date = new Date(createdAt);
    else if (createdAt) date = new Date(String(createdAt));
    if (!date || Number.isNaN(date.getTime())) {
      return { YYYY: "", MM: "", DD: "", HH: "", mm: "", ss: "" };
    }
    return {
      YYYY: String(date.getFullYear()),
      MM: pad2(date.getMonth() + 1),
      DD: pad2(date.getDate()),
      HH: pad2(date.getHours()),
      mm: pad2(date.getMinutes()),
      ss: pad2(date.getSeconds())
    };
  }

  /**
   * 收集一张图片的所有可用地址（微博同一张图会给多个档位），按“预期清晰度”从高到低排列：
   * original / woriginal（原图）→ largest → large → mw2000 → 其余缩略档（统一提到 large）。
   * 推送时若第一个地址拿不到，会自动换下一个。
   */
  function collectImageCandidates(pic, upscale) {
    const out = [];
    const addOne = (candidate) => {
      if (!candidate) return;
      const raw = typeof candidate === "string" ? candidate : candidate.url;
      const url = normalizeImageUrl(raw, upscale);
      if (url && out.indexOf(url) < 0) out.push(url);
    };
    if (pic && typeof pic === "object") {
      addOne(pic.original);
      addOne(pic.woriginal);
      addOne(pic.largest);
      addOne(pic.large);
      addOne(pic.mw2000);
      addOne(pic.mw690);
      addOne(pic.url);
    } else {
      addOne(pic);
    }
    return out;
  }

  function extFromUrl(url, fallback) {
    const clean = String(url || "").split("?")[0].split("#")[0];
    const m = clean.match(/\.([A-Za-z0-9]{2,5})$/);
    if (!m) return fallback || "jpg";
    const ext = m[1].toLowerCase();
    if (ext === "jpeg") return "jpg";
    return ext;
  }

  /**
   * 把一条微博（含转发原帖）摊平成待推送的媒体项列表。纯函数，便于单测。
   *
   * @param {object} status 微博主体（已处理转发：调用方应传入 retweeted_status 优先）
   * @param {object} raw   接口原始 JSON（视频信息在 page_info 上，只在原创帖那一层）
   * @param {object} options { upscale, animatedMode, videoWithCover }
   * @returns {Array<{kind:"image"|"video", url:string, ext:string, index:number, role:string, headers:boolean}>}
   */
  function collectMediaItems(status, raw, options) {
    const opts = options || {};
    const upscale = opts.upscale !== false;
    const animatedMode = opts.animatedMode || "video";
    const videoWithCover = opts.videoWithCover !== false;
    const items = [];

    const pushImage = (pic, role) => {
      const candidates = collectImageCandidates(pic, upscale);
      if (candidates.length === 0) return;
      items.push({
        kind: "image", url: candidates[0], candidates: candidates, ext: extFromUrl(candidates[0], "jpg"),
        index: items.length + 1, role: role || "image", headers: false
      });
    };
    const pushVideo = (url, role) => {
      const finalUrl = String(url || "").trim();
      if (!finalUrl) return;
      const videoUrl = finalUrl.replace(/^http:\/\//i, "https://");
      items.push({
        kind: "video", url: videoUrl, candidates: [videoUrl], ext: extFromUrl(finalUrl, "mp4"),
        index: items.length + 1, role: role || "video", headers: true
      });
    };

    // (a) 视频帖：raw.page_info.media_info
    const mediaInfo = raw && raw.page_info && raw.page_info.media_info;
    if (mediaInfo) {
      const playback = Array.isArray(mediaInfo.playback_list) ? mediaInfo.playback_list : [];
      let videoUrl = "";
      for (let i = 0; i < playback.length; i += 1) {
        const info = playback[i] && playback[i].play_info;
        if (info && info.url) { videoUrl = info.url; break; }
      }
      if (!videoUrl) videoUrl = mediaInfo.stream_url || "";
      pushVideo(videoUrl, "video");

      // 视频封面（pic_big 通常是中间档，normalizeImageUrl 会提到 large）
      const cover =
        (mediaInfo.pic_info && (mediaInfo.pic_info.pic_big || mediaInfo.pic_info.pic_small)) || null;
      if (videoWithCover && cover && cover.url) pushImage(cover, "cover");
    }

    // (b) 图集：status.pic_infos（对象字典）
    const picInfos = status && status.pic_infos;
    if (picInfos && typeof picInfos === "object") {
      Object.keys(picInfos).forEach((key) => {
        const pic = picInfos[key];
        if (!pic) return;
        pushImage(pic, "image");
        // 动图：pic.video 是那段短视频
        if (pic.video && animatedMode !== "image") pushVideo(pic.video, "animated");
      });
    }

    // (c) 图文视频混排：status.mix_media_info.items
    const mix = status && status.mix_media_info;
    if (mix && Array.isArray(mix.items)) {
      mix.items.forEach((entry) => {
        if (!entry || !entry.data) return;
        if (entry.type === "video") {
          const info = entry.data.media_info;
          let videoUrl = "";
          const playback = info && Array.isArray(info.playback_list) ? info.playback_list : [];
          for (let i = 0; i < playback.length; i += 1) {
            const pi = playback[i] && playback[i].play_info;
            if (pi && pi.url) { videoUrl = pi.url; break; }
          }
          if (!videoUrl && info) videoUrl = info.stream_url || "";
          pushVideo(videoUrl, "video");
          const cover = info && info.pic_info && (info.pic_info.pic_big || info.pic_info.pic_small);
          if (videoWithCover && cover && cover.url) pushImage(cover, "cover");
        } else if (entry.type === "pic") {
          pushImage(entry.data, "image");
          if (entry.data.video && animatedMode !== "image") pushVideo(entry.data.video, "animated");
        }
      });
    }

    // 动图为 "image" 模式时，去掉动图对应的视频项
    if (animatedMode === "image") {
      return items.filter((it) => it.role !== "animated");
    }
    return items;
  }

  /**
   * 微博 created_at → 毫秒时间戳（解析不出来返回 0）。
   *
   * 接口一般给 "Mon Sep 19 08:00:00 +0800 2026"，但也见过 "09-19 08:00" 或时间戳字段，
   * 这里都兜住。返回值会作为 Eagle 的 modificationTime（毫秒）写进素材。
   */
  function parseCreatedAt(status) {
    if (!status) return 0;
    // 1) 接口若已给出时间戳字段（秒或毫秒都能认）
    const numeric = Number(status.created_timestamp || status.createdTimestamp || status.created_at_timestamp || 0);
    if (Number.isFinite(numeric) && numeric > 1e9) return numeric > 1e12 ? numeric : numeric * 1000;
    // 2) 常见字符串格式
    const raw = String(status.created_at || status.createdAt || "").trim();
    if (!raw) return 0;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
    // 3) 微博简写："09-19 08:00"
    const m = raw.match(/^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
    if (m) {
      const now = new Date();
      const date = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4]), 0, 0);
      if (Number.isFinite(date.getTime())) {
        if (date.getTime() > now.getTime() + 86400000) date.setFullYear(date.getFullYear() - 1);
        return date.getTime();
      }
    }
    return 0;
  }

  function buildWebsite(status) {
    if (!status) return "https://weibo.com/";
    const uid = (status.user && status.user.idstr) || "";
    const mblogid = status.mblogid || status.idstr || "";
    if (uid && mblogid) return "https://weibo.com/" + uid + "/" + mblogid;
    return "https://weibo.com/";
  }

  function buildAuthorName(status) {
    if (!status) return "";
    const user = status.user || {};
    return String(user.screen_name || user.name || "").trim();
  }

  function buildAnnotation(status, meta) {
    const lines = [];
    if (!status) return "";
    const text = String(status.text_raw || status.text || "").replace(/<[^>]+>/g, "").trim();
    if (text) lines.push(text);
    const nickname = buildAuthorName(status);
    const uid = (status.user && (status.user.idstr || status.user.id)) || "";
    if (nickname) lines.push("作者: " + nickname + (uid ? " (" + uid + ")" : ""));
    if (status.created_at) lines.push("发布: " + status.created_at);
    if (meta && meta.website) lines.push(meta.website);
    const mblogid = status.mblogid || status.idstr || "";
    if (mblogid) lines.push("weibo:" + mblogid + (meta && meta.kind ? " type:" + meta.kind : ""));
    return lines.filter(Boolean).join("\n");
  }

  function readCookie(name) {
    try {
      const m = String(document.cookie || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : "";
    } catch (err) {
      return "";
    }
  }

  /**
   * 微博 /ajax/ 接口的反爬校验所需请求头。
   * 缺 X-XSRF-TOKEN（微博前端会从 cookie 的 XSRF-TOKEN 读一份放进请求头）、
   * Referer、X-Requested-With 时，接口常直接返回 403。
   */
  function weiboApiHeaders(url) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: (typeof location !== "undefined" && location.origin ? location.origin : "https://weibo.com") + "/"
    };
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
    return headers;
  }

  function gmGetText(url, headers, timeout) {
    return new Promise((resolve, reject) => {
      const xhr =
        typeof GM_xmlhttpRequest === "function"
          ? GM_xmlhttpRequest
          : typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function"
            ? GM.xmlHttpRequest
            : null;
      if (!xhr) {
        reject(new Error("GM_xmlhttpRequest 不可用"));
        return;
      }
      xhr({
        method: "GET",
        url: url,
        headers: headers || {},
        anonymous: false,
        timeout: timeout || 20000,
        onload: (res) => {
          const text = res.responseText || "";
          if (res.status >= 200 && res.status < 300) resolve(text);
          else reject(new Error("HTTP " + res.status + (text ? " " + String(text).slice(0, 160) : "")));
        },
        onerror: () => reject(new Error("请求失败（网络错误）")),
        ontimeout: () => reject(new Error("请求超时"))
      });
    });
  }

  function fetchGetText(url, headers) {
    return fetch(url, { credentials: "include", headers: headers || {} }).then((res) =>
      res.text().then((text) => {
        if (!res.ok) throw new Error("HTTP " + res.status + (text ? " " + String(text).slice(0, 160) : ""));
        return text;
      })
    );
  }

  /**
   * GET 取文本：同域时优先页面 fetch（自带 cookie 与来源，最接近微博前端行为），
   * 跨域时优先 GM_xmlhttpRequest；两条通道互为兜底。
   */
  function httpGetText(url) {
    const headers = weiboApiHeaders(url);
    let sameOrigin = false;
    try {
      sameOrigin = new URL(url).origin === location.origin;
    } catch (err) {
      sameOrigin = false;
    }
    // 两条通道都试；都失败时抛出信息量更大的那个（带 HTTP 状态码的优先，
    // 否则 GM 拿到的 "HTTP 403 {…}" 会被 fetch 的 "Failed to fetch" 覆盖掉）
    const runPair = (primary, fallback) =>
      primary().catch((firstErr) =>
        fallback().catch((secondErr) => {
          const first = String((firstErr && firstErr.message) || "");
          throw first.indexOf("HTTP ") >= 0 ? firstErr : secondErr;
        })
      );
    return sameOrigin
      ? runPair(() => fetchGetText(url, headers), () => gmGetText(url, headers))
      : runPair(() => gmGetText(url, headers), () => fetchGetText(url, headers));
  }

  /**
   * 取一条微博的详情 JSON。
   *
   * 必须走 GM_xmlhttpRequest：脚本常运行在 s.weibo.com / www.weibo.com 等页面上，
   * 而该接口只在 weibo.com 域名下可用，直接用页面 fetch 会被 CORS 拦成 "Failed to fetch"。
   */
  async function fetchStatus(id) {
    if (!id) throw new Error("缺少微博 id");
    const query = encodeURIComponent(id);
    const urls = [
      "https://weibo.com/ajax/statuses/show?id=" + query,
      "https://www.weibo.com/ajax/statuses/show?id=" + query
    ];
    let lastError = null;
    for (let i = 0; i < urls.length; i += 1) {
      let data = null;
      try {
        const text = await httpGetText(urls[i]);
        data = JSON.parse(text);
      } catch (err) {
        lastError = err;
        continue;
      }
      if (data && (data.idstr || data.mblogid)) {
        // 转发帖取原帖内容；视频信息只在原创帖那一层，所以一并继承 page_info
        const status = data.retweeted_status ? data.retweeted_status : data;
        const videoSource = data.retweeted_status
          ? Object.assign({}, data.retweeted_status, { page_info: data.retweeted_status.page_info || data.page_info })
          : data;
        return { raw: videoSource, status };
      }
      lastError = new Error(data && data.msg ? "获取微博数据失败：" + data.msg : "获取微博数据失败");
    }
    throw lastError || new Error("获取微博数据失败");
  }

  /* ============================ 3. Eagle 客户端 ============================ */

  /**
   * 组装 item/addFromURL 的请求体。
   *
   * 文件夹字段曾被写成 folderIds（数组），但 Eagle 的正式参数是
   * **folderId（单数、字符串）**；folderId 缺失时 Eagle 会静默忽略，
   * 于是「作者名建子文件夹」只创建了文件夹、素材却落到根目录。
   * 现在以 folderId 为准，同时附带 folderIds 兼容按数组解析的版本。
   */
  function buildItemAddBody(p) {
    const folders = Array.isArray(p.folders) ? p.folders.filter(Boolean) : [];
    const body = {
      url: p.url,
      name: p.name,
      website: p.website,
      tags: p.tags,
      annotation: p.annotation,
      headers: p.headers,
      modificationTime: p.modificationTime
    };
    if (folders.length) {
      body.folderId = String(folders[0]);
      body.folderIds = folders;
    }
    return body;
  }

  const EAGLE_API_MAP = {
    appInfo: {
      v2: { path: "/api/v2/app/info", method: "GET" },
      v1: { path: "/api/application/info", method: "GET" }
    },
    folderList: {
      v2: { path: "/api/v2/folder/get", method: "GET", query: (p) => "?offset=" + (p.offset || 0) + "&limit=" + (p.limit || 200) },
      v1: { path: "/api/folder/list", method: "GET" }
    },
    folderCreate: {
      v2: { path: "/api/v2/folder/create", method: "POST", body: (p) => ({ name: p.name, parent: p.parent || undefined }) },
      v1: { path: "/api/folder/create", method: "POST", body: (p) => ({ folderName: p.name, parent: p.parent || undefined }) }
    },
    tagList: {
      v2: { path: "/api/v2/tag/get", method: "GET", query: (p) => "?offset=" + (p.offset || 0) + "&limit=" + (p.limit || 50) },
      v1: { path: "/api/tag/list", method: "GET" }
    },
    itemLookupByUrl: {
      v2: { path: "/api/v2/item/get", method: "GET", query: (p) => "?url=" + encodeURIComponent(p.url) + "&limit=" + (p.limit || 100) },
      v1: { path: "/api/item/list", method: "GET", query: (p) => "?url=" + encodeURIComponent(p.url) + "&limit=" + (p.limit || 100) }
    },
    itemAdd: {
      v2: {
        path: "/api/v2/item/add",
        method: "POST",
        body: (p) => buildItemAddBody(p)
      },
      v1: {
        path: "/api/item/addFromURL",
        method: "POST",
        body: (p) => buildItemAddBody(p)
      }
    }
  };

  class EagleClient {
    constructor(baseURL) {
      const raw = String(baseURL || EAGLE_DEFAULT_BASE_URL).trim();
      this.baseURL = raw.replace(/\/+$/, "") || EAGLE_DEFAULT_BASE_URL;
      this.apiStyle = null;
      this.folderTree = null;
      this.tagNames = null;
      this.lookupCache = new Map();
    }

    static request(option) {
      const xhr =
        typeof GM_xmlhttpRequest === "function"
          ? GM_xmlhttpRequest
          : typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function"
            ? GM.xmlHttpRequest
            : null;
      if (!xhr) throw new Error("GM_xmlhttpRequest 不可用");
      return new Promise((resolve, reject) => {
        xhr({
          method: option.method || "GET",
          url: option.url,
          headers: option.headers || {},
          data: option.data,
          timeout: option.timeout || 30000,
          responseType: "json",
          onload: (res) => {
            let body = res.response;
            if (body == null && res.responseText) {
              try { body = JSON.parse(res.responseText); } catch (err) { body = res.responseText; }
            }
            if (res.status >= 200 && res.status < 300) resolve({ status: res.status, data: body });
            else reject(new Error("HTTP " + res.status + (body && body.message ? " " + body.message : "")));
          },
          onerror: () => reject(new Error("网络错误")),
          ontimeout: () => reject(new Error("请求超时"))
        });
      });
    }

    request(path, method, data) {
      return EagleClient.request({
        url: this.baseURL + path,
        method: method,
        data: data == null ? undefined : JSON.stringify(data),
        headers: data == null ? {} : { "Content-Type": "application/json" }
      });
    }

    async getApiStyle() {
      if (this.apiStyle) return this.apiStyle;
      const order = ["v1", "v2"];
      for (let i = 0; i < order.length; i += 1) {
        const style = order[i];
        const spec = EAGLE_API_MAP.appInfo[style];
        try {
          await this.request(spec.path, spec.method);
          this.apiStyle = style;
          return style;
        } catch (err) { /* try next */ }
      }
      this.apiStyle = "v1";
      return this.apiStyle;
    }

    async callApi(key, params) {
      const args = params || {};
      const style = await this.getApiStyle();
      const spec = EAGLE_API_MAP[key] && EAGLE_API_MAP[key][style];
      if (!spec) throw new Error("当前 Eagle（" + style + "）不支持该操作：" + key);
      const build = (target) => ({
        path: target.path + (typeof target.query === "function" ? target.query(args) : ""),
        method: target.method,
        data: typeof target.body === "function" ? target.body(args) : undefined
      });
      const call = build(spec);
      try {
        return await this.request(call.path, call.method, call.data);
      } catch (err) {
        const text = String((err && err.message) || err);
        if (text.indexOf("404") >= 0 || text.toLowerCase().indexOf("method not allowed") >= 0) {
          const other = style === "v2" ? "v1" : "v2";
          const otherSpec = EAGLE_API_MAP[key] && EAGLE_API_MAP[key][other];
          if (otherSpec) {
            this.apiStyle = other;
            const retried = build(otherSpec);
            return await this.request(retried.path, retried.method, retried.data);
          }
        }
        throw err;
      }
    }

    static extractListData(response) {
      if (response && response.data && Array.isArray(response.data.data)) return response.data.data;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    }

    static buildFolderTree(list) {
      const nodes = (Array.isArray(list) ? list : []).filter((node) => node && node.id);
      const nested = (node) => ({
        id: node.id,
        name: String(node.name || ""),
        children: (Array.isArray(node.children) ? node.children : []).filter((c) => c && c.id).map(nested)
      });
      return nodes.map(nested);
    }

    async getFolders(force) {
      if (!force && Array.isArray(this.folderTree)) return this.folderTree;
      const style = await this.getApiStyle();
      const all = [];
      if (style === "v2") {
        const limit = 200;
        let offset = 0;
        let total = 0;
        do {
          const response = await this.callApi("folderList", { offset: offset, limit: limit });
          const page = EagleClient.extractListData(response);
          total = Number((response && response.data && response.data.total) || page.length || 0);
          all.push.apply(all, page);
          offset += limit;
          if (page.length === 0) break;
        } while (offset < total);
      } else {
        const response = await this.callApi("folderList", {});
        all.push.apply(all, EagleClient.extractListData(response));
      }
      this.folderTree = EagleClient.buildFolderTree(all);
      return this.folderTree;
    }

    static flattenFolders(nodes, depth, out) {
      const acc = out || [];
      (Array.isArray(nodes) ? nodes : []).forEach((node) => {
        acc.push({ id: node.id, name: node.name, depth: depth || 0 });
        if (Array.isArray(node.children) && node.children.length) {
          EagleClient.flattenFolders(node.children, (depth || 0) + 1, acc);
        }
      });
      return acc;
    }

    static findFolderById(nodes, id) {
      const target = String(id || "");
      if (!target) return null;
      const list = Array.isArray(nodes) ? nodes : [];
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].id === target) return list[i];
        const found = EagleClient.findFolderById(list[i].children, target);
        if (found) return found;
      }
      return null;
    }

    static findFolderByName(nodes, name) {
      const target = String(name || "").trim();
      if (!target) return null;
      const list = Array.isArray(nodes) ? nodes : [];
      for (let i = 0; i < list.length; i += 1) {
        if (String(list[i].name || "").trim() === target) return list[i];
        const found = EagleClient.findFolderByName(list[i].children, target);
        if (found) return found;
      }
      return null;
    }

    async getTags(force) {
      if (!force && Array.isArray(this.tagNames)) return this.tagNames;
      const style = await this.getApiStyle();
      const all = [];
      if (style === "v2") {
        const limit = 50;
        let offset = 0;
        let total = 0;
        do {
          const response = await this.callApi("tagList", { offset: offset, limit: limit });
          const page = EagleClient.extractListData(response);
          total = Number((response && response.data && response.data.total) || page.length || 0);
          all.push.apply(all, page);
          offset += limit;
          if (page.length === 0) break;
        } while (offset < total);
      } else {
        const response = await this.callApi("tagList", {});
        all.push.apply(all, EagleClient.extractListData(response));
      }
      this.tagNames = all
        .map((tag) => (typeof tag === "string" ? tag : tag && tag.name))
        .filter(Boolean);
      return this.tagNames;
    }

    async createFolder(name, parentId) {
      const safe = String(name || "").trim();
      if (!safe) return "";
      const response = await this.callApi("folderCreate", { name: safe, parent: parentId || "" });
      // callApi 返回 { status, data }，而 Eagle 的返回体又是 { status, data: { id } }；
      // 之前只取了一层 response.data.id，永远拿不到 id —— 于是「作者名建子文件夹」
      // 变成只建文件夹、素材仍落回原目录。这里两层都试。
      const payload = response && response.data;
      const id = String(
        (payload && payload.id) ||
        (payload && payload.data && payload.data.id) ||
        ""
      );
      if (!id) {
        warn("创建文件夹成功但未解析到 id：" + safe, response);
        return "";
      }
      if (Array.isArray(this.folderTree)) {
        const node = { id: id, name: safe, children: [] };
        const parentNode = parentId ? EagleClient.findFolderById(this.folderTree, parentId) : null;
        if (parentNode) parentNode.children.push(node);
        else if (!parentId) this.folderTree.push(node);
        else this.folderTree = null;
      }
      return id;
    }

    static safeFolderName(name) {
      const raw = String(name || "").trim();
      if (!raw) return "";
      return raw.replace(/[<>*"|:?/\\\n\r\t]/g, "_").slice(0, 60).trim();
    }

    /** 作者名 → 文件夹 id：优先复用现有同名文件夹，没有就在 parentId 下建 */
    async resolveAuthorFolder(authorName, parentId) {
      const safe = EagleClient.safeFolderName(authorName);
      if (!safe) return "";
      const tree = await this.getFolders();
      const parentNode = parentId ? EagleClient.findFolderById(tree, parentId) : null;
      const scope = parentNode ? parentNode.children : tree;
      const found = EagleClient.findFolderByName(scope, safe);
      if (found && found.id) return found.id;
      return await this.createFolder(safe, parentId);
    }

    static normalizeUrl(url) {
      return String(url || "").trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
    }

    static isSameItemName(a, b) {
      const left = String(a || "").trim();
      const right = String(b || "").trim();
      if (!left || !right) return false;
      if (left === right) return true;
      const strip = (s) => s.replace(/\.[a-z0-9]{1,5}$/i, "");
      return strip(left) === strip(right);
    }

    async findExisting(task) {
      const website = String((task && task.website) || "").trim();
      if (!website) return false;
      const cacheKey = EagleClient.normalizeUrl(website) || website;
      let items = this.lookupCache.get(cacheKey);
      if (!items) {
        const response = await this.callApi("itemLookupByUrl", { url: website, limit: 100 });
        items = EagleClient.extractListData(response);
        this.lookupCache.set(cacheKey, items);
      }
      const targetUrl = EagleClient.normalizeUrl(website);
      return items.some((item) => {
        if (EagleClient.normalizeUrl(item && item.url) !== targetUrl) return false;
        return EagleClient.isSameItemName(item && item.name, task && task.name);
      });
    }

    async addFromURL(task) {
      return this.callApi("itemAdd", {
        url: task.url,
        name: task.name,
        website: task.website,
        tags: Array.isArray(task.tags) ? task.tags : [],
        annotation: task.annotation || "",
        folders: Array.isArray(task.folders) ? task.folders.filter(Boolean) : [],
        headers: task.headers,
        modificationTime: task.modificationTime || undefined
      });
    }

    /** 微博 CDN 需要来源头，否则 Eagle 侧会 403 */
    static buildDownloadHeaders(rawUrl, userAgent) {
      const url = String(rawUrl || "").trim();
      if (!/^https?:\/\//i.test(url)) return undefined;
      let host = "";
      try { host = new URL(url).hostname.toLowerCase(); } catch (err) { return undefined; }
      const matched = MEDIA_HOST_SUFFIXES.some((suffix) => host === suffix || host.slice(-(suffix.length + 1)) === "." + suffix);
      if (!matched) return undefined;
      const headers = { Referer: "https://weibo.com/" };
      const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
      if (ua) headers["User-Agent"] = ua;
      return headers;
    }
  }

  let eagleSingleton = null;
  function getEagleClient() {
    const base = cfg.eagle_base_url || EAGLE_DEFAULT_BASE_URL;
    if (!eagleSingleton || eagleSingleton.baseURL !== base.replace(/\/+$/, "")) {
      eagleSingleton = new EagleClient(base);
    }
    return eagleSingleton;
  }

  /* ============================ 4. 推送流程 ============================ */

  async function pushOne(item, ctx, stats) {
    const client = getEagleClient();
    const tags = Array.isArray(cfg.tags) ? cfg.tags.filter(Boolean) : [];
    const authorName = String(ctx.authorName || "").trim();
    if (cfg.author_as_tag && authorName && tags.indexOf(authorName) < 0) tags.push(authorName);

    let folders = cfg.folder_id ? [cfg.folder_id] : [];
    if (cfg.author_as_folder && authorName) {
      try {
        const authorFolderId = await client.resolveAuthorFolder(authorName, cfg.folder_id || "");
        if (authorFolderId) {
          folders = [authorFolderId];
          log("作者子文件夹：" + authorName + " -> " + authorFolderId);
        } else {
          warn("作者子文件夹未取得 id（作者名=" + authorName + "），回退到 " + (cfg.folder_id || "库根目录"));
        }
      } catch (err) {
        warn("作者文件夹定位失败，回退到原目标文件夹", err);
      }
    }
    if (folders.length === 0) log("目标文件夹：库根目录（未选择文件夹）");

    // 文件名模板的时间占位符（{YYYY}{MM}{DD}{HH}{mm}{ss}）此前漏传，导致它们原样留在文件名里
    const timeParts = formatTimeParts(ctx.modificationTime);
    // {original} 按 weibo-dl 的语义 = 原始文件名（不含扩展名），从媒体地址里取
    const originalName = (function () {
      try {
        const clean = String(item.url || "").split("?")[0].split("#")[0];
        const base = clean.split("/").pop() || "";
        return decodeURIComponent(base).replace(/\.[a-z0-9]{1,5}$/i, "");
      } catch (err) {
        return "";
      }
    })();
    const name = buildFilename(cfg.filename_template, {
      username: authorName,
      userid: (ctx.status && ctx.status.user && ctx.status.user.idstr) || "",
      mblogid: (ctx.status && (ctx.status.mblogid || ctx.status.idstr)) || "",
      uid: (ctx.status && ctx.status.idstr) || "",
      index: String(item.index).padStart(String(ctx.total).length, "0"),
      content: String((ctx.status && (ctx.status.text_raw || ctx.status.text)) || "").replace(/<[^>]+>/g, "").slice(0, 50),
      original: originalName,
      ext: item.ext || (item.kind === "video" ? "mp4" : "jpg"),
      YYYY: timeParts.YYYY,
      MM: timeParts.MM,
      DD: timeParts.DD,
      HH: timeParts.HH,
      mm: timeParts.mm,
      ss: timeParts.ss
    }, ctx.status);

    try {
      if (cfg.skip_existing) {
        const exists = await client.findExisting({ name: name, website: ctx.website });
        if (exists) return "skipped";
      }
    } catch (err) {
      warn("查重失败，继续尝试推送", err);
    }

    const urls = Array.isArray(item.candidates) && item.candidates.length ? item.candidates : [item.url];
    let lastError = null;
    for (let i = 0; i < urls.length; i += 1) {
      try {
        await client.addFromURL({
          url: urls[i],
          name: name,
          website: ctx.website,
          tags: tags,
          folders: folders,
          annotation: ctx.annotation,
          modificationTime: ctx.addDateFromPost ? ctx.modificationTime : undefined,
          headers: cfg.send_referer ? EagleClient.buildDownloadHeaders(urls[i]) : undefined
        });
        if (i > 0) log("第 " + (i + 1) + " 个候选地址成功：" + urls[i]);
        return "saved";
      } catch (err) {
        lastError = err;
      }
    }
    stats.error = stats.error || String((lastError && lastError.message) || lastError);
    warn("推送失败（已尝试 " + urls.length + " 个地址）：" + urls[0], lastError);
    return "failed";
  }

  async function pushStatus(status, raw, onProgress) {
    const items = collectMediaItems(status, raw, {
      upscale: cfg.upscale_image !== false,
      animatedMode: cfg.animated_mode || "video",
      videoWithCover: cfg.video_with_cover !== false
    });
    const stats = { saved: 0, skipped: 0, failed: 0, error: "", total: items.length };
    if (items.length === 0) {
      stats.error = "这条微博没有可推送的图片或视频";
      return stats;
    }
    const ctx = {
      status: status,
      website: buildWebsite(status),
      authorName: buildAuthorName(status),
      annotation: buildAnnotation(status, { website: buildWebsite(status), kind: items[0].kind }),
      // 始终解析博文时间（文件名模板要用）；是否写进 Eagle「添加日期」由 addDateFromPost 决定
      modificationTime: (function () {
        const ts = parseCreatedAt(status);
        if (ts > 0) {
          log("博文发布时间：" + new Date(ts).toLocaleString() +
            (cfg.set_added_date === true ? "（按设置写入 Eagle「添加日期」）" : "（写入文件名与注释；不改 Eagle 添加日期）"));
        } else {
          warn("未能解析微博发布时间（created_at=" + JSON.stringify(status && status.created_at) + "）；文件名时间位留空，Eagle 添加日期不变");
        }
        return ts;
      })(),
      addDateFromPost: cfg.set_added_date === true,
      total: items.length
    };
    for (let i = 0; i < items.length; i += 1) {
      if (typeof onProgress === "function") onProgress(i + 1, items.length);
      const result = await pushOne(items[i], ctx, stats);
      if (result === "saved") stats.saved += 1;
      else if (result === "skipped") stats.skipped += 1;
      else stats.failed += 1;
      await sleep(120); // 轻微节流，避免连推过快
    }
    return stats;
  }

  /* ============================ 5. UI ============================ */

  const NS = "wb-eagle";
  let uiInjected = false;
  let styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const css = [
      "." + NS + "-panel,." + NS + "-picker,." + NS + "-toast{color-scheme:dark}",
      "." + NS + "-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:340px;max-height:76vh;overflow:auto;background:#25252a;color:#e8e8ea;border:1px solid #3a3a42;border-radius:12px;box-shadow:0 12px 44px rgba(0,0,0,.55);font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;z-index:2147483000;padding:14px}",
      "." + NS + "-panel h4{margin:0 0 10px;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;-webkit-user-select:none}",
      "." + NS + "-panel ." + NS + "-close{cursor:pointer;color:#8a8a94;font-size:16px;line-height:1}",
      "." + NS + "-panel ." + NS + "-close:hover{color:#e8e8ea}",
      "." + NS + "-row{display:flex;align-items:center;gap:8px;margin:8px 0}",
      "." + NS + "-label{flex:0 0 68px;color:#9a9aa2;white-space:nowrap}",
      "." + NS + "-panel select,." + NS + "-panel input[type=text]{flex:1;min-width:0;padding:5px 7px;border:1px solid #3a3a42;border-radius:6px;background:#2e2e35;color:#e8e8ea;font-size:13px;outline:none}",
      "." + NS + "-panel select:focus,." + NS + "-panel input[type=text]:focus{border-color:#ff8200}",
      "." + NS + "-panel input[type=checkbox],." + NS + "-picker input[type=checkbox]{accent-color:#ff8200}",
      "." + NS + "-btn{padding:7px 12px;border:0;border-radius:999px;background:#ff8200;color:#fff;cursor:pointer;font-size:13px}",
      "." + NS + "-btn[disabled]{opacity:.55;cursor:default}",
      "." + NS + "-btn2{background:#3a3a42;color:#dcdce2}",
      "." + NS + "-hint{color:#8a8a94;font-size:12px;margin-top:6px}",
      "." + NS + "-status{margin-top:10px;font-size:12px;color:#c8c8d0;white-space:pre-wrap}",
      "." + NS + "-fab{position:fixed;right:20px;bottom:20px;min-width:56px;height:44px;padding:0 15px;border-radius:22px;border:0;background:#ff8200;color:#fff;font-size:13px;font-weight:600;letter-spacing:1px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 6px 22px rgba(0,0,0,.5);z-index:2147482999}",
      "." + NS + "-fab:active{cursor:grabbing}",
      "." + NS + "-card-btn{display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:2px 9px;border:1px solid currentColor;border-radius:999px;background:transparent;color:inherit;cursor:pointer;font-size:12px;line-height:18px;opacity:.85}",
      "." + NS + "-card-btn:hover{opacity:1}",
      "." + NS + "-toast{position:fixed;left:50%;bottom:56px;transform:translateX(-50%);background:#2a2a30;color:#f0f0f2;border:1px solid #3a3a42;padding:9px 16px;border-radius:8px;font-size:13px;z-index:2147483001;max-width:70vw;text-align:center;box-shadow:0 8px 26px rgba(0,0,0,.5)}",
      "." + NS + "-lv1{padding-left:14px}", "." + NS + "-lv2{padding-left:28px}", "." + NS + "-lv3{padding-left:42px}",
      "." + NS + "-list{max-height:38vh;overflow:auto;border:1px solid #3a3a42;border-radius:8px;padding:6px;margin:6px 0;background:#1e1e23}",
      "." + NS + "-listItem{display:flex;align-items:flex-start;gap:6px;padding:4px 2px;cursor:pointer;font-size:12px;line-height:1.4}",
      "." + NS + "-listItem:hover{background:#33333a;border-radius:4px}",
      "." + NS + "-listText{flex:1;min-width:0;word-break:break-all}",
      "." + NS + "-listMeta{flex:0 0 auto;color:#8a8a94;font-size:11px}",
      "." + NS + "-listBtn{border:0;background:transparent;color:#ff8200;cursor:pointer;font-size:12px;padding:0 6px}",
      "." + NS + "-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2147483600;display:flex;align-items:center;justify-content:center}",
      "." + NS + "-picker{width:440px;max-width:92vw;background:#25252a;color:#e8e8ea;border:1px solid #3a3a42;border-radius:12px;box-shadow:0 18px 52px rgba(0,0,0,.65);display:flex;flex-direction:column;overflow:hidden;font-size:13px;text-align:left}",
      "." + NS + "-pickHead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #3a3a42}",
      "." + NS + "-pickSearch{flex:1;min-width:0;padding:6px 10px;border:1px solid #3a3a42;border-radius:8px;background:#2e2e35;color:#e8e8ea;font-size:13px;outline:none}",
      "." + NS + "-pickSearch:focus{border-color:#ff8200}",
      "." + NS + "-pickHint{flex:0 0 auto;color:#8a8a94;font-size:12px}",
      "." + NS + "-pickBody{max-height:46vh;overflow:auto;padding:6px}",
      "." + NS + "-pickTwoCol{column-count:2;column-gap:6px}",
      "." + NS + "-pickItem{padding:6px 8px;border-radius:6px;cursor:pointer;word-break:break-all;break-inside:avoid;color:#dcdce2}",
      "." + NS + "-pickItem:hover{background:#33333a}",
      "." + NS + "-pickItemOn{background:#4a3418;color:#ffab4d;font-weight:600}",
      "." + NS + "-pickManual{margin:0 12px 8px;padding:6px 10px;border:1px solid #3a3a42;border-radius:8px;background:#2e2e35;color:#e8e8ea;font-size:12px;outline:none}",
      "." + NS + "-pickFoot{display:flex;justify-content:space-between;gap:8px;padding:8px 12px;border-top:1px solid #3a3a42;color:#8a8a94;font-size:11px}",
      "." + NS + "-pickState{padding:18px;text-align:center;color:#8a8a94;font-size:12px}",
      "." + NS + "-field{flex:1;min-width:0;color:#b9b9c2;font-size:12px;word-break:break-all}",
      "." + NS + "-fieldRow{display:flex;align-items:center;gap:6px;flex:1;min-width:0}",
      "." + NS + "-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}",
      "." + NS + "-chip{background:#33333a;border-radius:10px;padding:2px 8px;font-size:11px;color:#b9b9c2}"
    ].join("");
    document.head.appendChild(h("style", { text: css }));
  }

  let toastNode = null;
  let toastTimer = null;
  function toast(message, duration) {
    if (!toastNode) {
      toastNode = h("div", { class: NS + "-toast" });
      document.body.appendChild(toastNode);
    }
    toastNode.textContent = message;
    toastNode.style.display = "block";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastNode.style.display = "none"; }, duration || 3200);
  }

  let panelNode = null;

  /** 批量列表最多列多少条 */
  const MAX_BATCH_ROWS = 200;

  /**
   * 监听页面新增的微博卡片（时间线滚到底会继续加载），节流后回调。
   * 返回一个取消函数。
   */
  function watchNewCards(callback) {
    if (typeof MutationObserver !== "function" || !document.body) return () => {};
    let timer = null;
    const observer = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        try { callback(); } catch (err) { warn("更新微博列表失败", err); }
      }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (timer) { clearTimeout(timer); timer = null; }
      try { observer.disconnect(); } catch (err) { /* ignore */ }
    };
  }

  let panelCleanup = null;

  function closePanel() {
    if (panelCleanup) {
      try { panelCleanup(); } catch (err) { warn("清理面板监听失败", err); }
      panelCleanup = null;
    }
    if (panelNode && panelNode.parentNode) panelNode.parentNode.removeChild(panelNode);
    panelNode = null;
  }

  /* ---------- 拖动与位置记忆 ---------- */

  const POS_KEY_FAB = "wb-eagle-fab-pos";
  const POS_KEY_PANEL = "wb-eagle-panel-pos";

  /** 把保存过的坐标应用到元素上（越界会拉回可视区） */
  function applyStoredPos(el, storageKey) {
    if (!el || !storageKey) return false;
    const pos = GM_getValue(storageKey, null);
    if (!pos || typeof pos.left !== "number" || typeof pos.top !== "number") return false;
    const maxLeft = Math.max(0, (window.innerWidth || 1024) - 48);
    const maxTop = Math.max(0, (window.innerHeight || 768) - 48);
    el.style.left = Math.min(Math.max(0, pos.left), maxLeft) + "px";
    el.style.top = Math.min(Math.max(0, pos.top), maxTop) + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.transform = "none";
    return true;
  }

  /**
   * 让 el 可以按住 handle 拖动（Pointer Events，鼠标/触屏都行），松手后把坐标存进 GM 存储。
   * 拖动期间会给 el.__wbDragged 置位，供 click 判断「刚才是不是在拖动」。
   */
  function makeDraggable(el, handle, storageKey) {
    let dragging = false;
    let moved = false;
    let startX = 0; let startY = 0; let originLeft = 0; let originTop = 0;
    if (el) el.__wbDragged = false;
    if (!el || !handle) return { dragged: () => false };

    const onMove = (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      el.style.left = (originLeft + dx) + "px";
      el.style.top = (originTop + dy) + "px";
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      if (moved && storageKey) {
        try {
          GM_setValue(storageKey, { left: parseInt(el.style.left, 10) || 0, top: parseInt(el.style.top, 10) || 0 });
        } catch (err) { warn("保存位置失败", err); }
      }
      // click 紧跟 pointerup 触发，延后一点再清标记
      setTimeout(() => { moved = false; el.__wbDragged = false; }, 0);
    };

    handle.addEventListener("pointerdown", (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      if (ev.target && ev.target.closest && ev.target.closest("." + NS + "-close")) return;
      dragging = true;
      moved = false;
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0 };
      startX = ev.clientX; startY = ev.clientY;
      originLeft = rect.left; originTop = rect.top;
      el.style.position = "fixed";
      el.style.left = originLeft + "px";
      el.style.top = originTop + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.transform = "none";
      el.__wbDragged = false;
      document.addEventListener("pointermove", onMove, true);
      document.addEventListener("pointerup", onUp, true);
      if (ev.preventDefault) ev.preventDefault();
    });

    return { dragged: () => el.__wbDragged === true };
  }

  /** 面板挂载后：恢复记忆位置 + 支持拖标题栏 */
  function attachPanelDrag(panel, handle) {
    applyStoredPos(panel, POS_KEY_PANEL);
    makeDraggable(panel, handle, POS_KEY_PANEL);
  }

    function openSettings() {
    injectStyles();
    closePanel();
    const baseInput = h("input", { type: "text", value: cfg.eagle_base_url });
    const folderField = createFolderField();
    const tagField = createTagField();
    const tplInput = h("input", { type: "text", value: cfg.filename_template });
    const keyInput = h("input", { type: "text", value: cfg.push_shortcut });
    const skipExisting = h("input", { type: "checkbox", checked: cfg.skip_existing !== false });
    const sendReferer = h("input", { type: "checkbox", checked: cfg.send_referer !== false });
    const upscale = h("input", { type: "checkbox", checked: cfg.upscale_image !== false });
    const withCover = h("input", { type: "checkbox", checked: cfg.video_with_cover !== false });
    const setAddedDate = h("input", { type: "checkbox", checked: cfg.set_added_date === true });
    const enableShortcut = h("input", { type: "checkbox", checked: cfg.enable_shortcut !== false });
    const animSelect = h("select");
    [["video", "动图（mp4）"], ["image", "静图（大图）"], ["both", "两者都要"]].forEach((pair) => {
      animSelect.appendChild(h("option", { value: pair[0], text: pair[1] }));
    });
    animSelect.value = cfg.animated_mode || "video";

    const titleBar = h("h4", null, [
      h("span", { text: "微博 Eagle 推送 · 设置（可拖动）" }),
      h("span", { class: NS + "-close", text: "✕", onclick: closePanel })
    ]);
    const panel = h("div", { class: NS + "-panel" }, [
      titleBar,
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "Eagle 地址" }), baseInput]),
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "目标文件夹" }), folderField.node]),
      h("div", { class: NS + "-row", style: { alignItems: "flex-start" } }, [h("span", { class: NS + "-label", text: "标签" }), tagField.node]),
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "文件名" }), tplInput]),
      h("div", { class: NS + "-hint", text: "占位符：{username} {userid} {mblogid} {uid} {index} {content} {YYYY} {MM} {DD} {HH} {mm} {ss} {original} {ext}" }),
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "动图取" }), animSelect]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [skipExisting, h("span", { text: "跳过 Eagle 中已存在的素材" })]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [sendReferer, h("span", { text: "推送时带 Referer / UA（微博 CDN 防盗链，建议开）" })]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [upscale, h("span", { text: "图片取大图（把缩略档位换成 large）" })]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [withCover, h("span", { text: "视频帖同时推送封面" })]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [setAddedDate, h("span", { text: "把博文发布时间写入 Eagle「添加日期」（默认关：添加日期保持真实入库时间）" })]),
      h("label", { class: NS + "-row", style: { cursor: "pointer" } }, [enableShortcut, h("span", { text: "启用快捷键" })]),
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "快捷键" }), keyInput]),
      h("div", { class: NS + "-row", style: { justifyContent: "flex-end" } }, [
        h("button", { class: NS + "-btn " + NS + "-btn2", text: "恢复默认", onclick: () => { cfg = Object.assign({}, DEFAULT_CFG); saveCfg(); openSettings(); toast("已恢复默认设置"); } }),
        h("button", {
          class: NS + "-btn", text: "保存",
          onclick: () => {
            setCfg({
              eagle_base_url: baseInput.value.trim() || EAGLE_DEFAULT_BASE_URL,
              filename_template: tplInput.value.trim() || DEFAULT_FILENAME_TEMPLATE,
              push_shortcut: (keyInput.value.trim() || "s").slice(0, 1).toLowerCase(),
              skip_existing: skipExisting.checked,
              send_referer: sendReferer.checked,
              upscale_image: upscale.checked,
              video_with_cover: withCover.checked,
              set_added_date: setAddedDate.checked,
              enable_shortcut: enableShortcut.checked,
              animated_mode: animSelect.value
            });
            closePanel();
            toast("设置已保存");
          }
        })
      ]),
      h("div", { class: NS + "-hint", text: "快捷键、折叠开关等改动立即生效；Eagle 地址变更后下次推送生效。" })
    ]);
    document.body.appendChild(panel);
    panelNode = panel;
    attachPanelDrag(panel, titleBar);
  }

  /* ---------- 页面按钮注入 ---------- */

  /**
   * 页面上的“微博卡片”来源。
   *
   * 不能用裸 article —— 微博把 woo-panel-main / woo-panel-top 这类布局容器
   * 也做成了 article，会把整块面板当成一条微博（表现为点一次按钮取到不相干的 id）。
   * 最可靠的是带 mid 属性的帖子容器，另外兼容搜索页的 .card-wrap。
   */
  const CARD_SELECTORS = [
    "[mid]",
    ".card-wrap"
  ];

  function isUsableId(id) {
    return ID_NUMERIC.test(id) || ID_MBLOG.test(id);
  }

  /**
   * 返回这条卡片**可能的** status id（按可信度从高到低）。
   *
   * 微博把 mid 同时挂在面板容器、帖子容器、甚至子元素上，单点猜测极易出错；
   * 这里给出候选列表，由调用方逐个去接口试 —— 能查到数据的那个才是对的。
   * 绝不使用“任意 weibo.com 链接的最后一段”，否则会取到头像链接里的 uid。
   */
  function findStatusIdCandidates(card) {
    const out = [];
    const add = (value) => {
      const id = String(value || "").trim();
      if (!isUsableId(id) || out.indexOf(id) >= 0) return;
      out.push(id);
    };
    if (!card) return out;
    const readMid = (node) => (node && typeof node.getAttribute === "function" ? String(node.getAttribute("mid") || "").trim() : "");

    // 1) 卡片内部的 [mid]：越靠后通常越内层（越接近帖子本身），所以倒序优先
    const innerMids = typeof card.querySelectorAll === "function" ? card.querySelectorAll("[mid]") : [];
    for (let i = innerMids.length - 1; i >= 0; i -= 1) add(readMid(innerMids[i]));

    // 2) 卡片自身 / 最近祖先的 mid
    add(readMid(card.closest ? card.closest("[mid]") : null));
    add(readMid(card));

    // 3) 明确的 /status/、/detail/ 链接
    const explicit = typeof card.querySelectorAll === "function"
      ? card.querySelectorAll('a[href*="/status/"], a[href*="/detail/"], a[href*="s.weibo.com/weibo"]')
      : [];
    for (let i = 0; i < explicit.length; i += 1) add(parseStatusId(explicit[i].getAttribute("href")));

    // 4) header 时间链接 /{uid}/{mblogid}
    const headLinks = typeof card.querySelectorAll === "function"
      ? card.querySelectorAll("header a[href], .head-info_time_6sFQg, ._time_1tpft_33, a[href*='weibo.com']")
      : [];
    for (let i = 0; i < headLinks.length; i += 1) {
      const href = String(headLinks[i].getAttribute("href") || "");
      const m = href.match(/weibo\.com\/(?:u\/)?\d+\/([A-Za-z0-9]{6,})\/?(?:[?#]|$)/);
      if (m) add(m[1]);
    }

    // 5) 详情页地址栏
    try {
      add(parseStatusId(String(location.href || "")));
    } catch (err) { /* ignore */ }

    return out;
  }

  /** 兼容旧调用：取可信度最高的那个 id */
  function findStatusId(card) {
    const list = findStatusIdCandidates(card);
    return list.length ? list[0] : "";
  }

  /**
   * 收集页面上“像一条微博”的卡片。
   *
   * 不再猜测 mid 的层级（微博在面板容器、帖子容器、子元素上都可能挂 mid），
   * 而是以“每条帖子唯一的那条 footer / .card-act 操作栏”为锚点向上找容器；
   * 找不到就退回 .card-wrap；仍然为空则退回“内部没有再嵌 [mid]”的 [mid]。
   * 这样只要页面有帖子就能收集到卡片，不会因为层级判断过严而一张都拿不到。
   */
  function collectCards(root) {
    const scope = root || document;
    const out = [];
    if (typeof scope.querySelectorAll !== "function") return out;
    const push = (node) => {
      if (!node || out.indexOf(node) >= 0) return;
      out.push(node);
    };

    // 1) footer / .card-act 锚点（只认最内层锚点，避免把整块面板当成一条）
    const anchors = scope.querySelectorAll("footer, .card-act");
    for (let i = 0; i < anchors.length; i += 1) {
      const anchor = anchors[i];
      if (typeof anchor.querySelector === "function" && anchor.querySelector("footer, .card-act")) continue;
      const holder = (anchor.closest && anchor.closest("[mid]")) ||
        (anchor.closest && anchor.closest("article")) ||
        anchor.parentElement;
      push(holder);
    }

    // 2) 搜索页 / 其它列表结构
    const wraps = scope.querySelectorAll(".card-wrap");
    for (let j = 0; j < wraps.length; j += 1) push(wraps[j]);

    // 3) 兜底：内部没有再嵌 [mid] 的 [mid] 元素
    if (out.length === 0) {
      const mids = scope.querySelectorAll("[mid]");
      for (let k = 0; k < mids.length; k += 1) {
        const node = mids[k];
        if (!isUsableId(String(node.getAttribute("mid") || ""))) continue;
        if (typeof node.querySelector === "function" && node.querySelector("[mid]")) continue;
        push(node);
      }
    }
    return out;
  }

  function buttonHost(card) {
    if (!card) return null;
    const footer = card.querySelector("footer");
    if (footer) return footer;
    return card.querySelector(".card-act") || card;
  }

  async function handleButtonClick(event, card) {
    event.preventDefault();
    event.stopPropagation();
    const candidates = findStatusIdCandidates(card);
    let innerMidCount = 0;
    try {
      innerMidCount = typeof card.querySelectorAll === "function" ? card.querySelectorAll("[mid]").length : 0;
    } catch (err) {
      innerMidCount = -1;
    }
    log("点击「存 Eagle」：候选=" + (candidates.join(",") || "(无)") + " | card=" + (card.tagName || "") + "." + String(card.className || "").slice(0, 60) + " | 内部[mid]=" + innerMidCount + " | href=" + String(location.href).slice(0, 80));
    if (candidates.length === 0) {
      toast("没找到这条微博的 id（页面结构可能变了）：" + String(location.href).slice(0, 60), 6000);
      return;
    }
    const btn = event.currentTarget;
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "读取中…";

    let payload = null;
    let usedId = "";
    let lastError = null;
    for (let i = 0; i < candidates.length; i += 1) {
      try {
        payload = await fetchStatus(candidates[i]);
        usedId = candidates[i];
        break;
      } catch (err) {
        lastError = err;
        log("候选 id 失败：" + candidates[i] + " -> " + ((err && err.message) || err));
      }
    }

    btn.disabled = false;
    btn.textContent = original;
    if (!payload) {
      toast("读取微博失败（已试 " + candidates.length + " 个 id）：" + ((lastError && lastError.message) || lastError), 6000);
      return;
    }
    if (usedId !== candidates[0]) log("第 " + (candidates.indexOf(usedId) + 1) + " 个候选 id 生效：" + usedId);

    // 直接按已保存的设置推送（不再弹面板；文件夹/标签/开关都在设置里改）
    btn.disabled = true;
    btn.textContent = "推送中…";
    try {
      const stats = await pushStatus(payload.status, payload.raw, (done, total) => {
        btn.textContent = done + "/" + total;
      });
      const parts = [];
      if (stats.saved) parts.push(stats.saved + " 成功");
      if (stats.skipped) parts.push(stats.skipped + " 跳过");
      if (stats.failed) parts.push(stats.failed + " 失败");
      toast("Eagle：" + (parts.join("，") || "没有可推送的素材") + (stats.error ? "\n" + stats.error : ""), 5000);
    } catch (err) {
      warn("推送失败", err);
      toast("推送失败：" + ((err && err.message) || err), 6000);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function injectCardButtons() {
    if (!/weibo\.com$/.test(location.hostname)) return;
    const cards = collectCards(document);
    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      if (card.querySelector("." + NS + "-card-btn")) continue;
      const host = buttonHost(card);
      if (!host) continue;
      const btn = h("button", {
        class: NS + "-card-btn",
        text: "存 Eagle",
        type: "button",
        onclick: (event) => handleButtonClick(event, card)
      });
      host.appendChild(btn);
    }
  }

          /* ---------- Eagle 选择弹层（文件夹 / 标签共用，交互参考抖音脚本） ---------- */

  let pickerRoot = null;
  let pickerKeydown = null;

  function closeEaglePicker() {
    if (pickerKeydown) {
      window.removeEventListener("keydown", pickerKeydown, true);
      pickerKeydown = null;
    }
    if (pickerRoot) {
      pickerRoot.remove();
      pickerRoot = null;
    }
  }

  /**
   * 打开独立的 Eagle 选择弹层（搜索 + 单选/多选）。
   * @param {{mode:"folder"|"tag", selectedFolderId?:string, selectedTags?:string[], onChange:function}} options
   */
  function openEaglePicker(options) {
    injectStyles();
    closeEaglePicker();
    const opts = options || {};
    const isFolder = opts.mode !== "tag";
    let keyword = "";
    let loading = true;
    let errorText = "";
    let folders = [];
    let tags = [];
    let pickedFolderId = opts.selectedFolderId || "";
    let pickedTags = Array.isArray(opts.selectedTags) ? opts.selectedTags.slice() : [];
    let folderNames = {};

    const search = h("input", { class: NS + "-pickSearch", type: "text", placeholder: isFolder ? "搜索文件夹…" : "搜索标签…" });
    const body = h("div", { class: NS + "-pickBody" + (isFolder ? "" : " " + NS + "-pickTwoCol") });
    const manualInput = isFolder ? null : h("input", { class: NS + "-pickManual", type: "text", placeholder: "手动输入标签，逗号分隔，回车添加" });
    const emit = () => {
      if (typeof opts.onChange !== "function") return;
      if (isFolder) opts.onChange({ folder_id: pickedFolderId, folder_name: folderNames[pickedFolderId] || "" });
      else opts.onChange({ tags: pickedTags.slice() });
    };
    const render = () => {
      body.textContent = "";
      if (loading) { body.appendChild(h("div", { class: NS + "-pickState", text: "正在读取 Eagle…" })); return; }
      if (errorText) { body.appendChild(h("div", { class: NS + "-pickState", text: "读取失败：" + errorText })); return; }
      const q = keyword.trim().toLowerCase();
      let shown = 0;
      if (isFolder) {
        if (matchesQuery("（库根目录）", q)) {
          shown += 1;
          body.appendChild(h("div", {
            class: NS + "-pickItem" + (pickedFolderId ? "" : " " + NS + "-pickItemOn"),
            onclick: () => { pickedFolderId = ""; render(); emit(); }
          }, "（库根目录）"));
        }
        folders.forEach((folder) => {
          if (!matchesQuery(folder.name, q)) return;
          shown += 1;
          body.appendChild(h("div", {
            class: NS + "-pickItem" + (pickedFolderId === folder.id ? " " + NS + "-pickItemOn" : ""),
            style: { paddingLeft: (8 + folder.depth * 14) + "px" },
            onclick: () => { pickedFolderId = folder.id; render(); emit(); }
          }, folder.name));
        });
      } else {
        tags.forEach((name) => {
          if (!matchesQuery(name, q)) return;
          shown += 1;
          const isPicked = pickedTags.indexOf(name) >= 0;
          body.appendChild(h("div", {
            class: NS + "-pickItem" + (isPicked ? " " + NS + "-pickItemOn" : ""),
            onclick: () => {
              pickedTags = isPicked ? pickedTags.filter((x) => x !== name) : pickedTags.concat([name]);
              render(); emit();
            }
          }, name));
        });
      }
      if (shown === 0) body.appendChild(h("div", { class: NS + "-pickState", text: "没有匹配项" }));
    };

    search.addEventListener("input", () => { keyword = search.value || ""; render(); });
    if (manualInput) {
      manualInput.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        String(manualInput.value || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((name) => {
          if (pickedTags.indexOf(name) < 0) pickedTags = pickedTags.concat([name]);
          if (tags.indexOf(name) < 0) tags = tags.concat([name]);
        });
        manualInput.value = "";
        render();
        emit();
      });
    }

    const root = h("div", {
      class: NS + "-overlay",
      onclick: (ev) => { if (ev.target === ev.currentTarget) closeEaglePicker(); }
    }, [
      h("div", { class: NS + "-picker" }, [
        h("div", { class: NS + "-pickHead" }, [
          search,
          h("span", { class: NS + "-pickHint", text: isFolder ? "单选" : "可多选" })
        ]),
        body,
        manualInput,
        h("div", { class: NS + "-pickFoot" }, [
          h("span", { text: isFolder ? "点击选择（层级用缩进表示）" : "点击切换选中；手动输入的标签也会带上" }),
          h("span", { text: "Esc 关闭" })
        ])
      ])
    ]);
    document.body.appendChild(root);
    pickerRoot = root;
    pickerKeydown = (ev) => {
      if (ev.key === "Escape") { ev.preventDefault(); closeEaglePicker(); }
    };
    window.addEventListener("keydown", pickerKeydown, true);
    render();
    search.focus();

    (async () => {
      try {
        const client = getEagleClient();
        if (isFolder) {
          const tree = await client.getFolders();
          folders = EagleClient.flattenFolders(tree, 0, []);
          folderNames = {};
          folders.forEach((f) => { folderNames[f.id] = f.name; });
          folderNames[""] = "库根目录";
        } else {
          tags = (await client.getTags()).map((t) => String(t));
          pickedTags.forEach((name) => { if (tags.indexOf(name) < 0) tags.push(name); });
          tags.sort((a, b) => a.localeCompare(b));
        }
        loading = false;
      } catch (err) {
        loading = false;
        errorText = String((err && err.message) || err) + "（请确认 Eagle 已启动）";
      }
      render();
    })();
  }

  /**
   * 构造一行「开关」（复选框 + 文案）。
   *
   * 关键点：
   *  - 用 div 而不是 label：label 包裹 input 时点击转发依赖浏览器实现，
   *    点方框/点文字可能出现切换两次的观感（表现为「取消不掉」）。
   *  - 勾选变化**立即** setCfg，不必等点「推送选中」，否则直接关面板就会丢。
   */
  function createToggleRow(key, labelText) {
    const box = h("input", { type: "checkbox", checked: cfg[key] === true });
    const row = h("div", { class: NS + "-row", style: { cursor: "pointer" } }, [
      box,
      h("span", { text: labelText })
    ]);
    const apply = () => {
      const patch = {};
      patch[key] = box.checked;
      setCfg(patch);
    };
    // 点方框：交给浏览器切换，只监听 change
    box.addEventListener("change", apply);
    // 点文案或行内空白：手动切换（div 没有隐式转发，不会出现双重切换）
    row.addEventListener("click", (ev) => {
      if (ev.target === box) return;
      box.checked = !box.checked;
      apply();
    });
    return { box: box, row: row };
  }

  /** 主界面里的「目标文件夹」行：显示当前选择 + 打开选择窗口 */
  function createFolderField() {
    const value = h("span", { class: NS + "-field", text: "" });
    const pickBtn = h("button", { class: NS + "-btn " + NS + "-btn2", text: "选择文件夹" });
    const clearBtn = h("button", { class: NS + "-btn " + NS + "-btn2", text: "用根目录" });
    const update = () => {
      value.textContent = cfg.folder_id ? (cfg.folder_name || cfg.folder_id) : "库根目录（未选择）";
      clearBtn.style.display = cfg.folder_id ? "" : "none";
    };
    pickBtn.addEventListener("click", () => {
      openEaglePicker({
        mode: "folder",
        selectedFolderId: cfg.folder_id || "",
        onChange: (patch) => { setCfg(patch); update(); }
      });
    });
    clearBtn.addEventListener("click", () => { setCfg({ folder_id: "", folder_name: "" }); update(); });
    update();
    return { node: h("div", { class: NS + "-fieldRow" }, [value, pickBtn, clearBtn]), update: update };
  }

  /** 主界面里的「标签」行：显示已选数量与标签 + 打开选择窗口 */
  function createTagField() {
    const count = h("span", { class: NS + "-field", text: "" });
    const chips = h("div", { class: NS + "-chips" });
    const pickBtn = h("button", { class: NS + "-btn " + NS + "-btn2", text: "选择标签" });
    const clearBtn = h("button", { class: NS + "-btn " + NS + "-btn2", text: "清空标签" });
    const update = () => {
      const list = Array.isArray(cfg.tags) ? cfg.tags : [];
      count.textContent = list.length ? "已选 " + list.length + " 个" : "未选择（素材不带任何标签）";
      chips.textContent = "";
      list.forEach((name) => chips.appendChild(h("span", { class: NS + "-chip", text: name })));
      clearBtn.style.display = list.length ? "" : "none";
    };
    pickBtn.addEventListener("click", () => {
      openEaglePicker({
        mode: "tag",
        selectedTags: Array.isArray(cfg.tags) ? cfg.tags : [],
        onChange: (patch) => { setCfg(patch); update(); }
      });
    });
    clearBtn.addEventListener("click", () => { setCfg({ tags: [] }); update(); });
    update();
    return { node: h("div", { style: { flex: "1", minWidth: "0" } }, [
      h("div", { class: NS + "-fieldRow" }, [count, pickBtn, clearBtn]),
      chips
    ]), update: update };
  }


                  /** 搜索匹配：不区分大小写的子串匹配（key 为空一律通过） */
      function matchesQuery(text, key) {
        const q = String(key == null ? "" : key).trim().toLowerCase();
        if (!q) return true;
        return String(text == null ? "" : text).toLowerCase().indexOf(q) >= 0;
      }

      /** 从卡片 DOM 里取一段摘要用于列表展示（不请求接口，快） */
  function describeCard(card) {
    let mediaCount = 0;
    let text = "";
    try {
      mediaCount = card.querySelectorAll ? card.querySelectorAll("img, video").length : 0;
      text = String(card.textContent || "").replace(/\s+/g, " ").trim();
    } catch (err) { /* ignore */ }
    return { mediaCount: mediaCount, text: text.slice(0, 60) || "(无正文)" };
  }

  /** 取一条微博并直接按设置推送（供快捷键使用，不弹面板） */
  async function pushStatusById(id) {
    try {
      const result = await fetchStatus(id);
      const stats = await pushStatus(result.status, result.raw);
      const parts = [];
      if (stats.saved) parts.push(stats.saved + " 成功");
      if (stats.skipped) parts.push(stats.skipped + " 跳过");
      if (stats.failed) parts.push(stats.failed + " 失败");
      toast("Eagle：" + (parts.join("，") || "没有可推送的素材") + (stats.error ? "\n" + stats.error : ""), 5000);
    } catch (err) {
      warn("推送失败", err);
      toast("推送失败：" + ((err && err.message) || err), 6000);
    }
  }

  /**
   * 批量推送面板（右下角 E 按钮专用）：列出本页可推送的微博，勾选要推的，再选目标文件夹/标签。
   * 注意：单条「存 Eagle」与快捷键都是直接推送，不弹这个面板。
   * @param {Array<{id:string, card:Element}>} entries
   */
  function openBatchPanel(entries) {
    injectStyles();
    closePanel();
    const rows = [];
    const seenIds = {};
    const listNode = h("div", { class: NS + "-list" });

    const folderField = createFolderField();
    const tagField = createTagField();
    const authorTagRow = createToggleRow("author_as_tag", "作者名追加为标签");
    const authorFolderRow = createToggleRow("author_as_folder", "作者名建子文件夹");
    const statusLine = h("div", { class: NS + "-status", text: "" });
    const startBtn = h("button", { class: NS + "-btn", text: "推送选中项" });

    const updateCount = () => {
      const picked = rows.filter((r) => r.box.checked).length;
      statusLine.textContent = "已选 " + picked + " / " + rows.length + " 条" +
        (rows.length >= MAX_BATCH_ROWS
          ? "（已达上限 " + MAX_BATCH_ROWS + " 条）"
          : "（滚动加载的新微博会自动加入）");
      startBtn.textContent = picked > 0 ? "推送选中 " + picked + " 条" : "推送选中项";
      startBtn.disabled = picked === 0;
    };

    /** 把新出现的卡片追加进列表（已有的勾选状态不受影响） */
    const appendEntries = (list) => {
      let added = 0;
      (Array.isArray(list) ? list : []).forEach((entry) => {
        if (!entry || !entry.id || seenIds[entry.id]) return;
        if (rows.length >= MAX_BATCH_ROWS) return;
        seenIds[entry.id] = true;
        const info = describeCard(entry.card);
        const box = h("input", { type: "checkbox", checked: true });
        const node = h("label", { class: NS + "-listItem" }, [
          box,
          h("span", { class: NS + "-listText", text: (rows.length + 1) + ". " + info.text }),
          h("span", { class: NS + "-listMeta", text: info.mediaCount + " 项媒体" })
        ]);
        box.addEventListener("change", updateCount);
        rows.push({ box: box, entry: entry, node: node });
        listNode.appendChild(node);
        added += 1;
      });
      if (added > 0) updateCount();
      return added;
    };

    appendEntries(entries);

    const titleBar = h("h4", null, [
      h("span", { text: "批量推送到 Eagle（可拖动）" }),
      h("span", { class: NS + "-close", text: "✕", onclick: closePanel })
    ]);
    const panel = h("div", { class: NS + "-panel" }, [
      titleBar,
      h("div", { class: NS + "-row" }, [
        h("span", { class: NS + "-label", style: { flex: "1 1 auto", whiteSpace: "nowrap" }, text: "本页微博（勾选要推的）" }),
        h("span", { style: { flex: "0 0 auto" } }, [
          h("button", { class: NS + "-listBtn", text: "全选", onclick: () => { rows.forEach((r) => { r.box.checked = true; }); updateCount(); } }),
          h("button", { class: NS + "-listBtn", text: "全不选", onclick: () => { rows.forEach((r) => { r.box.checked = false; }); updateCount(); } })
        ])
      ]),
      listNode,
      h("div", { class: NS + "-row" }, [h("span", { class: NS + "-label", text: "目标文件夹" }), folderField.node]),
      h("div", { class: NS + "-row", style: { alignItems: "flex-start" } }, [h("span", { class: NS + "-label", text: "标签" }), tagField.node]),
      authorTagRow.row,
      authorFolderRow.row,
      h("div", { class: NS + "-row", style: { justifyContent: "flex-end" } }, [
        h("button", { class: NS + "-btn " + NS + "-btn2", text: "设置", onclick: openSettings }),
        startBtn
      ]),
      statusLine
    ]);
    document.body.appendChild(panel);
    panelNode = panel;
    attachPanelDrag(panel, titleBar);
    updateCount();

    // 页面继续加载微博时，列表实时跟进
    panelCleanup = watchNewCards(() => {
      const fresh = [];
      collectCards(document).forEach((card) => {
        const id = findStatusId(card);
        if (id && !seenIds[id]) fresh.push({ id: id, card: card });
      });
      appendEntries(fresh);
    });

    startBtn.addEventListener("click", async () => {
      const picked = rows.filter((r) => r.box.checked);
      if (picked.length === 0) { toast("没有勾选任何微博"); return; }
      // 作者归类开关在勾选瞬间就已 setCfg，这里不再覆盖
      startBtn.disabled = true;
      let saved = 0; let skipped = 0; let failed = 0;
      const errors = [];
      for (let i = 0; i < picked.length; i += 1) {
        if (i > 0) await sleep(250);
        const entry = picked[i].entry;
        try {
          const result = await fetchStatus(entry.id);
          const stats = await pushStatus(result.status, result.raw);
          saved += stats.saved; skipped += stats.skipped; failed += stats.failed;
          if (stats.error) errors.push(stats.error);
        } catch (err) {
          failed += 1;
          errors.push("id=" + entry.id + " " + String((err && err.message) || err));
        }
        statusLine.textContent = "进度 " + (i + 1) + "/" + picked.length + " · 成功 " + saved + " 跳过 " + skipped + " 失败 " + failed;
      }
      startBtn.disabled = false;
      updateCount(); // 先恢复按钮状态，再写汇总（updateCount 会重写状态行）
      statusLine.textContent = "完成：成功 " + saved + "，跳过 " + skipped + "，失败 " + failed + (errors.length ? "\n首个错误：" + errors[0] : "");
      toast("批量推送完成：成功 " + saved + "，跳过 " + skipped + "，失败 " + failed, 6000);
    });
  }

  function ensureFab() {
    if (document.querySelector("." + NS + "-fab")) return;
    const fab = h("button", {
      class: NS + "-fab",
      text: "插件",
      title: "批量推送当前页可见的微博（点击打开；按住可拖动）",
      onclick: () => {
        // 拖动过就不算点击
        if (fab.__wbDragged === true) return;
        // 打开「勾选列表」面板：列出本页微博，勾选要推的，再选目标
        const entries = [];
        const seen = [];
        collectCards(document).forEach((card) => {
          const id = findStatusId(card);
          if (!id || seen.indexOf(id) >= 0) return;
          seen.push(id);
          entries.push({ id: id, card: card });
        });
        if (entries.length === 0) { toast("当前页没找到可推送的微博"); return; }
        openBatchPanel(entries);
      }
    });
    document.body.appendChild(fab);
    applyStoredPos(fab, POS_KEY_FAB);
    makeDraggable(fab, fab, POS_KEY_FAB);
  }

  function registerMenu() {
    if (typeof GM_registerMenuCommand !== "function") return;
    GM_registerMenuCommand("微博 Eagle 推送 · 设置", () => openSettings());
    GM_registerMenuCommand("微博 Eagle 推送 · 批量推送当前页", () => {
      const fab = document.querySelector("." + NS + "-fab");
      if (fab) fab.click();
    });
  }

  /* ============================ 6. 启动 ============================ */

  function boot() {
    injectStyles();
    registerMenu();
    document.body.addEventListener("mouseover", injectCardButtons, { passive: true });
    setInterval(injectCardButtons, 2500);
    ensureFab();

    document.addEventListener(
      "keydown",
      (event) => {
        if (!cfg.enable_shortcut) return;
        const key = cfg.push_shortcut || "s";
        if (event.key.toLowerCase() !== key) return;
        const target = event.target;
        if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const article = document.querySelector("article");
        if (!article) return;
        const id = findStatusId(article);
        if (!id) return;
        event.preventDefault();
        pushStatusById(id);
      },
      true
    );

    log("微博 Eagle 推送脚本已启动（v1.0.18）");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // 暴露少量调试入口（便于在控制台核对解析结果）
  try {
    window.__wbEagle = {
      config: () => Object.assign({}, cfg),
      collect: (status, raw, options) => collectMediaItems(status, raw, options),
      parseStatusId: parseStatusId,
      findStatusId: findStatusId,
      findStatusIdCandidates: findStatusIdCandidates,
      collectCards: collectCards,
      parseCreatedAt: parseCreatedAt,
      formatTimeParts: formatTimeParts,
      fetchStatus: fetchStatus,
      pushStatus: pushStatus,
      openSettings: openSettings,
      openBatchPanel: openBatchPanel
    };
  } catch (err) { /* ignore */ }
})();
