/*!
 * 侧边栏日历卡片
 *
 * 一个月视图的日历，今天高亮，**有文章的日子会标出来并可以点进去**。
 * 文章日期来自 /calendar-posts.json（由 scripts/calendar-posts.js 生成）。
 *
 * 为什么自己写：主题里只有 `#gitcalendar` 的 CSS，没有对应的模板，
 * 也没有任何侧栏日历的配置项，所以没有现成的可以用。
 *
 * 挂载方式和访客小板报一致：插到 #aside-content .sticky_layout 里，
 * 外层用主题的 .card-widget，标题用 .item-headline，这样圆角、阴影、
 * 深色模式全都跟着主题走，不需要自己写配色。
 */
(function () {
  'use strict';

  var MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月',
                '七月', '八月', '九月', '十月', '十一月', '十二月'];
  // 日历从周日开始，和国内常见的挂历一致
  var WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  var postMap = null;      // { 'YYYY-MM-DD': [{title, url}] }
  var viewYear, viewMonth; // 当前显示的月份（month 从 0 开始）

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function key(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildCard() {
    var el = document.createElement('div');
    el.id = 'sidebar-calendar';
    el.className = 'card-widget';
    el.innerHTML =
      '<div class="item-headline">' +
      '  <i class="anzhiyufont anzhiyu-icon-calendar-days"></i>' +
      '  <span>日历</span>' +
      '</div>' +
      '<div class="sc-body">' +
      '  <div class="sc-head">' +
      '    <button type="button" class="sc-nav sc-prev" aria-label="上个月">‹</button>' +
      '    <span class="sc-title"></span>' +
      '    <button type="button" class="sc-nav sc-next" aria-label="下个月">›</button>' +
      '  </div>' +
      '  <div class="sc-week">' +
      WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') +
      '  </div>' +
      '  <div class="sc-grid"></div>' +
      '  <div class="sc-foot"></div>' +
      '</div>';
    return el;
  }

  function render(el) {
    var grid = el.querySelector('.sc-grid');
    var title = el.querySelector('.sc-title');
    var foot = el.querySelector('.sc-foot');

    title.textContent = viewYear + ' 年 ' + MONTHS[viewMonth];

    var first = new Date(viewYear, viewMonth, 1);
    var startPad = first.getDay();                                  // 这个月 1 号是周几
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); // 这个月有几天

    var today = new Date();
    var todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());

    var html = '';
    var i;
    // 月初的空格
    for (i = 0; i < startPad; i++) html += '<span class="sc-day sc-empty"></span>';

    var monthPostCount = 0;
    for (i = 1; i <= daysInMonth; i++) {
      var k = key(viewYear, viewMonth, i);
      var posts = postMap && postMap[k];
      var cls = 'sc-day';
      if (k === todayKey) cls += ' sc-today';
      if (posts && posts.length) {
        cls += ' sc-has-post';
        monthPostCount += posts.length;
      }
      var tip = posts && posts.length
        ? posts.map(function (p) { return p.title; }).join(' / ')
        : '';
      // 有文章的日子渲染成链接，直接点进第一篇文章
      if (posts && posts.length) {
        html += '<a class="' + cls + '" href="' + esc(posts[0].url) + '" title="' + esc(tip) + '">' + i + '</a>';
      } else {
        html += '<span class="' + cls + '"' + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + i + '</span>';
      }
    }
    grid.innerHTML = html;

    foot.textContent = monthPostCount
      ? '本月 ' + monthPostCount + ' 篇'
      : '本月没有更新';
  }

  function mount() {
    if (document.getElementById('sidebar-calendar')) return;

    var aside = document.getElementById('aside-content');
    var host = aside && aside.querySelector('.sticky_layout');
    if (!host) return;   // 单栏 / 移动端折叠时没有侧栏，自然不渲染

    var el = buildCard();

    // 插在小板报之后；没有小板报就直接放最前面
    var board = document.getElementById('visitor-board');
    if (board && board.parentNode === host) {
      host.insertBefore(el, board.nextSibling);
    } else {
      host.insertBefore(el, host.firstChild);
    }

    var now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    // 先渲染一次，数据到了再渲染一次 —— 日历本身不依赖网络，
    // 拿不到文章数据时至少还能当日历看。
    render(el);

    el.querySelector('.sc-prev').addEventListener('click', function () {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render(el);
    });
    el.querySelector('.sc-next').addEventListener('click', function () {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render(el);
    });

    if (postMap !== null) { render(el); return; }

    fetch('/calendar-posts.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        postMap = (data && typeof data === 'object') ? data : {};
        if (el.isConnected) render(el);
      })
      .catch(function () {
        // 拿不到就当日历用，不显示文章标记
        postMap = {};
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  document.addEventListener('pjax:complete', mount);
  window.addEventListener('popstate', function () { setTimeout(mount, 60); });
})();
