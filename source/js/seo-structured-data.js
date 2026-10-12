/*!
 * 结构化数据（JSON-LD）
 *
 * 为什么用 JS 生成而不是写死在模板里：
 *   主题的 pug 模板在 Git 子模块里，改了会在升级主题时丢掉。
 *   这个文件生成的数据全部读自页面已有的 meta 标签，
 *   所以首页、文章页、独立页面各自能得到正确的类型。
 *
 * 说明：Google 会执行 JS 后再读结构化数据，这个做法是被支持的。
 *   但静态注入的效果更稳，如果哪天要改主题模板，可以把这段挪进去。
 */
(function () {
  'use strict';

  function meta(selector, attr) {
    var el = document.querySelector(selector);
    if (!el) return '';
    return (el.getAttribute(attr || 'content') || '').trim();
  }

  var ogType = meta('meta[property="og:type"]');
  var title = meta('meta[property="og:title"]') || document.title;
  var url = meta('meta[property="og:url"]') || location.href;
  var image = meta('meta[property="og:image"]');
  var description = meta('meta[name="description"]') || meta('meta[property="og:description"]');
  var siteName = meta('meta[property="og:site_name"]');

  var authorName = '知识混子';
  var authorUrl = 'https://github.com/demokelite';

  var data;

  if (ogType === 'article') {
    // 文章页：BlogPosting
    var timeEl = document.querySelector('time[itemprop*="datePublished"], .post-meta-date-created, time[datetime]');
    var published = timeEl ? (timeEl.getAttribute('datetime') || '').trim() : '';

    data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      url: url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Person', name: authorName, url: authorUrl },
      publisher: {
        '@type': 'Organization',
        name: siteName || document.title.split('|').pop().trim(),
        logo: { '@type': 'ImageObject', url: location.origin + '/img/mine/favicon.png' }
      }
    };
    if (description) data.description = description;
    if (image) data.image = [image];
    if (published) data.datePublished = published;

    // 页面顶部有「更新于」时补上 dateModified
    var updatedEl = document.querySelector('.post-meta-date-updated');
    if (updatedEl && updatedEl.getAttribute('datetime')) {
      data.dateModified = updatedEl.getAttribute('datetime').trim();
    }
  } else {
    // 其余页面：WebSite + Person
    data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName || document.title.split('|').pop().trim(),
      url: location.origin + '/',
      inLanguage: 'zh-CN',
      author: { '@type': 'Person', name: authorName, url: authorUrl }
    };
    if (description) data.description = description;
  }

  var tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(data);
  document.head.appendChild(tag);

  // 顺手把 twitter:card 升级成大图卡片。
  // 主题模板里写死的是 summary，只能在这里改。注意：这只对执行 JS 的抓取器有效，
  // 微博/微信这类不执行 JS 的分享抓取器仍会看到 summary —— 那需要改主题模板。
  var tc = document.querySelector('meta[name="twitter:card"]');
  if (tc && image) tc.setAttribute('content', 'summary_large_image');

  // 把 og:url 对齐到 rel=canonical。
  // 主题的 Open_Graph.pug 用的是模板里的 url 变量，带 /index.html 后缀，
  // 而 canonical 是 /about/ 这种形式 —— 两者不一致等于声明了两个规范地址。
  // 已把 _config.yml 的 pretty_urls.trailing_index 设为 false，sitemap 已经干净了，
  // 但那个变量不受它影响，所以只能在这里补一刀。
  // 同样地，这只对执行 JS 的抓取器有效；要彻底修得改主题模板，升级时会丢。
  try {
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    var ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (canonicalEl && ogUrlEl) {
      var canonicalHref = (canonicalEl.getAttribute('href') || '').trim();
      if (canonicalHref && ogUrlEl.getAttribute('content') !== canonicalHref) {
        ogUrlEl.setAttribute('content', canonicalHref);
      }
    }
  } catch (e) { /* 对齐失败不影响其它功能 */ }
})();
