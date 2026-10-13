/**
 * Hexo 生成器：把文章按日期汇总，输出成 /calendar-posts.json
 *
 * 用途：给侧边栏日历卡片（source/js/sidebar-calendar.js）提供数据，
 *       让日历上「有文章的日子」能高亮出来，点进去就是那篇文章。
 *
 * ⚠️ 为什么这个文件可以放在 scripts/，而 tools/ 里那个不行：
 *   Hexo 会把站点根目录 scripts/ 下的所有 js **当成插件自动加载**。
 *   这个文件是货真价实的 Hexo 插件（注册了一个 generator），放这里正是它的用途。
 *   而之前那个 scheduled-publish.js 是独立的命令行工具，被当成插件加载就会报
 *   `Script load failed`，所以它必须放在 scripts/ 外面。
 *
 * 输出格式：
 *   { "2026-10-13": [{"title": "...", "url": "/2026/10/13/xxx/"}], ... }
 *   同一天有多篇就放进同一个数组。
 *
 * 时间基准：用文章的 date 字段，按 _config.yml 里的 timezone 解释，
 * 和日历上显示的日期是同一个口径。
 */

'use strict';

hexo.extend.generator.register('calendar-posts', function (locals) {
  var map = {};

  locals.posts.sort('-date').forEach(function (post) {
    // 跳过草稿和未发布的
    if (post.draft) return;

    // post.date 是 Hexo 的 Moment 对象，format 出来就是站点时区下的日期
    var day = post.date.format('YYYY-MM-DD');
    if (!map[day]) map[day] = [];
    map[day].push({
      title: post.title || '(无标题)',
      // path 不带开头的斜杠，补上，和站内链接保持一致
      url: '/' + String(post.path || '').replace(/^\//, '')
    });
  });

  return {
    path: 'calendar-posts.json',
    data: JSON.stringify(map)
  };
});
