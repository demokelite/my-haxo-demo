/*!
 * /search/ 页面：整页搜索
 *
 * 读主题已经生成好的 /search.json（hexo-generator-searchdb 产出的），
 * 所以不需要额外的索引，也不会出现「弹窗搜得到、整页搜不到」的不一致。
 *
 * 匹配规则很朴素：标题命中权重高于正文，全部转小写后做子串匹配。
 * 中文没有词边界，做分词反而容易漏，子串匹配更稳。
 */
(function () {
  'use strict';

  var data = null;
  var loading = false;
  var input = null, resultEl = null, countEl = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** 把命中的关键词包成 <mark>，输入已经转义过 */
  function highlight(text, kw) {
    if (!kw) return esc(text);
    var safe = esc(text);
    // 关键词本身也要转义，再用它做不区分大小写的替换
    var k = esc(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safe.replace(new RegExp('(' + k + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  /** 从正文里截取包含关键词的一段 */
  function snippet(content, kw) {
    var text = String(content || '').replace(/\s+/g, ' ').trim();
    if (!kw) return text.slice(0, 140);
    var idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx < 0) return text.slice(0, 140);
    var start = Math.max(0, idx - 50);
    return (start > 0 ? '…' : '') + text.slice(start, start + 150) + (text.length > start + 150 ? '…' : '');
  }

  function search(kw) {
    kw = String(kw || '').trim();
    if (!kw) {
      countEl.textContent = '';
      resultEl.innerHTML = '<div class="sr-empty">输入关键词开始搜索</div>';
      return;
    }

    var lower = kw.toLowerCase();
    var hits = [];

    (data || []).forEach(function (item) {
      var title = String(item.title || '');
      var content = String(item.content || '');
      var tags = String(item.tags || '');
      var cats = String(item.categories || '');

      var inTitle = title.toLowerCase().indexOf(lower) >= 0;
      var inContent = content.toLowerCase().indexOf(lower) >= 0;
      var inMeta = (tags + ' ' + cats).toLowerCase().indexOf(lower) >= 0;

      if (inTitle || inContent || inMeta) {
        // 标题命中排前面，其次正文，最后只看标签分类的
        hits.push({ item: item, score: inTitle ? 3 : (inContent ? 2 : 1) });
      }
    });

    hits.sort(function (a, b) { return b.score - a.score; });

    countEl.textContent = hits.length ? hits.length + ' 条结果' : '';

    if (!hits.length) {
      resultEl.innerHTML = '<div class="sr-empty">没有找到「' + esc(kw) + '」<br>' +
        '<small>换个词试试，或者去 <a href="/archives/">归档</a> 里翻</small></div>';
      return;
    }

    resultEl.innerHTML = hits.map(function (h) {
      var it = h.item;
      return '<a class="sr-item" href="' + esc(it.url) + '">' +
        '<div class="sr-title">' + highlight(it.title || '(无标题)', kw) + '</div>' +
        '<div class="sr-text">' + highlight(snippet(it.content, kw), kw) + '</div>' +
        '<div class="sr-meta">' + esc(it.date || '') +
        (it.categories ? '　' + esc(it.categories) : '') +
        (it.tags ? '　' + esc(it.tags) : '') +
        '</div></a>';
    }).join('');
  }

  function run() {
    var page = document.getElementById('search-page');
    if (!page) return;

    input = document.getElementById('sr-input');
    resultEl = document.getElementById('sr-results');
    countEl = document.getElementById('sr-count');
    if (!input || input.dataset.bound === '1') {
      if (input && data) search(input.value);
      return;
    }
    input.dataset.bound = '1';

    var t = null;
    input.addEventListener('input', function () {
      clearTimeout(t);
      // 输入时不要每敲一下就搜一次
      t = setTimeout(function () { search(input.value); }, 160);
    });

    // 从地址栏带 ?q=xxx 进来也能直接搜
    var q = new URLSearchParams(location.search).get('q');
    if (q) { input.value = q; }

    if (data) { search(input.value); return; }
    if (loading) return;
    loading = true;

    resultEl.innerHTML = '<div class="sr-empty">正在加载索引…</div>';
    fetch('/search.json', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        data = Array.isArray(j) ? j : [];
        loading = false;
        search(input.value);
        input.focus();
      })
      .catch(function (e) {
        loading = false;
        resultEl.innerHTML = '<div class="sr-empty">索引加载失败：' + esc(e.message) +
          '<br><small>search.json 由 hexo-generator-searchdb 生成，构建失败就不会有。</small></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  document.addEventListener('pjax:complete', run);
})();
