// ==UserScript==
// @name         小红书图集/视频推送eagle
// @namespace    https://github.com/jiebukai/tampermonkey
// @version      1.0
// @description  小红书作品（图文/视频）推送到 Eagle 素材库，可选目标文件夹与标签；支持手动输入标签、快捷键、可拖动悬浮按钮、下载当前作品
// @author       jiebukai
// @match        *://www.xiaohongshu.com/explore*
// @match        *://www.xiaohongshu.com/discovery/item/*
// @match        *://www.xiaohongshu.com/user/profile/*
// @match        *://www.rednote.com/explore*
// @match        *://www.rednote.com/discovery/item/*
// @match        *://www.rednote.com/user/profile/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @connect      localhost
// @connect      127.0.0.1
// @connect      *
// @run-at       document-idle
// @supportURL   https://github.com/jiebukai/tampermonkey/issues
// @downloadURL  https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E6%8E%A8%E9%80%81eagle.user.js
// @updateURL    https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E6%8E%A8%E9%80%81eagle.user.js
// @homepageURL  https://github.com/jiebukai/tampermonkey
// ==/UserScript==
/*
 * 维护：jiebukai（仓库 https://github.com/jiebukai/tampermonkey）
 * @namespace / @downloadURL / @updateURL / @supportURL 均指向本仓库，
 * 用于切断与上游脚本的自动更新关联，避免 Tampermonkey 自动更新把本地改动覆盖回上游版本。
 * 原作者与上游来源保留在下方 @author 及原说明中。
 */

/*
 * 说明
 * ----
 * 这是「抖音推送eagle 1.6.4」的小红书版本，只覆盖作品详情页（/explore/、/discovery/item/）。
 * 复用同一套 Eagle 接口契约（v2/v1 自动探测、addFromURL + folderIds、按 url + 文件名查重），
 * UI 形态与 1.6.4 一致：可拖动的悬浮按钮 + 卡片面板 + 选择目录/标签的弹层 + 快捷键。
 *
 * 小红书侧的数据来源参考 XHS-Downloader：window.__INITIAL_STATE__ 里的 noteData / noteDetailMap。
 * 小红书 CDN 图片存在时效防盗链，部分资源 Eagle 可能拉取失败（会提示）。
 */

(function () {
  'use strict';

  const LOG = '[XHS-Eagle]';
  const log = {
    info: (...args) => console.log(LOG, ...args),
    warn: (...args) => console.warn(LOG, ...args),
    error: (...args) => console.error(LOG, ...args),
    debug: (...args) => console.debug(LOG, ...args)
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 1. 配置                                                    ║
  // ╚════════════════════════════════════════════════════════════╝

  const CONFIG_KEY = 'xhs_eagle_config_v1';
  const FAB_POS_KEY = 'xhs_eagle_fab_pos_v1';
  const NAME_FIELDS = ['发布时间', '作者昵称', '作品标题', '作品ID', '作品描述', '作品类型', '作品标签', '点赞数量', '收藏数量', '评论数量', '分享数量', '更新时间', '作者ID'];
  const DEFAULT_CONFIG = {
    eagleURL: 'http://127.0.0.1:41595',
    eagleToken: '',
    folderId: '',
    folderName: '',
    tags: [],
    skipExisting: true,
    authorAsTag: false,
    authorAsFolder: false,
    sendReferer: true,
    enableShortcuts: true,
    shortcutPush: 's',
    shortcutDownload: 'm',
    filenameFields: ['发布时间', '作者昵称', '作品标题', '作品ID'],
    imageFormat: 'jpeg'
  };
  const config = Object.assign({}, DEFAULT_CONFIG, GM_getValue(CONFIG_KEY, {}) || {});
  const saveConfig = () => GM_setValue(CONFIG_KEY, config);
  if (!Array.isArray(config.tags)) config.tags = [];
  if (!Array.isArray(config.filenameFields) || config.filenameFields.length === 0) {
    config.filenameFields = [...DEFAULT_CONFIG.filenameFields];
  }

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 2. 通用工具                                                ║
  // ╚════════════════════════════════════════════════════════════╝

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const sanitizeName = (raw, max = 80) => {
    const text = String(raw == null ? '' : raw)
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/, '')
      .trim();
    return text.length > max ? text.slice(0, max).trim() : text;
  };

  const formatTime = (value) => {
    const ts = Number(value);
    if (!Number.isFinite(ts) || ts <= 0) return '';
    const date = new Date(ts > 1000000000000 ? ts : ts * 1000);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  };

  const getPageWindow = () => (typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window);

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 3. 小红书数据提取                                          ║
  // ╚════════════════════════════════════════════════════════════╝

  const currentSite = /rednote\.com/.test(location.host) ? 'rednote' : 'xiaohongshu';

  const getCurrentNoteId = () => {
    const match = location.pathname.match(/\/(?:explore|discovery\/item)\/([^/?#]+)/);
    if (match) return match[1];
    // 用户主页点开作品弹层时，作品 id 常在 modal_id 参数上
    try {
      const modalId = new URLSearchParams(location.search).get('modal_id');
      if (modalId) return String(modalId).split('?')[0];
    } catch (err) {
      log.debug('read modal_id failed', err);
    }
    return '';
  };

  const isNotePage = () => {
    const url = location.href;
    return url.includes(`https://www.${currentSite}.com/explore/`) ||
      url.includes(`https://www.${currentSite}.com/discovery/item/`) ||
      url.includes(`https://www.${currentSite}.com/user/profile/`) ||
      /\/explore\/[0-9a-zA-Z]+/.test(location.pathname);
  };

  /** 从 __INITIAL_STATE__ 提取当前作品数据（参考 XHS-Downloader 的取值路径） */
  const extractNote = () => {
    try {
      const initialState = getPageWindow().__INITIAL_STATE__;
      if (!initialState) return null;
      const direct = initialState?.noteData?.data?.noteData;
      if (direct) return direct;
      const noteId = getCurrentNoteId();
      const noteDetailMap = initialState?.note?.noteDetailMap;
      if (noteDetailMap) {
        if (noteId && noteDetailMap[noteId]?.note) return noteDetailMap[noteId].note;
        const items = Object.values(noteDetailMap).filter((item) => item && item.note);
        if (items.length > 0) return items[items.length - 1].note;
      }
      return null;
    } catch (err) {
      log.debug('extractNote failed', err);
      return null;
    }
  };

  const getNoteId = (note) => String(note?.noteId || note?.id || getCurrentNoteId() || '');

  const noteAuthor = (note) => String(note?.user?.nickname || note?.user?.nickName || '').trim();

  const noteTitle = (note) => String(note?.title || note?.displayTitle || '').trim();

  const noteDesc = (note) => String(note?.desc || '').trim();

  const noteTags = (note) => {
    const list = Array.isArray(note?.tagList) ? note.tagList : [];
    return list.map((tag) => (tag && tag.name ? String(tag.name).trim() : '')).filter(Boolean);
  };

  const isVideoNote = (note) => String(note?.type || '') === 'video';

  /** 图文作品的图片直链（小红书图片走 ci.xiaohongshu.com 的格式转换接口） */
  const buildImageUrls = (note) => {
    const images = Array.isArray(note?.imageList) ? note.imageList : [];
    const regexBySite = {
      xiaohongshu: /http:\/\/sns-webpic-qc\.xhscdn\.com\/\d+\/[0-9a-z]+\/(\S+)!/,
      rednote: /http:\/\/sns-web-i10\.rednotecdn\.com\/\d+\/[0-9a-z]+\/(\S+)!/
    };
    const regex = regexBySite[currentSite];
    const format = String(config.imageFormat || 'jpeg').toLowerCase();
    const urls = [];
    images.forEach((item) => {
      const raw = item?.urlDefault || item?.url || '';
      const match = raw.match(regex);
      if (match && match[1]) {
        urls.push(`https://ci.xiaohongshu.com/${match[1]}?imageView2/format/${format}`);
      }
    });
    return urls;
  };

  /** 视频作品的视频直链（优先 originVideoKey，再退回到最高分辨率的 stream） */
  const buildVideoUrls = (note) => {
    try {
      const key = note?.video?.consumer?.originVideoKey;
      if (key) return [`https://sns-video-bd.xhscdn.com/${key}`];
      const streams = Object.values(note?.video?.media?.stream || {}).flat();
      if (streams.length === 0) return [];
      streams.sort((a, b) => (Number(b?.height) || 0) - (Number(a?.height) || 0));
      const best = streams[0];
      const url = (Array.isArray(best?.backupUrls) && best.backupUrls[0]) || best?.masterUrl;
      return url ? [url] : [];
    } catch (err) {
      log.error('buildVideoUrls failed', err);
      return [];
    }
  };

  /** 当前作品的全部媒体直链 */
  const buildMediaUrls = (note) => (isVideoNote(note) ? buildVideoUrls(note) : buildImageUrls(note));

  /** 媒体明细：直链 + 分辨率（图片取 imageList，视频取最高档 stream） */
  const buildMediaDetails = (note) => {
    if (isVideoNote(note)) {
      const urls = buildVideoUrls(note);
      const video = note?.video || {};
      let best = null;
      try {
        const streams = Object.values(video?.media?.stream || {}).flat();
        if (streams.length > 0) {
          best = streams.slice().sort((a, b) => (Number(b?.height) || 0) - (Number(a?.height) || 0))[0];
        }
      } catch (err) {
        log.debug('read video streams failed', err);
      }
      const width = Number(best?.width || video.width || video.capa?.width || 0);
      const height = Number(best?.height || video.height || video.capa?.height || 0);
      return urls.map((url, index) => ({ url, width, height, kind: 'video', index }));
    }
    const images = Array.isArray(note?.imageList) ? note.imageList : [];
    const urls = buildImageUrls(note);
    return urls.map((url, index) => {
      const image = images[index] || {};
      const info = Array.isArray(image?.infoList) ? image.infoList[0] : null;
      return {
        url,
        width: Number(image.width || image.urlDefaultWidth || info?.width || 0),
        height: Number(image.height || image.urlDefaultHeight || info?.height || 0),
        kind: 'image',
        index
      };
    });
  };

  const formatSize = (width, height) => {
    if (!width || !height) return '';
    return `${width} × ${height}`;
  };

  // ── 文件名 ──

  const NAME_EXTRACTORS = {
    '发布时间': (note) => formatTime(note?.time),
    '作者昵称': (note) => noteAuthor(note),
    '作品标题': (note) => noteTitle(note) || getNoteId(note),
    '作品ID': (note) => getNoteId(note),
    '作品描述': (note) => noteDesc(note),
    '作品类型': (note) => (isVideoNote(note) ? '视频' : '图集'),
    '作品标签': (note) => noteTags(note).join(' '),
    '点赞数量': (note) => String(note?.interactInfo?.likedCount ?? ''),
    '收藏数量': (note) => String(note?.interactInfo?.collectedCount ?? ''),
    '评论数量': (note) => String(note?.interactInfo?.commentCount ?? ''),
    '分享数量': (note) => String(note?.interactInfo?.shareCount ?? ''),
    '更新时间': (note) => formatTime(note?.lastUpdateTime),
    '作者ID': (note) => String(note?.user?.userId || '')
  };

  const buildBaseName = (note) => {
    const fields = Array.isArray(config.filenameFields) && config.filenameFields.length > 0
      ? config.filenameFields
      : DEFAULT_CONFIG.filenameFields;
    const parts = fields
      .map((field) => {
        const extractor = NAME_EXTRACTORS[field];
        if (!extractor) return '';
        return sanitizeName(extractor(note), field === '作品描述' ? 60 : 40);
      })
      .filter(Boolean);
    const name = parts.join('_');
    return name || sanitizeName(noteTitle(note) || getNoteId(note) || '小红书作品', 80);
  };

  /** 作品页面地址（写进 Eagle 的来源 URL，也是查重依据） */
  const buildWebsite = (note) => {
    const id = getNoteId(note);
    return id ? `https://www.${currentSite}.com/explore/${id}` : location.href.split('?')[0];
  };

  const buildAnnotation = (note) => {
    const lines = [];
    const desc = noteDesc(note);
    if (desc) lines.push(desc);
    const author = noteAuthor(note);
    const userId = String(note?.user?.userId || '');
    if (author) lines.push(`作者: ${author}${userId ? ` (${userId})` : ''}`);
    const published = formatTime(note?.time);
    if (published) lines.push(`发布: ${published}`);
    const tags = noteTags(note);
    if (tags.length > 0) lines.push(`标签: ${tags.map((tag) => `#${tag}`).join(' ')}`);
    lines.push(buildWebsite(note));
    lines.push(`[xhs-eagle] note:${getNoteId(note)} type:${isVideoNote(note) ? 'video' : 'image'}`);
    return lines.filter(Boolean).join('\n');
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 4. Eagle 客户端（与 1.6.4 同一套接口契约）                  ║
  // ╚════════════════════════════════════════════════════════════╝

  const EAGLE_MEDIA_HOSTS = ['xiaohongshu.com', 'xhscdn.com', 'rednote.com', 'rednotecdn.com'];

  const EAGLE_API_MAP = {
    appInfo: {
      v2: { path: '/api/v2/app/info', method: 'GET' },
      v1: { path: '/api/application/info', method: 'GET' }
    },
    folderList: {
      v2: { path: '/api/v2/folder/get', method: 'GET', query: (p) => `?offset=${p.offset || 0}&limit=${p.limit || 200}` },
      v1: { path: '/api/folder/list', method: 'GET' }
    },
    folderCreate: {
      v2: { path: '/api/v2/folder/create', method: 'POST', body: (p) => ({ name: p.name, parent: p.parent || undefined }) },
      v1: { path: '/api/folder/create', method: 'POST', body: (p) => ({ folderName: p.name, parent: p.parent || undefined }) }
    },
    tagList: {
      v2: { path: '/api/v2/tag/get', method: 'GET', query: (p) => `?offset=${p.offset || 0}&limit=${p.limit || 50}` },
      v1: { path: '/api/tag/list', method: 'GET' }
    },
    itemLookupByUrl: {
      v2: { path: '/api/v2/item/get', method: 'GET', query: (p) => `?url=${encodeURIComponent(p.url)}&limit=${p.limit || 100}` },
      v1: { path: '/api/item/list', method: 'GET', query: (p) => `?url=${encodeURIComponent(p.url)}&limit=${p.limit || 100}` }
    },
    itemAdd: {
      v2: {
        path: '/api/v2/item/add',
        method: 'POST',
        body: (p) => ({ url: p.url, name: p.name, website: p.website, tags: p.tags, annotation: p.annotation, folders: p.folders, headers: p.headers })
      },
      v1: {
        path: '/api/item/addFromURL',
        method: 'POST',
        body: (p) => ({ url: p.url, name: p.name, website: p.website, tags: p.tags, annotation: p.annotation, folderIds: p.folders, headers: p.headers })
      }
    }
  };

  const eagle = {
    baseURL: String(config.eagleURL || DEFAULT_CONFIG.eagleURL).replace(/\/+$/, ''),
    apiStyle: null,
    folderTree: null,
    tagNames: null,
    lookupCache: new Map(),

    request(path, method, data) {
      return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (config.eagleToken) headers['X-Api-Token'] = config.eagleToken;
        GM_xmlhttpRequest({
          method: method || 'GET',
          url: this.baseURL + path,
          headers,
          data: data ? JSON.stringify(data) : undefined,
          timeout: 15000,
          onload: (res) => {
            let parsed;
            try {
              parsed = JSON.parse(res.responseText || '{}');
            } catch (err) {
              reject(new Error('Eagle 返回了无法解析的内容'));
              return;
            }
            if (!(res.status >= 200 && res.status < 300)) {
              reject(new Error(`Eagle HTTP ${res.status}`));
              return;
            }
            if (parsed && parsed.status && parsed.status !== 'success') {
              reject(new Error(parsed.message || (typeof parsed.data === 'string' ? parsed.data : '') || 'Eagle API 错误'));
              return;
            }
            resolve(parsed);
          },
          onerror: () => reject(new Error('Eagle API 请求失败（Eagle 未运行？）')),
          ontimeout: () => reject(new Error('Eagle API 请求超时'))
        });
      });
    },

    extractList(response) {
      if (Array.isArray(response?.data?.data)) return response.data.data;
      if (Array.isArray(response?.data)) return response.data;
      return [];
    },

    async getApiStyle(force) {
      if (this.apiStyle && !force) return this.apiStyle;
      let lastError = null;
      for (const style of ['v2', 'v1']) {
        const spec = EAGLE_API_MAP.appInfo[style];
        try {
          await this.request(spec.path, spec.method);
          this.apiStyle = style;
          return style;
        } catch (err) {
          lastError = err;
        }
      }
      this.apiStyle = null;
      throw lastError || new Error('Eagle API 不可用');
    },

    async callApi(key, params) {
      const options = params || {};
      const style = await this.getApiStyle();
      const spec = EAGLE_API_MAP[key] && EAGLE_API_MAP[key][style];
      if (!spec) throw new Error(`当前 Eagle（${style}）不支持该操作：${key}`);
      const build = (target) => ({
        path: target.path + (typeof target.query === 'function' ? target.query(options) : ''),
        method: target.method,
        data: typeof target.body === 'function' ? target.body(options) : undefined
      });
      const call = build(spec);
      try {
        return await this.request(call.path, call.method, call.data);
      } catch (err) {
        const text = String((err && err.message) || err);
        if (text.includes('404') || text.includes('method not allowed')) {
          const other = style === 'v2' ? 'v1' : 'v2';
          const otherSpec = EAGLE_API_MAP[key] && EAGLE_API_MAP[key][other];
          if (otherSpec) {
            this.apiStyle = other;
            const retried = build(otherSpec);
            return await this.request(retried.path, retried.method, retried.data);
          }
        }
        throw err;
      }
    },

    async getFolders(force) {
      if (!force && Array.isArray(this.folderTree)) return this.folderTree;
      const style = await this.getApiStyle();
      const all = [];
      if (style === 'v2') {
        const limit = 200;
        let offset = 0;
        let total = 0;
        do {
          const response = await this.callApi('folderList', { offset, limit });
          const page = this.extractList(response);
          total = Number(response?.data?.total || page.length || 0);
          all.push(...page);
          offset += limit;
          if (page.length === 0) break;
        } while (offset < total);
      } else {
        const response = await this.callApi('folderList', {});
        all.push(...this.extractList(response));
      }
      this.folderTree = this.buildFolderTree(all);
      return this.folderTree;
    },

    buildFolderTree(list) {
      const nodes = (Array.isArray(list) ? list : []).filter((node) => node && node.id);
      if (nodes.some((node) => Array.isArray(node.children) && node.children.length > 0)) {
        return nodes.map((node) => this.cloneFolderNode(node));
      }
      const map = new Map();
      nodes.forEach((node) => map.set(node.id, { id: node.id, name: String(node.name || ''), children: [] }));
      const roots = [];
      nodes.forEach((node) => {
        const self = map.get(node.id);
        const parentId = node.parent || node.parentId || '';
        if (parentId && map.has(parentId) && parentId !== node.id) map.get(parentId).children.push(self);
        else roots.push(self);
      });
      return roots;
    },

    cloneFolderNode(node) {
      return {
        id: node.id,
        name: String(node.name || ''),
        children: (Array.isArray(node.children) ? node.children : [])
          .filter((child) => child && child.id)
          .map((child) => this.cloneFolderNode(child))
      };
    },

    async getTags(force) {
      if (!force && Array.isArray(this.tagNames)) return this.tagNames;
      const style = await this.getApiStyle();
      const raw = [];
      if (style === 'v2') {
        let offset = 0;
        let total = Infinity;
        do {
          const response = await this.callApi('tagList', { offset, limit: 50 });
          const page = this.extractList(response);
          raw.push(...page);
          total = Number(response?.data?.total || raw.length);
          offset += page.length;
          if (page.length === 0) break;
        } while (offset < total);
      } else {
        const response = await this.callApi('tagList', {});
        raw.push(...this.extractList(response));
      }
      const names = new Set();
      raw.forEach((tag) => {
        const name = typeof tag === 'string' ? tag : tag && tag.name;
        if (name && String(name).trim()) names.add(String(name).trim());
      });
      this.tagNames = Array.from(names).sort((a, b) => a.localeCompare(b, 'zh-CN'));
      return this.tagNames;
    },

    /** 在文件夹树里按 id 找节点 */
    findFolderById(nodes, id) {
      const target = String(id || '');
      if (!target) return null;
      for (const node of Array.isArray(nodes) ? nodes : []) {
        if (node.id === target) return node;
        const found = this.findFolderById(node.children, target);
        if (found) return found;
      }
      return null;
    },

    /** 在给定层级里按名字找文件夹 */
    findFolderByName(nodes, name) {
      const target = String(name || '').trim();
      if (!target) return null;
      for (const node of Array.isArray(nodes) ? nodes : []) {
        if (String(node.name || '').trim() === target) return node;
        const found = this.findFolderByName(node.children, target);
        if (found) return found;
      }
      return null;
    },

    async createFolder(name, parentId) {
      const safe = String(name || '').trim();
      if (!safe) return '';
      const response = await this.callApi('folderCreate', { name: safe, parent: parentId || '' });
      const id = response && response.data && response.data.id ? response.data.id : '';
      this.folderTree = null;
      return id || '';
    },

    /**
     * 解析「作者名」对应的文件夹 id：优先用已存在的同名文件夹，没有就在
     * 当前目标文件夹（或根目录）下创建一个。
     */
    async resolveAuthorFolder(authorName) {
      const safe = sanitizeName(authorName, 60);
      if (!safe) return '';
      const tree = await this.getFolders();
      const parentId = config.folderId || '';
      const parentNode = parentId ? this.findFolderById(tree, parentId) : null;
      const scope = parentNode ? parentNode.children : tree;
      const found = this.findFolderByName(scope, safe);
      if (found && found.id) return found.id;
      return await this.createFolder(safe, parentId);
    },

    normalizeUrl(url) {
      return String(url || '').trim().replace(/[?#].*$/, '');
    },

    isSameName(a, b) {
      const left = String(a || '').trim();
      const right = String(b || '').trim();
      if (!left || !right) return false;
      if (left === right) return true;
      return left.replace(/\.[a-z0-9]{1,5}$/i, '') === right.replace(/\.[a-z0-9]{1,5}$/i, '');
    },

    /** 按来源 URL + 文件名在 Eagle 里查重（v1 的 url 查询是子串匹配，必须逐条复核） */
    async findExisting(task) {
      const website = String(task?.website || '').trim();
      if (!website) return false;
      const cacheKey = this.normalizeUrl(website) || website;
      let items = this.lookupCache.get(cacheKey);
      if (!Array.isArray(items)) {
        const response = await this.callApi('itemLookupByUrl', { url: website, limit: 100 });
        items = this.extractList(response);
        this.lookupCache.set(cacheKey, items);
      }
      const targetUrl = this.normalizeUrl(website);
      return items.some((item) => {
        if (this.normalizeUrl(item?.url || '') !== targetUrl) return false;
        return this.isSameName(item?.name, task?.name);
      });
    },

    buildDownloadHeaders(rawUrl) {
      const url = String(rawUrl || '').trim();
      if (!/^https?:\/\//i.test(url)) return undefined;
      let host = '';
      try {
        host = new URL(url).hostname.toLowerCase();
      } catch (err) {
        return undefined;
      }
      const matched = EAGLE_MEDIA_HOSTS.some((suffix) => host === suffix || host.endsWith('.' + suffix));
      if (!matched) return undefined;
      const headers = { Referer: 'https://www.xiaohongshu.com/' };
      if (navigator.userAgent) headers['User-Agent'] = navigator.userAgent;
      return headers;
    },

    async addFromURL(task) {
      return this.callApi('itemAdd', {
        url: task.url,
        name: task.name,
        website: task.website,
        tags: Array.isArray(task.tags) ? task.tags : [],
        annotation: task.annotation || '',
        folders: Array.isArray(task.folders) ? task.folders.filter(Boolean) : [],
        headers: task.headers
      });
    }
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 5. 样式                                                    ║
  // ╚════════════════════════════════════════════════════════════╝

  const STYLE_ID = 'xhs-eagle-style';
  const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.xhs-eagle-fab{position:fixed;z-index:2147483000;width:44px;height:44px;border-radius:50%;border:none;background:#ff2442;color:#fff;font-size:12px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 4px 12px rgba(255,36,66,0.4);font-family:sans-serif;}
.xhs-eagle-fab:active{cursor:grabbing;}
.xhs-eagle-card{position:fixed;z-index:2147483000;width:372px;max-width:calc(100vw - 32px);box-sizing:border-box;overflow-y:auto;background:rgba(24,24,26,0.97);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:18px;color:#fff;font-size:13.5px;font-family:sans-serif;box-shadow:0 10px 32px rgba(0,0,0,0.45);}
.xhs-eagle-title{margin:0 0 14px;font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.xhs-eagle-sub{font-size:11px;color:rgba(255,255,255,0.5);margin:-10px 0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.xhs-eagle-box{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);}
.xhs-eagle-box:first-of-type{margin-top:0;padding-top:0;border-top:none;}
.xhs-eagle-head{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:6px;}
.xhs-eagle-state{color:rgba(255,255,255,0.9);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.xhs-eagle-row{display:flex;gap:8px;flex-wrap:wrap;}
.xhs-eagle-row + .xhs-eagle-row{margin-top:8px;}
.xhs-eagle-mini{flex:1 1 0;min-width:90px;padding:7px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:20px;background:rgba(255,255,255,0.08);color:#fff;font-size:12px;cursor:pointer;text-align:center;white-space:nowrap;}
.xhs-eagle-mini:hover{background:rgba(255,255,255,0.14);}
.xhs-eagle-primary{flex:1 1 0;min-width:90px;padding:9px 12px;border:1px solid rgba(255,36,66,0.6);border-radius:20px;background:rgba(255,36,66,0.18);color:#fff;font-size:12.5px;cursor:pointer;text-align:center;}
.xhs-eagle-toggle{flex:1 1 0;min-width:90px;padding:7px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:20px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);font-size:12px;cursor:pointer;text-align:center;}
.xhs-eagle-toggle:hover{background:rgba(255,255,255,0.12);}
.xhs-eagle-toggle-on{border-color:rgba(64,150,255,0.65);background:rgba(64,150,255,0.2);color:#fff;}
.xhs-eagle-primary:hover{background:rgba(255,36,66,0.28);}
.xhs-eagle-primary:disabled,.xhs-eagle-mini:disabled{opacity:0.5;cursor:not-allowed;}
.xhs-eagle-hint{font-size:10px;color:rgba(255,255,255,0.45);margin-top:8px;line-height:1.5;}
.xhs-eagle-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.xhs-eagle-chip{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;background:rgba(64,150,255,0.18);border:1px solid rgba(64,150,255,0.5);font-size:11px;}
.xhs-eagle-chip-x{cursor:pointer;opacity:0.75;}
.xhs-eagle-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483200;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}
.xhs-eagle-panel{width:540px;max-width:92vw;max-height:76vh;display:flex;flex-direction:column;background:rgba(28,28,30,0.98);border:1px solid rgba(255,255,255,0.12);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,0.5);color:#fff;font-size:13px;font-family:sans-serif;overflow:hidden;}
.xhs-eagle-panel-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;}
.xhs-eagle-search{flex:1;min-width:0;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:13px;outline:none;}
.xhs-eagle-panel-hint{flex-shrink:0;font-size:12px;color:rgba(255,255,255,0.5);}
.xhs-eagle-list{flex-grow:1;min-height:140px;overflow-y:auto;padding:10px 14px;}
.xhs-eagle-list-two{column-count:2;column-gap:14px;}
.xhs-eagle-item{display:block;padding:5px 8px;margin-bottom:2px;border-radius:6px;color:rgba(255,255,255,0.85);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;break-inside:avoid;}
.xhs-eagle-item:hover{background:rgba(255,255,255,0.08);}
.xhs-eagle-item-active{background:rgba(64,150,255,0.28);color:#fff;}
.xhs-eagle-item-manual{color:#ffd79a;}
.xhs-eagle-manual{margin:0 14px 10px;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:#fff;font-size:13px;outline:none;flex-shrink:0;}
.xhs-eagle-foot{display:flex;justify-content:space-between;padding:0 14px 12px;font-size:12px;color:rgba(255,255,255,0.45);flex-shrink:0;}
.xhs-eagle-state-msg{padding:24px;text-align:center;color:rgba(255,255,255,0.55);font-size:12px;}
.xhs-eagle-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483200;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}
.xhs-eagle-modal-box{width:620px;max-width:94vw;max-height:86vh;display:flex;flex-direction:column;background:rgba(28,28,30,0.98);border:1px solid rgba(255,255,255,0.12);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,0.5);color:#fff;font-size:13px;font-family:sans-serif;overflow:hidden;}
.xhs-eagle-modal-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:15px;font-weight:600;flex-shrink:0;}
.xhs-eagle-modal-body{flex-grow:1;overflow-y:auto;padding:14px 16px;}
.xhs-eagle-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0;}
.xhs-eagle-field{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.xhs-eagle-field-label{width:110px;flex-shrink:0;color:rgba(255,255,255,0.65);font-size:12px;}
.xhs-eagle-input{flex:1;min-width:0;box-sizing:border-box;padding:8px 11px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:12.5px;outline:none;}
.xhs-eagle-check{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;color:rgba(255,255,255,0.85);}
.xhs-eagle-btn{padding:7px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:#fff;font-size:12.5px;cursor:pointer;}
.xhs-eagle-btn-main{padding:7px 18px;border-radius:20px;border:none;background:#ff2442;color:#fff;font-size:12.5px;cursor:pointer;font-weight:500;}
.xhs-eagle-section{margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.12);font-size:13px;font-weight:600;color:rgba(255,255,255,0.92);}
.xhs-eagle-kv{display:flex;gap:10px;padding:5px 0;font-size:12.5px;line-height:1.6;border-bottom:1px solid rgba(255,255,255,0.05);}
.xhs-eagle-kv-label{width:112px;flex-shrink:0;color:rgba(255,255,255,0.55);}
.xhs-eagle-kv-value{flex:1;min-width:0;word-break:break-all;color:rgba(255,255,255,0.9);white-space:pre-wrap;}
.xhs-eagle-url-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.xhs-eagle-url-index{width:22px;flex-shrink:0;color:rgba(255,255,255,0.45);font-size:12px;}
.xhs-eagle-url-text{flex:1;min-width:0;font-size:11.5px;color:rgba(255,255,255,0.8);word-break:break-all;}
.xhs-eagle-url-size{color:#7ec8ff;}
.xhs-eagle-copy{padding:3px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:#fff;font-size:11px;cursor:pointer;flex-shrink:0;}
.xhs-eagle-copy:hover{background:rgba(255,255,255,0.16);}
.xhs-eagle-toast{position:fixed;left:50%;bottom:6rem;transform:translateX(-50%);max-width:80vw;padding:10px 16px;border-radius:10px;background:rgba(0,0,0,0.78);color:#fff;font-size:13.5px;line-height:1.45;z-index:2147483400;pointer-events:none;white-space:pre-wrap;text-align:center;font-family:sans-serif;opacity:0;transition:opacity 200ms ease;}
.xhs-eagle-toast-show{opacity:1;}
`;
    document.head.appendChild(style);
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 6. Toast                                                   ║
  // ╚════════════════════════════════════════════════════════════╝

  let toastEl = null;
  let toastTimer = null;
  const showToast = (message, duration) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'xhs-eagle-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    requestAnimationFrame(() => toastEl.classList.add('xhs-eagle-toast-show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('xhs-eagle-toast-show');
    }, duration || 5000);
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 7. 目录 / 标签选择弹层                                      ║
  // ╚════════════════════════════════════════════════════════════╝

  const flattenFolders = (nodes, depth, out) => {
    const list = out || [];
    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
      list.push({ id: node.id, name: node.name || '(未命名)', depth: depth || 0 });
      flattenFolders(node.children, (depth || 0) + 1, list);
    });
    return list;
  };

  const SPLIT_PATTERN = /[,，、;；\n\r]+/;

  /**
   * 打开 Eagle 选择弹层
   * options: { mode: 'tag' | 'folder', onChange: (patch) => void }
   */
  const openEaglePicker = (options) => {
    const settings = options || {};
    const mode = settings.mode === 'folder' ? 'folder' : 'tag';
    const isFolder = mode === 'folder';
    if (document.getElementById('xhs-eagle-picker-root')) return;

    const root = document.createElement('div');
    root.id = 'xhs-eagle-picker-root';
    const overlay = document.createElement('div');
    overlay.className = 'xhs-eagle-overlay';
    const panel = document.createElement('div');
    panel.className = 'xhs-eagle-panel';
    root.appendChild(overlay);
    overlay.appendChild(panel);
    document.body.appendChild(root);

    const close = () => {
      root.remove();
      document.removeEventListener('keydown', onKeyDown, true);
    };
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    // 弹层内部的选中状态（手动新增的标签要立刻可见）
    let localTags = Array.isArray(config.tags) ? [...config.tags] : [];
    let localFolderId = String(config.folderId || '');
    let keyword = '';
    let folders = [];
    let tags = [];
    let loading = true;
    let loadError = '';

    const emitTags = (next) => {
      localTags = next;
      if (typeof settings.onChange === 'function') settings.onChange({ tags: next });
    };
    const emitFolder = (id, name) => {
      localFolderId = id;
      if (typeof settings.onChange === 'function') settings.onChange({ folder_id: id, folder_name: name });
    };

    const head = document.createElement('div');
    head.className = 'xhs-eagle-panel-head';
    const search = document.createElement('input');
    search.className = 'xhs-eagle-search';
    search.placeholder = isFolder ? '搜索文件夹...' : '搜索标签...';
    const hint = document.createElement('span');
    hint.className = 'xhs-eagle-panel-hint';
    hint.textContent = isFolder ? '单选' : '可多选';
    head.appendChild(search);
    head.appendChild(hint);
    panel.appendChild(head);

    const list = document.createElement('div');
    list.className = 'xhs-eagle-list' + (isFolder ? '' : ' xhs-eagle-list-two');
    panel.appendChild(list);

    let manualInput = null;
    if (!isFolder) {
      manualInput = document.createElement('input');
      manualInput.className = 'xhs-eagle-manual';
      manualInput.placeholder = '手动输入标签，逗号分隔，回车添加';
      panel.appendChild(manualInput);
    }

    const foot = document.createElement('div');
    foot.className = 'xhs-eagle-foot';
    const footLeft = document.createElement('span');
    footLeft.textContent = isFolder ? '点击选择（层级用缩进表示）' : '点击切换；黄字为手动新增的标签';
    const footRight = document.createElement('span');
    footRight.textContent = 'Esc 关闭';
    foot.appendChild(footLeft);
    foot.appendChild(footRight);
    panel.appendChild(foot);

    const render = () => {
      list.innerHTML = '';
      if (loading) {
        const state = document.createElement('div');
        state.className = 'xhs-eagle-state-msg';
        state.textContent = '正在读取 Eagle...';
        list.appendChild(state);
        return;
      }
      if (loadError) {
        const state = document.createElement('div');
        state.className = 'xhs-eagle-state-msg';
        state.textContent = '读取失败：' + loadError;
        list.appendChild(state);
        return;
      }
      const keywordTrim = keyword.trim().toLowerCase();
      let rows = [];
      if (isFolder) {
        rows.push({ id: '', name: '（库根目录）', depth: 0 });
        const all = flattenFolders(folders, 0, []);
        all.forEach((row) => {
          if (!keywordTrim || row.name.toLowerCase().includes(keywordTrim)) rows.push(row);
        });
      } else {
        const manualTags = localTags.filter((name) => !tags.includes(name));
        const merged = manualTags.concat(tags);
        rows = (keywordTrim ? merged.filter((name) => name.toLowerCase().includes(keywordTrim)) : merged)
          .map((name) => ({ id: name, name, depth: 0 }));
      }
      if (rows.length === 0) {
        const state = document.createElement('div');
        state.className = 'xhs-eagle-state-msg';
        state.textContent = '没有匹配项';
        list.appendChild(state);
        return;
      }
      rows.forEach((row) => {
        const item = document.createElement('div');
        const active = isFolder ? localFolderId === row.id : localTags.includes(row.name);
        const manual = !isFolder && !tags.includes(row.name);
        item.className = 'xhs-eagle-item' + (active ? ' xhs-eagle-item-active' : '') + (manual ? ' xhs-eagle-item-manual' : '');
        if (isFolder && row.depth > 0) item.style.paddingLeft = 8 + row.depth * 14 + 'px';
        item.textContent = row.name;
        item.addEventListener('click', () => {
          if (isFolder) {
            emitFolder(row.id, row.id ? row.name : '');
          } else {
            const next = localTags.includes(row.name)
              ? localTags.filter((name) => name !== row.name)
              : localTags.concat([row.name]);
            emitTags(next);
          }
          render();
        });
        list.appendChild(item);
      });
    };

    search.addEventListener('input', () => {
      keyword = search.value;
      render();
    });

    if (manualInput) {
      manualInput.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter') return;
        ev.preventDefault();
        const parts = String(manualInput.value || '').split(SPLIT_PATTERN).map((piece) => piece.trim()).filter(Boolean);
        if (parts.length === 0) return;
        emitTags(Array.from(new Set(localTags.concat(parts))));
        manualInput.value = '';
        render();
      });
    }

    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) close();
    });

    render();
    Promise.all([eagle.getFolders(), eagle.getTags()])
      .then((result) => {
        folders = result[0];
        tags = result[1];
        loading = false;
        loadError = '';
        render();
      })
      .catch((err) => {
        loading = false;
        loadError = String((err && err.message) || err);
        render();
      });
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 8. 设置面板                                                ║
  // ╚════════════════════════════════════════════════════════════╝

  const openSettings = () => {
    if (document.getElementById('xhs-eagle-settings-root')) return;
    const root = document.createElement('div');
    root.id = 'xhs-eagle-settings-root';
    const overlay = document.createElement('div');
    overlay.className = 'xhs-eagle-modal';
    const box = document.createElement('div');
    box.className = 'xhs-eagle-modal-box';
    overlay.appendChild(box);
    root.appendChild(overlay);
    document.body.appendChild(root);

    const close = () => {
      root.remove();
      document.removeEventListener('keydown', onKeyDown, true);
    };
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    const head = document.createElement('div');
    head.className = 'xhs-eagle-modal-head';
    const headText = document.createElement('span');
    headText.textContent = '小红书推送eagle 设置';
    head.appendChild(headText);
    box.appendChild(head);

    const body = document.createElement('div');
    body.className = 'xhs-eagle-modal-body';
    box.appendChild(body);

    const addField = (labelText, node) => {
      const field = document.createElement('div');
      field.className = 'xhs-eagle-field';
      const label = document.createElement('span');
      label.className = 'xhs-eagle-field-label';
      label.textContent = labelText;
      field.appendChild(label);
      field.appendChild(node);
      body.appendChild(field);
      return field;
    };
    const addHint = (text) => {
      const hint = document.createElement('div');
      hint.className = 'xhs-eagle-hint';
      hint.textContent = text;
      body.appendChild(hint);
    };

    const urlInput = document.createElement('input');
    urlInput.className = 'xhs-eagle-input';
    urlInput.value = config.eagleURL || DEFAULT_CONFIG.eagleURL;
    urlInput.placeholder = DEFAULT_CONFIG.eagleURL;
    addField('Eagle 地址', urlInput);

    const tokenInput = document.createElement('input');
    tokenInput.className = 'xhs-eagle-input';
    tokenInput.value = config.eagleToken || '';
    tokenInput.placeholder = '本机使用留空即可';
    addField('Eagle Token', tokenInput);

    const fieldsInput = document.createElement('input');
    fieldsInput.className = 'xhs-eagle-input';
    fieldsInput.value = (config.filenameFields || []).join(',');
    addField('文件名格式', fieldsInput);
    addHint('可用字段：' + NAME_FIELDS.join('、') + '（用英文逗号分隔，按顺序拼接）');

    const pushShortcut = document.createElement('input');
    pushShortcut.className = 'xhs-eagle-input';
    pushShortcut.value = config.shortcutPush || 's';
    pushShortcut.placeholder = 'S / Ctrl+Shift+S';
    addField('推送快捷键', pushShortcut);

    const downloadShortcut = document.createElement('input');
    downloadShortcut.className = 'xhs-eagle-input';
    downloadShortcut.value = config.shortcutDownload || 'm';
    downloadShortcut.placeholder = 'M / Ctrl+Shift+M';
    addField('下载快捷键', downloadShortcut);

    const switchRow = document.createElement('div');
    switchRow.className = 'xhs-eagle-row';
    const makeCheck = (labelText, checked, onToggle) => {
      const wrap = document.createElement('label');
      wrap.className = 'xhs-eagle-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;
      input.addEventListener('change', () => onToggle(input.checked));
      const text = document.createElement('span');
      text.textContent = labelText;
      wrap.appendChild(input);
      wrap.appendChild(text);
      return wrap;
    };
    switchRow.appendChild(makeCheck('启用快捷键', config.enableShortcuts !== false, (value) => {
      config.enableShortcuts = value;
    }));
    switchRow.appendChild(makeCheck('跳过已存在的素材', config.skipExisting !== false, (value) => {
      config.skipExisting = value;
    }));
    switchRow.appendChild(makeCheck('作者名为标签（推送时带上作者昵称）', config.authorAsTag === true, (value) => {
      config.authorAsTag = value;
    }));
    switchRow.appendChild(makeCheck('作者名为文件夹（没有则自动创建）', config.authorAsFolder === true, (value) => {
      config.authorAsFolder = value;
    }));
    body.appendChild(switchRow);

    const imageFormat = document.createElement('select');
    imageFormat.className = 'xhs-eagle-input';
    ['jpeg', 'png', 'webp', 'heic'].forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value.toUpperCase();
      if (String(config.imageFormat || 'jpeg').toLowerCase() === value) option.selected = true;
      imageFormat.appendChild(option);
    });
    addField('图片格式', imageFormat);
    addHint('Eagle 会自行拉取媒体直链入库；小红书图片有时效防盗链，部分资源可能失败。不选择标签时，素材不会写入任何标签。');

    const foot = document.createElement('div');
    foot.className = 'xhs-eagle-modal-foot';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'xhs-eagle-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', close);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'xhs-eagle-btn-main';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => {
      const url = urlInput.value.trim() || DEFAULT_CONFIG.eagleURL;
      if (url !== eagle.baseURL) {
        eagle.baseURL = url.replace(/\/+$/, '');
        eagle.apiStyle = null;
        eagle.folderTree = null;
        eagle.tagNames = null;
      }
      config.eagleURL = url;
      config.eagleToken = tokenInput.value.trim();
      config.shortcutPush = pushShortcut.value.trim() || 's';
      config.shortcutDownload = downloadShortcut.value.trim() || 'm';
      config.imageFormat = imageFormat.value || 'jpeg';
      const fields = fieldsInput.value.split(/[,，]/).map((item) => item.trim()).filter((item) => NAME_FIELDS.includes(item));
      config.filenameFields = fields.length > 0 ? fields : [...DEFAULT_CONFIG.filenameFields];
      saveConfig();
      registerHotkeys();
      renderPanel();
      showToast('设置已保存');
      close();
    });
    foot.appendChild(cancelBtn);
    foot.appendChild(saveBtn);
    box.appendChild(foot);

    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) close();
    });
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 8.5 详细信息弹窗                                           ║
  // ╚════════════════════════════════════════════════════════════╝

  const copyText = (text) => {
    const value = String(text || '');
    if (!value) return;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      showToast('已复制到剪贴板', 1800);
    };
    const fallback = () => {
      if (settled) return;
      fallbackCopy(value, done);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(fallback);
        // 某些环境下 clipboard 的 Promise 会长时间不 resolve，超时就走 execCommand 兜底
        setTimeout(fallback, 400);
        return;
      }
    } catch (err) {
      log.debug('clipboard failed', err);
    }
    fallback();
  };

  const fallbackCopy = (value, done) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      if (typeof done === 'function') done();
    } catch (err) {
      log.warn('copy failed', err);
    }
  };

  const openDetail = () => {
    if (document.getElementById('xhs-eagle-detail-root')) return;
    const note = getNote(true);
    const root = document.createElement('div');
    root.id = 'xhs-eagle-detail-root';
    const overlay = document.createElement('div');
    overlay.className = 'xhs-eagle-modal';
    const box = document.createElement('div');
    box.className = 'xhs-eagle-modal-box';
    overlay.appendChild(box);
    root.appendChild(overlay);
    document.body.appendChild(root);

    const close = () => {
      root.remove();
      document.removeEventListener('keydown', onKeyDown, true);
    };
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    const head = document.createElement('div');
    head.className = 'xhs-eagle-modal-head';
    const headText = document.createElement('span');
    headText.textContent = '作品详细信息';
    head.appendChild(headText);
    box.appendChild(head);

    const body = document.createElement('div');
    body.className = 'xhs-eagle-modal-body';
    box.appendChild(body);

    const addSection = (title) => {
      const el = document.createElement('div');
      el.className = 'xhs-eagle-section';
      el.textContent = title;
      body.appendChild(el);
    };
    const addKV = (label, value) => {
      const row = document.createElement('div');
      row.className = 'xhs-eagle-kv';
      const left = document.createElement('div');
      left.className = 'xhs-eagle-kv-label';
      left.textContent = label;
      const right = document.createElement('div');
      right.className = 'xhs-eagle-kv-value';
      const text = value === undefined || value === null || value === '' ? '-' : String(value);
      right.textContent = text;
      row.appendChild(left);
      row.appendChild(right);
      body.appendChild(row);
      return row;
    };

    let mediaDetails = [];
    if (!note) {
      const empty = document.createElement('div');
      empty.className = 'xhs-eagle-state-msg';
      empty.textContent = location.pathname.startsWith('/user/profile/')
        ? '用户主页：先点开一个作品，再查看详细信息'
        : '没读到作品数据，请刷新页面后重试';
      body.appendChild(empty);
    } else {
      mediaDetails = buildMediaDetails(note);
      const isVideo = isVideoNote(note);
      const imageCount = Array.isArray(note.imageList) ? note.imageList.length : 0;
      const tags = noteTags(note);
      const info = note.interactInfo || {};
      const author = noteAuthor(note);
      const userId = String(note.user?.userId || '');

      addSection('基本信息');
      addKV('标题', noteTitle(note));
      addKV('作品ID', getNoteId(note));
      addKV('类型', isVideo ? `视频${imageCount > 1 ? `（附 ${imageCount} 张图）` : ''}` : `图集（${imageCount} 张）`);
      addKV('作者', author ? `${author}${userId ? ` (${userId})` : ''}` : '');
      addKV('发布时间', formatTime(note.time));
      addKV('更新时间', formatTime(note.lastUpdateTime));
      addKV('标签', tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : '');
      addKV('点赞 / 收藏 / 评论 / 分享', [info.likedCount, info.collectedCount, info.commentCount, info.shareCount]
        .map((value) => (value === undefined || value === null || value === '' ? '-' : value)).join(' / '));
      addKV('描述', noteDesc(note));
      const sizeList = mediaDetails.map((item) => formatSize(item.width, item.height)).filter(Boolean);
      const uniqueSizes = Array.from(new Set(sizeList));
      addKV('分辨率', uniqueSizes.length === 0
        ? '数据里没有宽高信息'
        : (uniqueSizes.length === 1
          ? `${uniqueSizes[0]}${isVideo ? '' : `（${sizeList.length} 张一致）`}`
          : `${uniqueSizes.join('；')}`));

      addSection('推送信息');
      addKV('文件名预览', buildBaseName(note));
      addKV('来源地址', buildWebsite(note));
      const pushTags = Array.isArray(config.tags) ? [...config.tags] : [];
      if (config.authorAsTag && author && !pushTags.includes(author)) pushTags.push(author);
      addKV('将写入标签', pushTags.length > 0 ? pushTags.join('、') : '无（素材不带标签）');
      addKV('目标文件夹', config.authorAsFolder
        ? `${sanitizeName(author, 60) || '作者名'}${config.folderName ? `（在 ${config.folderName} 下）` : '（在根目录下）'}`
        : (config.folderName || '根目录'));

      addSection(`媒体直链（${mediaDetails.length} 条）`);
      if (mediaDetails.length === 0) {
        addKV('提示', '没有解析到可用的图片/视频直链（页面数据可能还没加载完）');
      } else {
        mediaDetails.forEach((item, index) => {
          const url = item.url;
          const row = document.createElement('div');
          row.className = 'xhs-eagle-url-row';
          const idx = document.createElement('div');
          idx.className = 'xhs-eagle-url-index';
          idx.textContent = String(index + 1);
          const text = document.createElement('div');
          text.className = 'xhs-eagle-url-text';
          const size = formatSize(item.width, item.height);
          if (size) {
            const sizeTag = document.createElement('span');
            sizeTag.className = 'xhs-eagle-url-size';
            sizeTag.textContent = `[${size}] `;
            text.appendChild(sizeTag);
          }
          const urlSpan = document.createElement('span');
          urlSpan.textContent = url;
          text.appendChild(urlSpan);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'xhs-eagle-copy';
          btn.textContent = '复制';
          btn.addEventListener('click', () => copyText(url));
          row.appendChild(idx);
          row.appendChild(text);
          row.appendChild(btn);
          body.appendChild(row);
        });
      }
    }

    const foot = document.createElement('div');
    foot.className = 'xhs-eagle-modal-foot';
    if (mediaDetails.length > 1) {
      const copyAllBtn = document.createElement('button');
      copyAllBtn.className = 'xhs-eagle-btn';
      copyAllBtn.textContent = '复制全部直链';
      copyAllBtn.addEventListener('click', () => copyText(mediaDetails.map((item) => item.url).join('\n')));
      foot.appendChild(copyAllBtn);
    }
    if (note) {
      const copyJsonBtn = document.createElement('button');
      copyJsonBtn.className = 'xhs-eagle-btn';
      copyJsonBtn.textContent = '复制原始JSON';
      copyJsonBtn.addEventListener('click', () => {
        try {
          copyText(JSON.stringify(note, null, 2));
        } catch (err) {
          showToast('复制失败：' + ((err && err.message) || err));
        }
      });
      foot.appendChild(copyJsonBtn);
    }
    const closeBtn = document.createElement('button');
    closeBtn.className = 'xhs-eagle-btn-main';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', close);
    foot.appendChild(closeBtn);
    box.appendChild(foot);

    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) close();
    });
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 9. 推送 / 下载                                             ║
  // ╚════════════════════════════════════════════════════════════╝

  const buildTasks = (note) => {
    const urls = buildMediaUrls(note);
    if (urls.length === 0) return [];
    const baseName = buildBaseName(note);
    const website = buildWebsite(note);
    const annotation = buildAnnotation(note);
    const video = isVideoNote(note);
    return urls.map((url, index) => {
      const suffix = urls.length > 1 ? `_${String(index + 1).padStart(2, '0')}` : '';
      const name = `${baseName}${suffix}`;
      return {
        url,
        name,
        website,
        annotation,
        fileType: video ? 'video' : 'image',
        index,
        dedupeTag: `xhs:${getNoteId(note)}:${index}:${video ? 'video' : 'image'}`
      };
    });
  };

  const pushCurrentToEagle = async () => {
    const note = extractNote();
    if (!note) {
      showToast('❌ 没读到作品数据，请刷新页面后重试（或先点开该作品）');
      return { ok: false };
    }
    const tasks = buildTasks(note);
    if (tasks.length === 0) {
      showToast('❌ 没有解析到可推送的图片/视频直链');
      return { ok: false };
    }
    const tags = Array.isArray(config.tags) ? config.tags.filter(Boolean) : [];
    if (config.authorAsTag) {
      const author = noteAuthor(note);
      if (author && !tags.includes(author)) tags.push(author);
    }
    let targetFolderId = config.folderId || '';
    if (config.authorAsFolder) {
      const authorFolderId = await eagle.resolveAuthorFolder(noteAuthor(note));
      if (authorFolderId) targetFolderId = authorFolderId;
    }
    const folders = targetFolderId ? [targetFolderId] : [];
    let saved = 0;
    let skipped = 0;
    let failed = 0;
    let firstError = '';
    showToast(`正在推送到 Eagle（共 ${tasks.length} 个文件）...`, 60000);
    for (const task of tasks) {
      try {
        if (config.skipExisting !== false && await eagle.findExisting(task)) {
          skipped += 1;
          continue;
        }
        await eagle.addFromURL({
          url: task.url,
          name: task.name,
          website: task.website,
          tags,
          folders,
          annotation: `${task.annotation}\n[dedupe] ${task.dedupeTag}`,
          headers: config.sendReferer !== false ? eagle.buildDownloadHeaders(task.url) : undefined
        });
        saved += 1;
      } catch (err) {
        failed += 1;
        firstError = firstError || String((err && err.message) || err);
        log.error('push failed', task, err);
      }
    }
    const parts = [];
    if (saved > 0) parts.push(`${saved} 成功`);
    if (skipped > 0) parts.push(`${skipped} 跳过`);
    if (failed > 0) parts.push(`${failed} 失败`);
    if (failed > 0 && saved === 0) {
      showToast(`❌ 推送失败：${firstError || '未知原因'}`, 10000);
    } else if (failed > 0) {
      showToast(`⚠️ 已推送到 Eagle：${parts.join('，')}；失败原因：${firstError || '未知'}`, 10000);
    } else {
      showToast(`✅ 已推送到 Eagle：${parts.join('，')}`, 8000);
    }
    return { ok: failed === 0, saved, skipped, failed };
  };

  const downloadViaGM = (url, name) => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType: 'blob',
      headers: config.sendReferer !== false ? (eagle.buildDownloadHeaders(url) || {}) : {},
      timeout: 120000,
      onload: (res) => {
        if (!(res.status >= 200 && res.status < 300)) {
          reject(new Error(`HTTP ${res.status}`));
          return;
        }
        let blob = res.response;
        if (!(blob instanceof Blob)) blob = new Blob([res.response]);
        resolve(blob);
      },
      onerror: () => reject(new Error('下载请求失败')),
      ontimeout: () => reject(new Error('下载超时'))
    });
  });

  const saveBlob = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const fileExt = (task) => {
    if (task.fileType === 'video') return 'mp4';
    const fmt = String(config.imageFormat || 'jpeg').toLowerCase();
    return fmt === 'jpg' ? 'jpeg' : fmt;
  };

  const downloadCurrent = async () => {
    const note = extractNote();
    if (!note) {
      showToast('❌ 没读到作品数据，请刷新页面后重试');
      return { ok: false };
    }
    const tasks = buildTasks(note);
    if (tasks.length === 0) {
      showToast('❌ 没有解析到可下载的图片/视频直链');
      return { ok: false };
    }
    let saved = 0;
    let failed = 0;
    let firstError = '';
    showToast(`正在下载（共 ${tasks.length} 个文件）...`, 60000);
    for (const task of tasks) {
      try {
        const blob = await downloadViaGM(task.url, task.name);
        saveBlob(blob, `${task.name}.${fileExt(task)}`);
        saved += 1;
        await sleep(120);
      } catch (err) {
        failed += 1;
        firstError = firstError || String((err && err.message) || err);
        log.error('download failed', task, err);
      }
    }
    if (failed > 0 && saved === 0) {
      showToast(`❌ 下载失败：${firstError || '未知原因'}`, 10000);
    } else if (failed > 0) {
      showToast(`⚠️ 下载完成：${saved} 成功，${failed} 失败；失败原因：${firstError || '未知'}`, 10000);
    } else {
      showToast(`✅ 下载完成：${saved} 个文件`, 8000);
    }
    return { ok: failed === 0 };
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 10. 悬浮按钮 + 卡片                                        ║
  // ╚════════════════════════════════════════════════════════════╝

  const FAB_SIZE = 44;
  const FAB_GAP = 12;
  const CARD_W = 372;
  let fabEl = null;
  let cardEl = null;
  let panelOpen = false;
  let fabPos = GM_getValue(FAB_POS_KEY, null);
  let busy = false;
  let noteCache = null;
  let noteCacheAt = 0;

  const clampPos = (pos) => ({
    x: Math.min(Math.max(pos.x, 8), Math.max(8, window.innerWidth - FAB_SIZE - 8)),
    y: Math.min(Math.max(pos.y, 8), Math.max(8, window.innerHeight - FAB_SIZE - 8))
  });

  const defaultFabPos = () => clampPos({
    x: window.innerWidth - FAB_SIZE - 24,
    y: window.innerHeight - FAB_SIZE - 96
  });

  const currentFabPos = () => clampPos(fabPos && typeof fabPos.x === 'number' ? fabPos : defaultFabPos());

  const getNote = (force) => {
    const now = Date.now();
    if (!force && noteCache && now - noteCacheAt < 2000) return noteCache;
    noteCache = extractNote();
    noteCacheAt = now;
    return noteCache;
  };

  const eagleTargetLabel = () => {
    const folder = config.folderName || (config.folderId ? '(已选文件夹)' : '根目录');
    const tagCount = Array.isArray(config.tags) ? config.tags.length : 0;
    return `${folder} · ${tagCount > 0 ? `${tagCount} 个标签` : '无标签'}`;
  };

  const applyFabPosition = () => {
    if (!fabEl) return;
    const pos = currentFabPos();
    fabEl.style.left = pos.x + 'px';
    fabEl.style.top = pos.y + 'px';
  };

  const applyCardPosition = () => {
    if (!cardEl) return;
    const pos = currentFabPos();
    const left = Math.min(Math.max(pos.x + FAB_SIZE - CARD_W, 8), Math.max(8, window.innerWidth - CARD_W - 8));
    const spaceBelow = window.innerHeight - (pos.y + FAB_SIZE + FAB_GAP + 8);
    cardEl.style.left = left + 'px';
    if (spaceBelow >= 300) {
      cardEl.style.top = pos.y + FAB_SIZE + FAB_GAP + 'px';
      cardEl.style.bottom = 'auto';
      cardEl.style.maxHeight = Math.max(200, spaceBelow) + 'px';
    } else {
      cardEl.style.top = 'auto';
      cardEl.style.bottom = window.innerHeight - pos.y + FAB_GAP + 'px';
      cardEl.style.maxHeight = Math.max(200, pos.y - 16) + 'px';
    }
  };

  const makeButton = (text, className, onClick) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  };

  const renderPanel = () => {
    if (!cardEl) return;
    const note = getNote(false);
    cardEl.innerHTML = '';

    const title = document.createElement('h4');
    title.className = 'xhs-eagle-title';
    title.textContent = note ? (noteTitle(note) || noteDesc(note) || getNoteId(note) || '当前作品') : '当前作品';
    cardEl.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'xhs-eagle-sub';
    const onProfile = location.pathname.startsWith('/user/profile/');
    sub.textContent = note
      ? `${noteAuthor(note) || '未知作者'} · ${isVideoNote(note) ? '视频' : `图集 ${(note.imageList || []).length} 张`}`
      : (onProfile ? '用户主页：先点开一个作品，再点上面的按钮' : '没读到作品数据，请刷新或先点开作品');
    cardEl.appendChild(sub);

    // Eagle 目标
    const eagleBox = document.createElement('div');
    eagleBox.className = 'xhs-eagle-box';
    const eagleHead = document.createElement('div');
    eagleHead.className = 'xhs-eagle-head';
    const eagleHeadLabel = document.createElement('span');
    eagleHeadLabel.textContent = 'Eagle 目标';
    const eagleHeadValue = document.createElement('span');
    eagleHeadValue.className = 'xhs-eagle-state';
    eagleHeadValue.textContent = eagleTargetLabel();
    eagleHead.appendChild(eagleHeadLabel);
    eagleHead.appendChild(eagleHeadValue);
    eagleBox.appendChild(eagleHead);

    // 第一行：目录 / 标签
    const rowTarget = document.createElement('div');
    rowTarget.className = 'xhs-eagle-row';
    rowTarget.appendChild(makeButton('目录', 'xhs-eagle-mini', () => {
      openEaglePicker({
        mode: 'folder',
        onChange: (patch) => {
          config.folderId = patch.folder_id || '';
          config.folderName = patch.folder_name || '';
          saveConfig();
          renderPanel();
        }
      });
    }));
    rowTarget.appendChild(makeButton('标签', 'xhs-eagle-mini', () => {
      openEaglePicker({
        mode: 'tag',
        onChange: (patch) => {
          config.tags = Array.isArray(patch.tags) ? patch.tags : [];
          saveConfig();
          renderPanel();
        }
      });
    }));
    eagleBox.appendChild(rowTarget);

    // 第二行：作者名为文件夹 / 作者名为标签
    const rowAuthor = document.createElement('div');
    rowAuthor.className = 'xhs-eagle-row';
    const folderToggle = makeButton(
      config.authorAsFolder ? '作者名为文件夹 ✓' : '作者名为文件夹',
      'xhs-eagle-toggle' + (config.authorAsFolder ? ' xhs-eagle-toggle-on' : ''),
      () => {
        config.authorAsFolder = !config.authorAsFolder;
        saveConfig();
        renderPanel();
      }
    );
    folderToggle.title = '开启后，推送时自动使用（没有则创建）以作者昵称命名的文件夹';
    rowAuthor.appendChild(folderToggle);
    const tagToggle = makeButton(
      config.authorAsTag ? '作者名为标签 ✓' : '作者名为标签',
      'xhs-eagle-toggle' + (config.authorAsTag ? ' xhs-eagle-toggle-on' : ''),
      () => {
        config.authorAsTag = !config.authorAsTag;
        saveConfig();
        renderPanel();
      }
    );
    tagToggle.title = '开启后，推送时自动把作者昵称也写进素材标签';
    rowAuthor.appendChild(tagToggle);
    eagleBox.appendChild(rowAuthor);

    // 第三行：存当前作品到 Eagle / 下载当前作品
    const rowAction = document.createElement('div');
    rowAction.className = 'xhs-eagle-row';
    const pushBtn = makeButton(busy ? '推送中...' : '存当前作品到 Eagle', 'xhs-eagle-primary', async () => {
      if (busy) return;
      busy = true;
      renderPanel();
      try {
        await pushCurrentToEagle();
      } finally {
        busy = false;
        renderPanel();
      }
    });
    pushBtn.disabled = busy;
    rowAction.appendChild(pushBtn);
    const downloadBtn = makeButton(busy ? '处理中...' : '下载当前作品', 'xhs-eagle-mini', async () => {
      if (busy) return;
      busy = true;
      renderPanel();
      try {
        await downloadCurrent();
      } finally {
        busy = false;
        renderPanel();
      }
    });
    downloadBtn.disabled = busy;
    rowAction.appendChild(downloadBtn);
    eagleBox.appendChild(rowAction);

    // 第四行：设置 / 详细信息
    const rowSettings = document.createElement('div');
    rowSettings.className = 'xhs-eagle-row';
    rowSettings.appendChild(makeButton('设置', 'xhs-eagle-mini', () => openSettings()));
    rowSettings.appendChild(makeButton('详细信息', 'xhs-eagle-mini', () => openDetail()));
    eagleBox.appendChild(rowSettings);

    const hint = document.createElement('div');
    hint.className = 'xhs-eagle-hint';
    const tags = Array.isArray(config.tags) ? [...config.tags] : [];
    const authorName = note ? noteAuthor(note) : '';
    if (config.authorAsTag && authorName && !tags.includes(authorName)) tags.push(authorName);
    const hintParts = [
      tags.length > 0 ? `标签：${tags.join('、')}` : '标签：无（素材不写入任何标签）',
      config.authorAsFolder
        ? `文件夹：${authorName || '作者名'}${config.folderName ? `（在 ${config.folderName} 下）` : '（在根目录下）'}`
        : `文件夹：${config.folderName || '根目录'}`
    ];
    hint.textContent = hintParts.join(' ｜ ');
    eagleBox.appendChild(hint);

    cardEl.appendChild(eagleBox);
  };

  const setPanelOpen = (open) => {
    panelOpen = open;
    if (!fabEl) return;
    fabEl.textContent = open ? '✕' : '插件';
    if (open) {
      if (!cardEl) {
        cardEl = document.createElement('div');
        cardEl.className = 'xhs-eagle-card';
        document.body.appendChild(cardEl);
      }
      renderPanel();
      applyCardPosition();
    } else if (cardEl) {
      cardEl.remove();
      cardEl = null;
    }
  };

  const setupFab = () => {
    fabEl = document.createElement('button');
    fabEl.type = 'button';
    fabEl.className = 'xhs-eagle-fab';
    fabEl.textContent = '插件';
    fabEl.title = '按住可拖动位置';
    document.body.appendChild(fabEl);
    applyFabPosition();

    let dragState = null;
    let dragged = false;

    fabEl.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      const pos = currentFabPos();
      dragState = {
        id: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        baseX: pos.x,
        baseY: pos.y
      };
      dragged = false;
    });

    const onMove = (ev) => {
      if (!dragState || ev.pointerId !== dragState.id) return;
      const dx = ev.clientX - dragState.startX;
      const dy = ev.clientY - dragState.startY;
      if (!dragged && Math.abs(dx) + Math.abs(dy) < 5) return;
      dragged = true;
      fabPos = clampPos({ x: dragState.baseX + dx, y: dragState.baseY + dy });
      applyFabPosition();
      applyCardPosition();
    };

    const onUp = (ev) => {
      if (!dragState || ev.pointerId !== dragState.id) return;
      const wasDragged = dragged;
      dragState = null;
      if (wasDragged) {
        dragged = false;
        GM_setValue(FAB_POS_KEY, fabPos);
        fabEl.dataset.justDragged = '1';
        setTimeout(() => {
          if (fabEl) delete fabEl.dataset.justDragged;
        }, 0);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);

    fabEl.addEventListener('click', () => {
      if (fabEl.dataset.justDragged) return;
      setPanelOpen(!panelOpen);
    });

    window.addEventListener('resize', () => {
      fabPos = currentFabPos();
      applyFabPosition();
      applyCardPosition();
    });
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 11. 快捷键                                                 ║
  // ╚════════════════════════════════════════════════════════════╝

  let hotkeyDisposers = [];

  const parseShortcut = (shortcut) => {
    const parts = String(shortcut || '').split('+').map((part) => part.trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return null;
    const result = { key: '', ctrl: false, alt: false, shift: false, meta: false };
    for (const part of parts) {
      if (part === 'ctrl' || part === 'control') result.ctrl = true;
      else if (part === 'alt' || part === 'option') result.alt = true;
      else if (part === 'shift') result.shift = true;
      else if (part === 'meta' || part === 'cmd' || part === 'command') result.meta = true;
      else if (result.key) return null;
      else result.key = part;
    }
    return result.key ? result : null;
  };

  const matchesShortcut = (ev, shortcut) => ev.key.toLowerCase() === shortcut.key &&
    ev.ctrlKey === shortcut.ctrl && ev.altKey === shortcut.alt &&
    ev.shiftKey === shortcut.shift && ev.metaKey === shortcut.meta;

  const addHotkey = (shortcut, handler) => {
    const parsed = parseShortcut(shortcut);
    if (!parsed) return () => {};
    const listener = (ev) => {
      if (!matchesShortcut(ev, parsed)) return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      ev.preventDefault();
      handler();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  };

  const registerHotkeys = () => {
    hotkeyDisposers.forEach((dispose) => dispose());
    hotkeyDisposers = [];
    if (config.enableShortcuts === false) return;
    if (config.shortcutPush) {
      hotkeyDisposers.push(addHotkey(config.shortcutPush, () => {
        pushCurrentToEagle().then();
      }));
    }
    if (config.shortcutDownload) {
      hotkeyDisposers.push(addHotkey(config.shortcutDownload, () => {
        downloadCurrent().then();
      }));
    }
  };

  // ╔════════════════════════════════════════════════════════════╗
  // ║ 12. 启动                                                   ║
  // ╚════════════════════════════════════════════════════════════╝

  const registerMenu = () => {
    try {
      if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('小红书推送eagle：设置', openSettings);
        GM_registerMenuCommand('小红书推送eagle：存当前作品到 Eagle', () => {
          pushCurrentToEagle().then();
        });
        GM_registerMenuCommand('小红书推送eagle：重置按钮位置', () => {
          fabPos = defaultFabPos();
          GM_setValue(FAB_POS_KEY, fabPos);
          applyFabPosition();
          applyCardPosition();
          showToast('按钮位置已重置', 2000);
        });
      }
    } catch (err) {
      log.debug('registerMenu failed', err);
    }
  };

  const init = () => {
    injectStyle();
    setupFab();
    registerHotkeys();
    registerMenu();
    // 单页应用路由切换时刷新卡片内容
    let lastHref = location.href;
    setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      noteCache = null;
      if (panelOpen) renderPanel();
    }, 1500);
    log.info('小红书推送eagle 已加载', location.href);
  };

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
