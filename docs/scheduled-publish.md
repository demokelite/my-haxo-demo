# 定时发布

说明本站怎么做到「文章写好了，但到某个时间才出现」。

---

## 先说清楚一件事

**静态站点没有定时器。**

Hexo 生成的是纯 HTML，构建完就固定了，没有任何东西会在运行时「到点执行」。
所以「定时发布」在静态博客上一定是两件事拼起来的：

1. **让文章暂时不生成** —— 靠 `_config.yml` 里的 `future: false`
2. **到点之后重新构建一次** —— 靠外部调度去触发

第 2 步才是关键。只做第 1 步的话，文章会一直不出现，直到你下次因为别的原因推送。

---

## 第一步：`future: false`

```yaml
# _config.yml
future: false
```

- `true`（Hexo 默认）：日期在未来的文章**也会立刻生成**，日期只是个显示值，做不到定时
- `false`：日期还没到的文章**不参与构建**

改成 `false` 之后，一篇 `date: 2026-10-13 10:00:00` 的文章在 10 点之前：
不会出现在首页、归档、sitemap、RSS 里，URL 也打不开。到点之后只要重新构建，它才出现。

---

## 第二步：谁来触发重建

用 GitHub Actions 的定时任务，配置在
[`.github/workflows/scheduled-publish.yml`](../.github/workflows/scheduled-publish.yml)。

```
每天北京时间 10:07 / 10:17 / 10:27 各跑一次
外加每小时第 37 分兜底一次
        ↓
运行 tools/scheduled-publish.js
        ↓
   ┌─ 找出日期已过（该发布）的文章
   └─ 逐个用 HTTP 请求确认它在线上到底存不存在
        ↓
   都打得开 ──→ 什么都不做
   有打不开的 ──→ 推一个空提交
        ↓
   Vercel 监测到 push，自动重新构建，文章上线
```

### 为什么是这几个时间点（踩过的坑）

**2026-10-13 那天定时任务一次都没跑，文章晚了 1 小时 44 分才上线。**

最初设的是 `0 2` / `10 2` / `20 2`（北京时间 10:00 / 10:10 / 10:20）。
GitHub Actions 接口显示该 workflow `state=active`，但运行记录是 **0 条**。

原因写在 GitHub 官方文档里：

> The `schedule` event can be delayed during periods of high loads of GitHub
> Actions workflow runs. **High load times include the start of every hour.**
> If the load is sufficiently high enough, **some queued jobs may be dropped.**

注意最后半句：不是「延迟」，而是**直接丢弃**。整点正是高负载时段。

所以现在改成两段：

| cron | 北京时间 | 作用 |
| --- | --- | --- |
| `7,17,27 2 * * *` | 10:07 / 10:17 / 10:27 | 贴近 10 点发布，分钟数刻意避开整点 |
| `37 * * * *` | 每小时第 37 分 | 兜底：哪怕上面三次被丢掉，一小时内也会补上 |

多跑几次没有代价，因为脚本是幂等的 —— 已经能访问的文章不会触发重建。

### ⚠️ 如果又没按时发布

GitHub 的调度终究是「尽力而为」，给不了保证。真的在意时间的话，两个补救办法：

1. 到点后去 **Actions → 定时发布 → Run workflow** 手动点一次，立刻生效
2. 本地 `git commit --allow-empty -m "触发重建" && git push`，效果一样

2026-10-13 那次就是用第 2 种办法补发的。

### 为什么去线上确认，而不是只看日期

因为 cron 一天跑好几次。如果只判断「文章日期是否已过」，那么文章上线之后，
后面每一次运行都会认为「该重建」，于是反复推空提交，把提交历史刷满。

改成去线上确认这篇到底在不在，逻辑就变成幂等的：**已经能访问就什么都不做。**

### 为什么用空提交，而不是 Vercel Deploy Hook

Deploy Hook 是 Vercel 官方推荐的触发方式，但它有两个额外的负担：

- 需要把 Hook URL 存成仓库密钥，多一步人工配置
- 那个 URL 一旦泄漏，任何人都能触发你的构建

空提交只用仓库自带的 `GITHUB_TOKEN`，不需要任何配置，权限也收得更紧。

代价是提交历史里会多出 `chore: 定时重建` 这样没有内容的记录 —— 只在真的有文章要发布时才会出现。

---

## 怎么用

### 写一篇定时发布的文章

front-matter 里的 `date` 写未来的时间即可：

```yaml
---
title: 文章标题
date: 2026-10-13 10:00:00     # 到点之前不会出现
categories: 分享
---
```

推送之后就不用管了，到点会自动上线。时间按 `_config.yml` 里的 `timezone`（`Asia/Shanghai`）解释。

### 手动检查一次

不用等 cron，也可以随时自己跑：

```bash
node tools/scheduled-publish.js            # 联网检查，输出 publish=yes/no
node tools/scheduled-publish.js --dry-run  # 只看日期判断，不联网
```

输出示例：

```
# 现在（北京时间）：2026/10/12 22:06:48
# 已到时间的文章 2 篇，未到时间的 1 篇
#   待发布 five-small-websites.md  还有约 713 分钟
# 已上线：https://www.zbnr.skin/2026/10/11/hexo-anzhiyu-deploy/
publish=no
```

也可以在 GitHub 仓库的 **Actions → 定时发布 → Run workflow** 手动点一次。

### 想提前发布

把 `date` 改成过去的时间，推一下就行。

---

## 已知限制

1. **不精确。** GitHub 的 cron 可能延迟几分钟到几十分钟，实际发布时间会略晚于设定的时间。三次尝试能减轻但不能消除。
2. **仓库长期没动静时会被停用。** GitHub 对 60 天没有任何提交的仓库会暂停定时工作流。本站通过 Pages CMS 会持续有提交，一般不会触发；真遇到了去 Actions 页面点一下启用即可。
3. **脚本放在 `tools/` 而不是 `scripts/`。** Hexo 会把根目录 `scripts/` 下的所有 js 当成插件自动加载，放在那里每次构建都会报 `Script loading failed`。这个坑踩过一次，写在这里免得以后又放错。
4. **时区。** `date` 不带时区信息时按站点的 `Asia/Shanghai` 解释（脚本里补 `+08:00`）。如果哪天换了时区，`tools/scheduled-publish.js` 顶部的 `TZ_OFFSET` 要一起改。

---

## 相关文件

- [`_config.yml`](../_config.yml) —— `future: false` 那一段有完整注释
- [`tools/scheduled-publish.js`](../tools/scheduled-publish.js) —— 判断该不该重建
- [`.github/workflows/scheduled-publish.yml`](../.github/workflows/scheduled-publish.yml) —— 定时任务本体
