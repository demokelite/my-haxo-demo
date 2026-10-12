/*!
 * 环境音控件（左下角）
 *
 * 目标：像 asoftmurmur.com 那样，把几种环境音各自给一个音量条，随便叠着听。
 *
 * 音频全部用 Web Audio API **现场合成**，不加载任何音频文件：
 *   1. 不会有版权问题（不是从别人那儿扒的音频）
 *   2. 不会因为外部链接失效而坏掉
 *   3. 不用额外下载几百 KB 的音频，代价只是几行数学
 *
 * 浏览器策略：AudioContext 必须在用户手势之后创建/恢复，否则会被挂起。
 * 所以这里在第一次点击按钮时才建，不做任何自动播放。
 *
 * PJAX：主题用 PJAX 局部刷新，切页面会把 DOM 换掉，
 * 但音频图是这个 IIFE 里的变量，切页不会中断播放。
 * 所以只重新挂载 UI，不重建音频。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ambient-player-v1';
  var PANEL_ID = 'ambient-panel';
  var BTN_ID = 'ambient-toggle';

  /* ============================ 音色定义 ============================ */

  // kind 决定合成方式，见 buildLayer()。
  // defaultVol 是第一次打开时的初始音量，0 表示默认静音（让用户自己开）。
  var SOUNDS = [
    { id: 'white',  name: '白噪音', icon: '◻', kind: 'white',  defaultVol: 0 },
    { id: 'pink',   name: '粉噪音', icon: '◧', kind: 'pink',   defaultVol: 0 },
    { id: 'brown',  name: '褐噪音', icon: '◼', kind: 'brown',  defaultVol: 0 },
    { id: 'rain',   name: '雨声',   icon: '☂', kind: 'rain',   defaultVol: 0 },
    { id: 'wind',   name: '风声',   icon: '≋', kind: 'wind',   defaultVol: 0 },
    { id: 'waves',  name: '海浪',   icon: '∿', kind: 'waves',  defaultVol: 0 },
    { id: 'fire',   name: '篝火',   icon: '✷', kind: 'fire',   defaultVol: 0 }
  ];

  /* ============================ 状态 ============================ */

  var ctx = null;          // AudioContext，第一次点击才创建
  var master = null;       // 总音量
  var layers = {};         // id -> { gain, nodes[] }
  var buffers = {};        // 缓存生成好的噪声 buffer
  var playing = false;
  var state = loadState();

  function loadState() {
    var s = { master: 0.7, playing: false, vols: {} };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.master === 'number') s.master = clamp(parsed.master, 0, 1);
          if (parsed.vols && typeof parsed.vols === 'object') s.vols = parsed.vols;
        }
      }
    } catch (e) { /* 隐私模式等场景读不到，用默认值即可 */ }
    SOUNDS.forEach(function (snd) {
      var v = s.vols[snd.id];
      s.vols[snd.id] = typeof v === 'number' ? clamp(v, 0, 1) : snd.defaultVol;
    });
    // 注意：playing 不持久化。刷新后一律停下，不然会变成"自动播放"，
    // 既被浏览器挡，也会吓到访客。
    s.playing = false;
    return s;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ master: state.master, vols: state.vols }));
    } catch (e) { /* 存不了就算了，不影响播放 */ }
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ============================ 噪声 buffer 生成 ============================ */

  // 全部用 4 秒循环。太短会有可听的周期感，4 秒对噪声来说够用，
  // 内存也小（单声道 48kHz × 4s ≈ 768KB 的 Float32）。
  var BUF_SECONDS = 4;

  function makeWhite(len) {
    var d = new Float32Array(len);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return d;
  }

  // Paul Kellet 的粉噪音近似：一组按倍频程衰减的一阶滤波器之和。
  // 比简单低通出来的粉噪音平坦得多，听感上更"厚"。
  function makePink(len) {
    var d = new Float32Array(len);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return d;
  }

  // 褐噪音：白噪音做漏积分，低频能量占主导，听起来像远处的闷响。
  function makeBrown(len) {
    var d = new Float32Array(len);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return d;
  }

  // 篝火：底噪用褐噪音，上面撒一层随机位置的短促衰减脉冲当爆裂声。
  // 直接生成到 buffer 里，比用定时器实时调度省事，也不会因为主线程卡顿而漏拍。
  function makeFire(len, rate) {
    var d = makeBrown(len);
    var count = Math.floor(len / rate);
    for (var i = 0; i < count; i++) {
      var at = Math.floor(Math.random() * (len - 200));
      var amp = 0.25 + Math.random() * 0.75;
      var dur = 30 + Math.floor(Math.random() * 170);
      for (var k = 0; k < dur && at + k < len; k++) {
        // 指数衰减，听起来更像真实的爆裂
        d[at + k] += amp * (1 - k / dur) * (Math.random() * 2 - 1) * 0.9;
      }
    }
    return d;
  }

  function getBuffer(kind) {
    if (buffers[kind]) return buffers[kind];
    var len = Math.floor(ctx.sampleRate * BUF_SECONDS);
    var data;
    if (kind === 'pink') data = makePink(len);
    else if (kind === 'brown' || kind === 'wind' || kind === 'waves') data = makeBrown(len);
    else if (kind === 'fire') data = makeFire(len, 900);
    else data = makeWhite(len);

    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    buf.copyToChannel(data, 0);
    buffers[kind] = buf;
    return buf;
  }

  /* ============================ 音频图 ============================ */

  function buildLayer(snd) {
    var src = ctx.createBufferSource();
    src.buffer = getBuffer(snd.kind);
    src.loop = true;

    var gain = ctx.createGain();
    gain.gain.value = 0;   // 初始静音，由 slider 逐渐拉起，避免"啪"的一声
    var nodes = [src, gain];
    var tail = src;

    if (snd.kind === 'rain') {
      // 雨：切掉低频，留下中高频的"沙沙"声
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      hp.Q.value = 0.4;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 9000;
      tail.connect(hp); hp.connect(lp); tail = lp;
      nodes.push(hp, lp);
    } else if (snd.kind === 'wind') {
      // 风：低通 + 让截止频率缓慢摆动，产生"一阵一阵"的感觉
      var wlp = ctx.createBiquadFilter();
      wlp.type = 'lowpass';
      wlp.frequency.value = 420;
      wlp.Q.value = 0.7;
      tail.connect(wlp); tail = wlp;
      nodes.push(wlp);

      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;          // 约 14 秒一个周期
      var lfoAmp = ctx.createGain();
      lfoAmp.gain.value = 220;             // 截止频率在 200~640Hz 之间摆
      lfo.connect(lfoAmp); lfoAmp.connect(wlp.frequency);
      lfo.start();
      nodes.push(lfo, lfoAmp);
    } else if (snd.kind === 'waves') {
      // 海浪：低通打底，再让音量做很慢的涨落，模拟浪涌
      var wvlp = ctx.createBiquadFilter();
      wvlp.type = 'lowpass';
      wvlp.frequency.value = 1100;
      tail.connect(wvlp); tail = wvlp;

      var swell = ctx.createGain();
      swell.gain.value = 0.55;
      tail.connect(swell);
      tail = swell;

      var slow = ctx.createOscillator();
      slow.type = 'sine';
      slow.frequency.value = 0.075;        // 约 13 秒一个浪
      var slowAmp = ctx.createGain();
      slowAmp.gain.value = 0.45;           // 在 0.10~1.00 之间起伏
      slow.connect(slowAmp); slowAmp.connect(swell.gain);
      slow.start();
      nodes.push(wvlp, swell, slow, slowAmp);
    } else if (snd.kind === 'fire') {
      // 篝火：buffer 里已经有爆裂声了，这里只做低通让它更"闷"一点
      var flp = ctx.createBiquadFilter();
      flp.type = 'lowpass';
      flp.frequency.value = 3200;
      tail.connect(flp); tail = flp;
      nodes.push(flp);
    } else if (snd.kind === 'brown') {
      var blp = ctx.createBiquadFilter();
      blp.type = 'lowpass';
      blp.frequency.value = 1200;
      tail.connect(blp); tail = blp;
      nodes.push(blp);
    }

    tail.connect(gain);
    gain.connect(master);
    src.start();
    return { gain: gain, nodes: nodes, src: src };
  }

  function ensureAudio() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;                 // 极老的浏览器，直接放弃
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = state.master;
    master.connect(ctx.destination);
    return true;
  }

  function startAll() {
    if (!ensureAudio()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    SOUNDS.forEach(function (snd) {
      if (!layers[snd.id]) layers[snd.id] = buildLayer(snd);
      setLayerVol(snd.id, state.vols[snd.id], true);
    });
    return true;
  }

  function setLayerVol(id, v, immediate) {
    var L = layers[id];
    if (!L) return;
    var t = ctx.currentTime;
    // 用 setTargetAtTime 平滑过渡，直接改 value 会有"咔"的爆音
    L.gain.gain.cancelScheduledValues(t);
    L.gain.gain.setTargetAtTime(v, t, immediate ? 0.01 : 0.06);
  }

  function setMaster(v) {
    state.master = v;
    if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    saveState();
  }

  function play() {
    if (!startAll()) return;
    playing = true;
    SOUNDS.forEach(function (snd) { setLayerVol(snd.id, state.vols[snd.id]); });
    render();
  }

  function pause() {
    playing = false;
    // 挂起而不是销毁：下次点开是即时的，也省掉重新生成 buffer
    if (ctx && ctx.state === 'running') ctx.suspend();
    render();
  }

  function anyVol() {
    return SOUNDS.some(function (s) { return state.vols[s.id] > 0; });
  }

  /* ============================ 界面 ============================ */

  var ui = null;   // { root, btn, panel, open }

  function buildUI() {
    var root = document.createElement('div');
    root.id = 'ambient-player';

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '环境音');

    var head = document.createElement('div');
    head.className = 'amb-head';
    head.innerHTML =
      '<span class="amb-title">环境音</span>' +
      '<button type="button" class="amb-close" aria-label="收起">✕</button>';

    var list = document.createElement('div');
    list.className = 'amb-list';

    SOUNDS.forEach(function (snd) {
      var row = document.createElement('div');
      row.className = 'amb-row';

      var label = document.createElement('button');
      label.type = 'button';
      label.className = 'amb-name';
      label.setAttribute('data-id', snd.id);
      label.title = '点击静音/恢复';
      label.innerHTML = '<span class="amb-ico">' + snd.icon + '</span><span>' + snd.name + '</span>';

      var slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.step = '1';
      slider.className = 'amb-slider';
      slider.setAttribute('data-id', snd.id);
      slider.setAttribute('aria-label', snd.name + ' 音量');
      slider.value = String(Math.round(state.vols[snd.id] * 100));

      var val = document.createElement('span');
      val.className = 'amb-val';
      val.setAttribute('data-id', snd.id);

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(val);
      list.appendChild(row);
    });

    var foot = document.createElement('div');
    foot.className = 'amb-foot';
    foot.innerHTML =
      '<label class="amb-master">' +
      '  <span>总音量</span>' +
      '  <input type="range" min="0" max="100" step="1" class="amb-master-slider" aria-label="总音量">' +
      '</label>' +
      '<button type="button" class="amb-reset">全部归零</button>';

    panel.appendChild(head);
    panel.appendChild(list);
    panel.appendChild(foot);

    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title = '环境音（白噪音）';
    btn.setAttribute('aria-label', '环境音');
    btn.innerHTML = '<span class="amb-btn-ico">♪</span>';

    root.appendChild(panel);
    root.appendChild(btn);

    // ---- 事件 ----
    btn.addEventListener('click', function () {
      ui.open = !ui.open;
      if (ui.open) {
        // 打开面板时若还没在放，且用户之前调过音量，就直接开始
        if (!playing && anyVol()) play();
        render();
      } else {
        render();
      }
    });

    head.querySelector('.amb-close').addEventListener('click', function () {
      ui.open = false;
      render();
    });

    list.addEventListener('input', function (e) {
      var el = e.target;
      if (!el.classList.contains('amb-slider')) return;
      var id = el.getAttribute('data-id');
      var v = clamp(Number(el.value) / 100, 0, 1);
      state.vols[id] = v;
      if (!playing && v > 0) play();          // 一拖就开播，符合直觉
      else if (ctx) setLayerVol(id, v);
      if (playing && !anyVol()) pause();
      saveState();
      render();
    });

    list.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.amb-name') : null;
      if (!el) return;
      var id = el.getAttribute('data-id');
      // 点名字：有声音就归零，没声音就回到 50%
      state.vols[id] = state.vols[id] > 0 ? 0 : 0.5;
      if (state.vols[id] > 0 && !playing) play();
      else if (ctx) setLayerVol(id, state.vols[id]);
      if (playing && !anyVol()) pause();
      saveState();
      render();
    });

    foot.querySelector('.amb-master-slider').addEventListener('input', function (e) {
      setMaster(clamp(Number(e.target.value) / 100, 0, 1));
      render();
    });

    foot.querySelector('.amb-reset').addEventListener('click', function () {
      SOUNDS.forEach(function (s) { state.vols[s.id] = 0; });
      if (ctx) SOUNDS.forEach(function (s) { setLayerVol(s.id, 0); });
      saveState();
      pause();
      render();
    });

    ui = { root: root, btn: btn, panel: panel, open: false };
    return root;
  }

  function render() {
    if (!ui) return;
    ui.root.classList.toggle('is-open', ui.open);
    ui.root.classList.toggle('is-playing', playing);
    ui.btn.setAttribute('aria-expanded', ui.open ? 'true' : 'false');
    ui.btn.title = playing ? '环境音播放中（点击设置）' : '环境音（白噪音）';

    SOUNDS.forEach(function (snd) {
      var v = state.vols[snd.id];
      var row = ui.panel.querySelector('.amb-row .amb-slider[data-id="' + snd.id + '"]');
      if (row && Number(row.value) !== Math.round(v * 100)) row.value = String(Math.round(v * 100));
      var nameEl = ui.panel.querySelector('.amb-name[data-id="' + snd.id + '"]');
      if (nameEl) nameEl.classList.toggle('is-on', v > 0);
      var valEl = ui.panel.querySelector('.amb-val[data-id="' + snd.id + '"]');
      if (valEl) valEl.textContent = v > 0 ? Math.round(v * 100) + '%' : '—';
    });

    var ms = ui.panel.querySelector('.amb-master-slider');
    if (ms && Number(ms.value) !== Math.round(state.master * 100)) {
      ms.value = String(Math.round(state.master * 100));
    }
  }

  // PJAX 切页会把 DOM 换掉，重新挂一次；音频图不动，所以听感是连续的。
  function mount() {
    var existing = document.getElementById('ambient-player');
    if (existing) return;                 // 已经在了
    var root = ui ? ui.root : buildUI();
    document.body.appendChild(root);
    ui.open = false;
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  document.addEventListener('pjax:complete', mount);
  // 主题部分场景不走 pjax:complete（比如带查询参数的跳转），补一个兜底
  window.addEventListener('popstate', function () { setTimeout(mount, 60); });

  // 切到后台就停下，避免用户忘了关、在别的标签页一直响
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) pause();
  });
})();
