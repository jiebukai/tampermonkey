// ==UserScript==
// @name            抖音图集/视频推送eagle
// @namespace       https://github.com/jiebukai/tampermonkey
// @version         1.0.2
// @description     把抖音作品（视频/图集）推送到 Eagle 素材库，可选目标文件夹与标签；保留上游的下载能力
// @author          jiebukai
// @match           https://*.douyin.com/*
// @icon            https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico
// @license         MIT
// @supportURL      https://github.com/jiebukai/tampermonkey/issues
// @downloadURL     https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E6%8A%96%E9%9F%B3%E6%8E%A8%E9%80%81eagle.user.js
// @updateURL       https://raw.githubusercontent.com/jiebukai/tampermonkey/main/%E6%8A%96%E9%9F%B3%E6%8E%A8%E9%80%81eagle.user.js
// @grant           GM_xmlhttpRequest
// @connect         *
// @homepageURL     https://github.com/jiebukai/tampermonkey
// ==/UserScript==
/*
 * 维护：jiebukai（仓库 https://github.com/jiebukai/tampermonkey）
 * @namespace / @downloadURL / @updateURL / @supportURL 均指向本仓库，
 * 用于切断与上游脚本的自动更新关联，避免 Tampermonkey 自动更新把本地改动覆盖回上游版本。
 * 原作者与上游来源保留在下方 @author 及原说明中。
 */

/*
 * 本版基于上游 v1.5.15（zhzLuke96/douyin-dl-user-js）增加 Eagle 推送能力：
 *
 * 1. 作品详情页：播放器「插件」菜单里多了「存到 Eagle」，一键把当前作品
 *    （视频或整套图集）推送到 Eagle 素材库。
 * 2. 作者主页：右下角浮动面板新增「存 Eagle」按钮，勾选多个作品后批量推送。
 * 3. 设置 → 下载器配置 → 类型选「Eagle」：填写 Eagle 服务地址
 *    （默认 http://127.0.0.1:41595）、选择目标文件夹与标签。
 *    未选择标签时，素材不会写入任何标签。
 *
 * 实现要点：
 * - Eagle 侧调用 /api/item/addFromURL（Eagle 4.0 桌面版）或 /api/v2/item/add，
 *   运行时自动探测 API 风格并在 404 时回退；
 * - 素材的来源 URL 写作品页地址，annotation 写入作者 / 发布时间 / 作品 ID 便于回溯；
 * - 视频优先使用带签名的 CDN 直链（Eagle 是外部程序、没有浏览器 cookie），
 *   同源 playApi 作为兜底；
 * - 默认按「来源页面 URL + 文件名」跳过 Eagle 中已存在的素材，可在设置里关闭。
 */


"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e3) {
      throw err = [e3], e3;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/.pnpm/preact@10.28.2/node_modules/preact/dist/preact.module.js
  function w(n2, l3) {
    for (var u4 in l3) n2[u4] = l3[u4];
    return n2;
  }
  function g(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u4, t3) {
    var i3, o3, r3, e3 = {};
    for (r3 in u4) "key" == r3 ? i3 = u4[r3] : "ref" == r3 ? o3 = u4[r3] : e3[r3] = u4[r3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (r3 in l3.defaultProps) void 0 === e3[r3] && (e3[r3] = l3.defaultProps[r3]);
    return m(l3, e3, i3, o3, null);
  }
  function m(n2, t3, i3, o3, r3) {
    var e3 = { type: n2, props: t3, key: i3, ref: o3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == r3 ? ++u : r3, __i: -1, __u: 0 };
    return null == r3 && null != l.vnode && l.vnode(e3), e3;
  }
  function k(n2) {
    return n2.children;
  }
  function x(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function S(n2, l3) {
    if (null == l3) return n2.__ ? S(n2.__, n2.__i + 1) : null;
    for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
    return "function" == typeof n2.type ? S(n2) : null;
  }
  function C(n2) {
    var l3, u4;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) {
        n2.__e = n2.__c.base = u4.__e;
        break;
      }
      return C(n2);
    }
  }
  function M(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || o != l.debounceRendering) && ((o = l.debounceRendering) || r)($);
  }
  function $() {
    for (var n2, u4, t3, o3, r3, f4, c4, s5 = 1; i.length; ) i.length > s5 && i.sort(e), n2 = i.shift(), s5 = i.length, n2.__d && (t3 = void 0, o3 = void 0, r3 = (o3 = (u4 = n2).__v).__e, f4 = [], c4 = [], u4.__P && ((t3 = w({}, o3)).__v = o3.__v + 1, l.vnode && l.vnode(t3), O(u4.__P, t3, o3, u4.__n, u4.__P.namespaceURI, 32 & o3.__u ? [r3] : null, f4, null == r3 ? S(o3) : r3, !!(32 & o3.__u), c4), t3.__v = o3.__v, t3.__.__k[t3.__i] = t3, N(f4, t3, c4), o3.__e = o3.__ = null, t3.__e != r3 && C(t3)));
    $.__r = 0;
  }
  function I(n2, l3, u4, t3, i3, o3, r3, e3, f4, c4, s5) {
    var a3, h3, y3, d3, w3, g2, _2, m3 = t3 && t3.__k || v, b = l3.length;
    for (f4 = P(u4, l3, m3, f4, b), a3 = 0; a3 < b; a3++) null != (y3 = u4.__k[a3]) && (h3 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g2 = O(n2, y3, h3, i3, o3, r3, e3, f4, c4, s5), d3 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && B(h3.ref, null, y3), s5.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), (_2 = !!(4 & y3.__u)) || h3.__k === y3.__k ? f4 = A(y3, f4, n2, _2) : "function" == typeof y3.type && void 0 !== g2 ? f4 = g2 : d3 && (f4 = d3.nextSibling), y3.__u &= -7);
    return u4.__e = w3, f4;
  }
  function P(n2, l3, u4, t3, i3) {
    var o3, r3, e3, f4, c4, s5 = u4.length, a3 = s5, h3 = 0;
    for (n2.__k = new Array(i3), o3 = 0; o3 < i3; o3++) null != (r3 = l3[o3]) && "boolean" != typeof r3 && "function" != typeof r3 ? ("string" == typeof r3 || "number" == typeof r3 || "bigint" == typeof r3 || r3.constructor == String ? r3 = n2.__k[o3] = m(null, r3, null, null, null) : d(r3) ? r3 = n2.__k[o3] = m(k, { children: r3 }, null, null, null) : void 0 === r3.constructor && r3.__b > 0 ? r3 = n2.__k[o3] = m(r3.type, r3.props, r3.key, r3.ref ? r3.ref : null, r3.__v) : n2.__k[o3] = r3, f4 = o3 + h3, r3.__ = n2, r3.__b = n2.__b + 1, e3 = null, -1 != (c4 = r3.__i = L(r3, u4, f4, a3)) && (a3--, (e3 = u4[c4]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c4 && (i3 > s5 ? h3-- : i3 < s5 && h3++), "function" != typeof r3.type && (r3.__u |= 4)) : c4 != f4 && (c4 == f4 - 1 ? h3-- : c4 == f4 + 1 ? h3++ : (c4 > f4 ? h3-- : h3++, r3.__u |= 4))) : n2.__k[o3] = null;
    if (a3) for (o3 = 0; o3 < s5; o3++) null != (e3 = u4[o3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
    return t3;
  }
  function A(n2, l3, u4, t3) {
    var i3, o3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, o3 = 0; i3 && o3 < i3.length; o3++) i3[o3] && (i3[o3].__ = n2, l3 = A(i3[o3], l3, u4, t3));
      return l3;
    }
    n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = S(n2)), u4.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function L(n2, l3, u4, t3) {
    var i3, o3, r3, e3 = n2.key, f4 = n2.type, c4 = l3[u4], s5 = null != c4 && 0 == (2 & c4.__u);
    if (null === c4 && null == e3 || s5 && e3 == c4.key && f4 == c4.type) return u4;
    if (t3 > (s5 ? 1 : 0)) {
      for (i3 = u4 - 1, o3 = u4 + 1; i3 >= 0 || o3 < l3.length; ) if (null != (c4 = l3[r3 = i3 >= 0 ? i3-- : o3++]) && 0 == (2 & c4.__u) && e3 == c4.key && f4 == c4.type) return r3;
    }
    return -1;
  }
  function T(n2, l3, u4) {
    "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || y.test(l3) ? u4 : u4 + "px";
  }
  function j(n2, l3, u4, t3, i3) {
    var o3, r3;
    n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || T(n2.style, l3, "");
      if (u4) for (l3 in u4) t3 && u4[l3] == t3[l3] || T(n2.style, l3, u4[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) o3 = l3 != (l3 = l3.replace(f, "$1")), r3 = l3.toLowerCase(), l3 = r3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? r3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u4, u4 ? t3 ? u4.u = t3.u : (u4.u = c, n2.addEventListener(l3, o3 ? a : s, o3)) : n2.removeEventListener(l3, o3 ? a : s, o3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u4 ? "" : u4;
        break n;
      } catch (n3) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
    }
  }
  function F(n2) {
    return function(u4) {
      if (this.l) {
        var t3 = this.l[u4.type + n2];
        if (null == u4.t) u4.t = c++;
        else if (u4.t < t3.u) return;
        return t3(l.event ? l.event(u4) : u4);
      }
    };
  }
  function O(n2, u4, t3, i3, o3, r3, e3, f4, c4, s5) {
    var a3, h3, p3, v3, y3, _2, m3, b, S2, C3, M2, $2, P2, A3, H, L2, T3, j3 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t3.__u && (c4 = !!(32 & t3.__u), r3 = [f4 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
    n: if ("function" == typeof j3) try {
      if (b = u4.props, S2 = "prototype" in j3 && j3.prototype.render, C3 = (a3 = j3.contextType) && i3[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? m3 = (h3 = u4.__c = t3.__c).__ = h3.__E : (S2 ? u4.__c = h3 = new j3(b, M2) : (u4.__c = h3 = new x(b, M2), h3.constructor = j3, h3.render = E), C3 && C3.sub(h3), h3.state || (h3.state = {}), h3.__n = i3, p3 = h3.__d = true, h3.__h = [], h3._sb = []), S2 && null == h3.__s && (h3.__s = h3.state), S2 && null != j3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = w({}, h3.__s)), w(h3.__s, j3.getDerivedStateFromProps(b, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u4, p3) S2 && null == j3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), S2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
      else {
        if (S2 && null == j3.getDerivedStateFromProps && b !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b, M2), u4.__v == t3.__v || !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b, h3.__s, M2)) {
          for (u4.__v != t3.__v && (h3.props = b, h3.state = h3.__s, h3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
            n3 && (n3.__ = u4);
          }), $2 = 0; $2 < h3._sb.length; $2++) h3.__h.push(h3._sb[$2]);
          h3._sb = [], h3.__h.length && e3.push(h3);
          break n;
        }
        null != h3.componentWillUpdate && h3.componentWillUpdate(b, h3.__s, M2), S2 && null != h3.componentDidUpdate && h3.__h.push(function() {
          h3.componentDidUpdate(v3, y3, _2);
        });
      }
      if (h3.context = M2, h3.props = b, h3.__P = n2, h3.__e = false, P2 = l.__r, A3 = 0, S2) {
        for (h3.state = h3.__s, h3.__d = false, P2 && P2(u4), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++) h3.__h.push(h3._sb[H]);
        h3._sb = [];
      } else do {
        h3.__d = false, P2 && P2(u4), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
      } while (h3.__d && ++A3 < 25);
      h3.state = h3.__s, null != h3.getChildContext && (i3 = w(w({}, i3), h3.getChildContext())), S2 && !p3 && null != h3.getSnapshotBeforeUpdate && (_2 = h3.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f4 = I(n2, d(L2) ? L2 : [L2], u4, t3, i3, o3, r3, e3, f4, c4, s5), h3.base = u4.__e, u4.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
    } catch (n3) {
      if (u4.__v = null, c4 || null != r3) if (n3.then) {
        for (u4.__u |= c4 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
        r3[r3.indexOf(f4)] = null, u4.__e = f4;
      } else {
        for (T3 = r3.length; T3--; ) g(r3[T3]);
        z(u4);
      }
      else u4.__e = t3.__e, u4.__k = t3.__k, n3.then || z(u4);
      l.__e(n3, u4, t3);
    }
    else null == r3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = q(t3.__e, u4, t3, i3, o3, r3, e3, c4, s5);
    return (a3 = l.diffed) && a3(u4), 128 & u4.__u ? void 0 : f4;
  }
  function z(n2) {
    n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
  }
  function N(n2, u4, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) B(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u4, n2), n2.some(function(u5) {
      try {
        n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
          n3.call(u5);
        });
      } catch (n3) {
        l.__e(n3, u5.__v);
      }
    });
  }
  function V(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : d(n2) ? n2.map(V) : w({}, n2);
  }
  function q(u4, t3, i3, o3, r3, e3, f4, c4, s5) {
    var a3, h3, v3, y3, w3, _2, m3, b = i3.props || p, k3 = t3.props, x2 = t3.type;
    if ("svg" == x2 ? r3 = "http://www.w3.org/2000/svg" : "math" == x2 ? r3 = "http://www.w3.org/1998/Math/MathML" : r3 || (r3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (a3 = 0; a3 < e3.length; a3++) if ((w3 = e3[a3]) && "setAttribute" in w3 == !!x2 && (x2 ? w3.localName == x2 : 3 == w3.nodeType)) {
        u4 = w3, e3[a3] = null;
        break;
      }
    }
    if (null == u4) {
      if (null == x2) return document.createTextNode(k3);
      u4 = document.createElementNS(r3, x2, k3.is && k3), c4 && (l.__m && l.__m(t3, e3), c4 = false), e3 = null;
    }
    if (null == x2) b === k3 || c4 && u4.data == k3 || (u4.data = k3);
    else {
      if (e3 = e3 && n.call(u4.childNodes), !c4 && null != e3) for (b = {}, a3 = 0; a3 < u4.attributes.length; a3++) b[(w3 = u4.attributes[a3]).name] = w3.value;
      for (a3 in b) if (w3 = b[a3], "children" == a3) ;
      else if ("dangerouslySetInnerHTML" == a3) v3 = w3;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
        j(u4, a3, null, w3, r3);
      }
      for (a3 in k3) w3 = k3[a3], "children" == a3 ? y3 = w3 : "dangerouslySetInnerHTML" == a3 ? h3 = w3 : "value" == a3 ? _2 = w3 : "checked" == a3 ? m3 = w3 : c4 && "function" != typeof w3 || b[a3] === w3 || j(u4, a3, w3, b[a3], r3);
      if (h3) c4 || v3 && (h3.__html == v3.__html || h3.__html == u4.innerHTML) || (u4.innerHTML = h3.__html), t3.__k = [];
      else if (v3 && (u4.innerHTML = ""), I("template" == t3.type ? u4.content : u4, d(y3) ? y3 : [y3], t3, i3, o3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : r3, e3, f4, e3 ? e3[0] : i3.__k && S(i3, 0), c4, s5), null != e3) for (a3 = e3.length; a3--; ) g(e3[a3]);
      c4 || (a3 = "value", "progress" == x2 && null == _2 ? u4.removeAttribute("value") : null != _2 && (_2 !== u4[a3] || "progress" == x2 && !_2 || "option" == x2 && _2 != b[a3]) && j(u4, a3, _2, b[a3], r3), a3 = "checked", null != m3 && m3 != u4[a3] && j(u4, a3, m3, b[a3], r3));
    }
    return u4;
  }
  function B(n2, u4, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u4 || (n2.__u = n2(u4));
      } else n2.current = u4;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function D(n2, u4, t3) {
    var i3, o3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || B(i3, null, u4)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u4);
      }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k) for (o3 = 0; o3 < i3.length; o3++) i3[o3] && D(i3[o3], u4, t3 || "function" != typeof n2.type);
    t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function E(n2, l3, u4) {
    return this.constructor(n2, u4);
  }
  function G(u4, t3, i3) {
    var o3, r3, e3, f4;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), r3 = (o3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f4 = [], O(t3, u4 = (!o3 && i3 || t3).__k = _(k, null, [u4]), r3 || p, p, t3.namespaceURI, !o3 && i3 ? [i3] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !o3 && i3 ? i3 : r3 ? r3.__e : t3.firstChild, o3, f4), N(e3, u4, f4);
  }
  var n, l, u, t, i, o, r, e, f, c, s, a, h, p, v, y, d;
  var init_preact_module = __esm({
    "node_modules/.pnpm/preact@10.28.2/node_modules/preact/dist/preact.module.js"() {
      p = {};
      v = [];
      y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
      d = Array.isArray;
      __name(w, "w");
      __name(g, "g");
      __name(_, "_");
      __name(m, "m");
      __name(k, "k");
      __name(x, "x");
      __name(S, "S");
      __name(C, "C");
      __name(M, "M");
      __name($, "$");
      __name(I, "I");
      __name(P, "P");
      __name(A, "A");
      __name(L, "L");
      __name(T, "T");
      __name(j, "j");
      __name(F, "F");
      __name(O, "O");
      __name(z, "z");
      __name(N, "N");
      __name(V, "V");
      __name(q, "q");
      __name(B, "B");
      __name(D, "D");
      __name(E, "E");
      __name(G, "G");
      n = v.slice, l = { __e: /* @__PURE__ */ __name(function(n2, l3, u4, t3) {
        for (var i3, o3, r3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
          if ((o3 = i3.constructor) && null != o3.getDerivedStateFromError && (i3.setState(o3.getDerivedStateFromError(n2)), r3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), r3 = i3.__d), r3) return i3.__E = i3;
        } catch (l4) {
          n2 = l4;
        }
        throw n2;
      }, "__e") }, u = 0, t = /* @__PURE__ */ __name(function(n2) {
        return null != n2 && void 0 === n2.constructor;
      }, "t"), x.prototype.setState = function(n2, l3) {
        var u4;
        u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = w({}, this.state), "function" == typeof n2 && (n2 = n2(w({}, u4), this.props)), n2 && w(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
      }, x.prototype.forceUpdate = function(n2) {
        this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
      }, x.prototype.render = k, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = /* @__PURE__ */ __name(function(n2, l3) {
        return n2.__v.__b - l3.__v.__b;
      }, "e"), $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;
    }
  });

  // node_modules/.pnpm/preact@10.28.2/node_modules/preact/hooks/dist/hooks.module.js
  function p2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
  }
  function d2(n2) {
    return o2 = 1, h2(D2, n2);
  }
  function h2(n2, u4, i3) {
    var o3 = p2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u4) : D2(void 0, u4), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f4 = /* @__PURE__ */ __name(function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u5 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u5.every(function(n4) {
          return !n4.__N;
        })) return !c4 || c4.call(this, n3, t3, r3);
        var i4 = o3.__c.props !== n3;
        return u5.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c4 && c4.call(this, n3, t3, r3) || i4;
      }, "f");
      r2.__f = true;
      var c4 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u5 = c4;
          c4 = void 0, f4(n3, t3, r3), c4 = u5;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f4;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u4) {
    var i3 = p2(t2++, 3);
    !c2.__s && C2(i3.__H, u4) && (i3.__ = n2, i3.u = u4, r2.__H.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u4 = p2(t2++, 7);
    return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
  }
  function q2(n2, t3) {
    return o2 = 8, T2(function() {
      return n2;
    }, t3);
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
    } catch (t3) {
      n2.__H.__h = [], c2.__e(t3, n2.__v);
    }
  }
  function w2(n2) {
    var t3, r3 = /* @__PURE__ */ __name(function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, "r"), u4 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u4 = n2.__c;
    "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }
  var t2, r2, u2, i2, o2, f2, c2, e2, a2, v2, l2, m2, s2, k2;
  var init_hooks_module = __esm({
    "node_modules/.pnpm/preact@10.28.2/node_modules/preact/hooks/dist/hooks.module.js"() {
      init_preact_module();
      o2 = 0;
      f2 = [];
      c2 = l;
      e2 = c2.__b;
      a2 = c2.__r;
      v2 = c2.diffed;
      l2 = c2.__c;
      m2 = c2.unmount;
      s2 = c2.__;
      __name(p2, "p");
      __name(d2, "d");
      __name(h2, "h");
      __name(y2, "y");
      __name(A2, "A");
      __name(T2, "T");
      __name(q2, "q");
      __name(j2, "j");
      c2.__b = function(n2) {
        r2 = null, e2 && e2(n2);
      }, c2.__ = function(n2, t3) {
        n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
      }, c2.__r = function(n2) {
        a2 && a2(n2), t2 = 0;
        var i3 = (r2 = n2.__c).__H;
        i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
          n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
        })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
      }, c2.diffed = function(n2) {
        v2 && v2(n2);
        var t3 = n2.__c;
        t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
          n3.u && (n3.__H = n3.u), n3.u = void 0;
        })), u2 = r2 = null;
      }, c2.__c = function(n2, t3) {
        t3.some(function(n3) {
          try {
            n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
              return !n4.__ || B2(n4);
            });
          } catch (r3) {
            t3.some(function(n4) {
              n4.__h && (n4.__h = []);
            }), t3 = [], c2.__e(r3, n3.__v);
          }
        }), l2 && l2(n2, t3);
      }, c2.unmount = function(n2) {
        m2 && m2(n2);
        var t3, r3 = n2.__c;
        r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
          try {
            z2(n3);
          } catch (n4) {
            t3 = n4;
          }
        }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
      };
      k2 = "function" == typeof requestAnimationFrame;
      __name(w2, "w");
      __name(z2, "z");
      __name(B2, "B");
      __name(C2, "C");
      __name(D2, "D");
    }
  });

  // src/core/Emitter.ts
  var _Emitter, Emitter;
  var init_Emitter = __esm({
    "src/core/Emitter.ts"() {
      "use strict";
      init_hooks_module();
      _Emitter = class _Emitter {
        constructor() {
          this.events = /* @__PURE__ */ new Map();
        }
        on(event, handler) {
          let set = this.events.get(event);
          if (!set) {
            set = /* @__PURE__ */ new Set();
            this.events.set(event, set);
          }
          set.add(handler);
          return () => this.off(event, handler);
        }
        off(event, handler) {
          const set = this.events.get(event);
          if (!set) return;
          set.delete(handler);
          if (set.size === 0) {
            this.events.delete(event);
          }
        }
        emit(event, ...args) {
          const set = this.events.get(event);
          if (!set) return;
          for (const fn of [...set]) {
            fn(...args);
          }
        }
        once(event, handler) {
          const wrap = /* @__PURE__ */ __name((...args) => {
            handler(...args);
            this.off(event, wrap);
          }, "wrap");
          return this.on(event, wrap);
        }
        /**
         * 清空某个事件或全部
         */
        clear(event) {
          if (event) {
            this.events.delete(event);
          } else {
            this.events.clear();
          }
        }
        useEvent(event, getter) {
          const [state, setState] = d2(null);
          y2(() => {
            const off = this.on(event, (...args) => {
              setState(getter ? getter(...args) : args[0]);
            });
            return () => off();
          }, []);
          return state;
        }
      };
      __name(_Emitter, "Emitter");
      Emitter = _Emitter;
    }
  });

  // src/core/Config.ts
  var isPlainObject, getPathValue, deepEqual, _Config, Config;
  var init_Config = __esm({
    "src/core/Config.ts"() {
      "use strict";
      init_Emitter();
      isPlainObject = /* @__PURE__ */ __name((value) => {
        return value !== null && typeof value === "object" && !Array.isArray(value);
      }, "isPlainObject");
      getPathValue = /* @__PURE__ */ __name((obj, path) => {
        return path.split(".").reduce((acc, key) => acc == null ? void 0 : acc[key], obj);
      }, "getPathValue");
      deepEqual = /* @__PURE__ */ __name((a3, b) => {
        if (a3 === b) return true;
        if (Array.isArray(a3) && Array.isArray(b)) {
          return a3.length === b.length && a3.every((value, index) => deepEqual(value, b[index]));
        }
        if (isPlainObject(a3) && isPlainObject(b)) {
          const keys = [.../* @__PURE__ */ new Set([...Object.keys(a3), ...Object.keys(b)])];
          return keys.every((key) => deepEqual(a3[key], b[key]));
        }
        return false;
      }, "deepEqual");
      _Config = class _Config {
        constructor(load = true) {
          this.events = new Emitter();
          this.features = {
            /**
             * 是否开启图片转码
             *
             * @deprecated 已经废弃使用 image_convert_codecs 代替
             */
            convert_webp_to_png: true,
            /**
             * 下载视频分辨率策略
             * 可以选默认，最高清晰度，最小清晰度，和一些其他预设分辨率
             */
            download_video_mode: "default",
            /**
             * 文件名模板
             */
            filename_template: _Config.defaults.filename_template,
            /**
             * 最大文件名长度
             */
            filename_max_length: 64,
            /**
             * 视频下载编码偏好
             *
             * 1. 默认，无偏好 "default"
             * 2. 只下载 h264 "h264"
             * 3. 只下载 h265 "h265"
             * 4. 优先 h264 "h264_prefer"
             * 5. 优先 h265 "h265_prefer"
             */
            video_download_codecs: "default",
            /**
             * 图片转码编码偏好
             *
             * 仅浏览器下载流程生效；外部下载器不会执行图片转码。
             *
             * 1. 默认，无偏好 "default"
             * 2. 转码为 png "png"
             * 3. 转码为 jpg "jpg"
             * 4. 转码为 webp "webp"
             */
            image_convert_codecs: "default",
            /**
             * 图片尺寸压缩偏好
             *
             * 仅浏览器下载流程生效；外部下载器不会执行图片压缩。
             *
             * 1. 默认，无偏好 "default"
             * 2. 最大边小于 2k "2k_max"
             * 3. 最大边小于 1k "1k_max"
             * 4. 最大边小于 960 "960_max"
             * 5. 最大边小于 640 "640_max"
             * 5. 最大边小于 512 "512_max"
             */
            image_resize_codecs: "default",
            /**
             * 图片压缩率 必须开启转码或者尺寸压缩才有用
             *
             * 仅浏览器下载流程生效；外部下载器不会执行图片压缩。
             *
             * 默认 80
             * 推荐 60 以上
             */
            image_quality: 80,
            /**
             * 使用什么下载器 默认为使用浏览器下载，可以配置其他下载
             */
            using_downloader: "browser",
            /**
             * 下载器配置
             *
             * 不同下载器有不同的配置
             */
            downloader_config: {
              browser: {
                // 没有配置
              },
              idm: { id: "1" },
              aria2: {
                // 不同类型的下载地址
                dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
                domain: "http://localhost",
                port: "6800",
                path: "/jsonrpc",
                token: ""
              },
              bc: {
                dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
                domain: "http://localhost",
                port: "8080",
                path: "/panel/task_add_httpftp_result",
                authName: "",
                authPass: ""
              },
              abdm: {
                // 不同类型的下载地址
                dir: { video: "`./douyin/${user_dir}/videos`", image: "`./douyin/${user_dir}/images`", other: "`./douyin/${user_dir}/others`" },
                domain: "http://localhost",
                port: "15151"
              },
              /**
               * Eagle 推送配置（把作品直接推送到 Eagle 素材库）
               *
               * - folder_id：目标文件夹 id，空字符串表示库根目录
               * - tags：要附加的标签；留空数组表示不添加任何标签
               * - skip_existing：推送前先按「来源页面 URL + 文件名」查询 Eagle，已存在则跳过
               * - send_referer：给抖音 CDN 请求带上 Referer / User-Agent，降低拉取失败率
               */
              eagle: {
                base_url: "http://127.0.0.1:41595",
                folder_id: "",
                folder_name: "",
                tags: [],
                skip_existing: true,
                send_referer: true
              }
            },
            /**
             * 是否启用下载快捷键
             *
             * 默认开启
             */
            enable_download_shortcut: true,
            /**
             * 下载当前媒体的快捷键
             *
             * 支持 M、Ctrl+M、Alt+M、Shift+M、Ctrl+Shift+M 等组合
             */
            download_shortcut: "m",
            /**
             * 是否启用「推送到 Eagle」快捷键
             *
             * 默认开启
             */
            enable_eagle_shortcut: true,
            /**
             * 推送到 Eagle 的快捷键
             *
             * 默认 S，支持 M、Ctrl+M、Alt+M、Shift+M、Ctrl+Shift+M 等组合
             */
            eagle_shortcut: "s",
            /**
             * 是否开启作者页面下载器
             *
             * 默认关闭
             */
            enable_profile_downloader: false
          };
          this._key = "__douyin-dl-user-js__";
          this._base = this.clone_features();
          this._storage_handler = /* @__PURE__ */ __name((event) => {
            if (event.key !== null && event.key !== this._key) return;
            try {
              this.load();
              this.events.emit("config_change");
            } catch (error) {
              console.error(error);
            }
          }, "_storage_handler");
          if (!load) return;
          try {
            this.load();
          } catch (error) {
            console.error(error);
          }
          if (typeof window !== "undefined") {
            window.addEventListener("storage", this._storage_handler);
          }
        }
        static default_features() {
          return new _Config(false).clone_features();
        }
        toJSON() {
          return { features: this.features };
        }
        static deepMerge(base, patch) {
          if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
            return patch === void 0 ? base : patch;
          }
          const result = Array.isArray(base) ? [...base] : { ...base };
          for (const key of Object.keys(patch)) {
            result[key] = this.deepMerge(base?.[key], patch[key]);
          }
          return result;
        }
        static diff_paths(base, next, prefix = "") {
          const result = [];
          const baseKeys = isPlainObject(base) ? Object.keys(base) : [];
          const nextKeys = isPlainObject(next) ? Object.keys(next) : [];
          const keys = [.../* @__PURE__ */ new Set([...baseKeys, ...nextKeys])];
          for (const key of keys) {
            const path = prefix ? `${prefix}.${key}` : key;
            const oldValue = isPlainObject(base) ? base[key] : void 0;
            const newValue = isPlainObject(next) ? next[key] : void 0;
            if (deepEqual(oldValue, newValue)) continue;
            if (isPlainObject(oldValue) && isPlainObject(newValue)) {
              result.push(...this.diff_paths(oldValue, newValue, path));
            } else {
              result.push(path);
            }
          }
          return result;
        }
        static apply_paths(target, source, paths) {
          const result = JSON.parse(JSON.stringify(target));
          for (const path of paths) {
            const parts = path.split(".");
            let current = result;
            for (let i3 = 0; i3 < parts.length - 1; i3++) {
              if (!isPlainObject(current[parts[i3]])) current[parts[i3]] = {};
              current = current[parts[i3]];
            }
            current[parts[parts.length - 1]] = getPathValue(source, path);
          }
          return result;
        }
        read_stored_features() {
          const raw = localStorage.getItem(this._key);
          if (!raw) return _Config.default_features();
          const data = JSON.parse(raw);
          const savedFeatures = data.features || {};
          const features = _Config.deepMerge(_Config.default_features(), savedFeatures);
          if (typeof savedFeatures.download_shortcut === "string" && !savedFeatures.download_shortcut.trim() && typeof savedFeatures.enable_download_shortcut !== "boolean") {
            features.enable_download_shortcut = false;
          }
          return features;
        }
        load() {
          this.features = this.read_stored_features();
          this._base = this.clone_features();
        }
        save() {
          const latest = this.read_stored_features();
          const patch = _Config.diff_paths(this._base, this.features);
          this.features = _Config.apply_paths(latest, this.features, patch);
          localStorage.setItem(this._key, JSON.stringify(this.toJSON()));
          this._base = this.clone_features();
          this.events.emit("config_change");
        }
        clone_features() {
          return JSON.parse(JSON.stringify(this.features));
        }
      };
      __name(_Config, "Config");
      _Config.defaults = {
        filename_template: "`${nickname}_${short_id}_${tags}_${desc}`"
      };
      _Config.global = new _Config();
      Config = _Config;
    }
  });

  // src/utils/format.ts
  function runInContext(context, code) {
    const keys = Object.keys(context);
    const head = `const {${keys.join(", ")}} = __CTX__; `;
    let body = code.trim();
    if (!body.startsWith("`")) {
      body = "`" + body.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`";
    }
    const fn = new Function("__CTX__", `${head}
return (${body})`);
    return fn(context);
  }
  function formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
    const o3 = {
      YYYY: date.getFullYear().toString(),
      MM: ("0" + (date.getMonth() + 1)).slice(-2),
      DD: ("0" + date.getDate()).slice(-2),
      HH: ("0" + date.getHours()).slice(-2),
      mm: ("0" + date.getMinutes()).slice(-2),
      ss: ("0" + date.getSeconds()).slice(-2)
    };
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m3) => o3[m3]);
  }
  var init_format = __esm({
    "src/utils/format.ts"() {
      "use strict";
      __name(runInContext, "runInContext");
      __name(formatDate, "formatDate");
    }
  });

  // src/utils/string.ts
  function getReplacementChar(value) {
    if (typeof value !== "string" || value.length !== 1) return "_";
    if (/[\\/:*?"<>|\x00-\x1f\x7f]/.test(value)) return "_";
    return value;
  }
  function getMaxLength(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return DEFAULT_MAX_LENGTH;
    return Math.floor(value);
  }
  function truncateUtf16(value, maxLength) {
    if (value.length <= maxLength) return value;
    let result = "";
    for (const char of value) {
      if (result.length + char.length > maxLength) break;
      result += char;
    }
    return result;
  }
  function escapeRegExp(value) {
    let result = "";
    for (const char of value) {
      if ("\\^$.*+?()[]{}|".includes(char)) result += "\\";
      result += char;
    }
    return result;
  }
  function cleanSegment(value, options) {
    let clean = value.replace(ILLEGAL_FILENAME_CHARS, options.replacementChar);
    if (options.replaceDots) clean = clean.replace(/\./g, options.replacementChar);
    clean = clean.trim().replace(/^\.+/, "").replace(/[.\s]+$/, "");
    if (!clean || clean === "." || clean === "..") clean = DEFAULT_FALLBACK;
    if (options.allowReserved && RESERVED_NAMES.test(clean)) clean = options.replacementChar + clean;
    clean = clean.replace(new RegExp(`${escapeRegExp(options.replacementChar)}{2,}`, "g"), options.replacementChar);
    clean = truncateUtf16(clean, options.maxLength);
    if (!clean) clean = truncateUtf16(DEFAULT_FALLBACK, options.maxLength);
    return clean;
  }
  function normalizeOptions(options) {
    return {
      replacementChar: getReplacementChar(options.replacementChar),
      maxLength: getMaxLength(options.maxLength)
    };
  }
  function normalizeFilename(name, options = {}) {
    const { replacementChar, maxLength } = normalizeOptions(options);
    const raw = typeof name === "string" ? name : "";
    const lastDotIndex = raw.lastIndexOf(".");
    const possibleExt = lastDotIndex > 0 && lastDotIndex < raw.length - 1 ? raw.slice(lastDotIndex + 1) : "";
    const hasExtension = /[^\s.]/.test(possibleExt);
    const rawBase = hasExtension ? raw.slice(0, lastDotIndex) : raw;
    const rawExt = hasExtension ? possibleExt : "";
    const cleanExt = rawExt ? cleanSegment(rawExt, { replacementChar, replaceDots: false, allowReserved: false, maxLength }) : "";
    const cleanBase = cleanSegment(rawBase, {
      replacementChar,
      replaceDots: false,
      allowReserved: true,
      maxLength: Math.max(1, maxLength - (cleanExt ? cleanExt.length + 1 : 0))
    });
    if (!cleanBase && !cleanExt) return DEFAULT_FALLBACK;
    if (!cleanExt) return cleanBase;
    if (!cleanBase) return "." + cleanExt;
    return `${cleanBase}.${cleanExt}`;
  }
  function normalizeBasename(name, options = {}) {
    const { replacementChar, maxLength } = normalizeOptions(options);
    const raw = typeof name === "string" ? name : "";
    return cleanSegment(raw, { replacementChar, replaceDots: true, allowReserved: true, maxLength });
  }
  function normalizePathSegment(name, options = {}) {
    const { replacementChar, maxLength } = normalizeOptions(options);
    const raw = typeof name === "string" ? name : "";
    return cleanSegment(raw, { replacementChar, replaceDots: false, allowReserved: true, maxLength });
  }
  function isProfilePagePath(pathname = location.pathname) {
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 2 && segments[0] === "user";
  }
  var ILLEGAL_FILENAME_CHARS, RESERVED_NAMES, DEFAULT_MAX_LENGTH, DEFAULT_FALLBACK;
  var init_string = __esm({
    "src/utils/string.ts"() {
      "use strict";
      ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f\x7f]/g;
      RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\..*)?$/i;
      DEFAULT_MAX_LENGTH = 255;
      DEFAULT_FALLBACK = "file";
      __name(getReplacementChar, "getReplacementChar");
      __name(getMaxLength, "getMaxLength");
      __name(truncateUtf16, "truncateUtf16");
      __name(escapeRegExp, "escapeRegExp");
      __name(cleanSegment, "cleanSegment");
      __name(normalizeOptions, "normalizeOptions");
      __name(normalizeFilename, "normalizeFilename");
      __name(normalizeBasename, "normalizeBasename");
      __name(normalizePathSegment, "normalizePathSegment");
      __name(isProfilePagePath, "isProfilePagePath");
    }
  });

  // src/core/download/DownloaderLauncher.ts
  function urlFilenameFallback(url) {
    try {
      const pathname = new URL(url).pathname.split("/").pop();
      return pathname ? decodeURIComponent(pathname) : "download";
    } catch {
      return "download";
    }
  }
  var _DownloaderLauncher, DownloaderLauncher;
  var init_DownloaderLauncher = __esm({
    "src/core/download/DownloaderLauncher.ts"() {
      "use strict";
      init_format();
      init_string();
      __name(urlFilenameFallback, "urlFilenameFallback");
      _DownloaderLauncher = class _DownloaderLauncher {
        constructor(config = {}) {
          this._idmSeq = 1;
          this.config = {
            idmList: config.idmList || [{ id: "1" }],
            aria2List: config.aria2List || [{ domain: "http://localhost", port: "6800", path: "/jsonrpc", token: "", dir: "" }],
            bitcometList: config.bitcometList || [{ domain: "http://localhost", port: "8080", path: "/panel/task_add_httpftp_result", authName: "", authPass: "", dir: "" }],
            abdmList: config.abdmList || [{ domain: "http://localhost", port: "15151", dir: "" }],
            curlTerminal: config.curlTerminal || "wc"
          };
        }
        // ==================== Dir Template ====================
        /**
         * 简化入口：解析下载目录模板
         */
        _resolveDirTemplate(input, context, fallback = "") {
          if (typeof input !== "string" || !input.trim()) return fallback;
          try {
            const resolved = runInContext(context, input);
            return typeof resolved === "string" && resolved.trim() ? resolved : fallback;
          } catch {
            return fallback;
          }
        }
        // ==================== invoke_download ====================
        /**
         * 简化入口：调用下载器下载
         */
        async invoke_download(url, dl_name = "abdm", dir_config, options = {}) {
          const input_filename = options.filename_input || urlFilenameFallback(url);
          const media = options.media;
          const filename = normalizeFilename(input_filename);
          const isVideo = filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".ts");
          const isImage = filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png") || filename.endsWith(".webp");
          const authorInfo = media?.authorInfo || {};
          const userId = authorInfo.uid || media?.authorUserId || authorInfo.secUid || "unknown";
          const nickname = authorInfo.nickname || "unknown";
          const safeUserDir = normalizePathSegment(`${userId}_${nickname}`);
          const filename_base = normalizeBasename(filename.replace(/\.[^/.]+$/, ""));
          const mediaType = options.mediaType || (isVideo ? "video" : isImage ? "image" : "other");
          const defaultDir = mediaType === "video" ? `./douyin/${safeUserDir}/videos` : mediaType === "image" ? `./douyin/${safeUserDir}/images` : `./douyin/${safeUserDir}/others`;
          const dirContext = {
            media,
            filename,
            filename_base,
            user_dir: safeUserDir,
            author_info: authorInfo,
            uid: userId,
            nickname,
            aweme_id: media?.awemeId || "",
            desc: media?.desc || ""
          };
          const resolvedDir = this._resolveDirTemplate(dir_config?.[mediaType], dirContext, defaultDir);
          switch (dl_name) {
            case "idm":
              return this.launchIDM(url, filename, 0, {}, null);
            case "aria2":
              return this.launchAria2(url, filename, {}, { dir: resolvedDir });
            case "bc":
              return this.launchBitComet(url, filename, {}, { dir: resolvedDir });
            case "abdm":
              return this.launchABDM(url, filename, {}, { dir: resolvedDir });
            default:
              throw new Error(`Unknown download name: ${dl_name}`);
          }
        }
        // ==================== Config helpers ====================
        /**
         * 获取默认配置项
         */
        getDefaultConfig(type) {
          const listMap = {
            idm: this.config.idmList,
            aria2: this.config.aria2List,
            bitcomet: this.config.bitcometList,
            abdm: this.config.abdmList
          };
          const list = listMap[type];
          if (!list) throw new Error(`Unknown type: ${type}`);
          return list.find((item) => item.default) || list[0];
        }
        // ==================== Static utilities ====================
        /**
         * 标准化请求头：转换为对象，添加常用默认头
         */
        static normalizeHeaders(headers = {}, addDefault = false) {
          if (typeof headers === "string") {
            const raw = {};
            headers.split(/[\r\n]+/).forEach((line) => {
              if (!line.trim() || !line.includes(":")) return;
              const [key, ...parts] = line.split(":");
              raw[key.trim().toLowerCase()] = parts.join(":").trim();
            });
            headers = raw;
          }
          const newHeaders = {};
          for (const key in headers) {
            let value = headers[key];
            if (typeof value === "object") value = JSON.stringify(value);
            else value = String(value);
            const normalizedKey = key.toLowerCase().split("-").map((w3) => w3.charAt(0).toUpperCase() + w3.slice(1)).join("-");
            newHeaders[normalizedKey] = value;
          }
          if (addDefault) return newHeaders;
          return {
            Dnt: "",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
            Cookie: document.cookie,
            "User-Agent": navigator.userAgent,
            Origin: location.origin,
            Referer: `${location.origin}/`,
            ...newHeaders
          };
        }
        /**
         * 可跨域 xmlhttpRequest 请求
         * 封装 GreaseMonkey-Compatible xmlhttpRequest 实现的跨域请求，支持回调和 await 两种用法
         */
        static xmlHttpRequest(option) {
          const xhr = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : typeof GM?.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null;
          if (!xhr || typeof xhr !== "function") throw new Error("GreaseMonkey 兼容 XMLHttpRequest 不可用。");
          return xhr({ withCredentials: true, ...option });
        }
        /**
         * 发送HTTP请求，使用 gm-xmlhttpRequest 发起跨域请求
         */
        static request_cors(url, options = {}) {
          return new Promise((resolve, reject) => {
            const { method = "GET", headers = {}, body, timeout = 3e4, responseType } = options;
            _DownloaderLauncher.xmlHttpRequest({
              method,
              url,
              headers,
              data: body,
              timeout,
              responseType,
              onload: /* @__PURE__ */ __name((res) => {
                let data = res.response;
                if (!responseType) {
                  const ct = res.responseHeaders || "";
                  if (ct.includes("application/json")) {
                    try {
                      data = JSON.parse(res.responseText);
                    } catch {
                      data = res.responseText;
                    }
                  } else data = res.responseText;
                }
                resolve({ status: res.status, data, headers: res.responseHeaders });
              }, "onload"),
              onerror: /* @__PURE__ */ __name((err) => reject(err), "onerror"),
              ontimeout: /* @__PURE__ */ __name(() => reject(new Error("Request timeout")), "ontimeout")
            });
          });
        }
        /**
         * 发送HTTP请求，默认用这个请求，不需要权限
         */
        static async request(url, options = {}) {
          const response = await fetch(url, options);
          let data;
          const ct = response.headers.get("content-type");
          if (ct && ct.includes("application/json")) data = await response.json();
          else data = await response.text();
          return { status: response.status, data };
        }
        /**
         * 格式化文件大小（用于调试）
         */
        static formatSize(bytes) {
          if (bytes === 0) return "0 B";
          const k3 = 1024;
          const sizes = ["B", "KB", "MB", "GB", "TB"];
          const i3 = Math.floor(Math.log(bytes) / Math.log(k3));
          return parseFloat((bytes / Math.pow(k3, i3)).toFixed(2)) + " " + sizes[i3];
        }
        static commandSafeFilename(filename) {
          return normalizeFilename(filename).replace(/[!&|`"'$%]/g, "_");
        }
        /**
         * 生成cURL命令
         */
        static toCurlCommand(link, filename, headers = {}, terminal = "wc") {
          const curlCmd = terminal !== "wp" ? "curl" : "curl.exe";
          const headerArgs = Object.entries(headers).map(([k3, v3]) => `-H "${k3}: ${v3}"`).join(" ");
          const safeFilename = _DownloaderLauncher.commandSafeFilename(filename);
          return `${curlCmd} -L -C - "${link}" -o "${safeFilename}" ${headerArgs}`.trim();
        }
        /**
         * 生成BC链接（比特彗星专用）
         */
        static toBitCometLink(link, filename, headers = {}) {
          const safeFilename = _DownloaderLauncher.commandSafeFilename(filename);
          const query = new URLSearchParams();
          query.append("url", link);
          for (const [k3, v3] of Object.entries(headers)) query.append(k3, v3);
          const bcData = `AA/${encodeURIComponent(safeFilename)}/?${query.toString()}ZZ`;
          const base64Data = btoa(unescape(encodeURIComponent(bcData)));
          return `bc://http/${base64Data}`;
        }
        // ==================== Launchers ====================
        /**
         * 发送到 IDM
         */
        async launchIDM(link, filename, filesize, headers = {}, idmConfig = null) {
          filename = normalizeFilename(filename);
          const config = { ...this.getDefaultConfig("idm"), ...idmConfig };
          const clientId = config.id || "1";
          if (!clientId) throw new Error("IDM client id missing");
          const seq = ++this._idmSeq;
          const time = Date.now();
          const url = `http://127.0.0.1:1001/client/${clientId}?seq=${seq}`;
          const ext = filename.split(".").pop()?.toUpperCase() || "";
          const normHeaders = _DownloaderLauncher.normalizeHeaders(headers);
          const headersText = Object.entries(normHeaders).map(([k3, v3]) => `${k3}: ${v3}`).join("\n") + "\n";
          const fmt2 = /* @__PURE__ */ __name((key, val) => {
            const s5 = String(val ?? "");
            return `${key}=${new Blob([s5]).size}:${s5}`;
          }, "fmt");
          const fields = [fmt2(4, ext), fmt2(6, link), fmt2(7, location.origin), fmt2(11, headersText), fmt2(100, filename), fmt2(122, 4)];
          const data = `MSG#${seq}#13#1#10241:${seq + 1e3}:0:${time}:0:1:2:${filesize}:0,${fields.join(",")};`;
          try {
            const res = await _DownloaderLauncher.request(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: data });
            return res.data === `${seq}:3;`;
          } catch (e3) {
            console.error("IDM launch failed", e3);
            return false;
          }
        }
        /**
         * 发送到 Aria2
         */
        async launchAria2(link, filename, headers = {}, aria2Config = null) {
          filename = normalizeFilename(filename);
          const config = { ...this.getDefaultConfig("aria2"), ...aria2Config };
          const url = `${config.domain}:${config.port}${config.path}`;
          const headerList = Object.entries(_DownloaderLauncher.normalizeHeaders(headers)).map(([k3, v3]) => `${k3}: ${v3}`);
          const params = [`token:${config.token}`, [link], { dir: config.dir || void 0, out: filename, header: headerList }];
          const rpcData = { id: Date.now(), jsonrpc: "2.0", method: "aria2.addUri", params };
          try {
            const res = await _DownloaderLauncher.request_cors(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rpcData) });
            return !!res.data?.result;
          } catch (e3) {
            console.error("Aria2 launch failed", e3);
            return false;
          }
        }
        /**
         * 发送到比特彗星 (BitComet)
         */
        async launchBitComet(link, filename, headers = {}, bitcometConfig = null) {
          filename = normalizeFilename(filename);
          const config = { ...this.getDefaultConfig("bitcomet"), ...bitcometConfig };
          const url = `${config.domain}:${config.port}${config.path}`;
          const formData = new URLSearchParams();
          formData.append("url", link);
          if (config.dir) formData.append("save_path", config.dir);
          formData.append("file_name", filename);
          formData.append("connection", "200");
          const normHeaders = _DownloaderLauncher.normalizeHeaders(headers);
          for (const [k3, v3] of Object.entries(normHeaders)) formData.append(k3, v3);
          const auth = btoa(`${config.authName}:${config.authPass}`);
          try {
            const res = await _DownloaderLauncher.request(url, {
              method: "POST",
              headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: formData
            });
            return !res.data.includes("Add task failed!");
          } catch (e3) {
            console.warn("BitComet launch may have succeeded despite error", e3);
            return true;
          }
        }
        /**
         * 发送到 AB Download Manager
         */
        async launchABDM(link, filename, headers = {}, abdmConfig = null) {
          filename = normalizeFilename(filename);
          const config = { ...this.getDefaultConfig("abdm"), ...abdmConfig };
          const url = `${config.domain}:${config.port}/start-headless-download`;
          const normHeaders = _DownloaderLauncher.normalizeHeaders(headers);
          const payload = { downloadSource: { link, headers: normHeaders, downloadPage: normHeaders["Referer"] || location.href }, name: filename };
          if (config.dir) payload.folder = config.dir;
          try {
            const res = await _DownloaderLauncher.request_cors(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(payload) });
            return res.data === "OK";
          } catch (e3) {
            console.error("ABDM launch failed", e3);
            return false;
          }
        }
        // ==================== 以下是同步命令生成方法（不实际唤醒）====================
        getCurlCommand(link, filename, headers = {}) {
          return _DownloaderLauncher.toCurlCommand(link, filename, headers, this.config.curlTerminal);
        }
        getBitCometLink(link, filename, headers = {}) {
          return _DownloaderLauncher.toBitCometLink(link, filename, headers);
        }
        getAria2Command(link, filename, headers = {}) {
          const headerArgs = Object.entries(headers).map(([k3, v3]) => `--header "${k3}: ${v3}"`).join(" ");
          const safeFilename = _DownloaderLauncher.commandSafeFilename(filename);
          return `aria2c "${link}" --out "${safeFilename}" ${headerArgs}`.trim();
        }
      };
      __name(_DownloaderLauncher, "DownloaderLauncher");
      DownloaderLauncher = _DownloaderLauncher;
    }
  });

  // src/utils/storage.ts
  function trySetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  var init_storage = __esm({
    "src/utils/storage.ts"() {
      "use strict";
      __name(trySetLocalStorage, "trySetLocalStorage");
    }
  });

  // src/core/download/DownloadHistory.ts
  var _DownloadHistory, DownloadHistory;
  var init_DownloadHistory = __esm({
    "src/core/download/DownloadHistory.ts"() {
      "use strict";
      init_storage();
      _DownloadHistory = class _DownloadHistory {
        // 最多保存50条记录
        static get() {
          try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
          } catch {
            return [];
          }
        }
        static add(media, downloadTime = Date.now()) {
          const history = this.get();
          const record = {
            id: media.awemeId || `hist_${Date.now()}_${Math.random()}`,
            desc: media.desc || "(无描述)",
            shareUrl: media.shareInfo?.shareUrl || "",
            downloadTime,
            media: {
              // 只保存必要字段，避免存储过大
              awemeId: media.awemeId,
              desc: media.desc,
              shareUrl: media.shareInfo?.shareUrl,
              authorNickname: media.authorInfo?.nickname
              // 可额外保存封面等，但注意localStorage容量限制
            }
          };
          history.unshift(record);
          if (history.length > this.MAX_ITEMS) history.pop();
          trySetLocalStorage(this.STORAGE_KEY, JSON.stringify(history));
          return record;
        }
        static clear() {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      };
      __name(_DownloadHistory, "DownloadHistory");
      _DownloadHistory.STORAGE_KEY = "__douyin-dl-history__";
      _DownloadHistory.MAX_ITEMS = 50;
      DownloadHistory = _DownloadHistory;
    }
  });

  // src/handlers/douyin/getBestCoverUrl.ts
  function isRootCoverContainer(obj) {
    if (!obj || typeof obj !== "object") return false;
    const candidate = obj;
    return !!(typeof candidate.cover === "string" || Array.isArray(candidate.coverUrlList) || Array.isArray(candidate.originCoverUrlList) || typeof candidate.dynamicCover === "string" || typeof candidate.rawCover === "string");
  }
  function extractFromContainer(container) {
    if (!container) return null;
    if (container.dynamicCover && container.dynamicCover.includes("_large")) {
      return container.dynamicCover;
    }
    if (container.rawCover) {
      return container.rawCover;
    }
    const candidates = [...container.originCoverUrlList || [], ...container.coverUrlList || []];
    const cleanCandidates = candidates.filter(
      (url) => typeof url === "string" && !url.includes("cropcenter") && !url.includes("sh=") && !url.includes("360p") && !url.includes("720p")
    );
    if (cleanCandidates.length > 0) {
      return cleanCandidates[0];
    }
    return container.originCover || container.cover || null;
  }
  function getBestCoverUrl(media) {
    if (media.video) {
      const fromVideo = extractFromContainer(media.video);
      if (fromVideo) return fromVideo;
    }
    if (isRootCoverContainer(media)) {
      const fromRoot = extractFromContainer(media);
      if (fromRoot) return fromRoot;
    }
    return null;
  }
  var init_getBestCoverUrl = __esm({
    "src/handlers/douyin/getBestCoverUrl.ts"() {
      "use strict";
      __name(isRootCoverContainer, "isRootCoverContainer");
      __name(extractFromContainer, "extractFromContainer");
      __name(getBestCoverUrl, "getBestCoverUrl");
    }
  });

  // node_modules/.pnpm/preact@10.28.2/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  function u3(e3, t3, n2, o3, i3, u4) {
    t3 || (t3 = {});
    var a3, c4, p3 = t3;
    if ("ref" in p3) for (c4 in p3 = {}, t3) "ref" == c4 ? a3 = t3[c4] : p3[c4] = t3[c4];
    var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
    if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c4 in a3) void 0 === p3[c4] && (p3[c4] = a3[c4]);
    return l.vnode && l.vnode(l3), l3;
  }
  var f3;
  var init_jsxRuntime_module = __esm({
    "node_modules/.pnpm/preact@10.28.2/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js"() {
      init_preact_module();
      init_preact_module();
      f3 = 0;
      __name(u3, "u");
    }
  });

  // src/utils/css-in-js.ts
  function createCSS() {
    const style = document.createElement("style");
    document.head.appendChild(style);
    const sheet = style.sheet;
    const cache = /* @__PURE__ */ new Map();
    const kebab = /* @__PURE__ */ __name((s5) => s5.replace(/[A-Z]/g, (m3) => "-" + m3.toLowerCase()), "kebab");
    const hash = /* @__PURE__ */ __name((s5) => {
      let h3 = 0, i3 = s5.length;
      while (i3) h3 = h3 * 31 + s5.charCodeAt(--i3) | 0;
      return "c" + (h3 >>> 0).toString(36);
    }, "hash");
    const merge = /* @__PURE__ */ __name((input) => Array.isArray(input) ? input.filter(Boolean).reduce((a3, b) => {
      return Object.assign(a3, merge(b));
    }, {}) : input || {}, "merge");
    function build(selector, obj) {
      let body = "";
      for (const k3 in obj) {
        const v3 = obj[k3];
        if (v3 == null || v3 === false) continue;
        if (typeof v3 === "object") {
          const sel = k3.includes("&") ? k3.replace(/&/g, selector) : `${selector} ${k3}`;
          build(sel, v3);
        } else {
          body += `${kebab(k3)}:${v3};`;
        }
      }
      if (body) {
        sheet.insertRule(`${selector}{${body}}`, sheet.cssRules.length);
      }
    }
    __name(build, "build");
    return /* @__PURE__ */ __name(function css4(input) {
      const obj = merge(input);
      const key = JSON.stringify(obj);
      if (cache.has(key)) return cache.get(key);
      const className = hash(key);
      build(`.${className}`, obj);
      cache.set(key, className);
      return className;
    }, "css");
  }
  var init_css_in_js = __esm({
    "src/utils/css-in-js.ts"() {
      "use strict";
      __name(createCSS, "createCSS");
    }
  });

  // src/utils/theme.ts
  var theme;
  var init_theme = __esm({
    "src/utils/theme.ts"() {
      "use strict";
      theme = {
        colors: {
          primary: "#fe2c55",
          primaryLight: "#ff8a80",
          bgOverlay: "rgba(18, 18, 20, 0.94)",
          bgNav: "rgba(0,0,0,0.2)",
          bgFieldset: "rgba(0,0,0,0.2)",
          borderLight: "rgba(255,255,255,0.1)",
          borderMedium: "rgba(255,255,255,0.15)",
          borderInput: "rgba(255,255,255,0.2)",
          textPrimary: "#fff",
          textSecondary: "rgba(255,255,255,0.8)",
          textMuted: "rgba(255,255,255,0.6)",
          textDim: "#999"
        },
        spacing: {
          xs: "4px",
          sm: "8px",
          md: "12px",
          lg: "16px",
          xl: "20px"
        },
        borderRadius: {
          sm: "8px",
          md: "12px",
          lg: "16px",
          full: "20px"
        },
        fontSize: {
          xs: "12px",
          sm: "13px"
        },
        backdropBlur: "blur(10px)"
      };
    }
  });

  // src/ui/modals/MediaDetailModal.tsx
  var MediaDetailModal_exports = {};
  __export(MediaDetailModal_exports, {
    MediaDetailModalApp: () => MediaDetailModalApp
  });
  var css, styles, navBtnClass, fmt, msToAssTime, KeyValue, Copyable, Table, launchers, LaunchButtons, VideoSection, ImageSection, MusicSection, MediaTab, AuthorTab, PostTab, JsonTab, DanmakuTab, tabs, MediaDetailModalApp;
  var init_MediaDetailModal = __esm({
    "src/ui/modals/MediaDetailModal.tsx"() {
      "use strict";
      init_hooks_module();
      init_css_in_js();
      init_theme();
      init_DownloaderLauncher();
      init_getBestCoverUrl();
      init_string();
      init_jsxRuntime_module();
      css = createCSS();
      styles = {
        container: css({
          display: "flex",
          flexDirection: "column",
          height: "80vh",
          overflow: "hidden",
          background: theme.colors.bgOverlay,
          backdropFilter: theme.backdropBlur,
          borderRadius: theme.borderRadius.lg,
          color: theme.colors.textPrimary
        }),
        nav: css({ display: "flex", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.bgNav, flexShrink: 0 }),
        navBtnBase: css({
          padding: theme.spacing.md + " " + theme.spacing.xl,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          borderBottom: "2px solid transparent",
          fontWeight: "normal",
          color: theme.colors.textSecondary,
          transition: "0.2s"
        }),
        navBtnActive: css({ background: "rgba(255,255,255,0.08)", borderBottomColor: theme.colors.primary, fontWeight: "bold", color: theme.colors.primary }),
        content: css({ flexGrow: 1, overflowY: "auto", padding: theme.spacing.xl }),
        fieldset: css({
          border: "1px solid " + theme.colors.borderMedium,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.lg,
          background: theme.colors.bgFieldset
        }),
        legend: css({
          fontWeight: "bold",
          padding: "0 " + theme.spacing.sm,
          color: "rgba(255,255,255,0.9)",
          background: "rgba(18,18,20,0.8)",
          borderRadius: theme.borderRadius.full,
          fontSize: theme.fontSize.sm
        }),
        row: css({ display: "flex", padding: theme.spacing.sm + " 0", fontSize: theme.fontSize.sm, borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }),
        label: css({ width: "100px", flexShrink: 0, color: theme.colors.textMuted, fontWeight: 600 }),
        value: css({ flexGrow: 1, color: theme.colors.textSecondary, wordBreak: "break-all" }),
        btn: css({
          padding: theme.spacing.xs + " " + theme.spacing.md,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.full,
          marginLeft: theme.spacing.sm,
          transition: "0.2s"
        }),
        img: css({ maxWidth: "100px", maxHeight: "80px", objectFit: "cover", borderRadius: theme.borderRadius.sm, border: "1px solid " + theme.colors.borderInput }),
        table: css({ width: "100%", fontSize: theme.fontSize.xs, borderCollapse: "collapse", background: "rgba(0,0,0,0.2)", borderRadius: theme.borderRadius.sm, overflow: "hidden" }),
        th: css({ border: "1px solid " + theme.colors.borderLight, padding: theme.spacing.sm, background: "rgba(0,0,0,0.4)", textAlign: "left", color: "rgba(255,255,255,0.9)" }),
        td: css({ border: "1px solid " + theme.colors.borderLight, padding: theme.spacing.sm, color: theme.colors.textSecondary }),
        flexRow: css({ display: "flex", gap: "15px", alignItems: "center" }),
        flexWrap: css({ display: "flex", gap: "6px", flexWrap: "wrap" }),
        imgCover: css({ width: "120px", borderRadius: "4px" }),
        authorHeader: css({ display: "flex", gap: "15px", marginBottom: "20px", alignItems: "center" }),
        jsonPre: css({
          background: "rgba(0,0,0,0.3)",
          padding: "10px",
          overflow: "auto",
          maxHeight: "100%",
          fontSize: "12px",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
          border: "1px solid " + theme.colors.borderInput,
          borderRadius: theme.borderRadius.sm,
          cursor: "text",
          color: "#ddd"
        }),
        danmakuContainer: css({ display: "flex", flexDirection: "column", gap: theme.spacing.md }),
        danmakuHeader: css({ display: "flex", justifyContent: "space-between", alignItems: "center" }),
        danmakuTitle: css({ margin: 0 }),
        danmakuButtonGroup: css({ display: "flex", gap: theme.spacing.sm }),
        danmakuEmpty: css({ textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }),
        danmakuTableWrapper: css({ maxHeight: "500px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px" })
      };
      navBtnClass = /* @__PURE__ */ __name((active) => active ? styles.navBtnBase + " " + styles.navBtnActive : styles.navBtnBase, "navBtnClass");
      fmt = {
        ts: /* @__PURE__ */ __name((ts) => ts ? new Date(ts * 1e3).toLocaleString() : "N/A", "ts"),
        num: /* @__PURE__ */ __name((n2) => n2 ? n2 > 1e4 ? (n2 / 1e4).toFixed(1) + " 万" : n2 : 0, "num"),
        size: /* @__PURE__ */ __name((s5) => s5 ? (s5 / 1024 / 1024).toFixed(2) + " MB" : "-", "size")
      };
      msToAssTime = /* @__PURE__ */ __name((ms) => {
        const h3 = Math.floor(ms / 36e5);
        const m3 = Math.floor(ms % 36e5 / 6e4);
        const s5 = Math.floor(ms % 6e4 / 1e3);
        const cs = Math.floor(ms % 1e3 / 10);
        return h3.toString().padStart(2, "0") + ":" + m3.toString().padStart(2, "0") + ":" + s5.toString().padStart(2, "0") + "." + cs.toString().padStart(2, "0");
      }, "msToAssTime");
      KeyValue = /* @__PURE__ */ __name(({ label, children }) => /* @__PURE__ */ u3("div", { className: styles.row, children: [
        /* @__PURE__ */ u3("strong", { className: styles.label, children: label }),
        /* @__PURE__ */ u3("span", { className: styles.value, children: children ?? "-" })
      ] }), "KeyValue");
      Copyable = /* @__PURE__ */ __name(({ label, value }) => {
        const [c4, sc] = d2(false);
        const h3 = /* @__PURE__ */ __name(() => {
          navigator.clipboard.writeText(value || "").then(() => {
            sc(true);
            setTimeout(() => sc(false), 2e3);
          });
        }, "h");
        if (!value) return /* @__PURE__ */ u3(KeyValue, { label });
        return /* @__PURE__ */ u3("div", { className: styles.row, children: [
          /* @__PURE__ */ u3("strong", { className: styles.label, children: label }),
          /* @__PURE__ */ u3("span", { className: styles.value, children: value }),
          /* @__PURE__ */ u3("button", { className: styles.btn, onClick: h3, children: c4 ? "已复制" : "复制" })
        ] });
      }, "Copyable");
      Table = /* @__PURE__ */ __name(({ headers, rows }) => /* @__PURE__ */ u3("table", { className: styles.table, children: [
        /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: headers.map((h3, i3) => /* @__PURE__ */ u3("th", { className: styles.th, children: h3 }, i3)) }) }),
        /* @__PURE__ */ u3("tbody", { children: rows.map((row, i3) => /* @__PURE__ */ u3("tr", { children: row.map((cell, j3) => /* @__PURE__ */ u3("td", { className: styles.td, children: cell }, j3)) }, i3)) })
      ] }), "Table");
      launchers = [
        { key: "browser", label: "打开", buildUrl: /* @__PURE__ */ __name((u4) => u4, "buildUrl") },
        {
          key: "copy",
          label: "复制",
          buildUrl: /* @__PURE__ */ __name(() => null, "buildUrl"),
          action: /* @__PURE__ */ __name((u4) => {
            navigator.clipboard.writeText(u4);
            alert("复制成功");
          }, "action")
        },
        { key: "potplayer", label: "PotPlayer", buildUrl: /* @__PURE__ */ __name((u4) => "potplayer://" + u4, "buildUrl") },
        {
          key: "abdm",
          label: "abdm",
          buildUrl: /* @__PURE__ */ __name(() => null, "buildUrl"),
          action: /* @__PURE__ */ __name(async (u4) => {
            const l3 = new DownloaderLauncher();
            await l3.invoke_download(u4, "abdm");
          }, "action")
        },
        {
          key: "aria2",
          label: "aria2",
          buildUrl: /* @__PURE__ */ __name(() => null, "buildUrl"),
          action: /* @__PURE__ */ __name(async (u4) => {
            const l3 = new DownloaderLauncher();
            await l3.invoke_download(u4, "aria2");
          }, "action")
        }
      ];
      LaunchButtons = /* @__PURE__ */ __name(({ url }) => /* @__PURE__ */ u3("div", { className: styles.flexWrap, children: launchers.map((l3) => {
        const h3 = l3.buildUrl?.(url);
        if (l3.action)
          return /* @__PURE__ */ u3("button", { className: styles.btn, onClick: () => l3.action(url), children: l3.label }, l3.key);
        if (h3)
          return /* @__PURE__ */ u3("a", { href: h3, target: "_blank", children: /* @__PURE__ */ u3("button", { className: styles.btn, children: l3.label }) }, l3.key);
        return null;
      }) }), "LaunchButtons");
      VideoSection = /* @__PURE__ */ __name(({ video, media, filenameBase }) => {
        if (!video?.bitRateList?.length) return null;
        const cu = getBestCoverUrl(media) || "#";
        return /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: styles.legend, children: "视频封面" }),
            /* @__PURE__ */ u3("div", { className: styles.flexRow, children: [
              /* @__PURE__ */ u3("img", { src: cu, className: styles.imgCover }),
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3("p", { children: [
                  /* @__PURE__ */ u3("strong", { children: "分辨率:" }),
                  " ",
                  video.width,
                  "x",
                  video.height
                ] }),
                /* @__PURE__ */ u3("div", { style: { marginTop: 10 }, children: [
                  /* @__PURE__ */ u3("a", { href: cu, target: "_blank", className: styles.btn, children: "新标签打开" }),
                  /* @__PURE__ */ u3("a", { href: cu, download: normalizeFilename("cover_" + filenameBase + ".jpeg"), className: styles.btn, children: "下载封面" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: styles.legend, children: "视频源" }),
            /* @__PURE__ */ u3(
              Table,
              {
                headers: ["清晰度", "分辨率", "编码", "FPS", "码率", "大小", "操作"],
                rows: video.bitRateList.map((v3) => [
                  v3.gearName,
                  v3.width + "x" + v3.height,
                  (v3.isH265 ? "H.265" : "H.264") + (v3.format === "dash" ? " dash" : ""),
                  v3.fps,
                  (v3.bitRate / 1e3).toFixed(0),
                  fmt.size(v3.dataSize),
                  v3.playApi ? /* @__PURE__ */ u3(LaunchButtons, { url: v3.playApi }) : "-"
                ])
              }
            )
          ] })
        ] });
      }, "VideoSection");
      ImageSection = /* @__PURE__ */ __name(({ images }) => {
        if (!images?.length) return null;
        return /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: [
            "图集 (",
            images.length,
            "P)"
          ] }),
          /* @__PURE__ */ u3(
            Table,
            {
              headers: ["#", "类型", "预览", "分辨率", "大小", "下载"],
              rows: images.map((img, i3) => {
                const iv = !!img.video;
                const th = iv ? img.video.originCoverUrlList?.[0] : img.urlList?.[0];
                const dl = iv ? img.video.playAddr?.[0]?.src : img.urlList?.[0];
                return [
                  i3 + 1,
                  iv ? "视频" : "图片",
                  /* @__PURE__ */ u3("img", { src: th, className: styles.img, loading: "lazy" }),
                  iv ? img.video.width + "x" + img.video.height : img.width + "x" + img.height,
                  iv ? fmt.size(img.video.dataSize) : "-",
                  dl ? /* @__PURE__ */ u3("a", { href: dl, target: "_blank", children: "链接" }) : "-"
                ];
              })
            }
          )
        ] });
      }, "ImageSection");
      MusicSection = /* @__PURE__ */ __name(({ music }) => {
        if (!music) return null;
        const du = music.playUrl?.urlList?.[0] || "";
        return /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: "背景音乐" }),
          /* @__PURE__ */ u3("div", { className: styles.flexRow, children: [
            /* @__PURE__ */ u3("img", { src: music.coverThumb?.urlList?.[0], style: { width: 60, height: 60, borderRadius: 4 }, loading: "lazy" }),
            /* @__PURE__ */ u3("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ u3(KeyValue, { label: "标题", children: music.title }),
              /* @__PURE__ */ u3(KeyValue, { label: "作者", children: music.author }),
              /* @__PURE__ */ u3(KeyValue, { label: "时长", children: [
                music.duration,
                "秒"
              ] }),
              du && /* @__PURE__ */ u3("a", { href: du, target: "_blank", className: styles.btn, children: "下载" }),
              du && /* @__PURE__ */ u3("audio", { controls: true, preload: "metadata", style: { width: "100%" }, children: /* @__PURE__ */ u3("source", { src: du }) })
            ] })
          ] })
        ] });
      }, "MusicSection");
      MediaTab = /* @__PURE__ */ __name(({ media, filenameBase }) => {
        if (!media) return /* @__PURE__ */ u3("div", { children: "无媒体信息" });
        return /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3(VideoSection, { media, video: media.video, filenameBase }),
          /* @__PURE__ */ u3(ImageSection, { images: media.images }),
          /* @__PURE__ */ u3(MusicSection, { music: media.music })
        ] });
      }, "MediaTab");
      AuthorTab = /* @__PURE__ */ __name(({ author }) => {
        if (!author) return /* @__PURE__ */ u3("div", { children: "无作者信息" });
        return /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("div", { className: styles.authorHeader, children: [
            /* @__PURE__ */ u3("img", { src: author.avatarThumb?.urlList?.[0], style: { width: 80, height: 80, borderRadius: "50%" } }),
            /* @__PURE__ */ u3("div", { children: [
              /* @__PURE__ */ u3("h3", { children: author.nickname }),
              /* @__PURE__ */ u3("a", { href: "https://www.douyin.com/user/" + author.secUid, target: "_blank", className: styles.btn, children: "访问主页" })
            ] })
          ] }),
          /* @__PURE__ */ u3(KeyValue, { label: "认证", children: author.customVerify || author.enterpriseVerifyReason }),
          /* @__PURE__ */ u3(Copyable, { label: "UID", value: author.uid }),
          /* @__PURE__ */ u3(Copyable, { label: "SecUID", value: author.secUid }),
          /* @__PURE__ */ u3(KeyValue, { label: "粉丝数", children: fmt.num(author.followerCount) }),
          /* @__PURE__ */ u3(KeyValue, { label: "获赞数", children: fmt.num(author.totalFavorited) })
        ] });
      }, "AuthorTab");
      PostTab = /* @__PURE__ */ __name(({ media }) => /* @__PURE__ */ u3(k, { children: [
        /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: "描述" }),
          /* @__PURE__ */ u3("div", { style: { whiteSpace: "pre-wrap", lineHeight: 1.5 }, children: media.desc || "无描述" })
        ] }),
        /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: "数据统计" }),
          /* @__PURE__ */ u3(KeyValue, { label: "发布时间", children: fmt.ts(media.createTime) }),
          /* @__PURE__ */ u3(Copyable, { label: "分享链接", value: media.shareInfo?.shareUrl }),
          /* @__PURE__ */ u3(KeyValue, { label: "点赞", children: fmt.num(media.stats?.diggCount) }),
          /* @__PURE__ */ u3(KeyValue, { label: "评论", children: fmt.num(media.stats?.commentCount) }),
          /* @__PURE__ */ u3(KeyValue, { label: "收藏", children: fmt.num(media.stats?.collectCount) }),
          /* @__PURE__ */ u3(KeyValue, { label: "分享", children: fmt.num(media.stats?.shareCount) })
        ] }),
        /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: "ID信息" }),
          /* @__PURE__ */ u3(Copyable, { label: "Aweme ID", value: media.awemeId }),
          /* @__PURE__ */ u3(Copyable, { label: "Group ID", value: media.groupId })
        ] }),
        /* @__PURE__ */ u3("fieldset", { className: styles.fieldset, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: "权限/状态" }),
          /* @__PURE__ */ u3(KeyValue, { label: "允许评论", children: media.awemeControl?.canComment ? "是" : "否" }),
          /* @__PURE__ */ u3(KeyValue, { label: "允许分享", children: media.awemeControl?.canShare ? "是" : "否" }),
          /* @__PURE__ */ u3(KeyValue, { label: "允许下载", children: media.download?.allowDownload ? "是" : "否" }),
          /* @__PURE__ */ u3(KeyValue, { label: "私密视频", children: media.isPrivate ? "是" : "否" })
        ] })
      ] }), "PostTab");
      JsonTab = /* @__PURE__ */ __name(({ data }) => {
        const ref = A2(null);
        const sel = /* @__PURE__ */ __name(() => {
          const r3 = document.createRange();
          r3.selectNodeContents(ref.current);
          const s5 = window.getSelection();
          s5.removeAllRanges();
          s5.addRange(r3);
        }, "sel");
        return /* @__PURE__ */ u3("fieldset", { style: { overflow: "hidden", border: "1px solid #ddd", borderRadius: "4px", padding: 10, maxHeight: "100%" }, children: [
          /* @__PURE__ */ u3("legend", { className: styles.legend, children: [
            "原始数据",
            /* @__PURE__ */ u3("button", { onClick: sel, className: styles.btn, children: "全选" }),
            /* @__PURE__ */ u3("button", { onClick: () => console.log(data), className: styles.btn, children: "Console Log" })
          ] }),
          /* @__PURE__ */ u3("pre", { className: styles.jsonPre, children: /* @__PURE__ */ u3("code", { ref, children: JSON.stringify(data, null, 2) }) })
        ] });
      }, "JsonTab");
      DanmakuTab = /* @__PURE__ */ __name(() => {
        const [list, setList] = d2([]);
        const [loading, setLoading] = d2(false);
        const fetchDm = /* @__PURE__ */ __name(() => {
          try {
            setLoading(true);
            const p3 = window.player;
            if (!p3?.danmaku?.main) {
              setList([]);
              return;
            }
            const raw = p3.danmaku.main.data || [];
            const f4 = raw.map((item, i3) => ({ index: i3 + 1, startTimeStr: msToAssTime(item.start), text: item.text || "", uid: item.user_id || 0, score: item.score || 0 }));
            setList(f4);
          } catch (e3) {
            console.error(e3);
            setList([]);
          } finally {
            setLoading(false);
          }
        }, "fetchDm");
        y2(() => {
          fetchDm();
        }, []);
        const copyAll = /* @__PURE__ */ __name(() => {
          navigator.clipboard.writeText(list.map((i3) => i3.text).join("\n"));
          alert("已复制" + list.length + "条");
        }, "copyAll");
        return /* @__PURE__ */ u3("div", { className: styles.danmakuContainer, children: [
          /* @__PURE__ */ u3("div", { className: styles.danmakuHeader, children: [
            /* @__PURE__ */ u3("h4", { className: styles.danmakuTitle, children: [
              "弹幕列表(",
              list.length,
              "条)"
            ] }),
            /* @__PURE__ */ u3("div", { className: styles.danmakuButtonGroup, children: [
              /* @__PURE__ */ u3("button", { className: styles.btn, onClick: fetchDm, disabled: loading, children: "刷新" }),
              /* @__PURE__ */ u3("button", { className: styles.btn, onClick: copyAll, disabled: list.length === 0, children: "复制全部" })
            ] })
          ] }),
          loading && /* @__PURE__ */ u3("div", { className: styles.danmakuEmpty, children: "加载中..." }),
          !loading && list.length === 0 && /* @__PURE__ */ u3("div", { className: styles.danmakuEmpty, children: "暂无弹幕" }),
          !loading && list.length > 0 && /* @__PURE__ */ u3("div", { className: styles.danmakuTableWrapper, children: /* @__PURE__ */ u3("table", { className: styles.table, children: [
            /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("th", { className: styles.th, children: "#" }),
              /* @__PURE__ */ u3("th", { className: styles.th, children: "时间" }),
              /* @__PURE__ */ u3("th", { className: styles.th, children: "UID" }),
              /* @__PURE__ */ u3("th", { className: styles.th, children: "内容" }),
              /* @__PURE__ */ u3("th", { className: styles.th, children: "评分" }),
              /* @__PURE__ */ u3("th", { className: styles.th, children: "操作" })
            ] }) }),
            /* @__PURE__ */ u3("tbody", { children: list.map((item) => /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("td", { className: styles.td, children: item.index }),
              /* @__PURE__ */ u3("td", { className: styles.td, children: item.startTimeStr }),
              /* @__PURE__ */ u3("td", { className: styles.td, children: item.uid }),
              /* @__PURE__ */ u3("td", { className: styles.td, children: item.text }),
              /* @__PURE__ */ u3("td", { className: styles.td, children: item.score.toFixed(2) }),
              /* @__PURE__ */ u3("td", { className: styles.td, children: /* @__PURE__ */ u3("button", { className: styles.btn, onClick: () => navigator.clipboard.writeText(item.text), children: "复制" }) })
            ] }, item.index)) })
          ] }) })
        ] });
      }, "DanmakuTab");
      tabs = [
        { id: "media", title: "媒体资源", Comp: MediaTab },
        { id: "author", title: "作者信息", Comp: AuthorTab },
        { id: "post", title: "作品信息", Comp: PostTab },
        { id: "danmaku", title: "弹幕列表", Comp: DanmakuTab },
        { id: "json", title: "JSON", Comp: JsonTab }
      ];
      MediaDetailModalApp = /* @__PURE__ */ __name(({ media, filenameBase }) => {
        const [tab, setTab] = d2("media");
        const t3 = tabs.find((t4) => t4.id === tab);
        const props = /* @__PURE__ */ __name((id) => {
          switch (id) {
            case "author":
              return { author: media.authorInfo };
            case "json":
              return { data: media };
            default:
              return { media, filenameBase };
          }
        }, "props");
        const Comp = t3.Comp;
        return /* @__PURE__ */ u3("div", { className: styles.container, children: [
          /* @__PURE__ */ u3("nav", { className: styles.nav, children: tabs.map((t4) => /* @__PURE__ */ u3("button", { onClick: () => setTab(t4.id), className: navBtnClass(tab === t4.id), children: t4.title }, t4.id)) }),
          /* @__PURE__ */ u3("div", { className: styles.content, children: /* @__PURE__ */ u3(Comp, { ...props(tab) }) })
        ] });
      }, "MediaDetailModalApp");
    }
  });

  // src/ui/eagle/EaglePicker.tsx
  var EaglePickerApp, openEaglePicker, closeEaglePicker, eaglePickerRoot, eaglePickerStyles, EAGLE_PICKER_SPLIT;
  var init_EaglePicker = __esm({
    "src/ui/eagle/EaglePicker.tsx"() {
      "use strict";
      init_preact_module();
      init_hooks_module();
      init_jsxRuntime_module();
      init_css_in_js();
      init_theme();
      init_Config();
      eaglePickerStyles = createCSS();
      eaglePickerRoot = null;
      // 手动输入标签的分隔符：英文/中文逗号、顿号、分号、换行
      EAGLE_PICKER_SPLIT = /[,，、;；\n\r]+/;
      var st = {
        overlay: eaglePickerStyles({
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          zIndex: "2147483000",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }),
        panel: eaglePickerStyles({
          width: "540px",
          maxWidth: "92vw",
          maxHeight: "76vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(28,28,30,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "14px",
          boxShadow: "0 18px 48px rgba(0,0,0,0.5)",
          color: "#fff",
          fontSize: "13px",
          fontFamily: "sans-serif",
          overflow: "hidden"
        }),
        head: eaglePickerStyles({ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }),
        search: eaglePickerStyles({
          flex: 1,
          minWidth: 0,
          padding: "9px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: "13px",
          outline: "none"
        }),
        hint: eaglePickerStyles({ flexShrink: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)" }),
        list: eaglePickerStyles({ flexGrow: 1, minHeight: "140px", overflowY: "auto", padding: "10px 14px", scrollbarWidth: "thin" }),
        listTwoCol: eaglePickerStyles({ columnCount: 2, columnGap: "14px" }),
        item: eaglePickerStyles({
          display: "block",
          padding: "5px 8px",
          marginBottom: "2px",
          borderRadius: "6px",
          color: "rgba(255,255,255,0.85)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          breakInside: "avoid",
          "&:hover": { background: "rgba(255,255,255,0.08)" }
        }),
        itemActive: eaglePickerStyles({ background: "rgba(64,150,255,0.28)", color: "#fff" }),
        itemManual: eaglePickerStyles({ color: "#ffd79a" }),
        manual: eaglePickerStyles({
          margin: "0 14px 10px",
          padding: "9px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          fontSize: "13px",
          outline: "none",
          flexShrink: 0
        }),
        foot: eaglePickerStyles({ display: "flex", justifyContent: "space-between", padding: "0 14px 12px", fontSize: "12px", color: "rgba(255,255,255,0.45)", flexShrink: 0 }),
        state: eaglePickerStyles({ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "12px" })
      };
      EaglePickerApp = /* @__PURE__ */ __name(({ mode = "tag", baseURL = "", selectedTags = [], selectedFolderId = "", onChange, onClose }) => {
        const [keyword, setKeyword] = d2("");
        const [manual, setManual] = d2("");
        const [folders, setFolders] = d2([]);
        const [tags, setTags] = d2([]);
        const [loading, setLoading] = d2(true);
        const [error, setError] = d2("");
        const isFolder = mode === "folder";
        // 弹层内维护自己的选中状态：手动新增的标签要能立刻在列表里看到
        const [localTags, setLocalTags] = d2(Array.isArray(selectedTags) ? selectedTags : []);
        const [localFolderId, setLocalFolderId] = d2(selectedFolderId || "");
        const emitTags = /* @__PURE__ */ __name((nextTags) => {
          setLocalTags(nextTags);
          onChange({ tags: nextTags });
        }, "emitTags");
        const emitFolder = /* @__PURE__ */ __name((id, name) => {
          setLocalFolderId(id);
          onChange({ folder_id: id, folder_name: name });
        }, "emitFolder");
        y2(() => {
          let alive = true;
          setLoading(true);
          const client = getEagleClient({ baseURL });
          Promise.all([client.getFolders(), client.getTags()]).then((result) => {
            if (!alive) return;
            setFolders(result[0]);
            setTags(result[1]);
            setError("");
          }).catch((err) => {
            if (alive) setError(String(err?.message || err));
          }).finally(() => {
            if (alive) setLoading(false);
          });
          return () => {
            alive = false;
          };
        }, [baseURL]);
        y2(() => {
          const onKeyDown = /* @__PURE__ */ __name((ev) => {
            if (ev.key === "Escape") {
              ev.stopPropagation();
              onClose();
            }
          }, "onKeyDown");
          document.addEventListener("keydown", onKeyDown, true);
          return () => document.removeEventListener("keydown", onKeyDown, true);
        }, []);
        const flatten = /* @__PURE__ */ __name((nodes, depth = 0, out = []) => {
          (Array.isArray(nodes) ? nodes : []).forEach((node) => {
            out.push({ id: node.id, name: node.name || "(未命名)", depth });
            flatten(node.children, depth + 1, out);
          });
          return out;
        }, "flatten");
        const selectedTagList = localTags;
        const keywordTrim = keyword.trim().toLowerCase();
        const manualTags = selectedTagList.filter((name) => !tags.includes(name));
        const mergedTags = [...manualTags, ...tags];
        const visibleTags = keywordTrim ? mergedTags.filter((name) => name.toLowerCase().includes(keywordTrim)) : mergedTags;
        const visibleFolders = keywordTrim ? flatten(folders).filter((row) => row.name.toLowerCase().includes(keywordTrim)) : flatten(folders);
        const addManualTags = /* @__PURE__ */ __name(() => {
          const parts = String(manual || "").split(EAGLE_PICKER_SPLIT).map((piece) => piece.trim()).filter(Boolean);
          if (parts.length === 0) return;
          emitTags(Array.from(new Set([...selectedTagList, ...parts])));
          setManual("");
        }, "addManualTags");
        const rows = isFolder ? [
          /* @__PURE__ */ u3("div", {
            className: st.item + (localFolderId ? "" : " " + st.itemActive),
            onClick: () => emitFolder("", ""),
            children: "（库根目录）"
          }, "__root__"),
          ...visibleFolders.map((row) => /* @__PURE__ */ u3("div", {
            className: st.item + (localFolderId === row.id ? " " + st.itemActive : ""),
            style: { paddingLeft: 8 + row.depth * 14 + "px" },
            onClick: () => emitFolder(row.id, row.name),
            children: row.name
          }, row.id))
        ] : visibleTags.map((name) => /* @__PURE__ */ u3("div", {
          className: st.item + (selectedTagList.includes(name) ? " " + st.itemActive : "") + (tags.includes(name) ? "" : " " + st.itemManual),
          onClick: () => emitTags(selectedTagList.includes(name) ? selectedTagList.filter((tagName) => tagName !== name) : [...selectedTagList, name]),
          children: name
        }, name));
        return /* @__PURE__ */ u3("div", {
          className: st.overlay,
          onClick: (ev) => {
            if (ev.target === ev.currentTarget) onClose();
          },
          children: /* @__PURE__ */ u3("div", { className: st.panel, children: [
            /* @__PURE__ */ u3("div", { className: st.head, children: [
              /* @__PURE__ */ u3("input", {
                className: st.search,
                value: keyword,
                placeholder: isFolder ? "搜索文件夹..." : "搜索标签...",
                onInput: (ev) => setKeyword(ev.target.value),
                autoFocus: true
              }),
              /* @__PURE__ */ u3("span", { className: st.hint, children: isFolder ? "单选" : "可多选" })
            ] }),
            loading ? /* @__PURE__ */ u3("div", { className: st.state, children: "正在读取 Eagle..." }) : error ? /* @__PURE__ */ u3("div", { className: st.state, children: "读取失败：" + error }) : /* @__PURE__ */ u3("div", { className: st.list + (isFolder ? "" : " " + st.listTwoCol), children: rows.length === 0 ? /* @__PURE__ */ u3("div", { className: st.state, children: "没有匹配项" }) : rows }),
            !isFolder && /* @__PURE__ */ u3("input", {
              className: st.manual,
              value: manual,
              placeholder: "手动输入标签，逗号分隔，回车添加",
              onInput: (ev) => setManual(ev.target.value),
              onKeyDown: (ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  addManualTags();
                }
              }
            }),
            /* @__PURE__ */ u3("div", { className: st.foot, children: [
              /* @__PURE__ */ u3("span", { children: isFolder ? "点击选择（层级用缩进表示）" : "点击切换；黄字为手动新增的标签" }),
              /* @__PURE__ */ u3("span", { children: "Esc 关闭" })
            ] })
          ] })
        });
      }, "EaglePickerApp");
      closeEaglePicker = /* @__PURE__ */ __name(() => {
        if (!eaglePickerRoot) return;
        G(null, eaglePickerRoot);
        eaglePickerRoot.remove();
        eaglePickerRoot = null;
      }, "closeEaglePicker");
      /**
       * 打开 Eagle 选择弹层（命令式调用；作者主页面板与设置弹窗共用）
       */
      openEaglePicker = /* @__PURE__ */ __name((options) => {
        closeEaglePicker();
        eaglePickerRoot = document.createElement("div");
        eaglePickerRoot.id = "dy-dl-eagle-picker-root";
        document.body.appendChild(eaglePickerRoot);
        G(/* @__PURE__ */ u3(EaglePickerApp, { ...options, onClose: closeEaglePicker }), eaglePickerRoot);
      }, "openEaglePicker");
    }
  });
  init_EaglePicker();

  // src/ui/modals/ConfigModal.tsx
  var ConfigModal_exports = {};
  __export(ConfigModal_exports, {
    ConfigModalApp: () => ConfigModalApp
  });
  var cssFn, c3, navCls, toShortId, mockMedia, previewFilename, previewDirPath, eagleFieldStyles, SettingsTab, DownloaderConfigTab, HistoryTab, tabs2, ConfigModalApp;
  var init_ConfigModal = __esm({
    "src/ui/modals/ConfigModal.tsx"() {
      "use strict";
      init_hooks_module();
      init_css_in_js();
      init_theme();
      init_DownloadHistory();
      init_format();
      init_string();
      init_Config();
      init_jsxRuntime_module();
      cssFn = createCSS();
      c3 = {
        container: cssFn({
          display: "flex",
          flexDirection: "column",
          height: "70vh",
          width: "600px",
          overflow: "hidden",
          background: theme.colors.bgOverlay,
          backdropFilter: theme.backdropBlur,
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.lg
        }),
        header: cssFn({
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          borderBottom: "1px solid " + theme.colors.borderLight,
          background: theme.colors.bgNav,
          flexShrink: 0
        }),
        nav: cssFn({ display: "flex", flexShrink: 0 }),
        actions: cssFn({ display: "flex", alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.sm + " " + theme.spacing.md }),
        navBtnBase: cssFn({
          padding: theme.spacing.md + " " + theme.spacing.xl,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          borderBottom: "2px solid transparent",
          fontWeight: "normal",
          color: theme.colors.textSecondary,
          transition: "0.2s",
          "&:hover": { background: "rgba(255,255,255,0.05)" }
        }),
        navBtnActive: cssFn({ background: "rgba(255,255,255,0.08)", borderBottomColor: theme.colors.primary, fontWeight: "bold", color: theme.colors.primary }),
        content: cssFn({ flexGrow: 1, overflowY: "auto", padding: theme.spacing.xl }),
        fieldset: cssFn({
          border: "1px solid " + theme.colors.borderMedium,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.lg,
          background: theme.colors.bgFieldset
        }),
        legend: cssFn({
          fontWeight: "bold",
          padding: "0 " + theme.spacing.sm,
          color: "rgba(255,255,255,0.9)",
          background: "rgba(18,18,20,0.8)",
          borderRadius: theme.borderRadius.full,
          fontSize: theme.fontSize.sm
        }),
        row: cssFn({ display: "flex", padding: theme.spacing.sm + " 0", fontSize: theme.fontSize.sm, borderBottom: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }),
        label: cssFn({ width: "120px", flexShrink: 0, color: theme.colors.textMuted, fontWeight: 600 }),
        value: cssFn({ flexGrow: 1, color: theme.colors.textSecondary, wordBreak: "break-all" }),
        btn: cssFn({
          padding: theme.spacing.xs + " " + theme.spacing.md,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.full,
          marginLeft: theme.spacing.sm,
          transition: "0.2s",
          whiteSpace: "nowrap"
        }),
        btnDanger: cssFn({
          padding: theme.spacing.xs + " " + theme.spacing.md,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          border: "1px solid #ff4d4f",
          background: "rgba(255,77,79,0.15)",
          color: "#ff4d4f",
          borderRadius: theme.borderRadius.full,
          transition: "0.2s"
        }),
        select: cssFn({
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.xs + " " + theme.spacing.sm,
          fontSize: theme.fontSize.xs,
          "& option": {
            background: "#2c2c2e",
            color: theme.colors.textPrimary,
            padding: theme.spacing.sm
          }
        }),
        input: cssFn({
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm + " " + theme.spacing.md,
          fontSize: theme.fontSize.sm,
          lineHeight: "20px",
          flexGrow: 1,
          minWidth: 0,
          "&:focus": { borderColor: theme.colors.primary }
        }),
        table: cssFn({ width: "100%", borderCollapse: "collapse", fontSize: theme.fontSize.xs }),
        th: cssFn({ textAlign: "left", padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderMedium, color: theme.colors.textMuted, fontWeight: 600 }),
        td: cssFn({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, verticalAlign: "top" }),
        range: cssFn({ flexGrow: 1, accentColor: theme.colors.primary, cursor: "pointer" }),
        rangeValue: cssFn({ minWidth: "32px", textAlign: "right", fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }),
        flexBetween: cssFn({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }),
        hintText: cssFn({ fontSize: "11px", color: theme.colors.textDim, marginTop: theme.spacing.xs, padding: theme.spacing.xs + " 0", lineHeight: 1.5 }),
        codeBlock: cssFn({
          background: "rgba(0,0,0,0.3)",
          borderRadius: theme.borderRadius.sm,
          padding: "4px " + theme.spacing.sm,
          fontSize: "11px",
          color: theme.colors.textSecondary,
          fontFamily: "monospace",
          wordBreak: "break-all"
        }),
        hr: cssFn({ border: "none", borderTop: "1px solid " + theme.colors.borderLight, margin: theme.spacing.sm + " 0" }),
        btnSave: cssFn({
          padding: theme.spacing.xs + " " + theme.spacing.md,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
          color: theme.colors.textPrimary,
          borderRadius: theme.borderRadius.full,
          marginLeft: theme.spacing.sm,
          transition: "0.2s",
          whiteSpace: "nowrap"
        }),
        btnSaveDirty: cssFn({
          padding: theme.spacing.xs + " " + theme.spacing.md,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          border: "2px solid " + theme.colors.primary,
          background: "rgba(64,150,255,0.2)",
          color: theme.colors.primary,
          borderRadius: theme.borderRadius.full,
          marginLeft: theme.spacing.sm,
          transition: "0.2s",
          whiteSpace: "nowrap",
          fontWeight: "bold"
        })
      };
      navCls = /* @__PURE__ */ __name((a3) => a3 ? c3.navBtnBase + " " + c3.navBtnActive : c3.navBtnBase, "navCls");
      toShortId = /* @__PURE__ */ __name((bigintStr) => {
        try {
          return BigInt(bigintStr).toString(36);
        } catch {
          return bigintStr;
        }
      }, "toShortId");
      mockMedia = {
        authorInfo: { nickname: "示例用户" },
        awemeId: "1234567890123456789",
        desc: "这是一个示例视频描述 #tag1 #tag2",
        textExtra: [{ hashtagName: "tag1" }, { hashtagName: "tag2" }],
        authorUserId: "12345",
        createTime: Date.now() / 1e3
      };
      previewFilename = /* @__PURE__ */ __name((template, maxLen) => {
        const {
          authorInfo: { nickname },
          awemeId,
          desc,
          textExtra
        } = mockMedia;
        const short_id = toShortId(awemeId);
        const tag_list = textExtra?.map((x2) => x2.hashtagName).filter(Boolean) || [];
        const tags = tag_list.map((x2) => "#" + x2).join("_");
        let rawDesc = desc || "";
        tag_list.forEach((t3) => {
          rawDesc = rawDesc.replace(new RegExp("#" + t3 + "\\s*", "g"), "");
        });
        rawDesc = rawDesc.trim().replace(/[#/?<>\\:*|":]/g, "_");
        const now_date = /* @__PURE__ */ new Date();
        const create_date = new Date(Number(mockMedia.createTime) * 1e3);
        const ctx = {
          nickname,
          short_id,
          tags,
          desc: rawDesc,
          aweme_id: awemeId,
          media: mockMedia,
          author_info: mockMedia.authorInfo,
          uid: mockMedia.authorUserId,
          music_name: "",
          now_date,
          create_date,
          now_YYYYMMDD: formatDate(now_date, "YYYYMMDD"),
          now_YYYYMMDD_HHmmss: formatDate(now_date, "YYYYMMDD_HHmmss"),
          create_date_YYYYMMDD: formatDate(create_date, "YYYYMMDD"),
          create_date_YYYYMMDD_HHmmss: formatDate(create_date, "YYYYMMDD_HHmmss")
        };
        let base;
        try {
          base = runInContext(ctx, template);
        } catch {
          base = runInContext(ctx, "`${nickname}_${short_id}_${tags}_${desc}`");
        }
        return normalizeBasename(base, { maxLength: maxLen });
      }, "previewFilename");
      previewDirPath = /* @__PURE__ */ __name((template) => {
        if (!template) return "";
        const {
          authorInfo: { nickname },
          awemeId,
          desc,
          authorUserId
        } = mockMedia;
        const uid = authorUserId;
        const userDir = normalizePathSegment(`${uid}_${nickname}`);
        const ctx = {
          user_dir: userDir,
          nickname,
          uid,
          aweme_id: awemeId,
          desc,
          filename: "example.mp4",
          filename_base: "example",
          media: mockMedia
        };
        let resolved;
        try {
          resolved = runInContext(ctx, template);
        } catch {
          resolved = "(无法解析)";
        }
        return typeof resolved === "string" ? resolved : String(resolved);
      }, "previewDirPath");
      SettingsTab = /* @__PURE__ */ __name(({ cfg, onChange, onResetDefaults }) => {
        const filenamePreview = T2(() => previewFilename(cfg.filename_template, cfg.filename_max_length), [cfg.filename_template, cfg.filename_max_length]);
        const update = /* @__PURE__ */ __name((mutate) => {
          mutate();
          onChange();
        }, "update");
        return /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "文件命名" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "文件名模板" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: cfg.filename_template, onChange: (e3) => update(() => cfg.filename_template = e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.hintText, children: [
              "可用变量：",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "nickname" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "short_id" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "tags" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "desc" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "aweme_id" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "create_date_YYYYMMDD" }),
              " ",
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "now_YYYYMMDD_HHmmss" })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "文件名长度" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  className: c3.input,
                  type: "number",
                  value: cfg.filename_max_length,
                  onChange: (e3) => update(() => cfg.filename_max_length = Number(e3.target.value))
                }
              )
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "预览" }),
              /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: filenamePreview || "(无法预览)" })
            ] })
          ] }),
          /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "视频下载设置" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "分辨率策略" }),
              /* @__PURE__ */ u3("select", { className: c3.select, value: cfg.download_video_mode, onChange: (e3) => update(() => cfg.download_video_mode = e3.target.value), children: [
                /* @__PURE__ */ u3("option", { value: "default", children: "默认" }),
                /* @__PURE__ */ u3("option", { value: "max", children: "最高清晰度" }),
                /* @__PURE__ */ u3("option", { value: "min", children: "最低清晰度" }),
                /* @__PURE__ */ u3("option", { value: "1080P", children: "1080P" }),
                /* @__PURE__ */ u3("option", { value: "720P", children: "720P" }),
                /* @__PURE__ */ u3("option", { value: "540P", children: "540P" }),
                /* @__PURE__ */ u3("option", { value: "360P", children: "360P" }),
                /* @__PURE__ */ u3("option", { value: "2K", children: "2K" }),
                /* @__PURE__ */ u3("option", { value: "4K", children: "4K" }),
                /* @__PURE__ */ u3("option", { value: "max_file", children: "最大文件" }),
                /* @__PURE__ */ u3("option", { value: "min_file", children: "最小文件" })
              ] })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "编码偏好" }),
              /* @__PURE__ */ u3("select", { className: c3.select, value: cfg.video_download_codecs, onChange: (e3) => update(() => cfg.video_download_codecs = e3.target.value), children: [
                /* @__PURE__ */ u3("option", { value: "default", children: "默认" }),
                /* @__PURE__ */ u3("option", { value: "h264", children: "H.264" }),
                /* @__PURE__ */ u3("option", { value: "h265", children: "H.265" }),
                /* @__PURE__ */ u3("option", { value: "h264_prefer", children: "优先H.264" }),
                /* @__PURE__ */ u3("option", { value: "h265_prefer", children: "优先H.265" })
              ] })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.hintText, children: "注意：实际下载时根据可用地址匹配，并非所有视频都提供所有编码。" })
          ] }),
          /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "快捷键" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "启用快捷键" }),
              /* @__PURE__ */ u3("label", { style: { display: "flex", alignItems: "center", gap: theme.spacing.sm, cursor: "pointer" }, children: [
                /* @__PURE__ */ u3("input", { type: "checkbox", checked: cfg.enable_download_shortcut, onChange: (e3) => update(() => cfg.enable_download_shortcut = e3.target.checked) }),
                /* @__PURE__ */ u3("span", { children: "启用下载快捷键" })
              ] })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "下载快捷键" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  className: c3.input,
                  value: cfg.download_shortcut,
                  placeholder: "M / Ctrl+Shift+M",
                  disabled: !cfg.enable_download_shortcut,
                  onChange: (e3) => update(() => cfg.download_shortcut = e3.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "启用 Eagle 快捷键" }),
              /* @__PURE__ */ u3("label", { style: { display: "flex", alignItems: "center", gap: theme.spacing.sm, cursor: "pointer" }, children: [
                /* @__PURE__ */ u3("input", { type: "checkbox", checked: cfg.enable_eagle_shortcut !== false, onChange: (e3) => update(() => cfg.enable_eagle_shortcut = e3.target.checked) }),
                /* @__PURE__ */ u3("span", { children: "启用推送到 Eagle 快捷键" })
              ] })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Eagle 快捷键" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  className: c3.input,
                  value: cfg.eagle_shortcut,
                  placeholder: "S / Ctrl+Shift+S",
                  disabled: cfg.enable_eagle_shortcut === false,
                  onChange: (e3) => update(() => cfg.eagle_shortcut = e3.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.hintText, children: "支持单键或组合键，例如 S、Ctrl+S、Alt+M、Shift+M、Ctrl+Shift+M。输入框聚焦时快捷键不触发。" })
          ] }),
          /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "重置配置" }),
            /* @__PURE__ */ u3("div", { className: c3.hintText, children: "重置会将当前表单所有配置恢复为默认值，保存后覆盖现有全部配置。" }),
            /* @__PURE__ */ u3("button", { className: c3.btnDanger, onClick: onResetDefaults, children: "重置配置为默认" })
          ] })
        ] });
      }, "SettingsTab");
      eagleFieldStyles = {
        chips: cssFn({ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: theme.spacing.sm }),
        chip: cssFn({
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "2px 10px",
          borderRadius: theme.borderRadius.full,
          background: "rgba(64,150,255,0.18)",
          border: "1px solid rgba(64,150,255,0.5)",
          color: theme.colors.textPrimary,
          fontSize: theme.fontSize.xs
        }),
        chipX: cssFn({ cursor: "pointer", opacity: 0.75, "&:hover": { opacity: 1 } }),
        treeBox: cssFn({
          maxHeight: "240px",
          overflowY: "auto",
          marginTop: theme.spacing.sm,
          padding: theme.spacing.sm,
          background: "rgba(0,0,0,0.28)",
          border: "1px solid " + theme.colors.borderLight,
          borderRadius: theme.borderRadius.sm
        }),
        treeRow: cssFn({
          padding: "3px 6px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          "&:hover": { background: "rgba(255,255,255,0.08)" }
        }),
        treeRowActive: cssFn({ background: "rgba(64,150,255,0.22)", color: theme.colors.textPrimary }),
        tagListBox: cssFn({
          maxHeight: "220px",
          overflowY: "auto",
          marginTop: theme.spacing.sm,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: theme.spacing.sm,
          background: "rgba(0,0,0,0.28)",
          border: "1px solid " + theme.colors.borderLight,
          borderRadius: theme.borderRadius.sm
        }),
        tagOption: cssFn({
          padding: "2px 10px",
          borderRadius: theme.borderRadius.full,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.xs,
          cursor: "pointer",
          whiteSpace: "nowrap"
        }),
        tagOptionActive: cssFn({ background: "rgba(254,44,85,0.25)", borderColor: theme.colors.primary, color: "#fff" }),
        statusOk: cssFn({ color: "#81c784", fontSize: theme.fontSize.xs, padding: theme.spacing.xs + " 0" }),
        statusErr: cssFn({ color: "#ef9a9a", fontSize: theme.fontSize.xs, padding: theme.spacing.xs + " 0" })
      };
      DownloaderConfigTab = /* @__PURE__ */ __name(({ cfg, onChange }) => {
        const [dlType, setDlType] = d2(cfg.using_downloader);
        const [, forceRender] = d2(0);
        y2(() => {
          setDlType(cfg.using_downloader);
        }, [cfg.using_downloader]);
        const dc = cfg.downloader_config || {};
        const notify = /* @__PURE__ */ __name(() => {
          forceRender((v3) => v3 + 1);
          onChange();
        }, "notify");
        const setField = /* @__PURE__ */ __name((path, val) => {
          val = val.replace(/\\/g, "/");
          const parts = path.split(".");
          let obj = dc[dlType];
          if (!obj) {
            obj = {};
            dc[dlType] = obj;
          }
          for (let i3 = 0; i3 < parts.length - 1; i3++) {
            if (typeof obj[parts[i3]] !== "object") obj[parts[i3]] = {};
            obj = obj[parts[i3]];
          }
          obj[parts[parts.length - 1]] = val;
          cfg.downloader_config = { ...dc };
          notify();
        }, "setField");
        const rawDcfg = dc[dlType] || {};
        const downloaderDefaults = Config.default_features().downloader_config[dlType] || {};
        const dcfg = {
          ...downloaderDefaults,
          ...rawDcfg,
          dir: { ...downloaderDefaults.dir || {}, ...rawDcfg.dir || {} }
        };
        const renderBrowserImageFields = /* @__PURE__ */ __name(() => /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: "以下图片转码/压缩配置仅在“浏览器下载”时生效。使用外部下载器时，脚本只能把原图地址交给下载器，无法自动转码或压缩。" }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "转码格式" }),
            /* @__PURE__ */ u3(
              "select",
              {
                className: c3.select,
                value: cfg.image_convert_codecs,
                onChange: (e3) => {
                  cfg.image_convert_codecs = e3.target.value;
                  notify();
                },
                children: [
                  /* @__PURE__ */ u3("option", { value: "default", children: "默认" }),
                  /* @__PURE__ */ u3("option", { value: "png", children: "PNG" }),
                  /* @__PURE__ */ u3("option", { value: "jpg", children: "JPG" }),
                  /* @__PURE__ */ u3("option", { value: "webp", children: "WebP" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "尺寸限制" }),
            /* @__PURE__ */ u3(
              "select",
              {
                className: c3.select,
                value: cfg.image_resize_codecs,
                onChange: (e3) => {
                  cfg.image_resize_codecs = e3.target.value;
                  notify();
                },
                children: [
                  /* @__PURE__ */ u3("option", { value: "default", children: "默认" }),
                  /* @__PURE__ */ u3("option", { value: "2k_max", children: "2K(2048px)" }),
                  /* @__PURE__ */ u3("option", { value: "1k_max", children: "1K(1024px)" }),
                  /* @__PURE__ */ u3("option", { value: "960_max", children: "960px" }),
                  /* @__PURE__ */ u3("option", { value: "640_max", children: "640px" }),
                  /* @__PURE__ */ u3("option", { value: "512_max", children: "512px" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.flexBetween, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "图片质量" }),
            /* @__PURE__ */ u3("span", { className: c3.rangeValue, children: [
              cfg.image_quality,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ u3(
            "input",
            {
              className: c3.range,
              type: "range",
              min: "1",
              max: "100",
              value: cfg.image_quality,
              onChange: (e3) => {
                cfg.image_quality = Number(e3.target.value);
                notify();
              }
            }
          ),
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: "压缩率仅当转码或尺寸压缩开启时生效，推荐 60% 以上。" })
        ] }), "renderBrowserImageFields");
        const defaultDirs = downloaderDefaults.dir || {};
        const renderDirFields = /* @__PURE__ */ __name(() => /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "视频目录" }),
            /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.dir?.video || defaultDirs.video || "", onChange: (e3) => setField("dir.video", e3.target.value) })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "图片目录" }),
            /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.dir?.image || defaultDirs.image || "", onChange: (e3) => setField("dir.image", e3.target.value) })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "其他目录" }),
            /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.dir?.other || defaultDirs.other || "", onChange: (e3) => setField("dir.other", e3.target.value) })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: [
            "可用变量：",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${user_dir}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${nickname}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${uid}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${aweme_id}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${desc}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${filename}" }),
            " ",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "${filename_base}" }),
            /* @__PURE__ */ u3("br", {}),
            "使用模板字符串语法，如：",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: "`./douyin/${user_dir}/videos`" })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: [
            "预览视频目录：",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: previewDirPath(dcfg.dir?.video || defaultDirs.video || "") }),
            /* @__PURE__ */ u3("br", {}),
            "预览图片目录：",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: previewDirPath(dcfg.dir?.image || defaultDirs.image || "") }),
            /* @__PURE__ */ u3("br", {}),
            "预览其他目录：",
            /* @__PURE__ */ u3("span", { className: c3.codeBlock, children: previewDirPath(dcfg.dir?.other || defaultDirs.other || "") })
          ] })
        ] }), "renderDirFields");
        // ── Eagle 推送配置：目录与标签改用弹层选择（弹层自行拉取 Eagle 数据） ──
        const eagleCfg = (cfg.downloader_config || {}).eagle || {};
        const setEagleField = /* @__PURE__ */ __name((patch) => {
          const nextConfig = { ...(cfg.downloader_config || {}) };
          nextConfig.eagle = { ...(nextConfig.eagle || {}), ...patch };
          cfg.downloader_config = nextConfig;
          notify();
        }, "setEagleField");
        const [eagleProbe, setEagleProbe] = d2("");
        const [eagleProbeOk, setEagleProbeOk] = d2(false);
        const [eagleProbing, setEagleProbing] = d2(false);
        const probeEagle = /* @__PURE__ */ __name(async () => {
          setEagleProbing(true);
          setEagleProbe("正在连接 Eagle...");
          setEagleProbeOk(false);
          try {
            const client = getEagleClient({ baseURL: eagleCfg.base_url });
            const style = await client.getApiStyle(true);
            const tree = await client.getFolders(true);
            const tagList = await client.getTags(true);
            setEagleProbe(`已连接 Eagle（API ${style}）：${tree.length} 个顶层文件夹 / ${tagList.length} 个标签`);
            setEagleProbeOk(true);
          } catch (err) {
            setEagleProbe(`连接失败：${err?.message || err}`);
            setEagleProbeOk(false);
          } finally {
            setEagleProbing(false);
          }
        }, "probeEagle");
        y2(() => {
          probeEagle();
        }, [eagleCfg.base_url]);
        const selectedTagNames = Array.isArray(eagleCfg.tags) ? eagleCfg.tags : [];
        const openTagPicker = /* @__PURE__ */ __name(() => {
          openEaglePicker({
            mode: "tag",
            baseURL: eagleCfg.base_url,
            selectedTags: selectedTagNames,
            onChange: (patch) => setEagleField(patch)
          });
        }, "openTagPicker");
        const openFolderPicker = /* @__PURE__ */ __name(() => {
          openEaglePicker({
            mode: "folder",
            baseURL: eagleCfg.base_url,
            selectedFolderId: eagleCfg.folder_id || "",
            onChange: (patch) => setEagleField(patch)
          });
        }, "openFolderPicker");
        const renderEagleFields = /* @__PURE__ */ __name(() => /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "服务地址" }),
            /* @__PURE__ */ u3("input", { className: c3.input, value: eagleCfg.base_url || "", onChange: (e3) => setEagleField({ base_url: e3.target.value }) }),
            /* @__PURE__ */ u3("button", { className: c3.btnSave, onClick: probeEagle, disabled: eagleProbing, children: eagleProbing ? "连接中..." : "检测连接" })
          ] }),
          eagleProbe ? /* @__PURE__ */ u3("div", { className: eagleProbeOk ? eagleFieldStyles.statusOk : eagleFieldStyles.statusErr, children: eagleProbe }) : null,
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "目标文件夹" }),
            /* @__PURE__ */ u3("span", { className: c3.value, children: eagleCfg.folder_id ? eagleCfg.folder_name || eagleCfg.folder_id : "库根目录（未选择）" }),
            /* @__PURE__ */ u3("button", { className: c3.btnSave, onClick: openFolderPicker, children: "选择文件夹" }),
            eagleCfg.folder_id ? /* @__PURE__ */ u3("button", { className: c3.btnDanger, onClick: () => setEagleField({ folder_id: "", folder_name: "" }), children: "用根目录" }) : null
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "标签" }),
            /* @__PURE__ */ u3("span", { className: c3.value, children: selectedTagNames.length === 0 ? "未选择（素材不带任何标签）" : "已选 " + selectedTagNames.length + " 个" }),
            /* @__PURE__ */ u3("button", { className: c3.btnSave, onClick: openTagPicker, children: "选择标签" }),
            selectedTagNames.length > 0 ? /* @__PURE__ */ u3("button", { className: c3.btnDanger, onClick: () => setEagleField({ tags: [] }), children: "清空标签" }) : null
          ] }),
          selectedTagNames.length > 0 ? /* @__PURE__ */ u3("div", { className: eagleFieldStyles.chips, children: selectedTagNames.map((name) => /* @__PURE__ */ u3("span", { className: eagleFieldStyles.chip, children: name }, name)) }) : null,
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "去重" }),
            /* @__PURE__ */ u3("label", { style: { display: "flex", alignItems: "center", gap: theme.spacing.sm, cursor: "pointer" }, children: [
              /* @__PURE__ */ u3("input", { type: "checkbox", checked: eagleCfg.skip_existing !== false, onChange: (e3) => setEagleField({ skip_existing: e3.target.checked }) }),
              /* @__PURE__ */ u3("span", { children: "推送前检查 Eagle 里是否已有同一作品同一张图，已存在则跳过" })
            ] })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.row, children: [
            /* @__PURE__ */ u3("span", { className: c3.label, children: "请求头" }),
            /* @__PURE__ */ u3("label", { style: { display: "flex", alignItems: "center", gap: theme.spacing.sm, cursor: "pointer" }, children: [
              /* @__PURE__ */ u3("input", { type: "checkbox", checked: eagleCfg.send_referer !== false, onChange: (e3) => setEagleField({ send_referer: e3.target.checked }) }),
              /* @__PURE__ */ u3("span", { children: "给抖音 CDN 补 Referer / User-Agent（推荐开启）" })
            ] })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: "目录与标签用弹层选择，点击后立即生效并记住。Eagle 会自行拉取媒体直链入库；视频优先使用带签名的 CDN 直链。不选择标签时，素材不会写入任何标签。" })
        ] }), "renderEagleFields");
        return /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "下载器" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "类型" }),
              /* @__PURE__ */ u3(
                "select",
                {
                  className: c3.select,
                  value: dlType,
                  onChange: (e3) => {
                    const next = e3.target.value;
                    setDlType(next);
                    cfg.using_downloader = next;
                    notify();
                  },
                  children: [
                    /* @__PURE__ */ u3("option", { value: "browser", children: "浏览器" }),
                    /* @__PURE__ */ u3("option", { value: "eagle", children: "Eagle（推送到素材库）" }),
                    /* @__PURE__ */ u3("option", { value: "idm", children: "IDM" }),
                    /* @__PURE__ */ u3("option", { value: "aria2", children: "Aria2" }),
                    /* @__PURE__ */ u3("option", { value: "bc", children: "BitComet" }),
                    /* @__PURE__ */ u3("option", { value: "abdm", children: "AB Download Manager" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.hintText, children: "切换下载器会立即显示对应配置，保存后才会用于实际下载。使用外部下载器（含 Eagle）时，图片压缩转码不可用。" })
          ] }),
          dlType === "eagle" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "Eagle 素材库" }),
            renderEagleFields()
          ] }),
          dlType === "browser" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "浏览器下载（图片转码压缩）" }),
            renderBrowserImageFields()
          ] }),
          dlType === "abdm" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "AB Download Manager" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Domain" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.domain || "", onChange: (e3) => setField("domain", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Port" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.port || "", onChange: (e3) => setField("port", e3.target.value) })
            ] }),
            renderDirFields()
          ] }),
          dlType === "aria2" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "Aria2" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Domain" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.domain || "http://localhost", onChange: (e3) => setField("domain", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Port" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.port || "6800", onChange: (e3) => setField("port", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Path" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.path || "/jsonrpc", onChange: (e3) => setField("path", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Token" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.token || "", onChange: (e3) => setField("token", e3.target.value) })
            ] }),
            renderDirFields()
          ] }),
          dlType === "idm" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "IDM" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "ID" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.id || "1", onChange: (e3) => setField("id", e3.target.value) })
            ] })
          ] }),
          dlType === "bc" && /* @__PURE__ */ u3("fieldset", { className: c3.fieldset, children: [
            /* @__PURE__ */ u3("legend", { className: c3.legend, children: "BitComet" }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Domain" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.domain || "http://localhost", onChange: (e3) => setField("domain", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Port" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.port || "8080", onChange: (e3) => setField("port", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Path" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.path || "/panel/task_add_httpftp_result", onChange: (e3) => setField("path", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Auth Name" }),
              /* @__PURE__ */ u3("input", { className: c3.input, value: dcfg.authName || "", onChange: (e3) => setField("authName", e3.target.value) })
            ] }),
            /* @__PURE__ */ u3("div", { className: c3.row, children: [
              /* @__PURE__ */ u3("span", { className: c3.label, children: "Auth Pass" }),
              /* @__PURE__ */ u3("input", { className: c3.input, type: "password", value: dcfg.authPass || "", onChange: (e3) => setField("authPass", e3.target.value) })
            ] }),
            renderDirFields()
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.hintText, children: "选择下载器后填写对应配置；浏览器下载不需要额外连接配置，但可使用上面的图片转码/压缩设置。" })
        ] });
      }, "DownloaderConfigTab");
      HistoryTab = /* @__PURE__ */ __name(() => {
        const [hist, setHist] = d2([]);
        y2(() => {
          setHist(DownloadHistory.get());
        }, []);
        const clearHist = /* @__PURE__ */ __name(() => {
          if (!confirm("确认清空所有下载记录？")) return;
          DownloadHistory.clear();
          setHist([]);
        }, "clearHist");
        return /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("div", { className: c3.flexBetween, style: { marginBottom: theme.spacing.md }, children: [
            /* @__PURE__ */ u3("span", { style: { fontWeight: "bold", fontSize: theme.fontSize.sm }, children: "下载记录（最多50条）" }),
            hist.length > 0 && /* @__PURE__ */ u3("button", { className: c3.btnDanger, onClick: clearHist, children: "清空" })
          ] }),
          hist.length === 0 ? /* @__PURE__ */ u3("div", { style: { textAlign: "center", padding: theme.spacing.xl, color: theme.colors.textDim }, children: "暂无下载记录" }) : /* @__PURE__ */ u3("table", { className: c3.table, children: [
            /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("th", { className: c3.th, children: "描述" }),
              /* @__PURE__ */ u3("th", { className: c3.th, children: "分享链接" }),
              /* @__PURE__ */ u3("th", { className: c3.th, children: "下载时间" })
            ] }) }),
            /* @__PURE__ */ u3("tbody", { children: hist.map((h3, i3) => /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("td", { className: c3.td, children: h3.desc || "(无描述)" }),
              /* @__PURE__ */ u3("td", { className: c3.td, children: h3.shareUrl ? /* @__PURE__ */ u3("a", { href: h3.shareUrl, target: "_blank", rel: "noopener noreferrer", style: { color: theme.colors.primary }, children: "链接" }) : "-" }),
              /* @__PURE__ */ u3("td", { className: c3.td, children: h3.downloadTime ? new Date(h3.downloadTime).toLocaleString() : "-" })
            ] }, i3)) })
          ] })
        ] });
      }, "HistoryTab");
      tabs2 = [
        { id: "settings", title: "基本设置", Comp: SettingsTab },
        { id: "downloader", title: "下载器配置", Comp: DownloaderConfigTab },
        { id: "history", title: "下载历史", Comp: HistoryTab }
      ];
      ConfigModalApp = /* @__PURE__ */ __name(({ config, modal }) => {
        const [tab, setTab] = d2("settings");
        const [cfg, setCfg] = d2(() => config.clone_features());
        const [original, setOriginal] = d2(() => config.clone_features());
        const originalRef = T2(() => JSON.stringify(original), [original]);
        const dirty = T2(() => JSON.stringify(cfg) !== originalRef, [cfg, originalRef]);
        const dirtyRef = A2(false);
        dirtyRef.current = dirty;
        y2(() => {
          const refresh = /* @__PURE__ */ __name(() => {
            const latest = config.clone_features();
            if (dirtyRef.current) return;
            setCfg(latest);
            setOriginal(latest);
          }, "refresh");
          return config.events.on("config_change", refresh);
        }, [config]);
        y2(() => {
          if (modal) {
            modal.onBeforeClose = dirty ? () => confirm("有未保存的修改，确定放弃？") : void 0;
          }
        }, [dirty, modal]);
        const onSave = /* @__PURE__ */ __name(() => {
          const changedPaths = Config.diff_paths(original, cfg);
          const latest = config.clone_features();
          if (changedPaths.length === 0) {
            setOriginal(latest);
            setCfg(latest);
            alert("配置已保存");
            return;
          }
          const conflictingPaths = changedPaths.filter((path) => Config.diff_paths(original, latest).includes(path));
          if (conflictingPaths.length > 0 && !confirm(`其他标签页已修改：${conflictingPaths.join("、")}。保存会覆盖这些字段，确定继续？`)) return;
          config.features = Config.apply_paths(latest, cfg, changedPaths);
          config.save();
          const saved = config.clone_features();
          setOriginal(saved);
          setCfg(saved);
          alert("配置已保存");
        }, "onSave");
        const onEdit = /* @__PURE__ */ __name(() => setCfg({ ...cfg }), "onEdit");
        const onCancel = /* @__PURE__ */ __name(() => {
          const latest = config.clone_features();
          setCfg(latest);
          setOriginal(latest);
        }, "onCancel");
        const onResetDefaults = /* @__PURE__ */ __name(() => {
          if (!confirm("确定重置为默认配置？此操作会覆盖当前所有配置，包括下载器、图片、文件命名等。")) return;
          setCfg(Config.default_features());
        }, "onResetDefaults");
        const t3 = tabs2.find((t4) => t4.id === tab);
        const props = /* @__PURE__ */ __name((id) => {
          if (id === "settings") return { cfg, onChange: onEdit, onResetDefaults };
          if (id === "downloader") return { cfg, onChange: onEdit };
          return {};
        }, "props");
        const Comp = t3.Comp;
        return /* @__PURE__ */ u3("div", { className: c3.container, children: [
          /* @__PURE__ */ u3("div", { className: c3.header, children: [
            /* @__PURE__ */ u3("nav", { className: c3.nav, children: tabs2.map((t4) => /* @__PURE__ */ u3("button", { onClick: () => setTab(t4.id), className: navCls(tab === t4.id), children: t4.title }, t4.id)) }),
            dirty && /* @__PURE__ */ u3("div", { className: c3.actions, children: [
              /* @__PURE__ */ u3("button", { className: c3.btnDanger, onClick: onCancel, children: "取消" }),
              /* @__PURE__ */ u3("button", { className: c3.btnSaveDirty, onClick: onSave, children: "保存" })
            ] })
          ] }),
          /* @__PURE__ */ u3("div", { className: c3.content, children: /* @__PURE__ */ u3(Comp, { ...props(tab) }) })
        ] });
      }, "ConfigModalApp");
    }
  });

  // src/core/download/ImageProcessor.ts
  var _ImageProcessor = class _ImageProcessor {
    constructor(config = {}) {
      this.resizeMap = {
        "2k_max": 2048,
        "1k_max": 1024,
        "960_max": 960,
        "640_max": 640,
        "512_max": 512
      };
      this.config = {
        image_convert_codecs: "default",
        image_resize_codecs: "default",
        image_quality: 80,
        ...config
      };
    }
    /**
     * 根据配置判断是否需要压缩转码
     */
    is_need_convert(width, height) {
      const { image_convert_codecs, image_resize_codecs } = this.config;
      const need_format = image_convert_codecs !== "default";
      const resize_target = this.resizeMap[image_resize_codecs] ?? Infinity;
      const need_resize = width > resize_target || height > resize_target;
      return need_format || need_resize;
    }
    /**
     * 主入口
     */
    async process(file) {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (!this.is_need_convert(width, height)) {
        return { blob: file };
      }
      ;
      ({ width, height } = this._resize(width, height));
      const canvas = this._createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      const outputType = this._getOutputType(file.type);
      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await this._toBlob(canvas, outputType);
      return { blob, outputType };
    }
    /**
     * resize 逻辑
     * @private
     */
    _resize(width, height) {
      const mode = this.config.image_resize_codecs;
      const maxEdge = this.resizeMap[mode];
      if (!maxEdge) return { width, height };
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      return {
        width: Math.round(width * scale),
        height: Math.round(height * scale)
      };
    }
    /**
     * canvas 创建（兼容 fallback）
     * @private
     */
    _createCanvas(width, height) {
      if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    /**
     * 输出格式决策
     * @private
     */
    _getOutputType(inputType) {
      const codec = this.config.image_convert_codecs;
      if (codec === "png") return "image/png";
      if (codec === "jpg") return "image/jpeg";
      if (codec === "webp") return "image/webp";
      if (inputType === "image/png") return "image/png";
      if (inputType === "image/webp") return "image/webp";
      return "image/jpeg";
    }
    /**
     * 质量归一化
     * @private
     */
    _normalizeQuality() {
      const q3 = this.config.image_quality;
      if (!q3) return 0.8;
      return Math.min(1, Math.max(0.1, q3 / 100));
    }
    /**
     * toBlob 封装（兼容 HTMLCanvas）
     * @private
     */
    _toBlob(canvas, type) {
      const quality = this._normalizeQuality();
      if (canvas.convertToBlob) {
        return canvas.convertToBlob({ type, quality });
      }
      return new Promise((resolve) => {
        ;
        canvas.toBlob((b) => resolve(b), type, quality);
      });
    }
  };
  __name(_ImageProcessor, "ImageProcessor");
  var ImageProcessor = _ImageProcessor;

  // src/core/eagle/EagleClient.ts
  var _EagleClient, EagleClient, getEagleClient, eagleClientSingleton, EAGLE_DEFAULT_BASE_URL, EAGLE_API_MAP, EAGLE_MEDIA_HOSTS;
  var init_EagleClient = __esm({
    "src/core/eagle/EagleClient.ts"() {
      "use strict";
      EAGLE_DEFAULT_BASE_URL = "http://127.0.0.1:41595";
      /**
       * 抖音 CDN 域名：这些域名才需要补 Referer / UA。
       */
      EAGLE_MEDIA_HOSTS = [
        "douyin.com",
        "douyinpic.com",
        "douyinvod.com",
        "douyincdn.com",
        "iesdouyin.com",
        "ixigua.com",
        "byteimg.com",
        "bytednsdoc.com",
        "snssdk.com",
        "pstatp.com",
        "zjcdn.com",
        "toutiaoimg.com"
      ];
      /**
       * 同一个逻辑操作在两种 Eagle API 风格下的路径与参数差异。
       *
       * v1 = Eagle 4.0 桌面版实际提供的接口（用 app.asar 里的路由表核对过）：
       *   添加素材   POST /api/item/addFromURL（收 folderIds 数组，且不返回素材 id）
       *   按 url 查  GET  /api/item/list?url=（子串匹配，需逐条复核）
       *   建文件夹   POST /api/folder/create（参数名是 folderName）
       * v2 = 较新版本提供的 /api/v2/*（保留兼容）。
       */
      EAGLE_API_MAP = {
        appInfo: {
          v2: { path: "/api/v2/app/info", method: "GET" },
          v1: { path: "/api/application/info", method: "GET" }
        },
        folderList: {
          v2: { path: "/api/v2/folder/get", method: "GET", query: (p) => `?offset=${p.offset || 0}&limit=${p.limit || 200}` },
          v1: { path: "/api/folder/list", method: "GET" }
        },
        tagList: {
          v2: { path: "/api/v2/tag/get", method: "GET", query: (p) => `?offset=${p.offset || 0}&limit=${p.limit || 50}` },
          v1: { path: "/api/tag/list", method: "GET" }
        },
        itemLookupByUrl: {
          v2: { path: "/api/v2/item/get", method: "GET", query: (p) => `?url=${encodeURIComponent(p.url)}&limit=${p.limit || 100}` },
          v1: { path: "/api/item/list", method: "GET", query: (p) => `?url=${encodeURIComponent(p.url)}&limit=${p.limit || 100}` }
        },
        itemAdd: {
          v2: {
            path: "/api/v2/item/add",
            method: "POST",
            body: (p) => ({ url: p.url, name: p.name, website: p.website, tags: p.tags, annotation: p.annotation, folders: p.folders, headers: p.headers })
          },
          v1: {
            path: "/api/item/addFromURL",
            method: "POST",
            body: (p) => ({ url: p.url, name: p.name, website: p.website, tags: p.tags, annotation: p.annotation, folderIds: p.folders, headers: p.headers })
          }
        }
      };
      _EagleClient = class _EagleClient {
        constructor(options = {}) {
          const raw = String(options.baseURL || EAGLE_DEFAULT_BASE_URL).trim();
          this.baseURL = raw.replace(/\/+$/, "") || EAGLE_DEFAULT_BASE_URL;
          this.apiStyle = null;
          this.folderTree = null;
          this.tagNames = null;
          this.lookupCache = /* @__PURE__ */ new Map();
        }
        static xmlHttpRequest(option) {
          const xhr = typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null;
          if (!xhr) throw new Error("GreaseMonkey 兼容 XMLHttpRequest 不可用，无法访问 Eagle API。");
          return xhr({ withCredentials: false, ...option });
        }
        /**
         * 底层请求：统一补 baseURL、解析 JSON、把 Eagle 的错误包装成异常。
         */
        request(path, method, data) {
          return new Promise((resolve, reject) => {
            _EagleClient.xmlHttpRequest({
              method: method || "GET",
              url: this.baseURL + path,
              headers: { "Content-Type": "application/json" },
              data: data ? JSON.stringify(data) : void 0,
              timeout: 8e3,
              onload: /* @__PURE__ */ __name((res) => {
                let parsed = null;
                try {
                  parsed = JSON.parse(res.responseText || "{}");
                } catch (err) {
                  reject(new Error("Eagle 返回了无法解析的内容"));
                  return;
                }
                if (!(res.status >= 200 && res.status < 300)) {
                  reject(new Error(`Eagle HTTP ${res.status}`));
                  return;
                }
                if (parsed && parsed.status && parsed.status !== "success") {
                  reject(new Error(parsed.message || (typeof parsed.data === "string" ? parsed.data : "") || "Eagle API 错误"));
                  return;
                }
                resolve(parsed);
              }, "onload"),
              onerror: /* @__PURE__ */ __name(() => reject(new Error("Eagle API 请求失败（Eagle 未运行？）")), "onerror"),
              ontimeout: /* @__PURE__ */ __name(() => reject(new Error("Eagle API 请求超时")), "ontimeout")
            });
          });
        }
        /**
         * 探测 Eagle 的 API 风格并缓存：v2 可用则用 v2，否则回退 v1。
         * 两种都失败说明 Eagle 没运行（或端口被占用）。
         */
        async getApiStyle(force = false) {
          if (this.apiStyle && !force) return this.apiStyle;
          let lastError = null;
          for (const style of ["v2", "v1"]) {
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
          throw lastError || new Error("Eagle API 不可用");
        }
        /**
         * 按逻辑操作名调用 Eagle API；命中 404/405 时自动换另一种风格重试一次。
         */
        async callApi(key, params = {}) {
          const style = await this.getApiStyle();
          const spec = EAGLE_API_MAP[key] && EAGLE_API_MAP[key][style];
          if (!spec) throw new Error(`当前 Eagle（${style}）不支持该操作：${key}`);
          const build = /* @__PURE__ */ __name((target) => ({
            path: target.path + (typeof target.query === "function" ? target.query(params) : ""),
            method: target.method,
            data: typeof target.body === "function" ? target.body(params) : void 0
          }), "build");
          const call = build(spec);
          try {
            return await this.request(call.path, call.method, call.data);
          } catch (err) {
            const text = String(err && err.message || err);
            if (text.includes("404") || text.includes("method not allowed")) {
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
          if (Array.isArray(response?.data?.data)) return response.data.data;
          if (Array.isArray(response?.data)) return response.data;
          return [];
        }
        /**
         * 拉取文件夹树（自动兼容 v2 的分页扁平结构）并缓存。
         */
        async getFolders(force = false) {
          if (!force && Array.isArray(this.folderTree)) return this.folderTree;
          const style = await this.getApiStyle();
          const all = [];
          if (style === "v2") {
            const limit = 200;
            let offset = 0;
            let total = 0;
            do {
              const response = await this.callApi("folderList", { offset, limit });
              const page = _EagleClient.extractListData(response);
              total = Number(response?.data?.total || page.length || 0);
              all.push(...page);
              offset += limit;
              if (page.length === 0) break;
            } while (offset < total);
          } else {
            const response = await this.callApi("folderList", {});
            all.push(..._EagleClient.extractListData(response));
          }
          this.folderTree = _EagleClient.buildFolderTree(all);
          return this.folderTree;
        }
        /**
         * 统一成 {id, name, children} 的嵌套结构：v1 本来就返回嵌套，
         * v2 可能是带 parent 的扁平列表。
         */
        static buildFolderTree(list) {
          const nodes = (Array.isArray(list) ? list : []).filter((node) => node && node.id);
          const nested = /* @__PURE__ */ __name((node) => ({
            id: node.id,
            name: String(node.name || ""),
            children: (Array.isArray(node.children) ? node.children : []).filter((child) => child && child.id).map(nested)
          }), "nested");
          if (nodes.some((node) => Array.isArray(node.children) && node.children.length > 0)) {
            return nodes.map(nested);
          }
          const map = /* @__PURE__ */ new Map();
          nodes.forEach((node) => map.set(node.id, { id: node.id, name: String(node.name || ""), children: [] }));
          const roots = [];
          nodes.forEach((node) => {
            const self = map.get(node.id);
            const parentId = node.parent || node.parentId || "";
            if (parentId && map.has(parentId) && parentId !== node.id) map.get(parentId).children.push(self);
            else roots.push(self);
          });
          return roots;
        }
        /**
         * 拉取标签名列表（去重 + 拼音排序交给 UI 处理）。
         */
        async getTags(force = false) {
          if (!force && Array.isArray(this.tagNames)) return this.tagNames;
          const style = await this.getApiStyle();
          const raw = [];
          if (style === "v2") {
            let offset = 0;
            let total = Infinity;
            do {
              const response = await this.callApi("tagList", { offset, limit: 50 });
              const page = _EagleClient.extractListData(response);
              raw.push(...page);
              total = Number(response?.data?.total || raw.length);
              offset += page.length;
              if (page.length === 0) break;
            } while (offset < total);
          } else {
            const response = await this.callApi("tagList", {});
            raw.push(..._EagleClient.extractListData(response));
          }
          const names = /* @__PURE__ */ new Set();
          raw.forEach((tag) => {
            const name = typeof tag === "string" ? tag : tag?.name;
            if (name && String(name).trim()) names.add(String(name).trim());
          });
          this.tagNames = Array.from(names).sort((a, b) => a.localeCompare(b, "zh-CN"));
          return this.tagNames;
        }
        /**
         * 把文件夹 id 翻译成 “父级/子级” 形式的可读路径。
         */
        findFolderPath(folderId) {
          const target = String(folderId || "");
          if (!target) return "";
          const walk = /* @__PURE__ */ __name((nodes, prefix) => {
            for (const node of Array.isArray(nodes) ? nodes : []) {
              const path = prefix ? `${prefix}/${node.name}` : node.name;
              if (node.id === target) return path;
              const found = walk(node.children, path);
              if (found) return found;
            }
            return "";
          }, "walk");
          return walk(this.folderTree || [], "");
        }
        normalizeUrl(url) {
          return String(url || "").trim().replace(/[?#].*$/, "");
        }
        /**
         * Eagle 落库时会剥掉扩展名（扩展名单独存在 item.ext），
         * 而脚本给出的 task.name 可能带扩展名，所以比较前先规范化。
         */
        static isSameItemName(a, b) {
          const left = String(a || "").trim();
          const right = String(b || "").trim();
          if (!left || !right) return false;
          if (left === right) return true;
          return left.replace(/\.[a-z0-9]{1,5}$/i, "") === right.replace(/\.[a-z0-9]{1,5}$/i, "");
        }
        /**
         * 判断素材是否已经在 Eagle 里：
         * 按来源页面 URL 查询（v1 是子串匹配，必须再逐条复核 URL 与文件名）。
         */
        async findExisting(task) {
          const website = String(task?.website || "").trim();
          if (!website) return false;
          const cacheKey = this.normalizeUrl(website) || website;
          let items = this.lookupCache.get(cacheKey);
          if (!items) {
            const response = await this.callApi("itemLookupByUrl", { url: website, limit: 100 });
            items = _EagleClient.extractListData(response);
            this.lookupCache.set(cacheKey, items);
          }
          const targetUrl = this.normalizeUrl(website);
          return items.some((item) => {
            if (this.normalizeUrl(item?.url || "") !== targetUrl) return false;
            return _EagleClient.isSameItemName(item?.name, task?.name);
          });
        }

        /**
         * 把一条媒体直链交给 Eagle 下载入库。
         */
        async addFromURL(task) {
          return this.callApi("itemAdd", {
            url: task.url,
            name: task.name,
            website: task.website,
            tags: Array.isArray(task.tags) ? task.tags : [],
            annotation: task.annotation || "",
            folders: Array.isArray(task.folders) ? task.folders.filter(Boolean) : [],
            headers: task.headers
          });
        }
        /**
         * 抖音 CDN 对缺少来源头的下载请求可能直接拒绝，
         * 给这些域名补上页面级 Referer 与浏览器 UA。
         */
        static buildDownloadHeaders(rawUrl, userAgent) {
          const url = String(rawUrl || "").trim();
          if (!/^https?:\/\//i.test(url)) return void 0;
          let host = "";
          try {
            host = new URL(url).hostname.toLowerCase();
          } catch (err) {
            return void 0;
          }
          const matched = EAGLE_MEDIA_HOSTS.some((suffix) => host === suffix || host.endsWith("." + suffix));
          if (!matched) return void 0;
          const headers = { Referer: "https://www.douyin.com/" };
          const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
          if (ua) headers["User-Agent"] = ua;
          return headers;
        }
      };
      __name(_EagleClient, "EagleClient");
      EagleClient = _EagleClient;
      /**
       * 按 baseURL 复用单例，避免每次推送都重新探测 API 风格。
       */
      getEagleClient = (options = {}) => {
        const raw = String(options.baseURL || EAGLE_DEFAULT_BASE_URL).trim();
        const baseURL = raw.replace(/\/+$/, "") || EAGLE_DEFAULT_BASE_URL;
        if (!eagleClientSingleton || eagleClientSingleton.baseURL !== baseURL) {
          eagleClientSingleton = new _EagleClient({ baseURL });
        }
        return eagleClientSingleton;
      };
    }
  });

  // src/core/download/Downloader.ts
  init_Config();
  init_DownloaderLauncher();
  init_string();
  init_EagleClient();
  function parseMimeType(contentType) {
    return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  }
  __name(parseMimeType, "parseMimeType");
  function sanitizeFileExtension(ext) {
    return ext.match(/[a-z0-9]+/i)?.[0].toLowerCase() ?? "";
  }
  __name(sanitizeFileExtension, "sanitizeFileExtension");
  var _Downloader = class _Downloader {
    /**
     * 将 WebP 图片转换为 PNG 格式
     */
    async convertWebPToPNG(blob) {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
    }
    /**
     * 获取请求头
     */
    async get_headers(url) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) return new Headers();
        return response.headers;
      } catch {
        return new Headers();
      }
    }
    /**
     * 根据请求头猜测完整文件名
     */
    async prepare_filename(dl_url, filename_input = "", options = {}) {
      let url = dl_url;
      if (url.startsWith("//")) {
        url = window.location.protocol + url;
      }
      const headers = options.mediaType === "video" ? new Headers() : await this.get_headers(url);
      const content_disposition = headers.get("content-disposition") || "";
      const content_type = headers.get("content-type") || "";
      const content_length = headers.get("content-length") || "";
      const imagex_fmt = headers.get("Imagex-Fmt") || "";
      const mimeType = parseMimeType(content_type);
      const imagexFmt = imagex_fmt.toLowerCase();
      const isWebP = imagexFmt.includes("webp") || url.toLowerCase().includes(".webp") || mimeType.includes("webp");
      const isImage = options.mediaType === "image" || options.mediaType !== "video" && (!!imagex_fmt || mimeType.startsWith("image/") || isWebP);
      const isVideo = options.mediaType === "video" || mimeType.startsWith("video/");
      let fileExtGuess = mimeType.split("/")[1]?.toLowerCase();
      if (isWebP) fileExtGuess = "webp";
      else if (imagexFmt.includes("png")) fileExtGuess = "png";
      else if (imagexFmt.includes("jpeg") || imagexFmt.includes("jpg")) fileExtGuess = "jpg";
      if (!fileExtGuess && isImage) fileExtGuess = "jpg";
      else if (!fileExtGuess) fileExtGuess = "bin";
      let determinedFileExt = sanitizeFileExtension(fileExtGuess);
      if (options.mediaType === "video") {
        determinedFileExt = "mp4";
      } else if (content_disposition) {
        const m3 = content_disposition.match(/filename="(.+)"$/i);
        if (m3) {
          const fe = sanitizeFileExtension(m3[1].split(".").pop() ?? "");
          if (fe) determinedFileExt = fe;
        }
      }
      let filename = normalizeFilename(filename_input || new URL(url).pathname.split("/").pop() || "download");
      if (filename.endsWith(".image")) filename = filename.slice(0, -".image".length);
      filename = normalizeFilename(filename);
      let filename_base = normalizeBasename(filename.replace(/\.[^/.]+$/, ""));
      const re = new RegExp("\\." + determinedFileExt + "$", "i");
      if (!re.test(filename)) filename = normalizeFilename(filename_base + "." + determinedFileExt);
      filename = normalizeFilename(filename);
      filename_base = normalizeBasename(filename.replace(/\.[^/.]+$/, ""));
      return { filename, ext: determinedFileExt, isImage, isVideo, isWebP, headers, content_length, content_type, filename_base };
    }
    /**
     * 预下载文件
     *
     * PS: 这一步其实没有下载，而是通过浏览器的缓存读取了
     * PSS: 并且如果浏览器没有缓存，似乎会报错，因为server那边会校验cookie，我们没带上
     */
    async prepare_download_file(dl_url, filename_input = "", options = {}) {
      const meta = await this.prepare_filename(dl_url, filename_input, options);
      const response = await fetch(dl_url);
      if (!response.ok) {
        return { ok: false, error_msg: "Failed to fetch the file: " + response.status };
      }
      const blob = await response.blob();
      return {
        blob,
        filename: meta.filename,
        filename_base: meta.filename_base,
        isImage: meta.isImage,
        isWebP: meta.isWebP,
        content_type: meta.content_type,
        fileExt: meta.ext,
        ok: true
      };
    }
    /**
     * 使用浏览器下载 Blob
     */
    async download_blob(blob, filename) {
      const link = document.createElement("a");
      link.style.display = "none";
      link.download = normalizeFilename(filename);
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
    /**
     * 下载后处理：转码、压缩图片
     */
    async download_postprocess(blob, content_type, options = {}) {
      const looksLikeImage = parseMimeType(content_type).startsWith("image/") || blob.type.startsWith("image/") || options.isImage || options.isWebP;
      if (looksLikeImage) {
        const processor = new ImageProcessor(Config.global.clone_features());
        return processor.process(blob);
      }
      return { blob };
    }
    /**
     * 使用浏览器下载数据
     *
     * 下载文件流程:
     * 1. 预下载为 blob，读取元信息
     * 2. 如果是 webp 图片，尝试转为 png 图片
     * 3. 下载 blob
     */
    async download_using_browser(url, filename_input, options = {}) {
      let blob;
      let filename;
      try {
        const result = await this.prepare_download_file(url, filename_input, options);
        if (!result.ok) return { ok: false, error_msg: result.error_msg || "预下载失败" };
        filename = result.filename;
        blob = result.blob;
        const { blob: new_blob, outputType } = await this.download_postprocess(blob, result.content_type ?? "", {
          isImage: result.isImage,
          isWebP: result.isWebP
        });
        blob = new_blob;
        if (outputType === "image/png") filename = result.filename_base + ".png";
        else if (outputType === "image/jpeg") filename = result.filename_base + ".jpeg";
        else if (outputType === "image/webp") filename = result.filename_base + ".webp";
      } catch (error) {
        console.error("[dy-dl]预下载异常", error);
        return { ok: false, error_msg: "预下载异常" };
      }
      if (blob && filename) {
        try {
          await this.download_blob(blob, filename);
          return { ok: true, error_msg: "" };
        } catch (error) {
          console.error("[dy-dl]下载blob失败", error);
          return { ok: false, error_msg: "下载失败" };
        }
      }
      return { ok: false, error_msg: "下载失败" };
    }
    /**
     * 根据配置使用不同的下载器
     */
    async download_one_url(url, filename_input, options = {}) {
      const { using_downloader, downloader_config } = Config.global.features;
      const activeDownloader = options.downloaderOverride || using_downloader;
      switch (activeDownloader) {
        case "eagle":
          return this.eagle_push(url, filename_input, options);
        case "browser":
          return this.download_using_browser(url, filename_input, options);
        case "idm":
        case "aria2":
        case "bc":
        case "abdm": {
          let resolvedFilename = filename_input;
          try {
            const meta = await this.prepare_filename(url, filename_input, options);
            resolvedFilename = meta.filename;
          } catch (e3) {
            console.warn("[dy-dl] prepare_filename failed, using input filename", e3);
          }
          const launcher = new DownloaderLauncher({
            idmList: [{ id: downloader_config.idm?.id || "1" }],
            aria2List: [
              {
                domain: downloader_config.aria2?.domain || "http://localhost",
                port: downloader_config.aria2?.port || "6800",
                path: downloader_config.aria2?.path || "/jsonrpc",
                token: downloader_config.aria2?.token ?? "",
                dir: ""
              }
            ],
            bitcometList: [
              {
                domain: downloader_config.bc?.domain || "http://localhost",
                port: downloader_config.bc?.port || "8080",
                path: downloader_config.bc?.path || "/panel/task_add_httpftp_result",
                authName: downloader_config.bc?.authName ?? "",
                authPass: downloader_config.bc?.authPass ?? "",
                dir: ""
              }
            ],
            abdmList: [{ domain: downloader_config.abdm?.domain || "http://localhost", port: downloader_config.abdm?.port || "15151", dir: "" }]
          });
          const ok = await launcher.invoke_download(url, activeDownloader, downloader_config[activeDownloader]?.dir, {
            filename_input: resolvedFilename,
            media: options.media,
            mediaType: options.mediaType
          });
          return { ok: !!ok, error_msg: "" };
        }
        default:
          return { ok: false, error_msg: "未知下载器" };
      }
    }
    /**
     * 推送到 Eagle
     *
     * Eagle 会自己异步拉取媒体直链，所以这里只负责：
     * 1. 从候选地址里挑一个对 Eagle 最友好的（带签名的 CDN 直链优先，
     *    因为 Eagle 是外部程序、没有浏览器的 cookie，同源 playApi 只作兜底）；
     * 2. 组装 name / website / tags / annotation；
     * 3. 可选地先查重再入库。
     *
     * tags 为空表示不添加任何标签（配置里未选择标签时的默认行为）。
     */
    async eagle_push(url, filename_input, options = {}) {
      const config = Config.global.features.downloader_config?.eagle || {};
      const media = options.media;
      const client = getEagleClient({ baseURL: config.base_url });
      const name = normalizeBasename(filename_input || urlFilenameFallback(url));
      const website = _Downloader.buildMediaWebsite(media);
      const preferredUrl = _Downloader.pickEagleFriendlyUrl(options.candidateUrls, url);
      const tags = Array.isArray(config.tags) ? config.tags.filter(Boolean) : [];
      const folders = config.folder_id ? [config.folder_id] : [];
      const annotation = _Downloader.buildEagleAnnotation(media, { website, mediaType: options.mediaType });
      try {
        if (config.skip_existing) {
          const exists = await client.findExisting({ name, website });
          if (exists) return { ok: true, error_msg: "", skipped: true };
        }
        await client.addFromURL({
          url: preferredUrl,
          name,
          website,
          tags,
          folders,
          annotation,
          headers: config.send_referer ? _EagleClient.buildDownloadHeaders(preferredUrl) : void 0
        });
        return { ok: true, error_msg: "" };
      } catch (err) {
        console.warn("[dy-dl] Eagle 推送失败", err);
        return { ok: false, error_msg: `Eagle 推送失败：${err?.message || err}` };
      }
    }
    /** 作品在抖音的规范页面地址（用于 Eagle 的来源 URL / 去重） */
    static buildMediaWebsite(media) {
      const awemeId = media?.awemeId;
      if (!awemeId) return media?.shareInfo?.shareUrl || "";
      const isAlbum = Array.isArray(media?.images) && media.images.length > 0;
      return `https://www.douyin.com/${isAlbum ? "note" : "video"}/${awemeId}`;
    }
    /** 从候选地址里挑对 Eagle 最友好的一个 */
    static pickEagleFriendlyUrl(candidates, fallback) {
      const list = (Array.isArray(candidates) ? candidates : []).filter((u) => typeof u === "string" && u.length > 0);
      const score = /* @__PURE__ */ __name((u) => {
        const s = u.toLowerCase();
        if (/douyinvod\.com|zjcdn|\.mp4(\?|$)/.test(s)) return 0;
        if (/aweme\/v1\/play\//.test(s)) return 2;
        return 1;
      }, "score");
      const best = list.slice().sort((a, b) => score(a) - score(b))[0];
      return best || fallback;
    }
    /** 组装写进 Eagle 素材的说明文本 */
    static buildEagleAnnotation(media, meta = {}) {
      const lines = [];
      const desc = String(media?.desc || "").trim();
      if (desc) lines.push(desc);
      const nickname = media?.authorInfo?.nickname || "";
      const uid = media?.authorInfo?.uid || media?.authorUserId || "";
      if (nickname) lines.push(`作者: ${nickname}${uid ? ` (${uid})` : ""}`);
      const createTime = Number(media?.createTime) || 0;
      if (createTime > 0) {
        const date = new Date(createTime * 1e3);
        if (!Number.isNaN(date.getTime())) {
          const pad = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "pad");
          lines.push(`发布: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
        }
      }
      if (meta.website) lines.push(meta.website);
      if (media?.awemeId) lines.push(`[dy-dl] aweme:${media.awemeId}${meta.mediaType ? ` type:${meta.mediaType}` : ""}`);
      return lines.filter(Boolean).join("\n");
    }
    /**
     * 下载文件，根据所有 url 逐一尝试下载
     */
    async download_file_with_error(source, filename_input = "", fallback_src = [], options = {}) {
      let url_sources = [source, ...fallback_src].filter((x2) => typeof x2 === "string" && x2.length > 0);
      url_sources = Array.from(new Set(url_sources));
      const attemptOptions = { ...options, candidateUrls: url_sources };
      let error_msg = "";
      for (const url of url_sources) {
        const r3 = await this.download_one_url(url, filename_input, attemptOptions);
        error_msg = error_msg || r3.error_msg;
        if (r3.ok) return { ok: true, error_msg: "" };
      }
      if (!options.silent) {
        alert(error_msg && url_sources.length === 1 ? error_msg : "[dy-dl]所有尝试下载都失败，请刷新重试");
      }
      return { ok: false, error_msg };
    }
    async download_file(source, filename_input = "", fallback_src = [], options = {}) {
      return (await this.download_file_with_error(source, filename_input, fallback_src, options)).ok;
    }
  };
  __name(_Downloader, "Downloader");
  var Downloader = _Downloader;

  // src/index.ts
  init_Config();

  // src/core/DOMPatcher.ts
  init_Config();

  // src/ui/TooltipsButton.ts
  function renderHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.children[0];
  }
  __name(renderHtml, "renderHtml");
  var _TooltipsButton = class _TooltipsButton {
    constructor(label, items, onclick, playerControlMode = "douyin") {
      this.label = label;
      this.items = items;
      this.onclick = onclick;
      this.playerControlMode = playerControlMode;
    }
    render() {
      const rootTag = this.playerControlMode === "xgplayer" ? "xg-icon" : "dy-icon";
      const settingClass = this.playerControlMode === "xgplayer" ? "xgplayer-playclarity-setting" : "douyin-player-playclarity-setting";
      const htmlStr = "<" + rootTag + '  class="' + settingClass + ' dy-dl-video-btn"  data-state="normal"  data-index="11">  <div class="gear isSmoothSwitchClarityLogin">    <div class="virtual"></div>    <div class="btn" tabindex="0">' + this.label + "</div>  </div></" + rootTag + ">";
      const root = renderHtml(htmlStr);
      const $gear = root.querySelector(".gear");
      const $items_list = root.querySelector(".virtual");
      const $btn = root.querySelector(".btn");
      $gear.addEventListener("mouseenter", () => $gear.classList.add("hover"));
      $gear.addEventListener("mouseleave", () => $gear.classList.remove("hover"));
      for (const item of this.items) {
        if (item.html) {
          $items_list.appendChild(renderHtml(item.html));
          continue;
        }
        if (item.render) {
          $items_list.appendChild(item.render());
          continue;
        }
        const $item = renderHtml('<div class="item">' + item.label + "</div>");
        $item.addEventListener("click", item.callback);
        $items_list.appendChild($item);
      }
      $btn.addEventListener("click", this.onclick);
      return root;
    }
  };
  __name(_TooltipsButton, "TooltipsButton");
  var TooltipsButton = _TooltipsButton;

  // src/handlers/profile/ProfileDataService.ts
  init_string();
  var _ProfileDataService = class _ProfileDataService {
    constructor() {
      this.feedMediaCache = /* @__PURE__ */ new Map();
    }
    static findReactFiber(node) {
      let current = node;
      while (current) {
        const fiberKey = Object.keys(current).find((key) => key.startsWith("__reactFiber$"));
        if (fiberKey) return current[fiberKey];
        current = current.parentElement;
      }
      return null;
    }
    static getAwemeIdFromHref(href = "") {
      const match = href.match(/\/(?:video|note)\/(\d+)/);
      return match?.[1] || "";
    }
    _extractFeedMedia(card) {
      let fiber = _ProfileDataService.findReactFiber(card);
      while (fiber) {
        const props = fiber.memoizedProps;
        const candidate = props?.awemeInfo || props?.itemInfo?.awemeInfo || (props?.itemInfo?.awemeId ? props.itemInfo : null);
        if (candidate?.awemeId) {
          this.feedMediaCache.set(candidate.awemeId, candidate);
          return candidate;
        }
        fiber = fiber.return;
      }
      const awemeId = _ProfileDataService.getAwemeIdFromHref(card.getAttribute("href") || "");
      return awemeId ? this.feedMediaCache.get(awemeId) || null : null;
    }
    collectCurrentFeedMedia() {
      const medias = [];
      const seen = /* @__PURE__ */ new Set();
      document.querySelectorAll(_ProfileDataService.FEED_CARD_SELECTOR).forEach((card) => {
        const media = this._extractFeedMedia(card);
        if (!media?.awemeId || seen.has(media.awemeId)) return;
        seen.add(media.awemeId);
        this.feedMediaCache.set(media.awemeId, media);
        medias.push(media);
      });
      return medias;
    }
    isProfilePage() {
      return isProfilePagePath();
    }
    getProfileContext() {
      if (!this.isProfilePage()) return null;
      const pathSecUid = location.pathname.replace(/^\/user\//, "").trim();
      const scannedMedia = this.collectCurrentFeedMedia().find((m3) => m3?.authorInfo?.secUid);
      const secUid = pathSecUid && pathSecUid !== "self" ? pathSecUid : scannedMedia?.authorInfo?.secUid || pathSecUid || "";
      const titleName = document.title.split("的抖音")[0]?.trim() || "";
      const profileName = scannedMedia?.authorInfo?.nickname || titleName;
      const activeTab = new URLSearchParams(location.search).get("showTab") || "post";
      const profileKey = secUid || "self:" + activeTab;
      return { secUid, profileName, tabKey: activeTab, profileKey };
    }
    _findScrollContainer() {
      const firstCard = document.querySelector(_ProfileDataService.FEED_CARD_SELECTOR);
      let current = firstCard instanceof HTMLElement ? firstCard.parentElement : null;
      while (current instanceof HTMLElement) {
        const style = window.getComputedStyle(current);
        const isScrollable = ["auto", "scroll", "overlay"].includes(style.overflowY) && current.scrollHeight > current.clientHeight + 100;
        if (isScrollable) return current;
        current = current.parentElement;
      }
      return document.querySelector(".route-scroll-container") || document.querySelector(".parent-route-container") || document.scrollingElement || document.documentElement;
    }
    async scrollPageOnce() {
      const container = this._findScrollContainer();
      if (!container) return false;
      const isDoc = container === document.body || container === document.documentElement || container === document.scrollingElement;
      const beforeTop = isDoc ? window.scrollY : container.scrollTop;
      const clientHeight = isDoc ? window.innerHeight : container.clientHeight;
      const scrollHeight = container.scrollHeight;
      const maxTop = Math.max(0, scrollHeight - clientHeight);
      const nextTop = Math.min(beforeTop + Math.max(clientHeight * 0.85, 480), maxTop);
      if (nextTop <= beforeTop + 4) return false;
      if (isDoc) window.scrollTo({ top: nextTop, behavior: "smooth" });
      else container.scrollTo({ top: nextTop, behavior: "smooth" });
      await new Promise((r3) => setTimeout(r3, 1200));
      return true;
    }
  };
  __name(_ProfileDataService, "ProfileDataService");
  _ProfileDataService.FEED_CARD_SELECTOR = '.waterfall-videoCardContainer[href], [href*="/video/"][target="_blank"], [href*="/note/"][target="_blank"]';
  var ProfileDataService = _ProfileDataService;

  // src/core/DOMPatcher.ts
  var FEED_STATUS_STYLES = {
    running: { background: "#2b2b2d", border: "1px solid #ffb74d", color: "#ffd79a" },
    downloaded: { background: "#2b2b2d", border: "1px solid #66bb6a", color: "#a5d6a7" },
    failed: { background: "#2b2b2d", border: "1px solid #ef5350", color: "#ef9a9a" },
    pending: { background: "#2b2b2d", border: "1px solid rgba(255,255,255,0.35)", color: "#fff" }
  };
  function formatFeedFileSize(bytes) {
    if (!bytes || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    return value.toFixed(index === 0 ? 0 : 1) + " " + units[index];
  }
  __name(formatFeedFileSize, "formatFeedFileSize");
  function formatFeedDuration(duration) {
    if (!duration || duration <= 0) return "";
    const totalSeconds = Math.max(1, Math.round(duration >= 1e3 ? duration / 1e3 : duration));
    const h3 = Math.floor(totalSeconds / 3600);
    const m3 = Math.floor(totalSeconds % 3600 / 60);
    const s5 = totalSeconds % 60;
    return h3 > 0 ? `${h3}:${String(m3).padStart(2, "0")}:${String(s5).padStart(2, "0")}` : `${String(m3).padStart(2, "0")}:${String(s5).padStart(2, "0")}`;
  }
  __name(formatFeedDuration, "formatFeedDuration");
  function applyFeedStatusStyle(el, tone) {
    const style = FEED_STATUS_STYLES[tone];
    el.style.background = style.background;
    el.style.border = style.border;
    el.style.color = style.color;
  }
  __name(applyFeedStatusStyle, "applyFeedStatusStyle");
  function getFeedMetaLines(media) {
    if (!media) return [];
    if (Array.isArray(media.images) && media.images.length > 0) return ["🖼️ 图集", `图片数: ${media.images.length}张`];
    const video = media.video;
    if (!video) return [];
    const candidates = (video.bitRateList || []).filter((item) => item?.format !== "dash" && (item.dataSize || item.width || item.height));
    const best = candidates.slice().sort((a3, b) => (b.dataSize || 0) - (a3.dataSize || 0))[0] || video;
    const width = best.width || video.width;
    const height = best.height || video.height;
    const size = formatFeedFileSize(best.dataSize || video.dataSize);
    const duration = formatFeedDuration(video.duration);
    const lines = ["🎬 视频"];
    if (width && height) lines.push(`分辨率: ${width}x${height}`);
    if (size) lines.push(`最大大小: ${size}`);
    if (duration) lines.push(`时长: ${duration}`);
    return lines;
  }
  __name(getFeedMetaLines, "getFeedMetaLines");
  var PLAYER_CONTROL_SELECTOR = ".douyin-player-controls, xg-controls";
  var PLAYER_RIGHT_GRID_SELECTOR = ".douyin-player-controls-right, .xg-right-grid";
  var PLAYER_CONTROL_TREE_SELECTOR = `${PLAYER_CONTROL_SELECTOR}, ${PLAYER_RIGHT_GRID_SELECTOR}`;
  var _DOMPatcher = class _DOMPatcher {
    /**
     * @param options - 包含各处理器实例的配置对象
     */
    constructor(options) {
      this.playerControlSyncPending = false;
      this.feed_card_selector_cls = "dy-dl-feed-selector";
      this.downloader = options.downloader;
      this.mediaHandler = options.mediaHandler;
      this.videoHandler = options.videoHandler;
      this.danmakuHandler = options.danmakuHandler;
      this.profilePageHandler = options.profilePageHandler;
      this.observer = new MutationObserver(this._handleMutations.bind(this));
      Config.global.events.on("config_change", this._on_config_change.bind(this));
    }
    /**
     * 渲染 HTML 字符串为 DOM 元素
     */
    static render_html(html) {
      const div = document.createElement("div");
      div.innerHTML = html.trim();
      return div.children[0];
    }
    /** 从节点向上遍历 DOM 树查找 img 元素 */
    static findImage(node) {
      let img;
      let current = node;
      while (current) {
        img = current.querySelector("img");
        if (img) return img;
        current = current.parentElement instanceof HTMLElement ? current.parentElement : null;
      }
      return null;
    }
    /** 配置变更时同步卡片选择器和快捷键提示 */
    _on_config_change() {
      this._sync_shortcut_labels();
      this._sync_feed_cards();
    }
    /** 同步播放器菜单中的快捷键提示 */
    _sync_shortcut_labels() {
      const label = this._shortcut_label();
      document.body.querySelectorAll(".dy-dl-video-btn .shortcutKey").forEach((el) => {
        el.textContent = label;
      });
    }
    /** 当前下载快捷键展示文本 */
    _shortcut_label() {
      const features = Config.global.features;
      if (!features.enable_download_shortcut) return "已禁用";
      return features.download_shortcut?.trim() || "未设置";
    }
    /** 同步所有 feed 卡片的选择器状态 */
    _sync_feed_cards() {
      document.body.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR).forEach((card) => this._handleProfileCard(card));
    }
    /** 处理 DOM 变更 */
    _handleMutations(mutations) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node;
          if (el.classList.contains("semi-portal")) {
            const tn = el.querySelector(".semi-tooltip-wrapper");
            if (tn) {
              setTimeout(() => this._handleTooltip(tn));
              return;
            }
          }
          if (el.parentElement === document.body && el.classList.length === 0) {
            setTimeout(() => this._handleModal(el));
            return;
          }
          if (this._isPlayerControlNode(el)) {
            this._schedulePlayerControlSync();
            return;
          }
          if (el.matches(ProfileDataService.FEED_CARD_SELECTOR)) {
            this._handleProfileCard(el);
            return;
          }
          if (el.localName === "li") {
            Array.from(el.querySelectorAll(ProfileDataService.FEED_CARD_SELECTOR)).forEach((dom) => this._handleProfileCard(dom));
          }
        });
      });
    }
    _isPlayerControlNode(node) {
      return node.matches(PLAYER_CONTROL_TREE_SELECTOR) || Boolean(node.querySelector(PLAYER_CONTROL_TREE_SELECTOR)) || Boolean(node.closest(PLAYER_CONTROL_TREE_SELECTOR));
    }
    _schedulePlayerControlSync() {
      if (this.playerControlSyncPending) return;
      this.playerControlSyncPending = true;
      setTimeout(() => {
        this.playerControlSyncPending = false;
        this._sync_player_controls();
      }, 80);
    }
    _sync_player_controls() {
      document.body.querySelectorAll(PLAYER_RIGHT_GRID_SELECTOR).forEach((grid) => this._handleXgControl(grid));
    }
    /** 处理模态框，注入图片下载按钮 */
    _handleModal(modalNode) {
      const close_icon = modalNode.querySelector("#svg_icon_ic_close");
      const img = modalNode.querySelector("img");
      const container = img?.closest(`div[style*="transform: scale(1)"] > div`) || img?.parentElement;
      if (!close_icon || !img || !container) return;
      if (container.querySelector(".dy-dl-modal-btn")) return;
      const btn = document.createElement("div");
      btn.textContent = "下载图片";
      btn.className = "LV01TNDE dy-dl-modal-btn";
      btn.addEventListener("click", (e3) => {
        e3.stopPropagation();
        this.downloader.download_file(img.src, "douyin_image");
      });
      Object.assign(btn.style, {
        position: "absolute",
        bottom: "35px",
        right: "35px",
        color: "#fff",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: "5px 10px",
        borderRadius: "4px",
        fontSize: "16px",
        zIndex: "999999",
        cursor: "pointer"
      });
      container.appendChild(btn);
    }
    /** 处理 Tooltip，注入表情下载按钮 */
    _handleTooltip(tooltipNode) {
      const tc = tooltipNode.querySelector(".semi-tooltip-content");
      if (!tc || !tc.textContent?.includes("添加到表情")) return;
      const imgNode = _DOMPatcher.findImage(tooltipNode);
      if (!imgNode?.src) return;
      const existing = tc.querySelector(".download-button");
      if (existing) return;
      const btn = document.createElement("div");
      btn.textContent = "下载表情包";
      btn.className = "LV01TNDE download-button";
      btn.style.cssText = "cursor: pointer; padding-top: 4px;";
      btn.addEventListener("click", (e3) => {
        e3.stopPropagation();
        this.downloader.download_file(imgNode.src, "douyin_emoticon");
      });
      tc.appendChild(btn);
    }
    /** 处理播放器控件，注入插件菜单 */
    _handleXgControl(controlNode) {
      const rightGrid = controlNode.matches(PLAYER_RIGHT_GRID_SELECTOR) ? controlNode : controlNode.querySelector(PLAYER_RIGHT_GRID_SELECTOR);
      if (!rightGrid) return;
      const rightGridChildren = Array.from(rightGrid.children);
      if (rightGridChildren.some((child) => child.matches(".dy-dl-video-btn"))) return;
      const isXgPlayer = rightGrid.matches(".xg-right-grid");
      const btn = new TooltipsButton(
        "插件",
        [
          {
            render: /* @__PURE__ */ __name(() => {
              const item = document.createElement("div");
              item.className = isXgPlayer ? "xgTips item" : "item";
              const label = document.createElement("span");
              label.textContent = "快捷键：";
              const shortcut = document.createElement("span");
              shortcut.className = "shortcutKey";
              shortcut.textContent = this._shortcut_label();
              item.append(label, shortcut);
              return item;
            }, "render")
          },
          { label: "需求/反馈", callback: /* @__PURE__ */ __name(() => window.open("https://github.com/zhzLuke96/douyin-dl-user-js/issues", "_blank", "noopener,noreferrer"), "callback") },
          { label: "设置", callback: /* @__PURE__ */ __name(() => this.mediaHandler.open_config_modal(), "callback") },
          { label: "媒体详情", callback: /* @__PURE__ */ __name(() => this.mediaHandler.show_media_details(), "callback") },
          {
            label: "下载弹幕",
            callback: /* @__PURE__ */ __name(() => {
              if (!this.mediaHandler.player) {
                alert("当前没有播放器实例");
                return;
              }
              if (!this.mediaHandler.current_media) {
                alert("当前没有媒体实例");
                return;
              }
              const content = this.danmakuHandler.getDanmakuAssFileContent(this.mediaHandler.player);
              if (content) {
                const fn = this.mediaHandler._build_filename(this.mediaHandler.current_media);
                this.downloader.download_blob(new Blob([content], { type: "text/plain" }), fn + ".ass");
              }
            }, "callback")
          },
          { label: "复制视频帧", callback: /* @__PURE__ */ __name(() => this.videoHandler.copy_current_frame(), "callback") },
          { label: "下载视频帧", callback: /* @__PURE__ */ __name(() => this.videoHandler.download_current_frame(), "callback") },
          { label: "存到 Eagle", callback: /* @__PURE__ */ __name(() => this.mediaHandler.push_current_to_eagle(), "callback") },
          { label: "下载", callback: /* @__PURE__ */ __name(() => this.mediaHandler.download_current_media(), "callback") }
        ],
        () => {
        },
        isXgPlayer ? "xgplayer" : "douyin"
      );
      const db = btn.render();
      const findAnchor = /* @__PURE__ */ __name((selector) => rightGridChildren.find((child) => child.matches(selector)) || null, "findAnchor");
      const qs = findAnchor(".douyin-player-playclarity-setting, .xgplayer-quality-setting");
      const vc = findAnchor(".douyin-player-volume, .xgplayer-volume");
      if (qs && qs.parentNode) qs.parentNode.insertBefore(db, qs);
      else if (vc && vc.parentNode) vc.parentNode.insertBefore(db, vc);
      else rightGrid.appendChild(db);
    }
    /** 处理个人主页卡片，注入选择器 */
    _handleProfileCard(card) {
      const dom = card.querySelector("." + this.feed_card_selector_cls);
      if (!Config.global.features.enable_profile_downloader) {
        dom?.remove();
        return;
      } else if (dom) return;
      const media = this.profilePageHandler.dataService._extractFeedMedia(card);
      const { awemeId } = media || {};
      if (!awemeId) return;
      const pos = window.getComputedStyle(card).position;
      if (!pos || pos === "static") card.style.position = "relative";
      const mask = document.createElement("div");
      mask.className = this.feed_card_selector_cls;
      mask.setAttribute("role", "button");
      mask.setAttribute("aria-label", "切换视频选择");
      Object.assign(mask.style, {
        position: "absolute",
        inset: "0",
        zIndex: "10",
        cursor: "pointer",
        background: "transparent",
        userSelect: "none",
        touchAction: "manipulation"
      });
      const badgeGroup = document.createElement("div");
      Object.assign(badgeGroup.style, {
        position: "absolute",
        top: "10px",
        left: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        maxWidth: "calc(100% - 20px)",
        pointerEvents: "none",
        userSelect: "none"
      });
      const badge = document.createElement("div");
      Object.assign(badge.style, {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "27px",
        padding: "0 10px",
        boxSizing: "border-box",
        borderRadius: "999px",
        background: "#2b2b2d",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "#fff",
        fontSize: "12px",
        fontFamily: "sans-serif"
      });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "dy-dl-feed-checkbox";
      cb.style.cssText = "margin: 0; pointer-events: none;";
      const label = document.createElement("span");
      label.className = "dy-dl-feed-select-label";
      label.textContent = "选择";
      badge.append(cb, label);
      const statusRow = document.createElement("div");
      Object.assign(statusRow.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px"
      });
      const makeStatusBadge = /* @__PURE__ */ __name((className) => {
        const el = document.createElement("div");
        el.className = className;
        Object.assign(el.style, {
          display: "inline-flex",
          alignItems: "center",
          height: "27px",
          padding: "0 10px",
          boxSizing: "border-box",
          borderRadius: "999px",
          background: "#2b2b2d",
          border: "1px solid rgba(255,255,255,0.35)",
          color: "#fff",
          fontSize: "12px",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap"
        });
        return el;
      }, "makeStatusBadge");
      const contentBadge = makeStatusBadge("dy-dl-feed-content-status");
      const coverBadge = makeStatusBadge("dy-dl-feed-cover-status");
      statusRow.append(contentBadge, coverBadge);
      const metaPanel = document.createElement("div");
      metaPanel.className = "dy-dl-feed-meta";
      Object.assign(metaPanel.style, {
        display: "none",
        flexDirection: "column",
        gap: "2px",
        maxWidth: "100%",
        padding: "6px 10px",
        boxSizing: "border-box",
        borderRadius: "10px",
        background: "#2b2b2d",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "#fff",
        fontSize: "12px",
        fontFamily: "sans-serif",
        lineHeight: "1.5"
      });
      badgeGroup.append(badge, statusRow, metaPanel);
      mask.append(badgeGroup);
      card.appendChild(mask);
      const renderState = /* @__PURE__ */ __name((status) => {
        cb.checked = status.selected;
        mask.setAttribute("aria-pressed", status.selected ? "true" : "false");
        mask.style.boxShadow = status.selected ? "inset 0 0 0 2px rgba(64,150,255,0.75)" : "none";
        const contentRunning = status.running && status.runningType === "content";
        const coverRunning = status.running && status.runningType === "cover";
        contentBadge.textContent = contentRunning ? "内容下载中" : status.failed ? "内容失败" : status.contentDownloaded ? "内容已下载" : "内容未下载";
        applyFeedStatusStyle(contentBadge, contentRunning ? "running" : status.failed ? "failed" : status.contentDownloaded ? "downloaded" : "pending");
        coverBadge.textContent = coverRunning ? "封面下载中" : status.coverFailed ? "封面失败" : status.coverDownloaded ? "封面已下载" : "封面未下载";
        applyFeedStatusStyle(coverBadge, coverRunning ? "running" : status.coverFailed ? "failed" : status.coverDownloaded ? "downloaded" : "pending");
        const media2 = this.profilePageHandler.dataService.feedMediaCache.get(awemeId);
        const lines = media2 ? getFeedMetaLines(media2) : [];
        metaPanel.replaceChildren();
        if (lines.length) {
          metaPanel.style.display = "flex";
          lines.forEach((line) => {
            const row = document.createElement("span");
            row.style.whiteSpace = "nowrap";
            row.textContent = line;
            metaPanel.append(row);
          });
        } else {
          metaPanel.style.display = "none";
        }
      }, "renderState");
      const toggle = /* @__PURE__ */ __name((ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const selected = !this.profilePageHandler.downloadManager._isFeedSelected(awemeId);
        this.profilePageHandler.downloadManager.markSelect(awemeId, selected);
      }, "toggle");
      mask.addEventListener("click", toggle);
      mask.addEventListener("mousedown", (ev) => ev.stopPropagation());
      const render = /* @__PURE__ */ __name(() => {
        if (!mask.parentElement) return;
        renderState(this.profilePageHandler.downloadManager.getFeedCardStatus(awemeId));
      }, "render");
      render();
      this.profilePageHandler.downloadManager.on("countsUpdated", render);
      this.profilePageHandler.downloadManager.on("stateChanged", render);
    }
    /** 启动 DOM 观察 */
    startObserving() {
      this.observer.observe(document.body, { childList: true, subtree: true });
      this._sync_player_controls();
    }
  };
  __name(_DOMPatcher, "DOMPatcher");
  var DOMPatcher = _DOMPatcher;

  // src/core/HotkeyManager.ts
  function parseShortcut(shortcut) {
    const parts = shortcut.split("+").map((part) => part.trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return null;
    const result = { key: "", ctrl: false, alt: false, shift: false, meta: false };
    for (const part of parts) {
      if (part === "ctrl" || part === "control") result.ctrl = true;
      else if (part === "alt" || part === "option") result.alt = true;
      else if (part === "shift") result.shift = true;
      else if (part === "meta" || part === "command" || part === "cmd" || part === "win" || part === "windows") result.meta = true;
      else if (result.key) return null;
      else result.key = part;
    }
    return result.key ? result : null;
  }
  __name(parseShortcut, "parseShortcut");
  function matchesShortcut(ev, shortcut) {
    return ev.key.toLowerCase() === shortcut.key && ev.ctrlKey === shortcut.ctrl && ev.altKey === shortcut.alt && ev.shiftKey === shortcut.shift && ev.metaKey === shortcut.meta;
  }
  __name(matchesShortcut, "matchesShortcut");
  var _HotkeyManager = class _HotkeyManager {
    /**
     * 注册快捷键，支持 M、Ctrl+M、Alt+Shift+M 等写法
     */
    addHotkey(shortcut, fn) {
      const parsed = parseShortcut(shortcut);
      if (!parsed) return { dispose: /* @__PURE__ */ __name(() => {
      }, "dispose") };
      const callback = /* @__PURE__ */ __name((ev) => {
        if (!matchesShortcut(ev, parsed)) return;
        const activeElement = document.activeElement;
        if (activeElement) {
          const tagName = activeElement.tagName;
          const isInputElement = tagName === "INPUT" || tagName === "TEXTAREA" || activeElement.isContentEditable;
          if (isInputElement) return;
        }
        ev.preventDefault();
        fn();
      }, "callback");
      document.addEventListener("keydown", callback);
      const dispose = /* @__PURE__ */ __name(() => document.removeEventListener("keydown", callback), "dispose");
      return { dispose };
    }
  };
  __name(_HotkeyManager, "HotkeyManager");
  var HotkeyManager = _HotkeyManager;

  // src/handlers/MediaHandler.tsx
  init_preact_module();
  init_Config();
  init_DownloadHistory();

  // src/ui/modals/Modal.ts
  var _Modal = class _Modal {
    constructor(callback, onBeforeClose) {
      this.onBeforeClose = onBeforeClose;
      this.overlay = document.createElement("div");
      Object.assign(this.overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "1000"
      });
      this.root = document.createElement("div");
      Object.assign(this.root.style, {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "300px",
        minHeight: "150px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      });
      this.root.addEventListener("click", (e3) => e3.stopPropagation());
      this.overlay.addEventListener("click", () => {
        if (this.onBeforeClose && !this.onBeforeClose()) return;
        this.close();
      });
      this.overlay.appendChild(this.root);
      document.body.appendChild(this.overlay);
      if (typeof callback === "function") {
        callback(this.root, this.overlay);
      }
    }
    close() {
      if (this.onBeforeClose && !this.onBeforeClose()) return;
      this.overlay.remove();
    }
  };
  __name(_Modal, "Modal");
  var Modal = _Modal;

  // src/utils/dom.ts
  function createToast(target, defaultDuration = 2e3) {
    let toastEl = null;
    let timeoutId = null;
    const getTargetElement = /* @__PURE__ */ __name(() => {
      if (!target) return null;
      if (typeof target === "string") return document.querySelector(target);
      return target.nodeType === Node.ELEMENT_NODE ? target : null;
    }, "getTargetElement");
    const updatePosition = /* @__PURE__ */ __name(() => {
      if (!toastEl) return;
      const targetEl = getTargetElement();
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const top = rect.top - toastEl.offsetHeight - 5;
        const left = rect.left + (rect.width - toastEl.offsetWidth) / 2;
        toastEl.style.top = `${top}px`;
        toastEl.style.left = `${left}px`;
        toastEl.style.right = "auto";
        toastEl.style.bottom = "auto";
      } else {
        toastEl.style.bottom = "20px";
        toastEl.style.right = "20px";
        toastEl.style.top = "auto";
        toastEl.style.left = "auto";
      }
    }, "updatePosition");
    const close = /* @__PURE__ */ __name(() => {
      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }, "close");
    const update = /* @__PURE__ */ __name((message, duration = defaultDuration) => {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.className = "dy-dl-toast";
        Object.assign(toastEl.style, {
          position: "fixed",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          zIndex: "999999",
          pointerEvents: "none",
          transition: "opacity 0.3s",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap"
        });
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = message;
      updatePosition();
      if (timeoutId) clearTimeout(timeoutId);
      if (duration > 0) {
        timeoutId = setTimeout(close, duration);
      }
    }, "update");
    return { update, close };
  }
  __name(createToast, "createToast");

  // src/handlers/MediaHandler.tsx
  init_format();
  init_string();
  init_getBestCoverUrl();

  // src/handlers/PlayerAdapter.ts
  var NEW_PLAYER_MEDIA_PLUGINS = ["WatchLaterPlugin", "DanmakuPlugin", "PlayClaritySettingPlugin", "Pip"];
  var ACTIVE_VIDEO_SELECTORS = [
    "#sliderVideo video",
    '[data-e2e="feed-active-video"] video',
    ".slider-video video",
    ".douyin-player-video-container video",
    ".xg-video-container video"
  ];
  function hasMediaShape(media) {
    if (!media || typeof media !== "object") return false;
    const hasAwemeId = typeof media.awemeId === "string" || typeof media.awemeId === "number";
    return hasAwemeId && (!!media.video || Array.isArray(media.images));
  }
  __name(hasMediaShape, "hasMediaShape");
  function isVideoElement(value) {
    try {
      return Boolean(value && (value.tagName === "VIDEO" || value.localName === "video"));
    } catch {
      return false;
    }
  }
  __name(isVideoElement, "isVideoElement");
  function getDouyinPlayer() {
    try {
      const isolated = window.player;
      if (isolated) return isolated;
      return typeof unsafeWindow !== "undefined" ? unsafeWindow.player : null;
    } catch {
      return null;
    }
  }
  __name(getDouyinPlayer, "getDouyinPlayer");
  function isNewPlayer(player) {
    return Boolean(player?._config?._config?.pluginsConfig);
  }
  __name(isNewPlayer, "isNewPlayer");
  function readPlayerMedia(player) {
    if (!player) return null;
    try {
      const pluginsConfig = player?._config?._config?.pluginsConfig;
      if (pluginsConfig && typeof pluginsConfig === "object") {
        for (const key of NEW_PLAYER_MEDIA_PLUGINS) {
          const awemeInfo = pluginsConfig[key]?.awemeInfo;
          if (hasMediaShape(awemeInfo)) return awemeInfo;
        }
      }
      if (hasMediaShape(player?.config?.awemeInfo)) return player.config.awemeInfo;
      if (hasMediaShape(player?.controls?.playerConfig?.awemeInfo)) return player.controls.playerConfig.awemeInfo;
    } catch {
      return null;
    }
    return null;
  }
  __name(readPlayerMedia, "readPlayerMedia");
  function readPlayerVideoElement(player) {
    try {
      const directCandidates = [player?.video, player?.controls?.video, player?._video, player?._core?._media];
      for (const candidate of directCandidates) {
        if (isVideoElement(candidate)) return candidate;
      }
    } catch {
    }
    for (const selector of ACTIVE_VIDEO_SELECTORS) {
      const video = document.querySelector(selector);
      if (video) return video;
    }
    return document.querySelector("video");
  }
  __name(readPlayerVideoElement, "readPlayerVideoElement");
  function readPlayerVideoSize(player) {
    const media = readPlayerMedia(player);
    const video = media?.video;
    if (video?.width && video?.height) return { width: video.width, height: video.height };
    const videoEl = readPlayerVideoElement(player);
    if (videoEl?.videoWidth && videoEl?.videoHeight) return { width: videoEl.videoWidth, height: videoEl.videoHeight };
    return null;
  }
  __name(readPlayerVideoSize, "readPlayerVideoSize");
  function subscribePlayer(player, handler) {
    try {
      if (!player || typeof player.on !== "function") return () => {
      };
      const on = player.on.bind(player);
      const off = typeof player.off === "function" ? player.off.bind(player) : typeof player.removeListener === "function" ? player.removeListener.bind(player) : null;
      const events = ["play", "seeked"];
      for (const event of events) {
        try {
          on(event, handler);
        } catch {
        }
      }
      return () => {
        if (!off) return;
        for (const event of events) off(event, handler);
      };
    } catch {
      return () => {
      };
    }
  }
  __name(subscribePlayer, "subscribePlayer");

  // src/handlers/MediaHandler.tsx
  init_jsxRuntime_module();
  var escapeRegExp2 = /* @__PURE__ */ __name((value) => {
    let result = "";
    for (const char of value) {
      if ("\\^$.*+?()[]{}|".includes(char)) result += "\\";
      result += char;
    }
    return result;
  }, "escapeRegExp");
  var _MediaHandler = class _MediaHandler {
    constructor(downloader2) {
      this.player = null;
      this.current_media = null;
      this.dispose_player_events = null;
      this.downloading = false;
      this.downloader = downloader2;
      this.download_current_media = this._lock_download(this._download_current_media_logic.bind(this));
    }
    static toShortId(bigintStr) {
      try {
        return BigInt(bigintStr).toString(36);
      } catch {
        return bigintStr;
      }
    }
    /** 文件名
     *
     * [nickname] + [short_id] + [tags] + [desc]
     * max length: 64
     */
    _build_filename(media = this.current_media, filename_template = Config.global.features.filename_template || Config.defaults.filename_template, filename_max_length = Config.global.features.filename_max_length || 64, throw_err = false) {
      if (!media) {
        throw new Error("缺少 media");
      }
      const {
        authorInfo: { nickname },
        awemeId,
        desc,
        textExtra
      } = media;
      const short_id = _MediaHandler.toShortId(awemeId);
      const tag_list = textExtra?.map((x2) => x2.hashtagName).filter(Boolean) || [];
      const tags = tag_list.map((x2) => "#" + x2).join("_");
      let rawDesc = desc || "";
      tag_list.forEach((t3) => {
        rawDesc = rawDesc.replace(new RegExp("#" + escapeRegExp2(t3) + "\\s*", "g"), "");
      });
      rawDesc = rawDesc.trim().replace(/[#/?<>\\:*|":]/g, "_");
      const context = {
        nickname,
        short_id,
        tags,
        desc: rawDesc,
        aweme_id: awemeId,
        media,
        author_info: media.authorInfo,
        uid: media.authorUserId,
        music_name: media.music?.musicName || "",
        now_date: /* @__PURE__ */ new Date(),
        create_date: new Date(media.createTime * 1e3)
      };
      context.now_YYYYMMDD = formatDate(context.now_date, "YYYYMMDD");
      context.now_YYYYMMDD_HHmmss = formatDate(context.now_date, "YYYYMMDD_HHmmss");
      context.create_date_YYYYMMDD = formatDate(context.create_date, "YYYYMMDD");
      context.create_date_YYYYMMDD_HHmmss = formatDate(context.create_date, "YYYYMMDD_HHmmss");
      let baseName;
      try {
        baseName = runInContext(context, filename_template);
      } catch (error) {
        if (throw_err) throw error;
        console.error("[dy-dl] Error rendering filename template:", error);
        baseName = runInContext(context, Config.defaults.filename_template);
      }
      return normalizeBasename(baseName, { maxLength: filename_max_length });
    }
    _bind_player_events() {
      if (!this.player) return;
      this.dispose_player_events?.();
      const update = /* @__PURE__ */ __name(() => {
        const media = readPlayerMedia(this.player);
        if (media) this.current_media = media;
      }, "update");
      update();
      this.dispose_player_events = subscribePlayer(this.player, update);
    }
    /**
     * !!!
     * 此为核心逻辑
     * !!!
     *
     * NOTE: 有可能在某次抖音更新之后就不可用，依赖于 xg-video 对全局状态注入
     */
    async _start_detect_player_change() {
      while (true) {
        const cp = getDouyinPlayer();
        if (this.player !== cp) {
          this.player = cp;
          if (this.player) this._bind_player_events();
        }
        const media = readPlayerMedia(cp);
        if (media) this.current_media = media;
        await new Promise((r3) => setTimeout(r3, 1e3));
      }
    }
    _flag_start_download() {
      this.downloading = true;
      return () => {
        this.downloading = false;
      };
    }
    _lock_download(fn) {
      return async (...args) => {
        if (this.downloading) {
          alert("[dy-dl]正在下载中...请稍等或刷新页面");
          return;
        }
        const release = this._flag_start_download();
        try {
          await fn(...args);
        } finally {
          await new Promise((r3) => setTimeout(r3, 300));
          release();
        }
      };
    }
    /**
     * 从 video 对象上取得所有 url，支持分辨率策略 + 编码偏好
     * 先按 codec 筛选，再按分辨率模式筛选
     */
    _get_video_urls(video_obj) {
      if (!video_obj) return [];
      const mode = Config.global.features.download_video_mode || "default";
      const codecPref = Config.global.features.video_download_codecs || "default";
      const isH265 = /* @__PURE__ */ __name((br) => br.isH265 === 1 || (br.gearName || "").toLowerCase().includes("h265") || (br.format || "").toLowerCase().includes("h265"), "isH265");
      const extractUrls = /* @__PURE__ */ __name((br) => {
        const urls = [];
        if (br.playApi) urls.push(br.playApi);
        if (Array.isArray(br.playAddr)) urls.push(...br.playAddr.map((a3) => a3.src));
        return urls.filter(Boolean);
      }, "extractUrls");
      if (!video_obj.bitRateList || video_obj.bitRateList.length === 0) return this._get_video_urls_default(video_obj);
      const bitRateList = video_obj.bitRateList.filter((x2) => x2.format !== "dash");
      let candidates = [...bitRateList];
      if (codecPref !== "default") {
        const isPrefer = codecPref.endsWith("_prefer");
        const wantH265 = codecPref.includes("h265");
        const matched = candidates.filter((br) => isH265(br) === wantH265);
        if (matched.length > 0) candidates = matched;
        else if (!isPrefer) return this._get_video_urls_default(video_obj);
      }
      if (mode !== "default" && candidates.length > 1) {
        const vsizeof = /* @__PURE__ */ __name((a3) => (a3?.width || 0) * (a3?.height || 0), "vsizeof");
        const fsizeof = /* @__PURE__ */ __name((a3) => a3.dataSize || 0, "fsizeof");
        if (mode === "max") candidates.sort((a3, b) => vsizeof(b) - vsizeof(a3));
        else if (mode === "min") candidates.sort((a3, b) => vsizeof(a3) - vsizeof(b));
        else if (mode === "max_file") candidates.sort((a3, b) => fsizeof(b) - fsizeof(a3));
        else if (mode === "min_file") candidates.sort((a3, b) => fsizeof(a3) - fsizeof(b));
        if (["1080P", "720P", "540P", "360P", "2K", "4K"].includes(mode)) {
          const kwMap = { "1080P": ["1080"], "720P": ["720"], "540P": ["540"], "360P": ["360"], "2K": ["2k", "2048"], "4K": ["4K", "4096"] };
          const kws = kwMap[mode] || [];
          const matched = candidates.filter((br) => kws.some((kw) => (br.gearName || "").toLowerCase().includes(kw.toLowerCase())));
          if (matched.length > 0) candidates = matched;
        }
      }
      const allUrls = [];
      candidates.forEach((br) => allUrls.push(...extractUrls(br)));
      if (codecPref === "default" || codecPref.includes("h264")) {
        if (video_obj.playApi) allUrls.push(video_obj.playApi);
      }
      if (codecPref === "default" || codecPref.includes("h265")) {
        if (video_obj.playApiH265) allUrls.push(video_obj.playApiH265);
      }
      const result = Array.from(new Set(allUrls.filter(Boolean)));
      if (result.length === 0) return this._get_video_urls_default(video_obj);
      return result;
    }
    /** 默认的 URL 提取逻辑 */
    _get_video_urls_default(video_obj) {
      const sources = [];
      if (video_obj.playApi) sources.push(video_obj.playApi);
      if (Array.isArray(video_obj.playAddr)) sources.push(...video_obj.playAddr.map((x2) => x2.src));
      if (video_obj.bitRateList)
        video_obj.bitRateList.filter((x2) => x2.format !== "dash").forEach((x2) => {
          if (x2.playApi) sources.push(x2.playApi);
        });
      if (video_obj.playApiH265) sources.push(video_obj.playApiH265);
      return Array.from(new Set(sources.filter(Boolean)));
    }
    /**
     * 抖音作品有两种形式：
     * 1. 单图、单视频
     * 2. 图集
     *
     * 如果是图集形式，必须从 images 这个数组里面取字段，其他字段都有可能是 fallback 值
     */
    async _download_media_logic(media, options = {}) {
      const { toastTarget = null, toast = null, toastPrefix = "", alertOnFail = true, addHistory = true, downloaderOverride = "" } = options;
      const isEaglePush = downloaderOverride === "eagle";
      const actionWord = isEaglePush ? "推送" : "下载";
      if (!media) {
        if (alertOnFail) alert("[dy-dl]无当前媒体信息");
        return { ok: false, reason: "missing_media" };
      }
      const { video, images } = media;
      const filename_base = this._build_filename(media);
      const isAlbum = Array.isArray(images) && images.length > 0;
      const total = isAlbum ? images.length : 1;
      const scopedToast = toast || createToast(toastTarget, 5e3);
      const toastUpdate = /* @__PURE__ */ __name((msg, dur = 5e3) => {
        const p3 = toastPrefix ? toastPrefix + " " + msg : msg;
        scopedToast.update(p3, dur);
      }, "toastUpdate");
      if (isAlbum) {
        let downloadedCount = 0;
        let lastError2 = "";
        for (let idx = 0; idx < images.length; idx++) {
          toastUpdate(actionWord + "图集 (" + (idx + 1) + "/" + total + ")");
          const item = images[idx];
          const fn = filename_base + "_" + (idx + 1);
          if (item.video) {
            const urls = this._get_video_urls(item.video);
            if (urls.length > 0) {
              const dl = await this.downloader.download_file_with_error(urls[0], fn, urls, { silent: !alertOnFail, media, mediaType: "video", downloaderOverride });
              if (dl.ok) downloadedCount++;
              else lastError2 = lastError2 || dl.error_msg;
            } else {
              lastError2 = lastError2 || "未找到视频地址";
            }
            continue;
          }
          const img_urls = item.urlList?.filter(Boolean) || item.downloadUrlList?.filter(Boolean);
          if (img_urls?.length > 0) {
            const dl = await this.downloader.download_file_with_error(img_urls[0], fn, img_urls, { silent: !alertOnFail, media, mediaType: "image", downloaderOverride });
            if (dl.ok) downloadedCount++;
            else lastError2 = lastError2 || dl.error_msg;
          } else {
            lastError2 = lastError2 || "未找到图片地址";
          }
        }
        toastUpdate("图集" + actionWord + "完成");
        if (downloadedCount === 0 && images.length > 0) {
          if (alertOnFail) alert("[dy-dl]图集下载失败");
          return { ok: false, reason: "no_valid_media", message: lastError2 || "图集下载失败" };
        }
        if (downloadedCount && addHistory) DownloadHistory.add(media);
        return { ok: downloadedCount > 0 };
      }
      toastUpdate(isEaglePush ? "正在推送到 Eagle..." : "正在下载...");
      const video_urls = this._get_video_urls(video);
      let lastError;
      if (video_urls.length > 0) {
        const dl = await this.downloader.download_file_with_error(video_urls[0], filename_base, video_urls, { silent: !alertOnFail, media, mediaType: "video", downloaderOverride });
        if (dl.ok && addHistory) DownloadHistory.add(media);
        if (dl.ok) {
          toastUpdate(actionWord + "完成");
          return { ok: true };
        }
        lastError = dl.error_msg;
      } else {
        lastError = "未找到视频地址";
      }
      if (alertOnFail) alert("[dy-dl]无法下载当前媒体");
      return { ok: false, reason: "no_valid_media", message: lastError || "无法下载当前媒体" };
    }
    async _download_cover_logic(media, options = {}) {
      const { alertOnFail = true, downloaderOverride = "" } = options;
      if (!media) {
        if (alertOnFail) alert("[dy-dl]无当前媒体信息");
        return { ok: false, reason: "missing_media" };
      }
      const coverUrl = getBestCoverUrl(media);
      if (!coverUrl) return { ok: false, reason: "no_cover", message: "未找到封面地址" };
      const dl = await this.downloader.download_file_with_error(coverUrl, "thumb_" + this._build_filename(media), [], { silent: !alertOnFail, media, mediaType: "image", downloaderOverride });
      if (!dl.ok) return { ok: false, reason: "cover_download_failed", message: dl.error_msg || "封面下载失败" };
      return { ok: true };
    }
    async _download_current_media_logic() {
      return this._download_media_logic(this.current_media, { toastTarget: document.querySelector(".dy-dl-video-btn"), alertOnFail: true, addHistory: true });
    }
    /**
     * 把当前作品直接推送到 Eagle（不改变全局下载器设置）
     */
    async push_current_to_eagle() {
      if (!this.current_media) {
        alert("[dy-dl] 无当前媒体信息");
        return { ok: false };
      }
      return this._download_media_logic(this.current_media, {
        toastTarget: document.querySelector(".dy-dl-video-btn"),
        alertOnFail: true,
        addHistory: false,
        downloaderOverride: "eagle"
      });
    }
    // 下载封面
    async download_thumb() {
      if (!this.current_media) {
        alert("[dy-dl] 无当前媒体信息");
        return;
      }
      const bestThumb = getBestCoverUrl(this.current_media);
      if (!bestThumb) {
        alert("[dy-dl] 未找到任何可用的封面图");
        return;
      }
      this.downloader.download_file(bestThumb, "thumb_" + this._build_filename(this.current_media), [], { media: this.current_media, mediaType: "image" });
    }
    // 显示媒体详情
    async show_media_details() {
      if (!this.current_media) {
        alert("[dy-dl]无当前媒体信息");
        return;
      }
      const modal = new Modal((_root, overlay) => {
        overlay.style.zIndex = "999999";
        if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay);
      });
      modal.root.style.cssText = "width:800px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden";
      const filenameBase = this._build_filename(this.current_media);
      try {
        const { MediaDetailModalApp: MediaDetailModalApp2 } = await Promise.resolve().then(() => (init_MediaDetailModal(), MediaDetailModal_exports));
        G(/* @__PURE__ */ u3(MediaDetailModalApp2, { media: this.current_media, filenameBase }), modal.root);
      } catch (e3) {
        console.error("[dy-dl] 媒体详情组件加载失败", e3);
        modal.root.textContent = "组件加载失败，请刷新重试";
      }
    }
    async open_config_modal() {
      const modal = new Modal((_root, overlay) => {
        overlay.style.zIndex = "999999";
        if (document.fullscreenElement) document.fullscreenElement.appendChild(overlay);
      });
      modal.root.style.cssText = "width:650px;max-width:90vw;background:transparent;box-shadow:none;border-radius:8px;overflow:hidden";
      try {
        const { ConfigModalApp: ConfigModalApp2 } = await Promise.resolve().then(() => (init_ConfigModal(), ConfigModal_exports));
        G(/* @__PURE__ */ u3(ConfigModalApp2, { config: Config.global, modal }), modal.root);
      } catch (e3) {
        console.error("[dy-dl] 配置组件加载失败", e3);
        modal.root.textContent = "组件加载失败";
      }
    }
    init() {
      this._start_detect_player_change();
    }
  };
  __name(_MediaHandler, "MediaHandler");
  var MediaHandler = _MediaHandler;

  // src/handlers/VideoHandler.ts
  init_string();
  var _VideoHandler = class _VideoHandler {
    constructor() {
      this._frameBlob = null;
    }
    /** 获取当前可见的视频元素 */
    getVideoElement() {
      return readPlayerVideoElement(getDouyinPlayer());
    }
    /** 截取当前视频帧，返回 Blob 和 DataURL */
    getCurrentFrame() {
      const video = this.getVideoElement();
      if (!video) return null;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const url = canvas.toDataURL("image/png");
      canvas.toBlob((blob) => {
        if (blob) this._frameBlob = blob;
      });
      return { blob: this._frameBlob, url };
    }
    /** 复制当前视频帧到剪贴板 */
    async copy_current_frame() {
      const video = this.getVideoElement();
      if (!video) {
        alert("未找到视频元素");
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        const blob = await new Promise((r3) => canvas.toBlob((b) => r3(b), "image/png"));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } catch (e3) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        const url = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = url;
        document.body.appendChild(img);
        Object.assign(img.style, { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 999999, maxWidth: "90vw", maxHeight: "90vh" });
        img.onclick = () => img.remove();
        console.error("复制帧失败(已显示图像):", e3);
      }
    }
    /** 下载当前视频帧 */
    async download_current_frame() {
      const video = this.getVideoElement();
      if (!video) {
        alert("未找到视频元素");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise((r3) => canvas.toBlob((b) => r3(b), "image/png"));
      const link = document.createElement("a");
      link.download = normalizeFilename("frame_" + Date.now() + ".png");
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };
  __name(_VideoHandler, "VideoHandler");
  var VideoHandler = _VideoHandler;

  // src/handlers/DanmakuHandler.ts
  var _DanmakuHandler = class _DanmakuHandler {
    /** 获取弹幕列表 */
    getDanmakuList(player) {
      return player?.danmaku?.main?.data || [];
    }
    /** 获取视频宽高 */
    getMediaSize(player) {
      const legacy = { width: player?.sizeInfo?.width, height: player?.sizeInfo?.height };
      if (legacy.width && legacy.height) return { width: legacy.width, height: legacy.height };
      const size = readPlayerVideoSize(player);
      if (size) return size;
      return { width: 1920, height: 1080 };
    }
    /** 毫秒转 ASS 时间格式 */
    msToAssTime(ms) {
      const totalSec = ms / 1e3;
      const h3 = Math.floor(totalSec / 3600);
      const m3 = Math.floor(totalSec % 3600 / 60);
      const s5 = totalSec % 60;
      return `${h3}:${String(m3).padStart(2, "0")}:${s5.toFixed(2).padStart(5, "0")}`.replace(/^0:/, "");
    }
    /** 十六进制颜色转 ASS 颜色格式 */
    hexToAssColor(hex) {
      if (!hex || hex === "transparent") return "&H00FFFFFF";
      const c4 = hex.replace("#", "");
      if (c4.length === 6) return "&H00" + c4.slice(4, 6) + c4.slice(2, 4) + c4.slice(0, 2);
      return "&H00FFFFFF";
    }
    /**
     * 将弹幕数据转换为 ASS 文件内容
     */
    convertDanmakuToAss(list, options = {}) {
      const { title = "", playResX = 1920, playResY = 1080 } = options;
      const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
Title: ${title}
Collisions: Normal

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
      const events = list.map((d3) => {
        const time = d3.time ?? 0;
        const content = d3.content ?? "";
        const start = this.msToAssTime(time);
        const end = this.msToAssTime(time + 3e3);
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${content}`;
      }).join("\n");
      return header + "\n" + events;
    }
    /**
     * 获取弹幕 ASS 文件内容
     */
    getDanmakuAssFileContent(player) {
      const list = this.getDanmakuList(player);
      if (!list || list.length === 0) {
        alert(isNewPlayer(player) ? "[dy-dl]新版播放器弹幕功能正在适配中" : "当前视频弹幕为空，或者未加载完成");
        return;
      }
      const size = this.getMediaSize(player);
      return this.convertDanmakuToAss(list, {
        title: "download from https://github.com/zhzLuke96/douyin-dl-user-js",
        playResX: size.width,
        playResY: size.height
      });
    }
  };
  __name(_DanmakuHandler, "DanmakuHandler");
  var DanmakuHandler = _DanmakuHandler;

  // src/ui/FloatingPanel.tsx
  init_preact_module();

  // src/ui/FloatingPanelUI.tsx
  init_hooks_module();
  init_css_in_js();
  init_Config();
  init_theme();

  // src/ui/modals/ProfileJobModal.tsx
  init_hooks_module();
  init_css_in_js();
  init_theme();
  init_getBestCoverUrl();
  init_jsxRuntime_module();
  var css2 = createCSS();
  var s3 = {
    overlay: css2({
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999999
    }),
    modal: css2({
      display: "flex",
      flexDirection: "column",
      height: "75vh",
      width: "960px",
      maxWidth: "95vw",
      overflow: "hidden",
      fontFamily: "sans-serif",
      background: theme.colors.bgOverlay,
      backdropFilter: theme.backdropBlur,
      borderRadius: theme.borderRadius.lg,
      color: theme.colors.textPrimary,
      boxShadow: "0 10px 30px rgba(0,0,0,0.22)"
    }),
    header: css2({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing.lg,
      borderBottom: "1px solid " + theme.colors.borderLight
    }),
    title: css2({ margin: 0, fontSize: "16px", fontWeight: 600 }),
    closeBtn: css2({ background: "none", border: "none", color: theme.colors.textSecondary, fontSize: "20px", cursor: "pointer" }),
    statsBar: css2({
      display: "flex",
      gap: "24px",
      padding: "0 " + theme.spacing.xl + " " + theme.spacing.md,
      fontSize: "13px",
      color: theme.colors.textMuted,
      borderBottom: "1px solid " + theme.colors.borderLight
    }),
    filterBar: css2({
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md + " " + theme.spacing.xl,
      borderBottom: "1px solid " + theme.colors.borderLight,
      background: theme.colors.bgNav
    }),
    searchInput: css2({
      flex: 1,
      padding: "6px 14px",
      borderRadius: theme.borderRadius.full,
      border: "1px solid " + theme.colors.borderInput,
      background: "rgba(255,255,255,0.08)",
      color: theme.colors.textPrimary,
      fontSize: theme.fontSize.sm,
      outline: "none",
      "&:focus": { borderColor: theme.colors.primary }
    }),
    typeFilterSelect: css2({
      padding: "4px 10px",
      borderRadius: theme.borderRadius.full,
      border: "1px solid " + theme.colors.borderInput,
      background: "rgba(255,255,255,0.08)",
      color: theme.colors.textPrimary,
      fontSize: theme.fontSize.sm,
      outline: "none",
      cursor: "pointer",
      "& option": { background: "#2c2c2e", color: theme.colors.textPrimary }
    }),
    tableContainer: css2({
      flexGrow: 1,
      overflowY: "auto",
      padding: "0 " + theme.spacing.xl + " 20px",
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(255,255,255,0.3) rgba(0,0,0,0.2)"
    }),
    table: css2({
      width: "100%",
      fontSize: "12px",
      borderCollapse: "collapse",
      color: theme.colors.textPrimary
    }),
    th: css2({
      position: "sticky",
      top: 0,
      background: "rgba(18,18,20,0.98)",
      backdropFilter: "blur(5px)",
      padding: "10px 8px",
      textAlign: "left",
      borderBottom: "1px solid " + theme.colors.borderMedium,
      fontWeight: 600,
      color: theme.colors.textSecondary,
      whiteSpace: "nowrap"
    }),
    thBtn: css2({
      background: "none",
      border: "none",
      padding: "0",
      color: "inherit",
      font: "inherit",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      whiteSpace: "nowrap"
    }),
    thArrow: css2({ fontSize: "10px", opacity: 0.55 }),
    thArrowActive: css2({ color: theme.colors.primary, opacity: 1 }),
    td: css2({
      padding: "10px 8px",
      borderBottom: "1px solid " + theme.colors.borderLight,
      verticalAlign: "middle"
    }),
    checkbox: css2({
      width: "18px",
      height: "18px",
      cursor: "pointer",
      accentColor: theme.colors.primary
    }),
    cover: css2({
      width: "48px",
      height: "64px",
      objectFit: "cover",
      borderRadius: theme.borderRadius.sm,
      background: "rgba(255,255,255,0.05)",
      display: "block"
    }),
    coverHidden: css2({ opacity: 0, visibility: "hidden" }),
    desc: css2({
      maxWidth: "180px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }),
    idText: css2({
      fontSize: "11px",
      color: "rgba(255,255,255,0.5)",
      wordBreak: "break-all",
      lineHeight: 1.4
    }),
    typeBadge: css2({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: theme.borderRadius.full,
      fontSize: "11px",
      background: "rgba(255,255,255,0.1)",
      color: theme.colors.textPrimary
    }),
    statusBadge: css2({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: theme.borderRadius.full,
      fontSize: "11px"
    }),
    statusGroup: css2({
      display: "flex",
      gap: "4px",
      flexWrap: "wrap"
    }),
    statusDownloaded: css2({
      background: "rgba(46,125,50,0.25)",
      color: "#81c784",
      border: "1px solid rgba(46,125,50,0.5)"
    }),
    statusFailed: css2({
      background: "rgba(198,40,40,0.25)",
      color: "#ef9a9a",
      border: "1px solid rgba(198,40,40,0.5)"
    }),
    statusPending: css2({
      background: "rgba(254,44,85,0.15)",
      color: "#ff8a80",
      border: "1px solid rgba(254,44,85,0.4)"
    }),
    actionBar: css2({
      display: "flex",
      gap: "10px",
      padding: theme.spacing.md + " " + theme.spacing.xl,
      borderTop: "1px solid " + theme.colors.borderLight,
      flexWrap: "wrap"
    }),
    btn: css2({
      padding: "7px 18px",
      borderRadius: theme.borderRadius.full,
      border: "1px solid " + theme.colors.borderInput,
      background: "transparent",
      color: "rgba(255,255,255,0.9)",
      fontSize: "12px",
      cursor: "pointer",
      transition: "0.2s",
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
    }),
    btnPrimary: css2({
      padding: "7px 18px",
      borderRadius: theme.borderRadius.full,
      border: "none",
      background: theme.colors.primary,
      color: "#fff",
      fontSize: "12px",
      cursor: "pointer",
      transition: "0.2s",
      fontWeight: 500,
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
    }),
    failSection: css2({ marginTop: theme.spacing.lg }),
    failTitle: css2({ margin: "0 0 8px", fontSize: "14px", color: "#ff6b6b" }),
    statRow: css2({
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: "13px"
    }),
    statLabel: css2({ color: theme.colors.textMuted }),
    statValue: css2({ color: theme.colors.textPrimary, fontWeight: 500 }),
    failTable: css2({ width: "100%", fontSize: "12px", borderCollapse: "collapse", borderRadius: theme.borderRadius.sm, overflow: "hidden" }),
    failTh: css2({ padding: theme.spacing.sm, background: "rgba(255,255,255,0.06)", textAlign: "left", color: theme.colors.textMuted, fontWeight: 600, whiteSpace: "nowrap" }),
    failTd: css2({ padding: theme.spacing.sm, borderBottom: "1px solid " + theme.colors.borderLight, color: theme.colors.textSecondary, verticalAlign: "top" }),
    failId: css2({ wordBreak: "break-all", fontSize: "11px", color: theme.colors.textSecondary }),
    failDesc: css2({ maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
    failMessage: css2({ wordBreak: "break-all", color: "#ff9c9c" }),
    failEmpty: css2({ padding: "24px", textAlign: "center", color: theme.colors.textDim, fontSize: "12px" }),
    progressBarContainer: css2({
      height: "6px",
      background: "rgba(255,255,255,0.1)",
      borderRadius: "3px",
      overflow: "hidden"
    }),
    progressBarFill: css2({
      height: "100%",
      background: theme.colors.primary,
      borderRadius: "3px",
      transition: "width 0.3s"
    }),
    squareContainer: css2({
      display: "flex",
      flexWrap: "wrap",
      gap: "3px",
      maxHeight: "84px",
      overflowY: "auto",
      padding: "8px",
      marginTop: theme.spacing.sm,
      background: "rgba(0,0,0,0.28)",
      borderRadius: theme.borderRadius.sm
    }),
    square: css2({ width: "12px", height: "12px", borderRadius: "2px", flex: "0 0 12px" }),
    squarePending: css2({ background: "#2a2a2a" }),
    squareRunning: css2({ background: "#ffb74d" }),
    squareSuccess: css2({ background: "#66bb6a" }),
    squareFailed: css2({ background: "#ef5350" }),
    footer: css2({
      padding: "8px 32px",
      fontSize: "11px",
      color: theme.colors.textDim,
      borderTop: "1px solid " + theme.colors.borderLight
    }),
    statusText: css2({
      fontSize: "12px",
      color: theme.colors.textMuted,
      margin: "0 32px 6px"
    }),
    tabs: css2({
      display: "flex",
      gap: "6px",
      padding: "0 " + theme.spacing.xl,
      borderBottom: "1px solid " + theme.colors.borderLight
    }),
    tab: css2({
      padding: "10px 14px",
      background: "none",
      border: "none",
      borderBottom: "2px solid transparent",
      color: theme.colors.textMuted,
      fontSize: "13px",
      cursor: "pointer",
      "&:hover": { color: theme.colors.textPrimary }
    }),
    tabActive: css2({
      color: theme.colors.textPrimary,
      fontWeight: 600,
      borderBottomColor: theme.colors.primary
    }),
    jobContent: css2({
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      overflow: "hidden"
    }),
    jobSummary: css2({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md + " " + theme.spacing.xl,
      borderBottom: "1px solid " + theme.colors.borderLight,
      fontSize: "13px",
      color: theme.colors.textMuted,
      flexWrap: "wrap"
    }),
    progressSection: css2({
      padding: theme.spacing.md + " " + theme.spacing.xl + " 0"
    }),
    progressLabel: css2({
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "6px",
      fontSize: "12px",
      color: theme.colors.textMuted
    }),
    logContainer: css2({
      flexGrow: 1,
      minHeight: 0,
      overflowY: "auto",
      margin: theme.spacing.md + " " + theme.spacing.xl,
      padding: theme.spacing.sm,
      background: "rgba(0,0,0,0.28)",
      border: "1px solid " + theme.colors.borderLight,
      borderRadius: theme.borderRadius.sm,
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(255,255,255,0.3) rgba(0,0,0,0.2)"
    }),
    logList: css2({ margin: 0, padding: 0, listStyle: "none" }),
    logItem: css2({
      display: "flex",
      gap: "8px",
      padding: "4px 8px",
      fontSize: "12px",
      lineHeight: 1.5,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      alignItems: "baseline"
    }),
    logTime: css2({ color: theme.colors.textDim, whiteSpace: "nowrap", fontFamily: "monospace" }),
    logType: css2({ color: theme.colors.textSecondary, whiteSpace: "nowrap" }),
    logDesc: css2({
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }),
    logStatusInfo: css2({ color: theme.colors.textMuted, whiteSpace: "nowrap" }),
    logStatusRunning: css2({ color: "#ffb74d", whiteSpace: "nowrap" }),
    logStatusSuccess: css2({ color: "#81c784", whiteSpace: "nowrap" }),
    logStatusFailed: css2({ color: "#ef9a9a", whiteSpace: "nowrap" }),
    emptyLog: css2({ padding: "24px", textAlign: "center", color: theme.colors.textDim, fontSize: "12px" })
  };
  var clampConcurrency = /* @__PURE__ */ __name((value) => {
    const next = Number.isFinite(value) ? Math.floor(value) : 1;
    return Math.min(Math.max(next, 1), 5);
  }, "clampConcurrency");
  var formatModalFileSize = /* @__PURE__ */ __name((bytes) => {
    if (!bytes || bytes <= 0) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    return value.toFixed(index === 0 ? 0 : 1) + " " + units[index];
  }, "formatModalFileSize");
  var formatModalDuration = /* @__PURE__ */ __name((duration) => {
    if (!duration || duration <= 0) return "-";
    const totalSeconds = Math.max(1, Math.round(duration >= 1e3 ? duration / 1e3 : duration));
    const h3 = Math.floor(totalSeconds / 3600);
    const m3 = Math.floor(totalSeconds % 3600 / 60);
    const s5 = totalSeconds % 60;
    return h3 > 0 ? `${h3}:${String(m3).padStart(2, "0")}:${String(s5).padStart(2, "0")}` : `${String(m3).padStart(2, "0")}:${String(s5).padStart(2, "0")}`;
  }, "formatModalDuration");
  var FAILURE_REASON_LABELS = {
    missing_media: "缺少媒体信息",
    no_valid_media: "未找到可下载的媒体资源",
    no_cover: "未找到封面地址",
    cover_download_failed: "封面下载失败",
    download_failed: "下载失败",
    cache_miss: "缓存中未找到作品",
    unexpected_error: "下载任务异常"
  };
  var LazyCover = /* @__PURE__ */ __name(({ src }) => {
    const ref = A2(null);
    const [visible, setVisible] = d2(false);
    y2(() => {
      const el = ref.current;
      if (!el) return;
      if (!("IntersectionObserver" in window)) {
        setVisible(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px 0px" }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);
    return /* @__PURE__ */ u3("img", { ref, src: visible ? src : void 0, className: s3.cover + (visible ? "" : " " + s3.coverHidden), loading: "lazy", decoding: "async", alt: "" });
  }, "LazyCover");
  var ProfileJobModalApp = /* @__PURE__ */ __name(({ downloadManager, onClose }) => {
    const [snap, setSnap] = d2(() => downloadManager.getSnapshot());
    const [searchText, setSearchText] = d2("");
    const [typeFilter, setTypeFilter] = d2("all");
    const [statusFilter, setStatusFilter] = d2("all");
    const [sortMode, setSortMode] = d2("time_desc");
    const [activeTab, setActiveTab] = d2("list");
    const toggleSort = /* @__PURE__ */ __name((field) => {
      setSortMode((prev) => {
        const currentField = prev.replace(/_(asc|desc)$/, "");
        if (currentField === field) return prev.endsWith("_asc") ? `${field}_desc` : `${field}_asc`;
        return `${field}_desc`;
      });
    }, "toggleSort");
    const sortArrow = /* @__PURE__ */ __name((field) => {
      const currentField = sortMode.replace(/_(asc|desc)$/, "");
      if (currentField !== field) return "↕";
      return sortMode.endsWith("_asc") ? "↑" : "↓";
    }, "sortArrow");
    const arrowClass = /* @__PURE__ */ __name((field) => s3.thArrow + (sortMode.startsWith(field) ? " " + s3.thArrowActive : ""), "arrowClass");
    const [concurrency, setConcurrency] = d2(1);
    const logRef = A2(null);
    const buildMediaList = q2(() => {
      const knownIds = downloadManager.jobState?.knownIds || [];
      return knownIds.map((id) => {
        const media = downloadManager.dataService.feedMediaCache.get(id);
        if (!media) return null;
        const downloaded = downloadManager.jobState?.downloadedIds?.includes(id) || false;
        const failed = downloadManager.jobState?.failedItems?.[id];
        const coverDownloaded = downloadManager.jobState?.coverDownloadedIds?.includes(id) || false;
        const coverFailed = downloadManager.jobState?.coverFailedItems?.[id];
        const bitRateList = media.video?.bitRateList || [];
        const maxSize = bitRateList.reduce((max, item) => Math.max(max, item.dataSize || 0), media.video?.dataSize || 0);
        const albumSize = (media.images || []).reduce((sum, img) => sum + (img.video?.dataSize || 0), 0);
        return {
          awemeId: id,
          media,
          downloaded,
          failed,
          coverDownloaded,
          coverFailed,
          selected: downloadManager.selectedIds.has(id),
          type: media.images && media.images.length > 0 ? "album" : "video",
          sortTime: media.createTime || 0,
          sortSize: Math.max(maxSize, albumSize),
          sortDuration: media.video?.duration || 0,
          sortImages: media.images?.length || 0
        };
      }).filter(Boolean);
    }, [downloadManager]);
    const refresh = q2(() => {
      setSnap(downloadManager.getSnapshot());
      setRawMediaList(buildMediaList());
    }, [buildMediaList, downloadManager]);
    const [rawMediaList, setRawMediaList] = d2([]);
    y2(() => {
      refresh();
      const off1 = downloadManager.on("stateChanged", refresh);
      const off2 = downloadManager.on("countsUpdated", refresh);
      const off3 = downloadManager.on("jobLog", refresh);
      const timer = setInterval(refresh, 2e3);
      return () => {
        off1();
        off2();
        off3();
        clearInterval(timer);
      };
    }, [refresh]);
    y2(() => {
      if (snap.jobRunning || snap.jobStatus === "running") setActiveTab("job");
    }, [snap.jobRunning, snap.jobStatus]);
    y2(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, [snap.jobLog.length]);
    const filteredList = T2(() => {
      let list = rawMediaList;
      if (typeFilter !== "all") list = list.filter((item) => item.type === typeFilter);
      if (statusFilter === "downloaded") list = list.filter((item) => item.downloaded);
      else if (statusFilter === "not_downloaded") list = list.filter((item) => !item.downloaded);
      else if (statusFilter === "cover_downloaded") list = list.filter((item) => item.coverDownloaded);
      else if (statusFilter === "cover_not_downloaded") list = list.filter((item) => !item.coverDownloaded);
      if (searchText.trim()) {
        const q3 = searchText.toLowerCase().trim();
        list = list.filter((item) => {
          const desc = (item.media.desc || "").toLowerCase();
          const shortId = MediaHandler.toShortId(item.awemeId).toLowerCase();
          return desc.includes(q3) || item.awemeId.toLowerCase().includes(q3) || shortId.includes(q3);
        });
      }
      const sortKey = sortMode.replace(/_(asc|desc)$/, "");
      const direction = sortMode.endsWith("_asc") ? 1 : -1;
      const keyMap = { time: "sortTime", size: "sortSize", duration: "sortDuration", images: "sortImages" };
      const sortField = keyMap[sortKey];
      return [...list].sort((a3, b) => ((a3[sortField] || 0) - (b[sortField] || 0)) * direction);
    }, [rawMediaList, searchText, typeFilter, statusFilter, sortMode]);
    const isFilteredAllSelected = filteredList.length > 0 && filteredList.every((item) => item.selected);
    const handleSelectAll = /* @__PURE__ */ __name((checked) => {
      downloadManager.markSelectMany(filteredList.map((item) => item.awemeId), checked);
    }, "handleSelectAll");
    const handleSelectRow = /* @__PURE__ */ __name((awemeId, checked) => {
      downloadManager.markSelect(awemeId, checked);
    }, "handleSelectRow");
    const startJob = /* @__PURE__ */ __name(async (downloadType2 = "content", runConcurrency = concurrency) => {
      try {
        await downloadManager.startJob(downloadType2, runConcurrency);
      } catch (e3) {
        alert(e3.message || e3);
      }
    }, "startJob");
    const updateConcurrency = /* @__PURE__ */ __name((value) => {
      setConcurrency(clampConcurrency(value));
    }, "updateConcurrency");
    const resumeJob = /* @__PURE__ */ __name(async () => {
      try {
        await downloadManager.resumeJob();
      } catch (e3) {
        alert(e3.message || e3);
      }
    }, "resumeJob");
    const isJobView = snap.jobRunning || snap.jobStatus === "running" || snap.jobStatus === "paused" || snap.jobStatus === "completed";
    const downloadType = snap.downloadType;
    const progressCount = Object.values(snap.itemStatuses || {}).filter((status) => status === "success").length;
    const progressTotal = Math.max(snap.counts.selected, 1);
    const failedSections = [
      { title: "内容失败详情", count: snap.counts.failed, items: downloadManager.jobState?.failedItems },
      { title: "封面失败详情", count: snap.counts.coverFailed, items: downloadManager.jobState?.coverFailedItems }
    ].filter((section) => section.count > 0);
    const logStatusClass = /* @__PURE__ */ __name((status) => {
      if (status === "running") return s3.logStatusRunning;
      if (status === "success") return s3.logStatusSuccess;
      if (status === "failed") return s3.logStatusFailed;
      return s3.logStatusInfo;
    }, "logStatusClass");
    const logStatusLabel = /* @__PURE__ */ __name((status) => {
      if (status === "running") return "下载中";
      if (status === "success") return "成功";
      if (status === "failed") return "失败";
      return "信息";
    }, "logStatusLabel");
    return /* @__PURE__ */ u3("div", { className: s3.overlay, onClick: onClose, children: /* @__PURE__ */ u3("div", { className: s3.modal, onClick: (e3) => e3.stopPropagation(), children: [
      /* @__PURE__ */ u3("div", { className: s3.header, children: [
        /* @__PURE__ */ u3("h3", { className: s3.title, children: [
          "批量下载 - ",
          snap.profileName
        ] }),
        /* @__PURE__ */ u3("div", { className: s3.statusText, children: [
          "状态: ",
          snap.statusLabel || "待命"
        ] }),
        /* @__PURE__ */ u3("button", { className: s3.closeBtn, onClick: onClose, children: "x" })
      ] }),
      /* @__PURE__ */ u3("div", { className: s3.tabs, children: [
        /* @__PURE__ */ u3("button", { className: s3.tab + (activeTab === "list" ? " " + s3.tabActive : ""), onClick: () => setActiveTab("list"), children: "作品列表" }),
        /* @__PURE__ */ u3("button", { className: s3.tab + (activeTab === "job" ? " " + s3.tabActive : ""), onClick: () => setActiveTab("job"), children: "任务进度" }),
        /* @__PURE__ */ u3("button", { className: s3.tab + (activeTab === "failed" ? " " + s3.tabActive : ""), onClick: () => setActiveTab("failed"), children: [
          "失败详情 (",
          snap.counts.failed + snap.counts.coverFailed,
          ")"
        ] })
      ] }),
      activeTab === "list" ? /* @__PURE__ */ u3(k, { children: [
        /* @__PURE__ */ u3("div", { className: s3.statsBar, children: [
          /* @__PURE__ */ u3("span", { children: [
            "已发现: ",
            snap.counts.known
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "内容已下载: ",
            snap.counts.downloaded
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "内容失败: ",
            snap.counts.failed
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "封面已下载: ",
            snap.counts.coverDownloaded
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "封面失败: ",
            snap.counts.coverFailed
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "已选: ",
            snap.counts.selected
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { className: s3.filterBar, children: /* @__PURE__ */ u3("input", { type: "text", placeholder: "搜索描述...", className: s3.searchInput, value: searchText, onInput: (e3) => setSearchText(e3.target.value) }) }),
        /* @__PURE__ */ u3("div", { className: s3.tableContainer, children: [
          /* @__PURE__ */ u3("table", { className: s3.table, children: [
            /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "40px" }, children: /* @__PURE__ */ u3("input", { type: "checkbox", className: s3.checkbox, checked: isFilteredAllSelected, onChange: (e3) => handleSelectAll(e3.target.checked) }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "60px" }, children: "封面" }),
              /* @__PURE__ */ u3("th", { className: s3.th, children: "描述" }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "110px" }, children: /* @__PURE__ */ u3("select", { className: s3.typeFilterSelect, value: typeFilter, onChange: (e3) => setTypeFilter(e3.target.value), children: [
                /* @__PURE__ */ u3("option", { value: "all", children: "类型: 全部" }),
                /* @__PURE__ */ u3("option", { value: "video", children: "视频" }),
                /* @__PURE__ */ u3("option", { value: "album", children: "图集" })
              ] }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "150px" }, children: /* @__PURE__ */ u3("select", { className: s3.typeFilterSelect, value: statusFilter, onChange: (e3) => setStatusFilter(e3.target.value), children: [
                /* @__PURE__ */ u3("option", { value: "all", children: "状态: 全部" }),
                /* @__PURE__ */ u3("option", { value: "downloaded", children: "内容已下载" }),
                /* @__PURE__ */ u3("option", { value: "not_downloaded", children: "内容未下载" }),
                /* @__PURE__ */ u3("option", { value: "cover_downloaded", children: "封面已下载" }),
                /* @__PURE__ */ u3("option", { value: "cover_not_downloaded", children: "封面未下载" })
              ] }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "90px" }, children: /* @__PURE__ */ u3("button", { className: s3.thBtn, onClick: () => toggleSort("size"), children: [
                "文件大小 ",
                /* @__PURE__ */ u3("span", { className: arrowClass("size"), children: sortArrow("size") })
              ] }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "90px" }, children: /* @__PURE__ */ u3("button", { className: s3.thBtn, onClick: () => toggleSort("duration"), children: [
                "视频时长 ",
                /* @__PURE__ */ u3("span", { className: arrowClass("duration"), children: sortArrow("duration") })
              ] }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "80px" }, children: /* @__PURE__ */ u3("button", { className: s3.thBtn, onClick: () => toggleSort("images"), children: [
                "图集数量 ",
                /* @__PURE__ */ u3("span", { className: arrowClass("images"), children: sortArrow("images") })
              ] }) }),
              /* @__PURE__ */ u3("th", { className: s3.th, style: { width: "100px" }, children: /* @__PURE__ */ u3("button", { className: s3.thBtn, onClick: () => toggleSort("time"), children: [
                "发布时间 ",
                /* @__PURE__ */ u3("span", { className: arrowClass("time"), children: sortArrow("time") })
              ] }) })
            ] }) }),
            /* @__PURE__ */ u3("tbody", { children: filteredList.map((item) => {
              const media = item.media;
              const coverUrl = getBestCoverUrl(media) || "";
              const desc = media.desc || "(无描述)";
              const createDate = media.createTime ? new Date(media.createTime * 1e3).toLocaleDateString() : "-";
              const fileSizeText = formatModalFileSize(item.sortSize);
              const durationText = formatModalDuration(item.sortDuration);
              const imageCountText = item.type === "album" ? `${item.sortImages}张` : "-";
              const typeLabel = item.type === "album" ? "图集" : "视频";
              let contentStatusCls = s3.statusPending;
              let contentStatusText = "内容 待下载";
              if (item.downloaded) {
                contentStatusCls = s3.statusDownloaded;
                contentStatusText = "内容 已下载";
              } else if (item.failed) {
                contentStatusCls = s3.statusFailed;
                contentStatusText = "内容 失败(" + item.failed.count + ")";
              }
              let coverStatusCls = s3.statusPending;
              let coverStatusText = "封面 待下载";
              if (item.coverDownloaded) {
                coverStatusCls = s3.statusDownloaded;
                coverStatusText = "封面 已下载";
              } else if (item.coverFailed) {
                coverStatusCls = s3.statusFailed;
                coverStatusText = "封面 失败(" + item.coverFailed.count + ")";
              }
              return /* @__PURE__ */ u3("tr", { children: [
                /* @__PURE__ */ u3("td", { className: s3.td, children: /* @__PURE__ */ u3(
                  "input",
                  {
                    type: "checkbox",
                    className: s3.checkbox,
                    checked: item.selected,
                    onChange: (e3) => handleSelectRow(item.awemeId, e3.target.checked)
                  }
                ) }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: coverUrl && /* @__PURE__ */ u3(LazyCover, { src: coverUrl }) }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: [
                  /* @__PURE__ */ u3("div", { className: s3.desc, title: desc, children: desc }),
                  /* @__PURE__ */ u3("div", { className: s3.idText, children: [
                    "ID: ",
                    item.awemeId
                  ] })
                ] }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: /* @__PURE__ */ u3("span", { className: s3.typeBadge, children: typeLabel }) }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: /* @__PURE__ */ u3("div", { className: s3.statusGroup, children: [
                  /* @__PURE__ */ u3("span", { className: s3.statusBadge + " " + contentStatusCls, children: contentStatusText }),
                  /* @__PURE__ */ u3("span", { className: s3.statusBadge + " " + coverStatusCls, children: coverStatusText })
                ] }) }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: fileSizeText }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: durationText }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: imageCountText }),
                /* @__PURE__ */ u3("td", { className: s3.td, children: createDate })
              ] }, item.awemeId);
            }) })
          ] }),
          filteredList.length === 0 && /* @__PURE__ */ u3("div", { style: "text-align:center;padding:40px;color:rgba(255,255,255,0.5);", children: rawMediaList.length === 0 ? "暂无作品数据，请先滚动主页加载作品。" : "没有匹配的搜索结果。" })
        ] }),
        /* @__PURE__ */ u3("div", { className: s3.footer, children: "提示：勾选作品后点击“开始下载”下载内容，点击“下载封面”下载封面。使用类型筛选快速定位内容。" }),
        /* @__PURE__ */ u3("div", { className: s3.actionBar, children: [
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => handleSelectAll(!isFilteredAllSelected), disabled: filteredList.length === 0, children: isFilteredAllSelected ? "取消全选" : "全选" }),
          /* @__PURE__ */ u3("select", { className: s3.typeFilterSelect, value: concurrency, onChange: (e3) => updateConcurrency(Number(e3.target.value)), children: [1, 2, 3, 4, 5].map((n2) => /* @__PURE__ */ u3("option", { value: n2, children: [
            "并发 ",
            n2
          ] }, n2)) }),
          /* @__PURE__ */ u3("button", { className: s3.btnPrimary, onClick: () => startJob("content", concurrency), disabled: snap.counts.selected === 0, children: "开始下载" }),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => startJob("cover", concurrency), disabled: snap.counts.selected === 0, children: "下载封面" }),
          /* @__PURE__ */ u3(
            "button",
            {
              className: s3.btn,
              onClick: () => {
                if (confirm("确定重置当前作者的下载记录吗？这将清除已下载和失败记录。")) downloadManager.resetState();
              },
              children: "重置"
            }
          ),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => downloadManager.mediaHandler.open_config_modal(), children: "设置" }),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: onClose, children: "关闭" })
        ] })
      ] }) : activeTab === "job" ? isJobView ? /* @__PURE__ */ u3("div", { className: s3.jobContent, children: [
        /* @__PURE__ */ u3("div", { className: s3.jobSummary, children: [
          /* @__PURE__ */ u3("span", { children: [
            "下载类型: ",
            downloadType === "cover" ? "封面" : "内容"
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "并发: ",
            snap.concurrency || concurrency
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "已选: ",
            snap.counts.selected
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "成功: ",
            progressCount
          ] }),
          /* @__PURE__ */ u3("span", { children: [
            "失败: ",
            downloadType === "cover" ? snap.counts.coverFailed : snap.counts.failed
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { className: s3.progressSection, children: [
          /* @__PURE__ */ u3("div", { className: s3.progressLabel, children: [
            /* @__PURE__ */ u3("span", { children: "下载进度" }),
            /* @__PURE__ */ u3("span", { children: [
              progressCount,
              "/",
              progressTotal
            ] })
          ] }),
          /* @__PURE__ */ u3("div", { className: s3.progressBarContainer, children: /* @__PURE__ */ u3("div", { className: s3.progressBarFill, style: { width: progressCount / progressTotal * 100 + "%" } }) }),
          /* @__PURE__ */ u3("div", { className: s3.squareContainer, children: Object.entries(snap.itemStatuses || {}).map(([id, status]) => /* @__PURE__ */ u3(
            "div",
            {
              className: s3.square + (status === "success" ? " " + s3.squareSuccess : status === "failed" ? " " + s3.squareFailed : status === "running" ? " " + s3.squareRunning : " " + s3.squarePending),
              title: id
            },
            id
          )) }),
          /* @__PURE__ */ u3("div", { className: s3.progressLabel, children: /* @__PURE__ */ u3("span", { children: "黑=等待 黄=下载中 绿=成功 红=失败" }) })
        ] }),
        /* @__PURE__ */ u3("div", { className: s3.logContainer, ref: logRef, children: snap.jobLog.length === 0 ? /* @__PURE__ */ u3("div", { className: s3.emptyLog, children: "暂无日志" }) : /* @__PURE__ */ u3("ul", { className: s3.logList, children: snap.jobLog.map((log, index) => /* @__PURE__ */ u3("li", { className: s3.logItem, children: [
          /* @__PURE__ */ u3("span", { className: s3.logTime, children: new Date(log.time).toLocaleTimeString() }),
          /* @__PURE__ */ u3("span", { className: s3.logType, children: log.type === "cover" ? "封面" : "内容" }),
          /* @__PURE__ */ u3("span", { className: s3.logDesc, children: log.desc || log.awemeId || log.message }),
          /* @__PURE__ */ u3("span", { className: logStatusClass(log.status), children: logStatusLabel(log.status) })
        ] }, index)) }) }),
        /* @__PURE__ */ u3("div", { className: s3.actionBar, children: snap.jobRunning ? /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => downloadManager.pauseJob(), disabled: snap.jobStopRequested, children: "暂停" }),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => downloadManager.endJob(), children: "结束" })
        ] }) : snap.jobStatus === "paused" ? /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("button", { className: s3.btnPrimary, onClick: resumeJob, children: "继续" }),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => downloadManager.endJob(), children: "结束" })
        ] }) : /* @__PURE__ */ u3(k, { children: [
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: () => downloadManager.endJob(), children: "结束" }),
          /* @__PURE__ */ u3("button", { className: s3.btn, onClick: onClose, children: "关闭" })
        ] }) }),
        /* @__PURE__ */ u3("div", { className: s3.footer, children: "关闭弹窗不会中断后台下载；结束后可回到选择阶段。" })
      ] }) : /* @__PURE__ */ u3("div", { className: s3.emptyLog, style: { flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: "暂无任务进度" }) : /* @__PURE__ */ u3("div", { className: s3.tableContainer, children: [
        failedSections.length === 0 ? /* @__PURE__ */ u3("div", { className: s3.failEmpty, children: "暂无失败记录" }) : failedSections.map((section) => /* @__PURE__ */ u3("div", { className: s3.failSection, children: [
          /* @__PURE__ */ u3("h4", { className: s3.failTitle, children: section.title }),
          /* @__PURE__ */ u3("table", { className: s3.failTable, children: [
            /* @__PURE__ */ u3("thead", { children: /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "类型" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "ID" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "描述" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "原因" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "错误信息" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "次数" }),
              /* @__PURE__ */ u3("th", { className: s3.failTh, children: "时间" })
            ] }) }),
            /* @__PURE__ */ u3("tbody", { children: Object.entries(section.items || {}).sort((a3, b) => (b[1].updatedAt || 0) - (a3[1].updatedAt || 0)).map(([id, info]) => /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: section.title.includes("封面") ? "封面" : "内容" }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: /* @__PURE__ */ u3("div", { className: s3.failId, children: id }) }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: /* @__PURE__ */ u3("div", { className: s3.failDesc, title: info.desc, children: info.desc || "-" }) }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: info.reason ? FAILURE_REASON_LABELS[info.reason] || info.reason : "-" }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: /* @__PURE__ */ u3("div", { className: s3.failMessage, children: info.message || info.reason || "-" }) }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: info.count }),
              /* @__PURE__ */ u3("td", { className: s3.failTd, children: info.updatedAt ? new Date(info.updatedAt).toLocaleString() : "-" })
            ] }, id)) })
          ] })
        ] }, section.title)),
        /* @__PURE__ */ u3("div", { className: s3.actionBar, children: /* @__PURE__ */ u3("button", { className: s3.btn, onClick: onClose, children: "关闭" }) })
      ] })
    ] }) });
  }, "ProfileJobModalApp");

  // src/ui/FloatingPanelUI.tsx
  init_jsxRuntime_module();
  var css3 = createCSS();
  var s4 = {
    panelClosed: css3({ position: "fixed", right: "24px", bottom: "80px", zIndex: 999999, display: "flex", flexDirection: "column", gap: theme.spacing.md }),
    panelOpen: css3({ position: "fixed", right: "24px", bottom: "80px", zIndex: 999999, display: "flex", flexDirection: "column", gap: theme.spacing.md, minWidth: "240px" }),
    fab: css3({
      position: "fixed",
      zIndex: 999999,
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "none",
      background: theme.colors.primary,
      color: "#fff",
      fontSize: "12px",
      cursor: "grab",
      touchAction: "none",
      userSelect: "none",
      boxShadow: "0 4px 12px rgba(254,44,85,0.4)",
      transition: "box-shadow 0.2s"
    }),
    card: css3({
      position: "fixed",
      zIndex: 999999,
      overflowY: "auto",
      boxSizing: "border-box",
      width: "372px",
      maxWidth: "calc(100vw - 32px)",
      background: "rgba(18,18,20,0.94)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "16px",
      padding: "18px",
      color: "#fff",
      fontSize: "13.5px",
      fontFamily: "sans-serif",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }),
    title: css3({ margin: "0 0 14px", fontSize: "16px", fontWeight: 600 }),
    row: css3({ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }),
    label: css3({ color: "rgba(255,255,255,0.6)" }),
    value: css3({ color: "#fff", fontWeight: 500 }),
    stats: css3({
      display: "flex",
      flexWrap: "wrap",
      gap: "4px 10px",
      marginTop: "8px",
      fontSize: "12px",
      lineHeight: 1.4,
      color: "rgba(255,255,255,0.55)"
    }),
    progressSection: css3({ marginTop: "10px" }),
    progressHeader: css3({
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "6px",
      fontSize: "12px",
      color: "rgba(255,255,255,0.6)"
    }),
    progressBar: css3({
      height: "6px",
      background: "rgba(255,255,255,0.1)",
      borderRadius: "3px",
      overflow: "hidden"
    }),
    progressFill: css3({
      height: "100%",
      background: theme.colors.primary,
      borderRadius: "3px",
      transition: "width 0.3s"
    }),
    select: css3({
      padding: "7px 10px",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: "12px",
      cursor: "pointer",
      outline: "none",
      minWidth: "92px",
      "& option": { background: "#2c2c2e", color: "#fff" },
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
    }),
    btnGroup: css3({ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }),
    btn: css3({
      flex: "1 1 auto",
      padding: "9px 12px",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "20px",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      cursor: "pointer",
      fontSize: "12px",
      textAlign: "center",
      transition: "0.2s",
      minWidth: "78px",
      wordBreak: "keep-all",
      whiteSpace: "nowrap"
    }),
    btnPrimary: css3({
      flex: "1 1 auto",
      padding: "9px 12px",
      border: "none",
      borderRadius: "20px",
      background: theme.colors.primary,
      color: "#fff",
      cursor: "pointer",
      fontSize: "12px",
      textAlign: "center",
      transition: "0.2s",
      minWidth: "78px",
      wordBreak: "keep-all",
      whiteSpace: "nowrap"
    }),
    btnDanger: css3({
      flex: "1 1 auto",
      padding: "9px 12px",
      border: "1px solid rgba(255,77,79,0.5)",
      borderRadius: "20px",
      background: "rgba(255,77,79,0.15)",
      color: "#ff6b6b",
      cursor: "pointer",
      fontSize: "12px",
      textAlign: "center",
      transition: "0.2s",
      minWidth: "78px",
      wordBreak: "keep-all",
      whiteSpace: "nowrap"
    })
  };
  var PANEL_OPEN_KEY = "__douyin-dl-profile-panel-open__";
  var readPanelOpen = /* @__PURE__ */ __name(() => {
    try {
      const saved = localStorage.getItem(PANEL_OPEN_KEY);
      if (saved !== null) return saved === "1";
    } catch {
    }
    return Config.global.features.enable_profile_downloader;
  }, "readPanelOpen");
  var writePanelOpen = /* @__PURE__ */ __name((open) => {
    try {
      localStorage.setItem(PANEL_OPEN_KEY, open ? "1" : "0");
    } catch {
    }
    Config.global.features.enable_profile_downloader = open;
    Config.global.save();
  }, "writePanelOpen");
  var s5 = {
    eagleBox: css3({ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }),
    eagleHead: css3({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "6px" }),
    eagleState: css3({ color: "rgba(255,255,255,0.9)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
    eagleRow: css3({ display: "flex", gap: "6px" }),
    miniBtn: css3({
      flex: 1,
      padding: "5px 8px",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: "11px",
      cursor: "pointer"
    }),
    miniInput: css3({
      width: "100%",
      boxSizing: "border-box",
      marginTop: "6px",
      padding: "5px 8px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: "11px",
      outline: "none"
    }),
    scrollBox: css3({ maxHeight: "150px", overflowY: "auto", marginTop: "6px", padding: "4px", background: "rgba(0,0,0,0.28)", borderRadius: "8px" }),
    row: css3({
      padding: "3px 6px",
      borderRadius: "4px",
      fontSize: "11px",
      color: "rgba(255,255,255,0.85)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      "&:hover": { background: "rgba(255,255,255,0.08)" }
    }),
    rowActive: css3({ background: "rgba(64,150,255,0.22)", color: "#fff" }),
    tagBox: css3({ maxHeight: "140px", overflowY: "auto", marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px", padding: "4px", background: "rgba(0,0,0,0.28)", borderRadius: "8px" }),
    tagOpt: css3({
      padding: "2px 8px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "rgba(255,255,255,0.75)",
      fontSize: "11px",
      cursor: "pointer",
      whiteSpace: "nowrap"
    }),
    tagOptActive: css3({ background: "rgba(254,44,85,0.25)", borderColor: theme.colors.primary, color: "#fff" }),
    tagActions: css3({ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }),
    linkBtn: css3({ color: theme.colors.primary, fontSize: "11px", cursor: "pointer", textDecoration: "underline" }),
    emptyHint: css3({ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "6px", lineHeight: 1.5 }),
    quickBtn: css3({
      width: "100%",
      marginTop: "8px",
      padding: "7px 10px",
      border: "1px solid rgba(64,150,255,0.55)",
      borderRadius: "20px",
      background: "rgba(64,150,255,0.16)",
      color: "#fff",
      fontSize: "12px",
      cursor: "pointer",
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
    }),
    quickWrap: css3({ position: "fixed", right: "24px", bottom: "96px", zIndex: 999999 }),
    quickFab: css3({
      padding: "10px 16px",
      border: "none",
      borderRadius: "22px",
      background: theme.colors.primary,
      color: "#fff",
      fontSize: "13px",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
      "&:disabled": { opacity: 0.6, cursor: "not-allowed" }
    })
  };
  // 悬浮按钮拖拽：按住拖动，位置写入 localStorage，刷新后仍生效
  var useDraggableFab = /* @__PURE__ */ __name((storageKey, defaultPos) => {
    const [pos, setPos] = d2(() => {
      let saved = null;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) saved = JSON.parse(raw);
      } catch (err) {
        saved = null;
      }
      const base = saved && typeof saved.x === "number" && typeof saved.y === "number" ? saved : defaultPos;
      return {
        x: Math.min(Math.max(base.x, 8), Math.max(8, window.innerWidth - 64)),
        y: Math.min(Math.max(base.y, 8), Math.max(8, window.innerHeight - 64))
      };
    });
    const posRef = A2(pos);
    const draggedRef = A2(false);
    posRef.current = pos;
    const onPointerDown = /* @__PURE__ */ __name((ev) => {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      const startX = ev.clientX;
      const startY = ev.clientY;
      const startPos = { x: posRef.current.x, y: posRef.current.y };
      let moved = false;
      const onMove = /* @__PURE__ */ __name((e3) => {
        const dx = e3.clientX - startX;
        const dy = e3.clientY - startY;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        moved = true;
        const next = {
          x: Math.min(Math.max(startPos.x + dx, 8), Math.max(8, window.innerWidth - 64)),
          y: Math.min(Math.max(startPos.y + dy, 8), Math.max(8, window.innerHeight - 64))
        };
        posRef.current = next;
        setPos(next);
      }, "onMove");
      const onUp = /* @__PURE__ */ __name(() => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        if (!moved) return;
        draggedRef.current = true;
        setTimeout(() => {
          draggedRef.current = false;
        }, 0);
        try {
          localStorage.setItem(storageKey, JSON.stringify(posRef.current));
        } catch (err) {
        }
      }, "onUp");
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }, "onPointerDown");
    return { pos, onPointerDown, draggedRef };
  }, "useDraggableFab");
  var FloatingPanelApp = /* @__PURE__ */ __name(({
    dataService,
    downloadManager,
    onOpenSettings
  }) => {
    const [exp, setExp] = d2(readPanelOpen);
    const [snap, setSnap] = d2(() => downloadManager.getSnapshot());
    const [showJob, setShowJob] = d2(false);
    const [concurrency, setConcurrency] = d2(snap.concurrency || 1);
    y2(() => {
      const off = downloadManager.on("stateChanged", () => setSnap(downloadManager.getSnapshot()));
      const off2 = downloadManager.on("countsUpdated", () => setSnap(downloadManager.getSnapshot()));
      return () => {
        off();
        off2();
      };
    }, []);
    y2(() => {
      setConcurrency(snap.concurrency || 1);
    }, [snap.concurrency]);
    // ── Eagle 推送目标：点按钮开弹层选择，选择后写入配置并持久化 ──
    const eagleCfg = /* @__PURE__ */ __name(() => (Config.global.features.downloader_config || {}).eagle || {}, "eagleCfg");
    const [, setEagleTick] = d2(0);
    const patchEagle = /* @__PURE__ */ __name((patch) => {
      const features = Config.global.features;
      const nextConfig = { ...(features.downloader_config || {}) };
      nextConfig.eagle = { ...(nextConfig.eagle || {}), ...patch };
      features.downloader_config = nextConfig;
      Config.global.save();
      setEagleTick((v3) => v3 + 1);
    }, "patchEagle");
    const drag = useDraggableFab("dy-dl-fab-pos", {
      x: Math.max(8, window.innerWidth - 72),
      y: Math.max(8, window.innerHeight - 132)
    });
    if (!dataService.isProfilePage()) return null;
    const progressType = snap.downloadType;
    const progressCount = Object.values(snap.itemStatuses || {}).filter((status) => status === "success").length;
    const progressTotal = Math.max(snap.counts.selected, 1);
    const progressPercent = Math.min(100, Math.round(progressCount / progressTotal * 100));
    const startJob = /* @__PURE__ */ __name(async (downloadType = "content", downloaderOverride = "") => {
      try {
        await downloadManager.startJob(downloadType, concurrency, downloaderOverride);
      } catch (e3) {
        alert(e3.message || e3);
      }
    }, "startJob");
    const eagleCfgNow = eagleCfg();
    const selectedEagleTags = Array.isArray(eagleCfgNow.tags) ? eagleCfgNow.tags : [];
    const eagleTargetLabel = (eagleCfgNow.folder_name || "根目录") + " · " + (selectedEagleTags.length > 0 ? selectedEagleTags.length + " 个标签" : "无标签");
    // FAB 定位：卡片跟随 FAB，优先在其下方展开，空间不足时改到上方（避免溢出视口）
    const FAB_SIZE = 44;
    const FAB_GAP = 12;
    const CARD_W = 372;
    const fabStyle = { left: drag.pos.x + "px", top: drag.pos.y + "px" };
    const cardLeft = Math.min(Math.max(drag.pos.x + FAB_SIZE - CARD_W, 8), Math.max(8, window.innerWidth - CARD_W - 8));
    const spaceBelow = window.innerHeight - (drag.pos.y + FAB_SIZE + FAB_GAP + 8);
    const cardStyle = spaceBelow >= 300 ? {
      left: cardLeft + "px",
      top: drag.pos.y + FAB_SIZE + FAB_GAP + "px",
      maxHeight: Math.max(200, spaceBelow) + "px"
    } : {
      left: cardLeft + "px",
      bottom: window.innerHeight - drag.pos.y + FAB_GAP + "px",
      maxHeight: Math.max(200, drag.pos.y - 16) + "px"
    };
    return /* @__PURE__ */ u3(k, { children: [
      exp && /* @__PURE__ */ u3("div", { className: s4.card, style: cardStyle, children: [
        /* @__PURE__ */ u3("h4", { className: s4.title, children: snap.profileName || "作者主页" }),
        /* @__PURE__ */ u3("div", { className: s5.eagleBox, children: [
          /* @__PURE__ */ u3("div", { className: s5.eagleHead, children: [
            /* @__PURE__ */ u3("span", { children: "Eagle 目标" }),
            /* @__PURE__ */ u3("span", { className: s5.eagleState, title: eagleTargetLabel, children: eagleTargetLabel })
          ] }),
          /* @__PURE__ */ u3("div", { className: s5.eagleRow, children: [
            /* @__PURE__ */ u3("button", { className: s5.miniBtn, onClick: () => openEaglePicker({ mode: "folder", baseURL: eagleCfgNow.base_url, selectedFolderId: eagleCfgNow.folder_id || "", onChange: patchEagle }), children: "目录" }),
            /* @__PURE__ */ u3("button", { className: s5.miniBtn, onClick: () => openEaglePicker({ mode: "tag", baseURL: eagleCfgNow.base_url, selectedTags: selectedEagleTags, onChange: patchEagle }), children: "标签" })
          ] }),
          /* @__PURE__ */ u3("button", { className: s5.quickBtn, onClick: () => downloadManager.mediaHandler.push_current_to_eagle(), children: "存当前作品到 Eagle" })
        ] }),
        /* @__PURE__ */ u3("div", { className: s4.row, children: [
          /* @__PURE__ */ u3("span", { className: s4.label, children: "状态" }),
          /* @__PURE__ */ u3("span", { className: s4.value, children: snap.statusLabel })
        ] }),
        /* @__PURE__ */ u3("div", { className: s4.stats, children: [
          /* @__PURE__ */ u3("span", { children: ["发现 ", snap.counts.known] }),
          /* @__PURE__ */ u3("span", { children: ["已选 ", snap.counts.selected] }),
          /* @__PURE__ */ u3("span", { children: ["内容 ", snap.counts.downloaded] }),
          /* @__PURE__ */ u3("span", { children: ["封面 ", snap.counts.coverDownloaded] }),
          /* @__PURE__ */ u3("span", { children: ["失败 ", snap.counts.failed + snap.counts.coverFailed] })
        ] }),
        /* @__PURE__ */ u3("div", { className: s4.progressSection, children: [
          /* @__PURE__ */ u3("div", { className: s4.progressHeader, children: [
            /* @__PURE__ */ u3("span", { children: progressType === "cover" ? "封面进度" : "内容进度" }),
            /* @__PURE__ */ u3("span", { children: [progressCount, "/", progressTotal] })
          ] }),
          /* @__PURE__ */ u3("div", { className: s4.progressBar, children: /* @__PURE__ */ u3("div", { className: s4.progressFill, style: { width: progressPercent + "%" } }) })
        ] }),
        /* @__PURE__ */ u3("div", { className: s4.btnGroup, children: [
          /* @__PURE__ */ u3("select", { className: s4.select, value: concurrency, disabled: snap.jobRunning, onChange: (e3) => setConcurrency(Number(e3.target.value)), children: [1, 2, 3, 4, 5].map((n2) => /* @__PURE__ */ u3("option", { value: n2, children: ["并发 ", n2] }, n2)) }),
          /* @__PURE__ */ u3("button", { className: s4.btn, onClick: () => downloadManager.markSelectAll(!downloadManager.isSelectAll()), children: downloadManager.isSelectAll() ? "取消全选" : "全选" }),
          /* @__PURE__ */ u3("button", { className: s4.btn, onClick: () => onOpenSettings?.(), children: "设置" }),
          /* @__PURE__ */ u3("button", { className: s4.btn, onClick: () => setShowJob(true), children: "查看详情" }),
          !snap.jobRunning ? /* @__PURE__ */ u3(k, { children: [
            /* @__PURE__ */ u3("button", { className: s4.btnPrimary, onClick: () => startJob("content"), disabled: snap.counts.selected === 0, children: "开始下载" }),
            /* @__PURE__ */ u3("button", { className: s4.btn, onClick: () => startJob("content", "eagle"), disabled: snap.counts.selected === 0, children: "存 Eagle" }),
            /* @__PURE__ */ u3("button", { className: s4.btn, onClick: () => startJob("cover"), disabled: snap.counts.selected === 0, children: "下载封面" })
          ] }) : /* @__PURE__ */ u3("button", { className: s4.btnDanger, onClick: () => downloadManager.pauseJob(), children: "暂停" })
        ] })
      ] }),
      /* @__PURE__ */ u3("button", {
        className: s4.fab,
        style: fabStyle,
        title: "按住可拖动位置",
        onPointerDown: drag.onPointerDown,
        onClick: () => {
          if (drag.draggedRef.current) return;
          const next = !exp;
          setExp(next);
          writePanelOpen(next);
        },
        children: exp ? "❌" : "插件"
      }),
      showJob && /* @__PURE__ */ u3(ProfileJobModalApp, { downloadManager, onClose: () => setShowJob(false) })
    ] });
  }, "FloatingPanelApp");

  // 作品详情页的悬浮「存到 Eagle」按钮（主页已有浮动面板，不重复显示）
  var EagleQuickButtonApp = /* @__PURE__ */ __name(({ mediaHandler }) => {
    const [, setTick] = d2(0);
    const [busy, setBusy] = d2(false);
    y2(() => {
      const timer = setInterval(() => setTick((v3) => v3 + 1), 1500);
      return () => clearInterval(timer);
    }, []);
    if (!/(^|\/)(video|note)\//.test(location.pathname)) return null;
    const media = mediaHandler.current_media;
    const eagleTarget = (Config.global.features.downloader_config || {}).eagle || {};
    const targetTags = Array.isArray(eagleTarget.tags) ? eagleTarget.tags : [];
    const targetTip = "目标：" + (eagleTarget.folder_name || "库根目录") + " · " + (targetTags.length > 0 ? targetTags.length + " 个标签" : "无标签");
    const handlePush = /* @__PURE__ */ __name(async () => {
      if (busy) return;
      setBusy(true);
      try {
        await mediaHandler.push_current_to_eagle();
      } finally {
        setTimeout(() => setBusy(false), 1200);
      }
    }, "handlePush");
    return /* @__PURE__ */ u3("div", { className: s5.quickWrap, children: [
      /* @__PURE__ */ u3("button", {
        className: s5.quickFab,
        onClick: handlePush,
        disabled: busy,
        title: targetTip,
        children: busy ? "推送中..." : media ? "存到 Eagle" : "存到 Eagle（先播放）"
      })
    ] });
  }, "EagleQuickButtonApp");

  // src/ui/FloatingPanel.tsx
  init_jsxRuntime_module();
  var _FloatingPanel = class _FloatingPanel {
    constructor() {
      this.root = null;
      this.mounted = false;
    }
    // 挂载浮动面板到 DOM
    mount({ dataService, downloadManager, onOpenSettings }) {
      this.root = document.createElement("div");
      this.root.id = "dy-dl-floating-panel";
      document.body.appendChild(this.root);
      this.mounted = true;
      try {
        G(/* @__PURE__ */ u3(FloatingPanelApp, { dataService, downloadManager, onOpenSettings }), this.root);
      } catch (e3) {
        console.error("[dy-dl] FloatingPanelUI 加载失败", e3);
      }
    }
    // 卸载浮动面板
    unmount() {
      if (this.root && this.mounted) {
        G(null, this.root);
        this.root.remove();
        this.root = null;
        this.mounted = false;
      }
    }
  };
  __name(_FloatingPanel, "FloatingPanel");
  var FloatingPanel = _FloatingPanel;

  // src/handlers/profile/ProfileDownloadManager.ts
  init_Emitter();

  // src/core/download/ProfileDownloadState.ts
  var DB_NAME = "dy-dl-profile-download-state";
  var DB_VERSION = 1;
  var STORE_NAME = "profile-download-state";
  var MAX_STORED_PROFILE_STATES = 30;
  var PROFILE_STATE_TTL_MS = 90 * 24 * 60 * 60 * 1e3;
  var dbPromise = null;
  function getProfileStateDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: "profileKey" });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            dbPromise = null;
            reject(request.error);
          };
          request.onblocked = () => {
            dbPromise = null;
            reject(new Error("IndexedDB blocked"));
          };
        } catch (error) {
          dbPromise = null;
          reject(error);
        }
      });
    }
    return dbPromise;
  }
  __name(getProfileStateDB, "getProfileStateDB");
  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  __name(requestResult, "requestResult");
  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  __name(transactionComplete, "transactionComplete");
  var _ProfileDownloadState = class _ProfileDownloadState {
    static _storage_key(profileKey) {
      return `${this.STORAGE_PREFIX}${profileKey}`;
    }
    static create_default(profile = {}) {
      return {
        version: 1,
        profileKey: profile.profileKey || "",
        secUid: profile.secUid || "",
        profileName: profile.profileName || "",
        tabKey: profile.tabKey || "post",
        status: "idle",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastRunAt: 0,
        completedAt: 0,
        knownIds: [],
        downloadedIds: [],
        failedItems: {},
        coverDownloadedIds: [],
        coverFailedItems: {}
      };
    }
    static async load(profileKey, profile = {}) {
      try {
        const db = await getProfileStateDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const stored = await requestResult(transaction.objectStore(STORE_NAME).get(profileKey));
        if (stored) {
          this._remove_legacy(profileKey);
          return this._normalize(stored, profile, profileKey);
        }
        const legacy = this._read_legacy(profileKey);
        if (legacy) {
          const state = this._normalize(legacy, profile, profileKey);
          await this.save(profileKey, state);
          return state;
        }
        return this.create_default({ ...profile, profileKey });
      } catch (error) {
        console.error("[dy-dl]加载作者下载状态失败", error);
        const legacy = this._read_legacy(profileKey);
        if (legacy) return this._normalize(legacy, profile, profileKey);
        return this.create_default({ ...profile, profileKey });
      }
    }
    static async save(profileKey, state) {
      const nextState = { ...state, updatedAt: Date.now() };
      try {
        const db = await getProfileStateDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(nextState);
        await transactionComplete(transaction);
        this._remove_legacy(profileKey);
      } catch (error) {
        console.error("[dy-dl]保存作者下载状态到 IndexedDB 失败", error);
      }
      return nextState;
    }
    static async reset(profileKey) {
      try {
        const db = await getProfileStateDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(profileKey);
        await transactionComplete(transaction);
      } catch (error) {
        console.error("[dy-dl]删除作者下载状态失败", error);
      }
      this._remove_legacy(profileKey);
    }
    static async pruneOldStates() {
      try {
        const db = await getProfileStateDB();
        const readTransaction = db.transaction(STORE_NAME, "readonly");
        const records = await requestResult(readTransaction.objectStore(STORE_NAME).getAll());
        const cutoff = Date.now() - PROFILE_STATE_TTL_MS;
        const toDelete = /* @__PURE__ */ new Set();
        for (const state of records) {
          if (!state.updatedAt || state.updatedAt < cutoff) toDelete.add(state.profileKey);
        }
        const active = records.filter((state) => state.updatedAt && state.updatedAt >= cutoff).sort((a3, b) => (b.updatedAt || 0) - (a3.updatedAt || 0));
        for (const state of active.slice(MAX_STORED_PROFILE_STATES)) toDelete.add(state.profileKey);
        if (toDelete.size === 0) return;
        const writeTransaction = db.transaction(STORE_NAME, "readwrite");
        const store = writeTransaction.objectStore(STORE_NAME);
        for (const profileKey of toDelete) store.delete(profileKey);
        await transactionComplete(writeTransaction);
        console.info(`[dy-dl]清理作者下载状态 ${toDelete.size} 条`);
      } catch (error) {
        console.error("[dy-dl]清理作者下载状态失败", error);
      }
    }
    static async migrateLegacyStorage() {
      try {
        const legacyKeys = [];
        for (let i3 = 0; i3 < localStorage.length; i3++) {
          const key = localStorage.key(i3);
          if (key && key.startsWith(this.STORAGE_PREFIX)) legacyKeys.push(key);
        }
        if (legacyKeys.length === 0) return;
        const db = await getProfileStateDB();
        const readTransaction = db.transaction(STORE_NAME, "readonly");
        const storedRecords = await requestResult(readTransaction.objectStore(STORE_NAME).getAll());
        const storedByKey = new Map(storedRecords.map((state) => [state.profileKey, state]));
        const statesToPut = [];
        for (const key of legacyKeys) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }
          const profileKey = key.slice(this.STORAGE_PREFIX.length);
          const state = this._normalize(parsed, {}, profileKey);
          if (!parsed?.updatedAt) state.updatedAt = 0;
          const stored = storedByKey.get(profileKey);
          if (!stored || (stored.updatedAt || 0) < (state.updatedAt || 0)) statesToPut.push(state);
        }
        if (statesToPut.length > 0) {
          const writeTransaction = db.transaction(STORE_NAME, "readwrite");
          const store = writeTransaction.objectStore(STORE_NAME);
          for (const state of statesToPut) store.put(state);
          await transactionComplete(writeTransaction);
        }
        for (const key of legacyKeys) localStorage.removeItem(key);
      } catch (error) {
        console.error("[dy-dl]迁移旧作者下载状态失败", error);
      }
    }
    static _normalize(parsed, profile, profileKey) {
      const source = parsed && typeof parsed === "object" ? parsed : {};
      return {
        ...this.create_default({ ...profile, profileKey }),
        ...source,
        profileKey,
        secUid: profile.secUid || source.secUid || "",
        profileName: profile.profileName || source.profileName || "",
        tabKey: profile.tabKey || source.tabKey || "post",
        knownIds: Array.isArray(source.knownIds) ? source.knownIds : [],
        downloadedIds: Array.isArray(source.downloadedIds) ? source.downloadedIds : [],
        failedItems: source.failedItems && typeof source.failedItems === "object" ? source.failedItems : {},
        coverDownloadedIds: Array.isArray(source.coverDownloadedIds) ? source.coverDownloadedIds : [],
        coverFailedItems: source.coverFailedItems && typeof source.coverFailedItems === "object" ? source.coverFailedItems : {}
      };
    }
    static _read_legacy(profileKey) {
      try {
        const raw = localStorage.getItem(this._storage_key(profileKey));
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (error) {
        console.error("[dy-dl]读取旧作者下载状态失败", error);
        return null;
      }
    }
    static _remove_legacy(profileKey) {
      try {
        localStorage.removeItem(this._storage_key(profileKey));
      } catch {
      }
    }
  };
  __name(_ProfileDownloadState, "ProfileDownloadState");
  _ProfileDownloadState.STORAGE_PREFIX = "__douyin-dl-profile-state__:";
  var ProfileDownloadState = _ProfileDownloadState;

  // src/utils/performance.ts
  function throttle(func, limit) {
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  __name(throttle, "throttle");

  // src/handlers/profile/ProfileDownloadManager.ts
  var _ProfileDownloadManager = class _ProfileDownloadManager extends Emitter {
    constructor({ mediaHandler: mediaHandler2, dataService }) {
      super();
      this.jobState = null;
      this.jobRunning = false;
      this.jobStopRequested = false;
      this.jobEndRequested = false;
      this.jobLog = [];
      this.currentDownloadType = "content";
      /** 本次任务并发数，不写入全局配置 */
      this._concurrency = 1;
      /** 本次任务的方块状态，不持久化 */
      this._itemStatus = {};
      /** 选中的媒体 */
      this.selectedIds = /* @__PURE__ */ new Set();
      this.collect_timer = null;
      this._loadPromise = null;
      this._loadProfileKey = "";
      this._saveQueue = Promise.resolve();
      this._storageInit = ProfileDownloadState.migrateLegacyStorage().then(() => ProfileDownloadState.pruneOldStates());
      this.mediaHandler = mediaHandler2;
      this.dataService = dataService;
      const collect = throttle(this.collect.bind(this), 1e3);
      this.collect_timer = setInterval(collect, 5 * 1e3);
      window.addEventListener("wheel", collect, { passive: false });
    }
    async collect() {
      if (!this.dataService.isProfilePage()) return;
      await this._ensureJobState();
      if (!this.jobState) return;
      const prev = this.jobState.knownIds.length || 0;
      const mediaList = this.dataService.collectCurrentFeedMedia();
      this.mergeMediaIntoState(mediaList);
      const changed = this.jobState.knownIds.length - prev;
      if (changed) {
        this.emit("stateChanged", this);
        this.emit("countsUpdated", this.getCounts());
      }
    }
    // 确保 jobState 与当前页面 profile 匹配
    async _ensureJobState(profile) {
      const context = profile || this.dataService.getProfileContext();
      if (!context) {
        if (!this.jobRunning) {
          this.jobState = null;
          this._clearSessionState();
        }
        return null;
      }
      const needLoad = !this.jobState || !this.jobRunning && this.jobState.profileKey !== context.profileKey;
      if (!needLoad) return this.jobState;
      if (this._loadProfileKey === context.profileKey && this._loadPromise) {
        return this._loadPromise;
      }
      this._clearSessionState();
      this.jobState = null;
      const loadProfileKey = context.profileKey;
      this._loadProfileKey = loadProfileKey;
      const load = this._storageInit.then(() => ProfileDownloadState.load(loadProfileKey, context)).then((state) => {
        if (this._loadProfileKey === loadProfileKey) this.jobState = state;
        return state;
      }).catch((error) => {
        console.error("[dy-dl]加载作者下载状态失败", error);
        if (this._loadProfileKey === loadProfileKey) this.jobState = ProfileDownloadState.create_default(context);
        return this.jobState;
      }).finally(() => {
        if (this._loadProfileKey === loadProfileKey) {
          this._loadPromise = null;
          this._loadProfileKey = "";
        }
        this.emit("stateChanged", this);
      });
      this._loadPromise = load;
      return load;
    }
    /** 页面跳转后同步当前会话状态 */
    async syncPageState() {
      await this._ensureJobState();
      this.emit("stateChanged", this);
    }
    _clearSessionState() {
      this.jobLog = [];
      this.selectedIds.clear();
      this._itemStatus = {};
      this.currentDownloadType = "content";
      this._concurrency = 1;
    }
    _saveJobState() {
      if (!this.jobState?.profileKey) return Promise.resolve(this.jobState);
      const profileKey = this.jobState.profileKey;
      const run = this._saveQueue.then(async () => {
        await this._storageInit;
        const state = this.jobState;
        if (!state?.profileKey || state.profileKey !== profileKey) return state;
        return ProfileDownloadState.save(profileKey, state);
      });
      this._saveQueue = run.then(
        () => void 0,
        () => void 0
      );
      return run;
    }
    _push_log(status, message, media, type = this.currentDownloadType) {
      this.jobLog.push({
        time: Date.now(),
        type,
        awemeId: media?.awemeId || "",
        desc: media?.desc || "",
        status,
        message
      });
      if (this.jobLog.length > 200) this.jobLog.splice(0, this.jobLog.length - 200);
      this.emit("jobLog", this.jobLog.slice());
    }
    mergeMediaIntoState(mediaList) {
      if (!this.jobState) return;
      const knownIds = new Set(this.jobState.knownIds || []);
      mediaList.forEach((media) => {
        if (media?.awemeId) knownIds.add(media.awemeId);
      });
      this.jobState.knownIds = Array.from(knownIds);
    }
    markDownloaded(media, downloadType = "content") {
      if (!this.jobState || !media?.awemeId) return;
      if (downloadType === "cover") {
        const downloadedIds = new Set(this.jobState.coverDownloadedIds || []);
        downloadedIds.add(media.awemeId);
        this.jobState.coverDownloadedIds = Array.from(downloadedIds);
        if (this.jobState.coverFailedItems?.[media.awemeId]) delete this.jobState.coverFailedItems[media.awemeId];
      } else {
        const downloadedIds = new Set(this.jobState.downloadedIds || []);
        downloadedIds.add(media.awemeId);
        this.jobState.downloadedIds = Array.from(downloadedIds);
        if (this.jobState.failedItems?.[media.awemeId]) delete this.jobState.failedItems[media.awemeId];
      }
    }
    markFailed(media, reason = "unknown", downloadType = "content", message = reason) {
      if (!this.jobState || !media?.awemeId) return;
      if (downloadType === "cover") {
        const prev = this.jobState.coverFailedItems?.[media.awemeId] || {};
        this.jobState.coverFailedItems = this.jobState.coverFailedItems || {};
        this.jobState.coverFailedItems[media.awemeId] = {
          count: Number(prev.count || 0) + 1,
          reason,
          message: message || reason,
          updatedAt: Date.now(),
          desc: media.desc || prev.desc || ""
        };
      } else {
        const prev = this.jobState.failedItems?.[media.awemeId] || {};
        this.jobState.failedItems = this.jobState.failedItems || {};
        this.jobState.failedItems[media.awemeId] = {
          count: Number(prev.count || 0) + 1,
          reason,
          message: message || reason,
          updatedAt: Date.now(),
          desc: media.desc || prev.desc || ""
        };
      }
    }
    markSelect(awemeId, selected) {
      const changed = selected ? !this.selectedIds.has(awemeId) : this.selectedIds.has(awemeId);
      if (selected) this.selectedIds.add(awemeId);
      else this.selectedIds.delete(awemeId);
      if (changed) {
        this.emit("stateChanged", this);
        this.emit("countsUpdated", this.getCounts());
      }
    }
    markSelectMany(ids, selected) {
      let changed = false;
      for (const awemeId of ids) {
        const has = this.selectedIds.has(awemeId);
        if (selected && !has) {
          this.selectedIds.add(awemeId);
          changed = true;
        } else if (!selected && has) {
          this.selectedIds.delete(awemeId);
          changed = true;
        }
      }
      if (changed) {
        this.emit("stateChanged", this);
        this.emit("countsUpdated", this.getCounts());
      }
    }
    markSelectAll(selected) {
      if (!selected) this.selectedIds.clear();
      else this.jobState?.knownIds?.forEach((id) => this.selectedIds.add(id));
      this.emit("stateChanged", this);
      this.emit("countsUpdated", this.getCounts());
    }
    isSelectAll() {
      return this.selectedIds.size === this.jobState?.knownIds?.length;
    }
    _isFeedSelected(awemeId) {
      return this.selectedIds.has(awemeId);
    }
    getFeedCardStatus(awemeId) {
      const running = this._itemStatus[awemeId] === "running";
      return {
        selected: this.selectedIds.has(awemeId),
        contentDownloaded: this.jobState?.downloadedIds?.includes(awemeId) || false,
        coverDownloaded: this.jobState?.coverDownloadedIds?.includes(awemeId) || false,
        failed: Boolean(this.jobState?.failedItems?.[awemeId]),
        coverFailed: Boolean(this.jobState?.coverFailedItems?.[awemeId]),
        running,
        runningType: running ? this.currentDownloadType : null
      };
    }
    getCounts() {
      return {
        known: this.jobState?.knownIds?.length || 0,
        downloaded: this.jobState?.downloadedIds?.length || 0,
        failed: Object.keys(this.jobState?.failedItems || {}).length,
        coverDownloaded: this.jobState?.coverDownloadedIds?.length || 0,
        coverFailed: Object.keys(this.jobState?.coverFailedItems || {}).length,
        selected: this.selectedIds.size,
        is_selected_all: this.isSelectAll()
      };
    }
    _normalizeConcurrency(value) {
      const raw = Number(value);
      const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
      return Math.min(Math.max(next, 1), 5);
    }
    _deriveItemStatuses() {
      const statuses = {};
      if (!this.jobState) return statuses;
      const isCover = this.currentDownloadType === "cover";
      const downloadedSet = new Set(isCover ? this.jobState.coverDownloadedIds || [] : this.jobState.downloadedIds || []);
      const failedItems = isCover ? this.jobState.coverFailedItems || {} : this.jobState.failedItems || {};
      const failedSet = new Set(Object.keys(failedItems));
      this.selectedIds.forEach((id) => {
        if (failedSet.has(id)) statuses[id] = "failed";
        else if (downloadedSet.has(id)) statuses[id] = "success";
        else statuses[id] = "pending";
      });
      return statuses;
    }
    getSnapshot(profileNameFallback = "当前作者主页") {
      if (!this.jobState) void this._ensureJobState();
      const isProfilePage = this.dataService.isProfilePage();
      const profile = !this.jobRunning && isProfilePage ? this.dataService.getProfileContext() : null;
      const profileName = this.jobState?.profileName || profile?.profileName || profileNameFallback;
      const statusLabel = this.jobRunning ? this.jobStopRequested ? this.jobEndRequested ? "结束中..." : "暂停中..." : "进行中" : this.jobState?.status === "completed" ? "已完成" : this.jobState?.status === "paused" ? "已暂停" : this.jobState?.status === "idle" ? "已结束" : "待开始";
      const counts = this.getCounts();
      const itemStatuses = Object.keys(this._itemStatus).length > 0 ? this._itemStatus : this._deriveItemStatuses();
      return {
        jobRunning: this.jobRunning,
        jobStopRequested: this.jobStopRequested,
        jobStatus: this.jobState?.status || "idle",
        profileName,
        statusLabel,
        counts,
        jobLog: this.jobLog.slice(),
        downloadType: this.currentDownloadType,
        concurrency: this._concurrency,
        itemStatuses: { ...itemStatuses }
      };
    }
    // 重置状态
    async resetState() {
      const profile = this.dataService.getProfileContext();
      if (!profile) return false;
      if (this.jobRunning) await this.endJob();
      await this._storageInit;
      await this._saveQueue;
      this.jobLog = [];
      await ProfileDownloadState.reset(profile.profileKey);
      this.currentDownloadType = "content";
      this._concurrency = 1;
      this._itemStatus = {};
      this.jobState = ProfileDownloadState.create_default(profile);
      this._loadPromise = null;
      this._loadProfileKey = "";
      await this.collect();
      this.emit("stateChanged", this);
      return true;
    }
    // 暂停当前下载，循环会在当前项结束后停止
    async pauseJob() {
      if (!this.jobRunning || this.jobStopRequested) return;
      this.jobStopRequested = true;
      if (this.jobState?.profileKey) {
        this.jobState.status = "paused";
        await this._saveJobState();
      }
      this._push_log("info", "已暂停");
      this.emit("jobPaused");
      this.emit("stateChanged", this);
    }
    // 继续上次暂停的下载
    resumeJob() {
      if (this.jobRunning) return;
      if (this.jobState?.status !== "paused") return;
      return this.startJob(this.currentDownloadType, this._concurrency);
    }
    // 结束当前下载阶段，回到选择阶段
    async endJob() {
      if (this.jobRunning) this.jobStopRequested = true;
      this.jobEndRequested = true;
      if (this.jobState?.profileKey) {
        this.jobState.status = "idle";
        await this._saveJobState();
      }
      this._push_log("info", "已结束");
      this.emit("jobEnded");
      this.emit("stateChanged", this);
    }
    // 启动下载循环（由外部调用，这里只做前置准备）
    // downloaderOverride：本次任务临时指定下载器（目前用于「存 Eagle」按钮），不影响全局设置
    async startJob(downloadType = this.currentDownloadType, concurrency = 1, downloaderOverride = "") {
      if (!this.dataService.isProfilePage()) throw new Error("请在作者主页中使用全量下载。");
      await this._ensureJobState();
      if (this.jobRunning) return;
      if (this.mediaHandler.downloading) throw new Error("当前已有下载任务在进行中。");
      const releaseLock = this.mediaHandler._flag_start_download();
      const resuming = this.jobState?.status === "paused" && downloadType === this.currentDownloadType;
      if (!resuming) this.jobLog = [];
      this.currentDownloadType = downloadType;
      this._downloaderOverride = downloaderOverride || "";
      this._concurrency = this._normalizeConcurrency(concurrency);
      this.jobRunning = true;
      this.jobStopRequested = false;
      this.jobEndRequested = false;
      this.emit("jobStarted");
      const isEagleJob = this._downloaderOverride === "eagle";
      this._push_log("info", resuming ? (isEagleJob ? "继续推送到 Eagle" : "继续下载") : isEagleJob ? "开始推送到 Eagle" : "开始下载");
      if (resuming) this.emit("jobResumed");
      this.emit("stateChanged", this);
      try {
        await this._runDownloadLoop();
      } finally {
        this.jobRunning = false;
        this.jobStopRequested = false;
        this.jobEndRequested = false;
        this._downloaderOverride = "";
        releaseLock();
        this.emit("stateChanged", this);
      }
    }
    async _runDownloadLoop() {
      const profile = this.dataService.getProfileContext();
      if (!profile) throw new Error("无法获取作者信息。");
      await this._ensureJobState(profile);
      if (!this.jobState) return;
      this.jobState.status = "running";
      this.jobState.lastRunAt = Date.now();
      this.jobState.completedAt = 0;
      await this._saveJobState();
      this.emit("stateChanged", this);
      const downloadType = this.currentDownloadType;
      const downloadedIds = downloadType === "cover" ? this.jobState.coverDownloadedIds || [] : this.jobState.downloadedIds || [];
      const failedItems = downloadType === "cover" ? this.jobState.coverFailedItems || {} : this.jobState.failedItems || {};
      const downloadedSet = new Set(downloadedIds);
      const failedSet = new Set(Object.keys(failedItems));
      const selectedIdsArray = Array.from(this.selectedIds);
      const pendingIds = selectedIdsArray.filter((id) => !downloadedSet.has(id) || failedSet.has(id));
      this._itemStatus = this._deriveItemStatuses();
      this.emit("stateChanged", this);
      if (pendingIds.length === 0) {
        this.jobState.status = this.jobEndRequested ? "idle" : "completed";
        if (this.jobState.status === "completed") this.jobState.completedAt = Date.now();
        await this._saveJobState();
        if (this.jobState.status === "completed") {
          this._push_log("info", "没有待下载项，任务完成");
          this.emit("jobCompleted");
        }
        this.emit("stateChanged", this);
        return;
      }
      const concurrency = this._concurrency;
      this._push_log("info", `并发数：${concurrency}`);
      await this._runConcurrentWorkers(pendingIds, downloadType, concurrency, this._downloaderOverride);
      if (!this.jobState) return;
      if (this.jobStopRequested) {
        this.jobState.status = this.jobEndRequested ? "idle" : "paused";
        await this._saveJobState();
        this.emit("stateChanged", this);
        return;
      }
      this.jobState.status = this.jobEndRequested ? "idle" : "completed";
      if (this.jobState.status === "completed") this.jobState.completedAt = Date.now();
      await this._saveJobState();
      if (this.jobState.status === "completed") {
        this._push_log("info", this._downloaderOverride === "eagle" ? "推送完成" : "下载完成");
        this.emit("jobCompleted");
      }
      this.emit("stateChanged", this);
    }
    async _downloadOne(awemeId, downloadType, downloaderOverride = "") {
      if (this.jobStopRequested) return;
      const media = this.dataService.feedMediaCache.get(awemeId);
      const isEaglePush = downloaderOverride === "eagle";
      const actionWord = isEaglePush ? "推送" : "下载";
      if (!media) {
        const fakeMedia = { awemeId, desc: "未缓存" };
        console.warn("[dy-dl] 缓存中未找到作品", awemeId);
        this._itemStatus[awemeId] = "failed";
        this._push_log("failed", "缓存中未找到作品，已标记失败", fakeMedia);
        this.markFailed(fakeMedia, "cache_miss", downloadType, "缓存中未找到作品");
        await this._saveJobState();
        this.emit("stateChanged", this);
        this.emit("countsUpdated", this.getCounts());
        return;
      }
      this._itemStatus[awemeId] = "running";
      this.emit("stateChanged", this);
      this._push_log("running", isEaglePush ? "开始推送" : "开始下载", media);
      const result = downloadType === "cover" ? await this.mediaHandler._download_cover_logic(media, { alertOnFail: false, downloaderOverride }) : await this.mediaHandler._download_media_logic(media, {
        toastTarget: null,
        toast: { update: /* @__PURE__ */ __name(() => {
        }, "update") },
        toastPrefix: "批量下载",
        alertOnFail: false,
        addHistory: true,
        downloaderOverride
      });
      const reason = result?.reason || (downloadType === "cover" ? "cover_download_failed" : "download_failed");
      const errorMessage = result?.message || result?.error_msg || reason;
      if (result?.ok) {
        this._itemStatus[awemeId] = "success";
        this.markDownloaded(media, downloadType);
        this._push_log("success", actionWord + "成功", media);
      } else {
        this._itemStatus[awemeId] = "failed";
        this.markFailed(media, reason, downloadType, errorMessage);
        this._push_log("failed", actionWord + "失败：" + errorMessage, media);
      }
      await this._saveJobState();
      this.emit("stateChanged", this);
      this.emit("countsUpdated", this.getCounts());
      await new Promise((r3) => setTimeout(r3, 500));
    }
    async _runConcurrentWorkers(pendingIds, downloadType, concurrency, downloaderOverride = "") {
      let cursor = 0;
      const worker = /* @__PURE__ */ __name(async () => {
        while (!this.jobStopRequested) {
          const index = cursor++;
          if (index >= pendingIds.length) return;
          const awemeId = pendingIds[index];
          try {
            await this._downloadOne(awemeId, downloadType, downloaderOverride);
          } catch (error) {
            const media = this.dataService.feedMediaCache.get(awemeId);
            const fallbackMedia = { awemeId, desc: "下载异常" };
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[dy-dl] 批量下载任务异常", error);
            this._itemStatus[awemeId] = "failed";
            this._push_log("failed", "下载异常：" + errorMessage, media || fallbackMedia);
            this.markFailed(media || fallbackMedia, "unexpected_error", downloadType, errorMessage);
            await this._saveJobState();
            this.emit("stateChanged", this);
            this.emit("countsUpdated", this.getCounts());
          }
        }
      }, "worker");
      const workerCount = Math.min(concurrency, pendingIds.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    }
  };
  __name(_ProfileDownloadManager, "ProfileDownloadManager");
  var ProfileDownloadManager = _ProfileDownloadManager;

  // src/handlers/profile/ProfilePageHandler.ts
  var _ProfilePageHandler = class _ProfilePageHandler {
    constructor({ mediaHandler: mediaHandler2 }) {
      this.panel = null;
      this.mediaHandler = mediaHandler2;
      this.dataService = new ProfileDataService();
      this.downloadManager = new ProfileDownloadManager({ mediaHandler: mediaHandler2, dataService: this.dataService });
      this.watchPageChanges();
    }
    watchPageChanges() {
      let lastHref = location.href;
      setInterval(() => {
        if (location.href === lastHref) return;
        lastHref = location.href;
        this.downloadManager.syncPageState();
      }, 500);
    }
    mount_ui() {
      if (this.panel) return;
      this.panel = new FloatingPanel();
      this.panel.mount({ dataService: this.dataService, downloadManager: this.downloadManager, onOpenSettings: /* @__PURE__ */ __name(() => this.mediaHandler.open_config_modal(), "onOpenSettings") });
      if (!this.eagleQuickRoot) {
        this.eagleQuickRoot = document.createElement("div");
        this.eagleQuickRoot.id = "dy-dl-eagle-quick";
        document.body.appendChild(this.eagleQuickRoot);
        G(/* @__PURE__ */ u3(EagleQuickButtonApp, { mediaHandler: this.mediaHandler }), this.eagleQuickRoot);
      }
    }
  };
  __name(_ProfilePageHandler, "ProfilePageHandler");
  var ProfilePageHandler = _ProfilePageHandler;

  // src/index.ts
  var downloader = new Downloader();
  var mediaHandler = new MediaHandler(downloader);
  var videoHandler = new VideoHandler();
  var danmakuHandler = new DanmakuHandler();
  var profilePageHandler = new ProfilePageHandler({ mediaHandler });
  var domPatcher = new DOMPatcher({
    downloader,
    mediaHandler,
    videoHandler,
    danmakuHandler,
    profilePageHandler
  });
  var hotkeyManager = new HotkeyManager();
  var registerDownloadHotkey = /* @__PURE__ */ __name(() => {
    const features = Config.global.features;
    if (!features.enable_download_shortcut) return null;
    const shortcut = features.download_shortcut?.trim();
    if (!shortcut) return null;
    return hotkeyManager.addHotkey(shortcut, () => mediaHandler.download_current_media());
  }, "registerDownloadHotkey");
  var registerEagleHotkey = /* @__PURE__ */ __name(() => {
    const features = Config.global.features;
    if (features.enable_eagle_shortcut === false) return null;
    const shortcut = features.eagle_shortcut?.trim();
    if (!shortcut) return null;
    return hotkeyManager.addHotkey(shortcut, () => mediaHandler.push_current_to_eagle());
  }, "registerEagleHotkey");
  var disposeDownloadHotkey = registerDownloadHotkey();
  var disposeEagleHotkey = registerEagleHotkey();
  Config.global.events.on("config_change", () => {
    disposeDownloadHotkey?.dispose();
    disposeDownloadHotkey = registerDownloadHotkey();
    disposeEagleHotkey?.dispose();
    disposeEagleHotkey = registerEagleHotkey();
  });
  mediaHandler.init();
  domPatcher.startObserving();
  profilePageHandler.mount_ui();
  console.log("[dy-dl]已启动");
})();
