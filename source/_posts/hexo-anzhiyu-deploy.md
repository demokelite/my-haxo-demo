---
title: Hexo + 安知鱼主题 + Vercel 部署记录
date: 2026-10-11 20:10:00
categories:
  - 折腾
tags:
  - Hexo
  - Anzhiyu
  - Vercel
keywords:
  - Hexo
  - 安知鱼主题
  - Vercel
  - Git 子模块
  - 静态博客
  - 博客部署
description: 从零把一个 Hexo 博客跑起来，并用 Git 子模块管理主题、部署到 Vercel 的完整过程。
---

## 为什么用子模块管理主题

安知鱼主题更新很频繁，直接 `git clone` 到 `themes/` 再提交进主仓库，会让仓库体积膨胀、升级也麻烦。用 Git 子模块可以把主题固定在一个具体提交上：

```bash
git submodule add -b main https://github.com/anzhiyu-c/hexo-theme-anzhiyu.git themes/anzhiyu
```

注意该仓库**默认分支是 `dev`**，而官方 README 要求用 `-b main`（稳定版）。不加 `-b` 会拉到开发分支。

## 覆盖配置放在根目录

主题的 `_config.yml` 不要直接改 —— 升级主题时会冲突。正确做法是复制到站点根目录并重命名：

```bash
cp themes/anzhiyu/_config.yml ./_config.anzhiyu.yml
```

只要根目录存在 `_config.anzhiyu.yml`，它的优先级就高于主题内的配置。

## 渲染器依赖

安知鱼用 Pug + Stylus 写模板和样式，缺了会直接构建失败：

```bash
npm install hexo-renderer-pug hexo-renderer-stylus --save
```

## Vercel 上的子模块坑

Vercel 的 Git 集成在拉取子模块时可能失败，报 `Warning: Failed to fetch one or more git submodules`，结果构建出来只有空壳。在 `vercel.json` 的安装命令里补一句是幂等的保险：

```json
{
  "installCommand": "git submodule update --init --recursive; npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "public"
}
```

构建命令用 `npm run build` 而不是裸 `hexo generate`，是为了确保 `node_modules/.bin` 在 PATH 中，不依赖全局安装的 hexo。

## 小结

| 环节 | 要点 |
| --- | --- |
| 主题 | 子模块 + `-b main` |
| 配置 | 根目录 `_config.anzhiyu.yml` 覆盖 |
| 渲染 | pug + stylus |
| 部署 | `vercel.json` 显式声明三条命令 |
