---
title: 音乐馆
date: 2026-10-11 20:00:00
type: music
top_img: false
---

这里还没有歌单。

音乐馆靠 APlayer + Meting 播放一个网易云歌单。此前它指向的是**主题作者**的歌单，
等于让来访的人听陌生人的音乐，所以已经清空，导航栏里的入口也一并先收起来了。

想启用的话，两步：

1. 在 `_config.anzhiyu.yml` 的 `nav_music` 里填入自己的歌单：

   ```yaml
   nav_music:
     enable: true            # 打开导航栏播放器
     id: 你的歌单ID           # 歌单链接里 ?id= 后面那串数字
     server: netease
   ```

2. 把 `menu` 里这一行的注释去掉：

   ```yaml
   # 音乐馆: /music/ || anzhiyu-icon-music
   ```

改完推送到仓库，Vercel 会自动重新构建。

如果只是想放几首固定的歌，而不是整个歌单，也可以在 `source/json/music.json` 里手写曲目列表。
