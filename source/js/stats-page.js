/*!
 * /stats/ 页面：把 /site-stats.json 渲染成统计图
 *
 * 数据由 scripts/site-stats.js 在构建时生成，所以这里只是「读 + 画」，
 * 不做任何计算 —— 数字和站点内容永远一致。
 *
 * 图表全部用 CSS 画（条形图就是一个 div 的宽度），不引图表库：
 * 为了一个统计页拉几百 KB 的 ECharts 不划算。
 */
(function () {
  'use strict';

  var root = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return Number(n || 0).toLocaleString('zh-CN'); }

  function card(n, label, unit) {
    return '<div class="sp-card">' +
      '<div class="sp-num">' + num(n) + (unit ? '<small>' + esc(unit) + '</small>' : '') + '</div>' +
      '<div class="sp-label">' + esc(label) + '</div>' +
      '</div>';
  }

  function bars(list, max) {
    return '<div class="sp-bars">' + list.map(function (x) {
      var pct = max > 0 ? Math.max(3, Math.round(x.count / max * 100)) : 0;
      return '<div class="sp-bar">' +
        '<span class="sp-bar-name" title="' + esc(x.name) + '">' + esc(x.name) + '</span>' +
        '<span class="sp-bar-track"><span class="sp-bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="sp-bar-count">' + x.count + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function render(d) {
    var maxMonth = Math.max.apply(null, d.timeline.map(function (t) { return t.count; }).concat([1]));
    var maxCat = d.categories.length ? d.categories[0].count : 1;
    var maxTag = d.tags.length ? d.tags[0].count : 1;

    var html = '';

    html += '<div class="sp-cards">' +
      card(d.postCount, '篇文章', '篇') +
      card(d.totalWords, '总字数', '字') +
      card(d.avgWords, '篇均字数', '字') +
      card(d.totalMinutes, '总阅读时长', '分钟') +
      card(d.categoryCount, '分类', '个') +
      card(d.tagCount, '标签', '个') +
      '</div>';

    html += '<div class="sp-h2">按年月分布</div>' + bars(d.timeline.map(function (t) {
      return { name: t.month, count: t.count };
    }), maxMonth);

    if (d.categories.length) {
      html += '<div class="sp-h2">分类</div>' + bars(d.categories, maxCat);
    }

    if (d.tags.length) {
      html += '<div class="sp-h2">标签</div><div class="sp-tags">' +
        d.tags.map(function (t) {
          return '<a class="sp-tag" href="/tags/">' + esc(t.name) + ' <b>' + t.count + '</b></a>';
        }).join('') + '</div>';
    }

    html += '<div class="sp-h2">文章（按字数排）</div><div class="sp-posts">' +
      d.posts.map(function (p) {
        return '<a class="sp-post" href="' + esc(p.url) + '">' +
          '<span class="sp-post-title">' + esc(p.title) + '</span>' +
          '<span class="sp-post-words">' + num(p.words) + ' 字</span>' +
          '<span class="sp-post-date">' + esc(p.date) + '</span>' +
          '</a>';
      }).join('') + '</div>';

    html += '<div class="sp-note">' +
      '首篇 ' + esc(d.firstDate || '—') + '　末篇 ' + esc(d.lastDate || '—') +
      '　单篇最长 ' + num(d.longest) + ' 字　最短 ' + num(d.shortest) + ' 字' +
      '</div>';

    root.innerHTML = html;
  }

  function run() {
    root = document.getElementById('stats-page');
    if (!root) return;
    if (root.dataset.done === '1') return;   // PJAX 回来时不要重复渲染
    root.dataset.done = '1';

    fetch('/site-stats.json', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(render)
      .catch(function (e) {
        root.innerHTML = '<p class="sp-error">统计数据加载失败：' + esc(e.message) +
          '<br>文件是构建时生成的，如果构建失败就不会有。刷新试试，或者看构建日志。</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  document.addEventListener('pjax:complete', run);
})();
