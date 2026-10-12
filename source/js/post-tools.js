/*!
 * 文章底部工具栏：补一个 GitHub 图标
 *
 * 背景：主题自带的分享按钮里有一个微博（ptool.share_weibo）。
 * 作者的微博早就不更新了，GitHub 才是会持续有动静的地方，所以把微博关掉，
 * 在这里补一个指向 GitHub 主页的图标。
 *
 * 为什么用 JS 注入而不是改模板：
 *   ptool.pug 在主题子模块里，改了会在升级主题时丢掉。
 *   注入的代价是首屏之后才出现，但这个按钮本来就在文章底部，不影响。
 *
 * DOM 结构照抄主题（ptool.pug）：
 *   #post-tools .shareRight > .share-link.mobile / .weibo / .copyurl
 * 每个 .share-link 里放一个 a.share-button，图标用 anzhiyufont 字体。
 * 新图标插在「复制链接」前面。
 */
(function () {
  'use strict';

  var GITHUB_URL = 'https://github.com/demokelite';
  var TITLE = '在 GitHub 上找到我';

  function inject() {
    var right = document.querySelector('#post-tools .shareRight');
    if (!right) return;                              // 不是文章页，跳过
    if (right.querySelector('.share-link.github')) return;  // 已经插过了

    var wrap = document.createElement('div');
    wrap.className = 'share-link github';

    var a = document.createElement('a');
    a.className = 'share-button';
    a.href = GITHUB_URL;
    a.target = '_blank';
    a.rel = 'external nofollow noreferrer noopener';
    a.title = TITLE;

    var icon = document.createElement('i');
    icon.className = 'anzhiyufont anzhiyu-icon-github';
    a.appendChild(icon);
    wrap.appendChild(a);

    // 尽量插在「复制链接」前面，和主题原有按钮排在一起
    var copyurl = right.querySelector('.share-link.copyurl');
    if (copyurl) right.insertBefore(wrap, copyurl);
    else right.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  // 主题用 PJAX 局部刷新，文章内容会被整体替换，需要重新注入
  document.addEventListener('pjax:complete', inject);
})();
