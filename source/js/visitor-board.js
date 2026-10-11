/*!
 * 访客小板报 —— 归属地 / 距离 / IP / 天气
 * 由 _config.anzhiyu.yml 的 inject.bottom 引入
 *
 * ⚠️ 关于「apiHeaders（含 Referer/Origin）」：
 * 浏览器 fetch 不允许手动设置 Origin 和 Referer —— 它们属于 forbidden header name，
 * 设了会被静默忽略；而任何自定义请求头都会把简单请求升级为 CORS 预检（OPTIONS）。
 * 实测 uapis.cn 对带 Origin 的请求直接返回 403：
 *   {"code":"CORS_FORBIDDEN","message":"当前接口不允许浏览器跨域直接调用，请携带有效 key 后重试"}
 * 连 OPTIONS 预检也是 403，且不支持 JSONP。
 * 所以这里不设任何自定义头，改为「同源代理 + 允许跨域的公网接口」两条路。
 */
(function () {
  'use strict';

  /* ============================ 配置区（改这里） ============================ */

  var CONFIG = {
    // 博主所在地坐标 —— 用于计算「距博主约 N 公里」。请改成你自己的位置。
    owner: { name: '承德市', lat: 40.9515, lng: 117.9634 },

    // 天气接口 1：同源代理（Vercel 云函数 api/weather.js 转发到 uapis.cn）。
    // uapis.cn 禁止浏览器跨域，只能服务端调用，所以必须经代理。
    // 本地 `hexo server` 没有这个路由，会 404 并自动降级到下面那个。
    proxyWeather: '/api/weather?city=',

    // 归属地接口：必须允许跨域，实测 https://v2.xxapi.cn/api/ip 返回
    // Access-Control-Allow-Origin: *，且不带参数就能拿到调用者自己的 IP + 完整地址 + 经纬度。
    geoApi: 'https://v2.xxapi.cn/api/ip',

    // WebRTC STUN：用户原本只写了 Google 的，但它在国内基本连不上，所以多列几个。
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun.qq.com:3478',
      'stun:stun.miwifi.com:3478'
    ],
    webrtcTimeout: 3000,

    // 是否只在首页显示。false = 所有带侧边栏的页面（首页/归档/分类/标签/文章页）都显示
    homeOnly: false,

    // 结果缓存时长，避免每次 PJAX 跳转都重新发请求
    cacheTTL: 30 * 60 * 1000,

    // 按小时轮换的那句话
    statusList: [
      { end: 5,  text: '凌晨了，还没睡吗？早点休息~' },
      { end: 8,  text: '早高峰，路上小心~' },
      { end: 11, text: '上午好，正在搬砖中~' },
      { end: 13, text: '午休时间，记得好好吃饭~' },
      { end: 17, text: '下午茶时间，来杯咖啡提提神？' },
      { end: 19, text: '即将下班，记得按时吃饭~' },
      { end: 23, text: '夜深了，在属于自己的时间好好放松~' }
    ]
  };

  /* ============================== 小工具 ============================== */

  function str(v) {
    return v === undefined || v === null ? '' : String(v).trim();
  }

  // 带超时的 fetch。不设任何自定义请求头（见文件顶部说明）。
  function fetchJSON(url, timeout) {
    return new Promise(function (resolve, reject) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error('timeout: ' + url));
      }, timeout || 8000);

      fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'default',
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) { clearTimeout(timer); resolve(json); })
        .catch(function (err) { clearTimeout(timer); reject(err); });
    });
  }

  // 依次尝试一组候选，返回第一个成功的；全失败返回 null
  function firstSuccess(tasks) {
    return tasks.reduce(function (chain, task) {
      return chain.then(function (acc) {
        if (acc) return acc;
        return Promise.resolve()
          .then(task)
          .then(function (v) { return v || null; })
          .catch(function () { return null; });
      });
    }, Promise.resolve(null));
  }

  function cacheGet(key) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || Date.now() - obj.t > CONFIG.cacheTTL) return null;
      return obj.v;
    } catch (e) { return null; }
  }

  function cacheSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); } catch (e) { /* 忽略隐私模式报错 */ }
  }

  /* ========================= 第一步：拿公网 IP ========================= */

  // WebRTC：连 STUN，从 ICE candidate 里挑 srflx（即公网映射地址）
  function getIpViaWebRTC() {
    return new Promise(function (resolve) {
      var RTCPC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (!RTCPC) return resolve(null);

      var pc = null;
      var done = false;
      var localIp = null;

      function finish(ip) {
        if (done) return;
        done = true;
        try { if (pc) pc.close(); } catch (e) { /* noop */ }
        // 没拿到公网地址就退回本地地址（多为内网/mDNS，仅作兜底展示）
        resolve(ip || localIp || null);
      }

      var timer = setTimeout(function () { finish(null); }, CONFIG.webrtcTimeout);

      try {
        pc = new RTCPC({ iceServers: CONFIG.stunServers.map(function (u) { return { urls: u }; }) });

        pc.onicecandidate = function (e) {
          if (!e || !e.candidate) { clearTimeout(timer); finish(null); return; }
          var cand = e.candidate.candidate || '';
          var m = cand.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(?::[a-f0-9]{0,4}){2,7})/i);
          if (!m) return;
          var ip = m[1];
          if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|127\.)/.test(ip)) {
            if (!localIp) localIp = ip;
            return;
          }
          if (e.candidate.type === 'srflx' || e.candidate.type === 'prflx') {
            clearTimeout(timer);
            finish(ip);
          }
        };

        // 只建一个 data channel 即可触发 ICE 收集，不需要真的连通
        if (pc.createDataChannel) pc.createDataChannel('vb');
        pc.createOffer()
          .then(function (offer) { return pc.setLocalDescription(offer); })
          .catch(function () { clearTimeout(timer); finish(null); });
      } catch (e) {
        clearTimeout(timer);
        finish(null);
      }
    });
  }

  /* ====================== 第一步：IP → 归属地 → 城市 ====================== */

  // 第 3 层兜底：把「中国河北省承德市隆化县」这类整串地址切成省 / 市 / 区县
  function parseAddress(raw) {
    var addr = str(raw).replace(/^中国/, '').trim();
    var out = { province: '', city: '', district: '' };
    var m;

    if ((m = addr.match(/^(.{2,8}?(?:省|自治区|特别行政区))/))) {
      out.province = m[1];
      addr = addr.slice(m[1].length);
    }
    if ((m = addr.match(/^(.{2,8}?(?:市|自治州|地区|盟))/))) {
      out.city = m[1];
      addr = addr.slice(m[1].length);
    }
    if ((m = addr.match(/^(.{2,8}?(?:区|县|市|旗))/))) {
      out.district = m[1];
    }
    return out;
  }

  // 备用接口用的正则：直接从地址文本里匹配「2~5 个字 + 市/区/县」
  function extractCityFromAddress(addr) {
    var text = str(addr);
    return {
      city: (text.match(/([\u4e00-\u9fa5]{2,5}市)/) || [])[1] || '',
      district: (text.match(/([\u4e00-\u9fa5]{2,5}[区县])/) || [])[1] || ''
    };
  }

  // 三层兜底：优先 city 字段 → 其次 province → 最后切分 region 文本
  function extractCity(geo, fallbackAddress) {
    var g = geo || {};
    var out = {
      province: str(g.province || g.prov),
      city: str(g.city),
      district: str(g.district || g.area || g.county)
    };
    var region = str(g.region || g.address || g.addr || g.location || fallbackAddress);

    if (region) {
      var p = parseAddress(region);
      out.province = out.province || p.province;
      if (!out.city) {
        var m = extractCityFromAddress(region);
        out.city = p.city || m.city;
        out.district = out.district || p.district || m.district;
      }
    }
    // 第 2 层：直辖市等没有「省」的情况，城市退回用省 / 市名显示
    if (!out.province) out.province = out.city;
    if (!out.city) out.city = out.province;
    return out;
  }

  function getGeo() {
    var cached = cacheGet('vb-geo');
    if (cached) return Promise.resolve(cached);

    return firstSuccess([
      // xxapi：允许跨域，且不带参数就返回本机 IP + 完整地址 + 经纬度
      function () {
        return fetchJSON(CONFIG.geoApi, 8000).then(function (j) {
          var d = (j && j.data) || {};
          if (!d.ip && !d.address) throw new Error('bad shape');
          return {
            ip: str(d.ip),
            region: str(d.address),
            isp: str(d.isp),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lng)
          };
        });
      },
      // 兜底：只拿得到 IP，归属地留空（此时用 WebRTC 的 IP 展示）
      function () {
        return getIpViaWebRTC().then(function (ip) {
          return ip ? { ip: ip, region: '', isp: '', lat: NaN, lng: NaN } : null;
        });
      }
    ]).then(function (geo) {
      if (!geo) return null;
      // 即使定位接口挂了，也尽量补一个 WebRTC 拿到的 IP
      if (geo.ip) { cacheSet('vb-geo', geo); return geo; }
      return getIpViaWebRTC().then(function (ip) {
        geo.ip = ip || '';
        if (geo.ip) cacheSet('vb-geo', geo);
        return geo;
      });
    });
  }

  /* ========================== 第二步：查天气 ========================== */

  // WMO 天气代码 → 中文（Open-Meteo 用的就是这套码）
  var WMO = {
    0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇',
    51: '毛毛雨', 53: '毛毛雨', 55: '浓毛毛雨',
    56: '冻毛毛雨', 57: '冻毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
    80: '阵雨', 81: '强阵雨', 82: '暴雨',
    85: '小阵雪', 86: '大阵雪',
    95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '雷阵雨伴冰雹'
  };

  function degToDir(deg) {
    var dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    var d = parseFloat(deg);
    if (isNaN(d)) return '';
    return dirs[Math.round(((d % 360) + 360) % 360 / 45) % 8] + '风';
  }

  // 字段名兼容层：两个数据源字段名不同，统一映射到同一组键
  function normalizeWeather(raw) {
    if (!raw || typeof raw !== 'object') return null;
    function pick() {
      for (var i = 0; i < arguments.length; i++) {
        var k = arguments[i];
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') return raw[k];
      }
      return '';
    }
    var w = {
      weather: str(pick('weather', 'text', 'info', 'tianqi')),
      temperature: pick('temperature', 'temp'),
      windDirection: str(pick('wind_direction', 'windDirection', 'fengxiang')),
      windPower: str(pick('wind_power', 'windPower', 'fengli', 'wind_scale')),
      humidity: pick('humidity', 'shidu', 'sd')
    };
    if (!w.weather && w.temperature === '') return null;
    return w;
  }

  function getWeather(city, lat, lng) {
    var key = 'vb-weather-' + city;
    var cached = cacheGet(key);
    if (cached) return Promise.resolve(cached);

    return firstSuccess([
      // 1) 同源代理 → uapis.cn（原定接口，需云端函数，本地预览会 404 后自动跳过）
      function () {
        if (!city) return null;
        return fetchJSON(CONFIG.proxyWeather + encodeURIComponent(city), 8000)
          .then(function (j) { return normalizeWeather(j && (j.data || j)); });
      },
      // 2) Open-Meteo：免密钥、允许跨域，用经纬度查
      function () {
        if (isNaN(lat) || isNaN(lng)) return null;
        var url = 'https://api.open-meteo.com/v1/forecast'
          + '?latitude=' + lat + '&longitude=' + lng
          + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m'
          + '&timezone=auto';
        return fetchJSON(url, 8000).then(function (j) {
          var c = j && j.current;
          if (!c) return null;
          return normalizeWeather({
            weather: WMO[c.weather_code] || '未知',
            temperature: Math.round(c.temperature_2m),
            wind_direction: degToDir(c.wind_direction_10m),
            wind_power: Math.round(c.wind_speed_10m) + ' km/h',
            humidity: c.relative_humidity_2m
          });
        });
      }
    ]).then(function (w) {
      if (w) cacheSet(key, w);
      return w;
    });
  }

  /* ============================ 距离计算 ============================ */

  function haversine(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some(function (v) { return isNaN(v); })) return NaN;
    var R = 6371;
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function statusText() {
    var h = new Date().getHours();
    for (var i = 0; i < CONFIG.statusList.length; i++) {
      if (h <= CONFIG.statusList[i].end) return CONFIG.statusList[i].text;
    }
    return CONFIG.statusList[CONFIG.statusList.length - 1].text;
  }

  /* ============================== 渲染 ============================== */

  function esc(s) {
    return str(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 外层用主题的 .card-widget —— #aside-content .card-widget 会提供圆角、阴影、
  // 背景色和深色模式适配；标题沿用 .item-headline，和标签/归档卡片保持一致。
  function buildCard() {
    var el = document.createElement('div');
    el.id = 'visitor-board';
    el.className = 'card-widget';
    el.innerHTML =
      '<div class="item-headline">' +
      '  <i class="anzhiyufont anzhiyu-icon-jike"></i>' +
      '  <span>小板报</span>' +
      '</div>' +
      '<div class="vb-line vb-welcome"><span class="is-loading"></span></div>' +
      '<div class="vb-line vb-province"></div>' +
      '<div class="vb-line vb-distance"></div>' +
      '<div class="vb-line vb-ip-line"></div>' +
      '<div class="vb-line vb-weather"></div>' +
      '<div class="vb-line vb-status"></div>';
    return el;
  }

  function render(el, geo, weather) {
    var cityInfo = extractCity(geo, geo && geo.region);
    var q = function (s) { return el.querySelector(s); };

    // 1) 欢迎来自 xx市 xx县 的小友
    var place = [cityInfo.city, cityInfo.district].filter(Boolean).join(' ');
    q('.vb-welcome').innerHTML = place
      ? '🙋 欢迎来自 <span class="vb-strong">' + esc(place) + '</span> 的小友💖'
      : '🙋 欢迎你，远道而来的小友💖';

    // 2) 欢迎来到 xx省
    q('.vb-province').innerHTML = cityInfo.province
      ? '😊 欢迎来到 <span class="vb-strong">' + esc(cityInfo.province) + '</span>🍂'
      : '';

    // 3) 距博主多远
    var km = geo ? haversine(parseFloat(geo.lat), parseFloat(geo.lng), CONFIG.owner.lat, CONFIG.owner.lng) : NaN;
    q('.vb-distance').innerHTML = isNaN(km)
      ? ''
      : '🗺️ 当前位置距博主（' + esc(CONFIG.owner.name) + '）约 <span class="vb-strong">' + Math.round(km) + '</span> 公里！';

    // 4) IP
    q('.vb-ip-line').innerHTML = geo && geo.ip
      ? '🌐 您的IP地址为：<span class="vb-ip">' + esc(geo.ip) + '</span>' +
        (geo.isp ? ' <span class="vb-sub">(' + esc(geo.isp) + ')</span>' : '')
      : '';

    // 5) 天气（三段式：城市 / 天气+温度 / 风向+风力+湿度）
    if (weather) {
      var parts = [];
      parts.push('☁️ <span class="vb-strong">' + esc(cityInfo.city || '本地') + '</span>');
      var wt = esc(weather.weather) + (weather.temperature !== '' && weather.temperature !== undefined
        ? ' <span class="vb-temp">' + esc(weather.temperature) + '°C</span>' : '');
      parts.push(wt);
      var extra = [weather.windDirection, weather.windPower,
        weather.humidity !== '' && weather.humidity !== undefined ? '湿度 ' + esc(weather.humidity) + '%' : ''
      ].filter(Boolean).join(' · ');
      if (extra) parts.push('<span class="vb-sub">' + extra + '</span>');
      q('.vb-weather').innerHTML = parts.join(' ');
    } else {
      q('.vb-weather').innerHTML = '<span class="vb-muted">☁️ 天气暂不可用</span>';
    }

    // 6) 按小时轮换的状态文案
    q('.vb-status').innerHTML = '🚶‍♂️ <span class="vb-status-text">' + esc(statusText()) + '</span>';
  }

  /* ============================ 挂载控制 ============================ */

  var mounting = false;

  function isHome() {
    var p = location.pathname;
    return p === '/' || p === '/index.html';
  }

  function mount() {
    if (CONFIG.homeOnly && !isHome()) return;
    if (document.getElementById('visitor-board')) return;
    if (mounting) return;

    // 插到侧边栏卡片区 .sticky_layout 的最前面，
    // 也就是作者卡 / 微信卡之后，标签 / 归档 / 网站资讯之前。
    // 页面不显示侧栏（单栏模式、移动端折叠）时这里取不到节点，自然就不渲染。
    var aside = document.getElementById('aside-content');
    var host = aside && aside.querySelector('.sticky_layout');
    if (!host) return;

    mounting = true;
    var el = buildCard();
    host.insertBefore(el, host.firstChild);

    Promise.all([
      getGeo().catch(function () { return null; }),
      // 天气依赖 city 与经纬度，所以先拿 geo 再查
      getGeo().catch(function () { return null; }).then(function (g) {
        var info = extractCity(g, g && g.region);
        return getWeather(info.city, g ? parseFloat(g.lat) : NaN, g ? parseFloat(g.lng) : NaN)
          .catch(function () { return null; });
      })
    ]).then(function (res) {
      if (!el.isConnected) return;
      render(el, res[0], res[1]);
    }).catch(function () {
      if (el.isConnected) render(el, null, null);
    }).then(function () { mounting = false; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  // 主题用 PJAX 局部刷新，content 会被整体替换，需要重新挂载
  document.addEventListener('pjax:complete', mount);
})();
