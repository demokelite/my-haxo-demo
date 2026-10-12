#!/usr/bin/env node
/**
 * 判断有没有"到点了但还没上线"的文章。
 *
 * 用途：给 .github/workflows/scheduled-publish.yml 调用。
 * 静态站点没有定时器，_config.yml 的 future: false 只是让未来日期的文章
 * 不参与构建；真正让它出现，需要到点之后重新构建一次。
 * 这个脚本负责回答一个问题：现在该不该重建？
 *
 * ⚠️ 为什么放在 tools/ 而不是 scripts/：
 *   Hexo 会把站点根目录 scripts/ 下的所有 js 当成插件，在**每次构建时自动加载**。
 *   这个文件是独立命令行工具，放在那里会让 hexo generate 每次都报
 *   `ERROR Script load failed`（虽然不中断构建，但会盖住真正的错误）。
 *
 * 为什么不直接比较"文章日期是否已过"：
 *   cron 每天跑几次，如果只看日期，文章上线后每一次都会判定"该重建"，
 *   于是反复推空提交。所以这里改成**去线上确认这篇文章到底在不在**，
 *   已经能访问就什么都不做，天然幂等。
 *
 * 退出码：
 *   0 且输出 publish=yes  有文章到点但没上线，调用方应触发一次重建
 *   0 且输出 publish=no   没有该发布的东西
 *   1                     脚本自身出错（网络挂了等），调用方应当当作"不动"
 *
 * 用法：
 *   node tools/scheduled-publish.js            # 正常检查
 *   node tools/scheduled-publish.js --dry-run  # 只看判定，不联网（用本地时间判断）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');
const SITE = process.env.SITE_URL || 'https://www.zbnr.skin';
const TZ_OFFSET = '+08:00'; // 站点时区是 Asia/Shanghai，见 _config.yml

/**
 * 从 front-matter 里取出 date。
 * 只做够用的解析，不引入 js-yaml —— 这个脚本要在 CI 里跑，
 * 少一个依赖少一次安装失败的机会。
 */
function readDate(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const line = m[1].match(/^date:\s*(.+?)\s*$/m);
  if (!line) return null;

  let v = line[1].replace(/^["']|["']$/g, '').trim();
  // 支持 2026-10-13 10:00:00 和 2026-10-13T10:00:00 两种写法
  const normalized = v.replace(' ', 'T');
  // front-matter 里的时间按站点时区解释，不带时区信息就补上 +08:00
  const withTz = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : normalized + TZ_OFFSET;
  const d = new Date(withTz);
  return isNaN(d.getTime()) ? null : d;
}

/** 由文件名和日期推出文章上线后的 URL，规则同 _config.yml 的 permalink: :year/:month/:day/:title/ */
function postUrl(file, date) {
  const slug = path.basename(file, '.md');
  const p = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = p(date.getMonth() + 1);
  const d = p(date.getDate());
  return `${SITE}/${y}/${mo}/${d}/${slug}/`;
}

async function isLive(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.status === 200;
  } catch (e) {
    // 网络问题当作"未知"，交给上层决定，不要因为一次抖动就误判成"没上线"
    throw new Error(`请求失败 ${url}: ${e.message}`);
  }
}

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  const now = new Date();

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('publish=no');
    console.log(`# 找不到文章目录 ${POSTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const due = [];
  const future = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const date = readDate(raw);
    if (!date) continue;
    if (date.getTime() <= now.getTime()) due.push({ file: f, date, url: postUrl(f, date) });
    else future.push({ file: f, date });
  }

  console.log(`# 现在（北京时间）：${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`# 已到时间的文章 ${due.length} 篇，未到时间的 ${future.length} 篇`);

  for (const p of future) {
    const mins = Math.round((p.date.getTime() - now.getTime()) / 60000);
    console.log(`#   待发布 ${p.file}  还有约 ${mins} 分钟`);
  }

  if (due.length === 0) {
    console.log('publish=no');
    console.log('# 没有已到时间的文章');
    return;
  }

  if (dryRun) {
    console.log('publish=yes');
    console.log('# dry-run：跳过联网检查');
    due.forEach((p) => console.log(`#   到点：${p.url}`));
    return;
  }

  // 逐篇去线上确认，只要有一篇还打不开，就认为需要重建
  const missing = [];
  for (const p of due) {
    if (await isLive(p.url)) {
      console.log(`# 已上线：${p.url}`);
    } else {
      console.log(`# 未上线：${p.url}`);
      missing.push(p);
    }
  }

  if (missing.length === 0) {
    console.log('publish=no');
    console.log('# 到点的文章都已经能访问了，不需要重建');
    return;
  }

  console.log('publish=yes');
  missing.forEach((p) => console.log(`#   待重建：${p.url}`));
})().catch((e) => {
  console.error(`# 检查出错：${e.message}`);
  // 出错时输出 publish=no，宁可漏一次也不要乱推提交
  console.log('publish=no');
  process.exitCode = 1;
});
