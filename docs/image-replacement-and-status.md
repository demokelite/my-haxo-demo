# 图片替换清单 与 功能自检

> 生成方式：程序化扫描 `_config.anzhiyu.yml` + `source/_data/*.yml` + `public/` 产物，
> 行号与 URL 均来自实际文件，非人工摘录。扫描时间基准：commit `19a355a` 之后的构建（58 files）。

---

## ⚠️ 第一部分：先读这个，否则替换会失败

### 坑：同名文件**不能**覆盖主题图片

我实测过（放测试文件 → `hexo clean && generate` → 对比 MD5）：

| 测试 | 结果 |
| --- | --- |
| 站点放**新文件名** `source/img/zzz-unique-test.png` | ✅ 成功输出到 `public/img/` |
| 站点放**同名文件** `source/img/512.png`（主题也有） | ❌ **主题的赢了**，站点文件被忽略 |

`public/img/512.png` 仍是主题的 4172 字节，我那个 150 字节的测试文件被完全无视。
（主题的 `scripts/` 里没有任何资源拷贝逻辑，这是 Hexo 8 的 Box 处理顺序导致的。）

### 正确做法

**用不冲突的新路径**，然后把配置指过去：

```
1. 在站点建目录：source/img/mine/
2. 把你的图片丢进去，例如 source/img/mine/avatar.png
3. 配置里改成新路径：/img/mine/avatar.png
4. hexo clean && hexo generate
```

下面所有条目的「替换方式」列都按这个套路写。

---

## 第二部分：需要替换的图片

### A. 必须替换 —— 访客直接看得到的第三方占位图

| # | 用途 | 当前地址 | 配置位置 | 格式 / 建议尺寸 |
| --- | --- | --- | --- | --- |
| A1 | **站点头像**（作者卡 + OG 分享图） | `bu.dusays.com/2023/04/27/64496e511b09c.jpg` | [_config.anzhiyu.yml:154](_config.anzhiyu.yml#L154) `avatar.img` | JPG/PNG/WebP，正方形 **≥300×300** |
| A2 | **首页顶部推荐卡封面** | `bu.dusays.com/2023/05/13/645fa3cf90d70.webp` | [_config.anzhiyu.yml:1097](_config.anzhiyu.yml#L1097) `home_top.banner.image` | WebP/JPG，**800×500** |
| A3 | **加载动画头像**（每次进站都显示） | `npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg` | [_config.anzhiyu.yml:811](_config.anzhiyu.yml#L811) `preloader.avatar` | PNG/JPG，正方形 **~120×120**，注意压小体积 |
| A4 | **首页人物粒子背景** | `upload-bbs.miyoushe.com/.../ba62475f...png` | [_config.anzhiyu.yml:1255](_config.anzhiyu.yml#L1255) `peoplecanvas.img` | PNG **透明底**，**600×600** 左右 |
| A5 | **微信赞赏码** | `npm.elemecdn.com/.../qrcode-weichat.png` | [_config.anzhiyu.yml:263](_config.anzhiyu.yml#L263) `reward.QR_code[0].img` | PNG/JPG，正方形 **≥300×300** |
| A6 | **支付宝赞赏码** | `npm.elemecdn.com/.../qrcode-alipay.png` | [_config.anzhiyu.yml:263](_config.anzhiyu.yml#L263) `reward.QR_code[1].img` | 同上 |
| A7 | **404 页背景** | `bu.dusays.com/2023/05/08/645907596997d.gif` | [_config.anzhiyu.yml:192](_config.anzhiyu.yml#L192) `error_404.background` | GIF/JPG/WebP，**1920×1080** |
| A8 | **文章默认封面 ×4**（所有没单独设封面的文章都用它） | `picsum.photos/seed/anzhiyu1~4/800/500` | [_config.anzhiyu.yml:178-181](_config.anzhiyu.yml#L178-L181) `cover.default_cover` | JPG/WebP，**800×500**（16:10），建议 4 张不同 |

### B. 建议替换 —— 出错时才显示 / 藏在控制台

| # | 用途 | 当前地址 | 配置位置 | 格式 / 建议尺寸 |
| --- | --- | --- | --- | --- |
| B1 | **友链破图兜底** | `/img/friend_404.gif`（主题资源，604 KB） | [_config.anzhiyu.yml:185](_config.anzhiyu.yml#L185) `error_img.flink` | GIF/PNG，**~300×300** |
| B2 | **文章破图兜底** | `/img/404.jpg`（主题资源，142 KB） | [_config.anzhiyu.yml:186](_config.anzhiyu.yml#L186) `error_img.post_page` | JPG/PNG，**~300×300** |
| B3 | **控制台彩蛋图**（F12 里那张） | `npm.elemecdn.com/.../tinggge.gif` | ❌ **写死在主题里**：`themes/anzhiyu/layout/includes/anzhiyu/log-js.pug:58` | 想换只能改子模块，或关掉 `console.enable` |
| B4 | **导航栏菜单图标 ×5** | `/img/favicon.ico`（主题图标） | [_config.anzhiyu.yml:24-40](_config.anzhiyu.yml#L24-L40) `nav.menu[].item[].icon` | ICO/PNG，**32×32** |
| B5 | **作者状态表情包**（当前未启用） | `bu.dusays.com/2023/08/24/64e6ce9c507bb.png` | [_config.anzhiyu.yml:88](_config.anzhiyu.yml#L88) `author_status.statusImg` | PNG 透明底，~200×200 |

### C. 站点数据文件里的占位图

| # | 用途 | 当前地址 | 位置 | 格式 / 建议尺寸 |
| --- | --- | --- | --- | --- |
| C1 | 友链头像 · 本站示例 1 | `bu.dusays.com/2023/04/27/64496e511b09c.jpg` | [source/_data/link.yml:12](source/_data/link.yml#L12) | 正方形 **100×100** |
| C2 | 友链头像 · Butterfly | `npm.elemecdn.com/hexo-theme-butterfly/butterfly.png` | [source/_data/link.yml:16](source/_data/link.yml#L16) | 同上 |
| C3 | 友链头像 · Hexo | `hexo.io/icon/favicon-196x196.png` | [source/_data/link.yml:20](source/_data/link.yml#L20) | 同上 |
| C4 | 相册封面 | `picsum.photos/seed/albumcover/800/500` | [source/_data/album.yml:12](source/_data/album.yml#L12) | JPG/WebP **800×500** |
| C5 | 相册页头图 | `picsum.photos/seed/albumcover/1600/600` | [source/_data/album.yml:15](source/_data/album.yml#L15) | JPG/WebP **1600×600** |
| C6 | 相册照片 ×5 | `picsum.photos/seed/photo1~5/800/600` | [source/_data/album.yml:23-30](source/_data/album.yml#L23-L30) | JPG/WebP **800×600** |

> **C1–C3 不是「必须换」**：那三个是真实的官方站点（安知鱼示例站 / Butterfly / Hexo）。
> 但你自己的友链应该替换掉它们。改 `link.yml` 即可，不需要动主题。

### D. 主题自带图标（本地文件，浏览器标签页显示）

| # | 用途 | 位置 | 替换方式 |
| --- | --- | --- | --- |
| D1 | **favicon**（24 个页面引用） | 配置 [_config.anzhiyu.yml:150](_config.anzhiyu.yml#L150) `favicon` = `/favicon.ico`<br>实际文件 `themes/anzhiyu/source/favicon.ico` | 改配置指向 `/img/mine/favicon.ico`，文件放 `source/img/mine/favicon.ico` |
| D2 | 同上，另一路径 | `/img/favicon.ico`（主题 `source/img/favicon.ico`） | 同 D1，把 `nav.menu` 的 icon 一并改掉 |
| D3 | PWA 图标 ×5（`pwa.enable: false`，当前**未启用**） | [_config.anzhiyu.yml:1053-1057](_config.anzhiyu.yml#L1053-L1057) | 启用 PWA 前才需要换 |

> **小提醒**：即使把 `favicon` 配置改到新路径，`public/favicon.ico` **仍会**是主题那个图标（同名覆盖无效）。
> 不过页面上有 `<link rel="shortcut icon">` 指向你的新图标，所以浏览器标签页显示的是你的。
> 只有少数会无视 link 标签、硬请求 `/favicon.ico` 的爬虫/旧浏览器才会拿到主题图标。

### E. 扫描到但**实际不会加载**（可以无视）

| 图片 | 出处 | 为什么不加载 |
| --- | --- | --- |
| `img02.anheyu.com/...×3` | `themes/anzhiyu/source/css/_extra/room/room.css` | 那是「小空调」页面（`/room/`）的样式，**本站没有这个页面** |
| `yuanshen.site/imgs/loading-bar.png` | `themes/anzhiyu/source/css/_page/about.styl:1040` | 原神卡片进度条，**你的 about 页没配这块** |
| `/img/loading.gif`（738 KB） | 主题资源 | 产物里有但**没有任何页面引用** |
| `/img/512.png`、`/img/algolia.svg`、`/img/siteicon/*` | 主题资源 | 分别属于 PWA / Algolia，两者都关着 |
| `/img/default_cover.jpg` | 主题资源 | 已被 A8 的 picsum 配置取代 |
| `/img/comment_bg.png` | `css/index.css` | Valine 评论背景，**你用的是 Twikoo**，不生效 |

---

## 第三部分：功能自检

### ✅ 已完成并实测通过

| 功能 | 状态依据 |
| --- | --- |
| Hexo 8.1.2 站点 + 安知鱼主题（Git 子模块，锁定 `main` @ `72439d9` / v1.7.1） | `.gitmodules`，`git submodule status` |
| 主题配置覆盖（根目录 `_config.anzhiyu.yml`） | 与主题原始配置 diff 出 **35 项**差异 |
| **构建** | `58 files generated`，**0 ERROR / 0 FATAL** |
| **页面产出 16 项** | 首页/404/about/album/album-demo/music/link/comments/categories/tags/archives/atom.xml/sitemap.xml + 3 个分类页，**全部非空，0 失败** |
| 菜单与顶栏 | `menu` 四组 + `nav.enable` 双组，DOM 里 9 个菜单项全部渲染 |
| 本地搜索 | `local_search.enable` + `hexo-generator-searchdb` |
| 字数统计 | `wordcount.enable` + `hexo-wordcount` |
| 打字机副标题 | `subtitle.enable`，接一言 API |
| 访问量统计 | 不蒜子 `site_uv/site_pv/page_pv` 全开，脚本已注入 |
| **看板娘** | `l2d-widget` 9 个模型，**9/9 路径 200**，CORS `*`，DOM 出现 `l2dw` 节点 |
| **导航栏时钟** | 自研注入（主题的 `nav.clock` 是和风天气，已弃用），实测显示 `18:24:42` |
| **访客小板报** | 侧边栏 `.sticky_layout` 首个子节点，五段内容全部渲染 |
| 欢迎语组件 | `greetingBox`，7 时段覆盖 0–23 点 |
| 评论系统前端 | `comments.use: Twikoo`，前端解析为 `cdn.cbd.int/twikoo@1.6.44` |
| RSS / Sitemap | `atom.xml` 11863 字节，`sitemap.xml` 3761 字节 |
| Vercel 部署配置 | `vercel.json` 三条命令 + 子模块自愈 |
| 两个云函数 | `api/ip.js`、`api/weather.js`，本地用假 req/res 实测通过 |
| 微信/支付宝翻转卡 | 已关闭，产物里 `card-wechat` **0 处** |

### 🟡 已配好，但需要你提供东西才真正生效

| 功能 | 卡在哪 | 你要做什么 |
| --- | --- | --- |
| **评论（Twikoo）** | `twikoo.envId` 为空 | 部署 Twikoo 后端（MongoDB Atlas + Vercel），把地址填进 [_config.anzhiyu.yml:373](_config.anzhiyu.yml#L373) |
| **云函数代理** | 本地 `hexo server` 没有 `/api/*` 路由 | 部署到 Vercel 后自动生效；本地会自动降级 |
| **距离显示** | 我仍在用「承德市」占位坐标 | 告诉我你的城市，或改 [visitor-board.js:20](source/js/visitor-board.js#L20) |
| **头像 / 封面 / 赞赏码 / 加载图** | 全是第三方占位 | 见本文第二部分 A 组 |
| **社交账号** | `github.com/demokelite` 是我猜的 | 改 [_config.anzhiyu.yml:68-72](_config.anzhiyu.yml#L68-L72) `social` |
| **音乐馆歌单** | 放的是主题作者的网易云歌单 `8152976493` | 改 [_config.anzhiyu.yml](_config.anzhiyu.yml) 的 `nav_music.id` |

### ❌ 未做 / 已知限制

| 项 | 说明 |
| --- | --- |
| **评论后端** | 我无法代你注册 MongoDB / Vercel 账号，只能给你步骤 |
| **天气数据源双轨** | `uapis.cn` 禁止浏览器跨域，**必须**经云函数。本地预览只能走 Open-Meteo 降级 |
| **uapis ipinfo 只到市级** | 它的 `region` 是 `"中国 河北 承德"`（空格分隔、无后缀、无区县）。区县只能靠 xxapi 补，所以 `geoApi` 不能清空 |
| **控制台彩蛋图** | `tinggge.gif` 写死在主题模板里，不改子模块换不掉 |
| **`/favicon.ico` 根路径** | 同名覆盖无效，主题图标仍在 `public/favicon.ico` 占位（页面显示不受影响） |
| **主题自带冗余图片** | `loading.gif`(738 KB) + `friend_404.gif`(604 KB) 等会照常进 `public/`，不引用但占体积。想瘦身只能改子模块或用 `hexo` 过滤器剔除 |
| **未启用的小组件** | 天气（需 QWeather Key）、PWA、Mermaid、KaTeX、朋友圈、客服聊天、广告等，清单见 [theme-config-checklist.md](docs/theme-config-checklist.md) 第二节 |
| **`nav.clock`** | 主题这个选项**不是时钟**而是和风天气，且写死了作者的 key、CDN 已死。保持关闭，时钟另注入 |

---

## 第四部分：替换后的自查命令

```bash
# 1. 重新构建
npx hexo clean && npx hexo generate

# 2. 看还有多少第三方图片残留（应该越来越少）
grep -roh 'https://\(bu\.dusays\.com\|npm\.elemecdn\.com\|picsum\.photos\|upload-bbs\.miyoushe\.com\)[^"'"'"' )]*' public --include=*.html --include=*.css | sort -u

# 3. 确认没有 0 字节页面（静默渲染失败的特征）
find public -type f -size 0

# 4. 本地预览
npx hexo server     # http://localhost:4000
```

第 3 条尤其重要：本项目的 `/album/` 页曾因数据缺 `date` 字段被**静默渲染成 0 字节**，
不报错、不提示，只能靠这一条查出来。
