/**
 * Hexo 生成器：统计站点数据，输出成 /site-stats.json
 *
 * 用途：给 /stats/ 页面提供数据，展示文章数、字数、分类标签分布、
 *       发文时间线这些能自动算出来的东西。
 *
 * ⚠️ 这是正经的 Hexo 插件，所以放 scripts/ 是对的
 *    （Hexo 会把站点根目录 scripts/ 下的 js 当插件自动加载）。
 *    命令行工具不能放这里，那会让每次构建都报 Script load failed。
 *
 * 字数的算法：
 *   把 HTML 标签去掉之后，中日韩字符按「一个字」算，
 *   拉丁字母按「一个词」算，两者相加。
 *   这个口径和 hexo-wordcount 接近但不完全相同 —— 页面上标明了是「字数」，
 *   没有声称和别的工具一致。
 */

'use strict';

/** 去掉 HTML 标签，粗略统计字数 */
function countWords(html) {
  var text = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

  // 中日韩统一表意文字 + 常见全角标点不计，只算汉字
  var cjk = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
  // 剩下的部分按空白切出拉丁词
  var latin = (text.replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, ' ')
    .match(/[A-Za-z0-9][A-Za-z0-9_'’-]*/g) || []).length;

  return cjk + latin;
}

hexo.extend.generator.register('site-stats', function (locals) {
  var posts = locals.posts.sort('-date').toArray();

  var totalWords = 0;
  var byYearMonth = {};
  var byCategory = {};
  var byTag = {};
  var items = [];

  posts.forEach(function (post) {
    var words = countWords(post.content);
    totalWords += words;

    var ym = post.date.format('YYYY-MM');
    byYearMonth[ym] = (byYearMonth[ym] || 0) + 1;

    (post.categories ? post.categories.toArray() : []).forEach(function (c) {
      byCategory[c.name] = (byCategory[c.name] || 0) + 1;
    });
    (post.tags ? post.tags.toArray() : []).forEach(function (t) {
      byTag[t.name] = (byTag[t.name] || 0) + 1;
    });

    items.push({
      title: post.title || '(无标题)',
      url: '/' + String(post.path || '').replace(/^\//, ''),
      date: post.date.format('YYYY-MM-DD'),
      updated: post.updated ? post.updated.format('YYYY-MM-DD') : null,
      words: words,
      // 主题按分钟估算阅读速度，这里用同样的口径：中文约 300 字/分钟
      minutes: Math.max(1, Math.round(words / 300)),
      categories: (post.categories ? post.categories.toArray() : []).map(function (c) { return c.name; }),
      tags: (post.tags ? post.tags.toArray() : []).map(function (t) { return t.name; })
    });
  });

  // 按年月排序（新的在前）
  var timeline = Object.keys(byYearMonth).sort().reverse().map(function (k) {
    return { month: k, count: byYearMonth[k] };
  });

  function toSortedList(obj) {
    return Object.keys(obj).map(function (k) { return { name: k, count: obj[k] }; })
      .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); });
  }

  var words = items.map(function (i) { return i.words; }).sort(function (a, b) { return b - a; });

  var data = {
    generatedAt: new Date().toISOString(),
    postCount: posts.length,
    totalWords: totalWords,
    avgWords: posts.length ? Math.round(totalWords / posts.length) : 0,
    totalMinutes: items.reduce(function (s, i) { return s + i.minutes; }, 0),
    longest: words.length ? words[0] : 0,
    shortest: words.length ? words[words.length - 1] : 0,
    firstDate: posts.length ? posts[posts.length - 1].date.format('YYYY-MM-DD') : null,
    lastDate: posts.length ? posts[0].date.format('YYYY-MM-DD') : null,
    categoryCount: Object.keys(byCategory).length,
    tagCount: Object.keys(byTag).length,
    categories: toSortedList(byCategory),
    tags: toSortedList(byTag),
    timeline: timeline,
    posts: items.sort(function (a, b) { return b.words - a.words; })
  };

  return {
    path: 'site-stats.json',
    data: JSON.stringify(data)
  };
});
