/*!
 * 页面帧率计（FPS）
 *
 * 放在左下角，实时显示当前帧率。用来判断页面上的动画——
 * 尤其是看板娘——到底流不流畅，而不是凭感觉说「有点卡」。
 *
 * 用法：
 *   单击 → 收起成一个点（记住选择，刷新后保持）
 *   再单击 → 展开
 *
 * 实现说明：
 *   · 用 requestAnimationFrame 计数。它和浏览器实际绘制同频，
 *     所以数出来的就是真实的帧率，不是定时器理论值。
 *   · **标签页切到后台时 rAF 会被暂停**，这时候统计出来的「1 FPS」是假的。
 *     所以监听 visibilitychange，切回来时把窗口重置掉。
 *   · 平均值用最近 5 秒的滑动窗口，避免刚打开页面时的抖动拉低结论。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'fps-meter-min';
  var WINDOW_MS = 1000;      // 每秒统计一次
  var AVG_SPAN = 5000;       // 平均值取最近 5 秒

  var frames = 0;
  var lastTick = performance.now();
  var samples = [];          // [{ t, fps }]
  var current = 0;
  var el = null, numEl = null, detailEl = null;

  function minimized() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }
  function setMinimized(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }

  function color(v) {
    return v >= 50 ? '#4ade80' : v >= 30 ? '#fbbf24' : '#f87171';
  }

  function build() {
    var box = document.createElement('div');
    box.id = 'fps-meter';
    box.innerHTML =
      '<span class="fm-num">—</span><span class="fm-unit">FPS</span>' +
      '<div class="fm-detail">' +
      '  <span>平均 <b class="fm-avg">—</b></span>' +
      '  <span>最低 <b class="fm-min">—</b></span>' +
      '</div>';
    document.body.appendChild(box);
    el = box;
    numEl = box.querySelector('.fm-num');
    detailEl = box.querySelector('.fm-detail');
    box.querySelector('.fm-avg').dataset.k = 'avg';
    box.querySelector('.fm-min').dataset.k = 'min';

    if (minimized()) box.classList.add('is-min');

    box.addEventListener('click', function () {
      var nowMin = !box.classList.contains('is-min');
      box.classList.toggle('is-min', nowMin);
      setMinimized(nowMin);
    });
  }

  function render() {
    if (!el) return;
    numEl.textContent = current || '—';
    numEl.style.color = current ? color(current) : '';
    el.style.borderColor = current ? color(current) + '66' : '';

    var avgEl = el.querySelector('[data-k="avg"]');
    var minEl = el.querySelector('[data-k="min"]');
    if (samples.length) {
      var sum = 0, min = Infinity;
      for (var i = 0; i < samples.length; i++) {
        sum += samples[i].fps;
        if (samples[i].fps < min) min = samples[i].fps;
      }
      avgEl.textContent = Math.round(sum / samples.length);
      minEl.textContent = min === Infinity ? '—' : min;
    }
  }

  function tick() {
    frames++;
    var now = performance.now();
    var dt = now - lastTick;
    if (dt >= WINDOW_MS) {
      // 切后台回来时 dt 可能是几十秒，这种窗口不是真实帧率，丢掉
      if (dt < WINDOW_MS * 3) {
        current = Math.round(frames * 1000 / dt);
        samples.push({ t: now, fps: current });
        while (samples.length && now - samples[0].t > AVG_SPAN) samples.shift();
        render();
      } else {
        current = 0;
      }
      frames = 0;
      lastTick = now;
    }
    requestAnimationFrame(tick);
  }

  function mount() {
    if (document.getElementById('fps-meter')) return;
    build();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  // 主题用 PJAX 局部刷新，切页面会把 DOM 换掉
  document.addEventListener('pjax:complete', mount);

  // 切回前台时重置统计窗口，否则第一秒会算进后台那段时间
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      frames = 0;
      lastTick = performance.now();
      samples = [];
    }
  });

  requestAnimationFrame(tick);
})();
