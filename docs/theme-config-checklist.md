# 安知鱼主题配置清单

> 全部开关来自 `_config.anzhiyu.yml`（程序化提取，共 208 个布尔项）。
> 图例：✅ 已开启 ｜ ⬜ 已关闭 ｜ 🔧 我改过（相对主题默认）｜ ⚠️ 依赖外部服务或密钥 ｜ ❌ 实测不可用

---

## 一、我改过的 35 项（相对主题默认）

这些是你现在已经和主题出厂状态不一样的配置。想恢复默认就把「主题默认」那一列填回去。

| 配置项 | 主题默认 | 你现在 |
| --- | --- | --- |
| `menu`（9 条菜单项） | 全部注释 | 🔧 文章/友链/我的/关于 四组 |
| `nav.enable` | `false` | 🔧 `true` |
| `nav.menu` | 主题作者的演示链接 | 🔧 站内链接 |
| `social` | 注释 | 🔧 Github + Mail |
| `local_search.enable` | `false` | 🔧 `true` |
| `wordcount.enable` | `false` | 🔧 `true` |
| `cover.default_cover` | 空 | 🔧 4 张 picsum 占位图 |
| `comments.use` | 空 | 🔧 `Twikoo` ⚠️ |
| `comments.count` / `card_post_count` | `false` | 🔧 `true` |
| `twikoo.visitor` | `false` | 🔧 `true` ⚠️ |
| `subtitle.enable` | `false` | 🔧 `true` ⚠️ |
| `busuanzi.site_uv` / `site_pv` / `page_pv` | `false` | 🔧 `true` ⚠️ |
| `greetingBox.enable` + `list` | `false` | 🔧 `true`（覆盖 0–23 点） |
| `linkPageTop.enable` | `false` | 🔧 `true` |
| `aside.card_author.description` | 空 | 🔧 自定文案 |
| `runtimeshow.publish_date` | `4/1/2021` | 🔧 `10/11/2026` |
| `footer.owner.since` | `2020` | 🔧 `2026` |
| `home_top.siteText` | `anheyu.com` | 🔧 `haxo-blog` |
| `home_top.category` | 主题作者的分类（死链） | 🔧 技术/折腾/生活 |
| `inject.head` / `inject.bottom` | 空 | 🔧 见第四节 |

---

## 二、还没开、但值得你考虑的

按「性价比」排序，都是主题原生支持、改一个 `false` 就能开的。

| 状态 | 配置项 | 作用 | 备注 |
| --- | --- | --- | --- |
| ⬜ | `post_copyright.decode` | 复制时自动追加原文出处 | 需填 `post_copyright` 的 license/author |
| ⬜ | `post_edit.enable` | 文章底部显示「在 GitHub 编辑」 | 公开仓库的话很实用 |
| ⬜ | `noticeOutdate.enable` | 老文章顶部提示「内容可能已过时」 | 写技术博客强烈建议 |
| ⬜ | `aside.card_categories.enable` | 侧栏显示分类卡片 | 你现在侧栏只有标签 |
| ⬜ | `aside.card_announcement.enable` | 侧栏公告卡片 | |
| ⬜ | `footer.runtime.enable` | 页脚显示「上班/下班」状态徽章 | ⚠️ 用主题作者的图片资源 |
| ⬜ | `footer.socialBar.enable` | 页脚社交栏 | |
| ⬜ | `footer.bdageitem.enable` | 页脚徽标（Hexo 版本等） | |
| ⬜ | `rightClickMenu.enable` | 自定义右键菜单 | 原站开了 |
| ⬜ | `shortcutKey.enable` | 键盘快捷键（shift+K 等） | 原站开了 |
| ⬜ | `comment_barrage_config.enable` | 评论弹幕 | ⚠️ 需要 Twikoo 管理端 token |
| ⬜ | `mermaid.enable` | Mermaid 图表 | |
| ⬜ | `katex.enable` | 数学公式 | |
| ⬜ | `pangu.enable` | 中英文自动加空格 | |
| ⬜ | `pwa.enable` | PWA 离线访问 | ⚠️ 需要配置 manifest |
| ⬜ | `friends_vue.enable` | 友链朋友圈（订阅友链更新） | ⚠️ 需要单独的后端服务 |
| ⬜ | `home_top.swiper.enable` | 首页顶部轮播 | |
| ⬜ | `anchor` | 滚动时 URL 跟随标题 | |
| ⬜ | `h2Divider` | h2 标题加分隔线 | |
| ⬜ | `table_interlaced_discoloration` | 表格隔行变色 | |
| ⬜ | `medium_zoom` | 图片缩放（与 `fancybox` 二选一） | 你现在用 fancybox |
| ⬜ | `footer_bg` | 页脚背景图 | |
| ⬜ | `mourn.enable` | 特定日期全站变灰 | 默认日期是作者设的 |
| ⬜ | `agreementPopup.enable` | 隐私协议弹窗 | ⚠️ 需要 `/privacy` 页面 |
| ⬜ | `author_status.enable` | 作者卡显示表情包状态 | |
| ⬜ | `mainTone.enable` | 根据封面图自动提取主色 | 性能开销较大 |
| ⬜ | `google_adsense.enable` | Google 广告 | ⚠️ 需要 AdSense 账号 |

---

## 三、完整开关清单（按功能分组）

### 1. 导航与菜单

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ 🔧 | `nav.enable` | 顶部分组导航栏 |
| ✅ 🔧 | `menu` / `nav.menu` | 主菜单四组 / 顶栏两组 |
| ⬜ | `nav.travelling` | 「开往」随机跳转按钮 |
| ⬜ | `nav.clock` | ❌ **实为和风天气组件，非时钟**；写死主题作者 key，CDN 已不可达 |
| ✅ | `accesskey` | 无障碍（首页按 `shift + ?`） |

### 2. 首页

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `home_top.enable` | 首页顶部区（标题+分类按钮+推荐卡） |
| ✅ 🔧 | `home_top.category` | 三个彩色分类按钮 |
| ⬜ | `home_top.swiper.enable` | 顶部轮播 |
| ✅ | `peoplecanvas.enable` | 首页人物粒子 canvas ⚠️ 用外部图片 |
| ✅ | `universe.enable` | 深色模式粒子背景 |
| ✅ | `index_post_content.method` | 首页文章摘要方式（3=自动摘要） |
| ✅ | `cover.index_enable` | 首页显示文章封面 |
| ✅ | `article_double_row` | 首页双栏布局 |
| ✅ | `aside.enable` / `button` / `mobile` | 侧边栏（含移动端） |
| ⬜ | `aside.hide` | 默认隐藏侧边栏 |
| ⬜ | `bubble.enable` | 卡片顶部气泡升起动效 |
| ✅ | `preloader.enable` | 加载动画（`source: 3`） |

### 3. 文章页

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `toc.post` / `number` | 文章目录（带序号） |
| ⬜ | `toc.page` / `expand` / `style_simple` | 独立页目录 / 默认展开 / 简洁样式 |
| ✅ | `post_copyright.enable` | 版权声明 |
| ⬜ | `post_copyright.decode` | 复制追加出处 |
| ✅ | `reward.enable` | 赞赏按钮 ⚠️ 需填收款码图片 |
| ✅ | `related_post.enable` | 相关文章推荐 |
| ✅ | `sharejs.enable` | 分享按钮 |
| ✅ | `wordcount.enable`（含 3 个子项） | 字数 / 阅读时长 / 全站字数 |
| ✅ | `post_meta.*` | 文章元信息（分类/标签等） |
| ✅ | `highlight_copy` / `highlight_lang` | 代码块复制按钮 / 语言标签 |
| ⬜ | `highlight_shrink` / `code_word_wrap` | 代码块折叠 / 自动换行 |
| ✅ | `ptool.enable`（含分享项） | 文章底部工具栏 |
| ✅ | `post_head_ai_description.enable` | 文章顶部 AI 摘要（`mode: local`） |
| ⬜ | `noticeOutdate.enable` | 过期提醒 |
| ⬜ | `post_edit.enable` | 在线编辑入口 |
| ⬜ | `photofigcaption` | 图片说明 |
| ⬜ | `anchor` | URL 跟随标题 |
| ✅ | `error_404.enable` | 404 页面 |
| ✅ | `fancybox` | 图片灯箱 |
| ✅ | `copy.enable` | 复制提示 |

### 4. 侧边栏卡片

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `aside.card_author.enable` | 作者卡（头像+描述+社交） |
| ✅ 🔧 | `aside.card_author.description` | 作者卡文案 |
| ✅ | `aside.card_weixin.enable` | 微信/支付宝二维码翻转卡 ⚠️ 主题作者图片 |
| ✅ | `aside.card_recent_post.enable` | 最新文章（5 篇） |
| ✅ | `aside.card_tags.enable` | 标签云（40 个） |
| ⬜ | `aside.card_tags.color` | 标签彩色 |
| ✅ | `aside.card_archives.enable` | 归档（按月，8 条） |
| ✅ | `aside.card_webinfo.enable` / `post_count` | 网站资讯 / 文章总数 |
| ⬜ | `aside.card_webinfo.last_push_date` | 最后更新时间 |
| ⬜ | `aside.card_categories.enable` | 分类卡片 |
| ⬜ | `aside.card_announcement.enable` | 公告卡片 |
| ✅ | `sidebar.*`（7 项） | 移动端侧栏（站点数据/功能/标签云/菜单） |

### 5. 评论

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ 🔧 | `comments.use` | 使用 **Twikoo** ⚠️ 待填 `envId` |
| ✅ 🔧 | `comments.count` / `card_post_count` | 文章顶部 / 首页卡片显示评论数 |
| ⬜ | `comments.lazyload` | 懒加载（开启后评论数失效） |
| ✅ 🔧 | `twikoo.visitor` | 文章访问量 |
| ⬜ | `valine.*` / `waline.*` / `artalk.*` / `giscus.*` | 其他四套评论系统（未启用） |
| ✅ | `visitorMail.enable` | 评论匿名邮箱 |
| ✅ 🔧 | `newest_comments.enable` | 中控台「最新评论」 |
| ⬜ | `comment_barrage_config.enable` | 评论弹幕 |
| ⬜ | `chat_btn` / `chatra` / `tidio` / `daovoice` / `crisp` | 客服聊天窗口（5 家，全关） |

### 6. 统计与数据

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ 🔧 | `busuanzi.site_uv` / `site_pv` | 全站访客数 / 访问量 ⚠️ 按域名计数 |
| ✅ 🔧 | `busuanzi.page_pv` | 单页访问量（被 Twikoo 覆盖） |
| ✅ 🔧 | `runtimeshow.enable` | 建站天数 |
| ✅ | `console.enable` | 控制台打印欢迎信息 |
| ⬜ | `LA.enable` | 51.la 统计 ⚠️ 需 ck |
| ⬜ | `umami.enable` | Umami 统计 ⚠️ 需自建服务 |
| ⬜ | `google_analytics` / `baidu_analytics` / `cnzz_analytics` / `cloudflare_analytics` / `microsoft_clarity` | 各类分析（全未配置） |

### 7. 搜索

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ 🔧 | `local_search.enable` | 本地搜索（已装 `hexo-generator-searchdb`） |
| ⬜ | `algolia_search.enable` | Algolia ⚠️ 需账号 |
| ⬜ | `docsearch.enable` | DocSearch ⚠️ 需申请 |

### 8. 视觉特效（背景/鼠标/点击）

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ⬜ | `canvas_ribbon.enable` | 静止彩带背景 |
| ⬜ | `canvas_fluttering_ribbon.enable` | 动态彩带 |
| ⬜ | `canvas_nest.enable` | 连线粒子背景 |
| ⬜ | `activate_power_mode.enable` | 打字烟花特效 |
| ⬜ | `fireworks.enable` | 点击烟火 |
| ⬜ | `click_heart.enable` | 点击爱心 |
| ⬜ | `ClickShowText.enable` | 点击显示文字 |
| ✅ | `beautify.enable` | 页面美化 |
| ✅ | `hr_icon.enable` | 分割线图标 |
| ✅ | `dynamicEffect.postTopWave` | 文章顶部波浪 |
| ⬜ | `dynamicEffect.postTopRollZoomInfo` / `pageCommentsRollZoom` | 滚动缩放动效 |

### 9. 交互与体验

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `pjax.enable` | 无刷新局部跳转 |
| ✅ | `instantpage` | 悬停预加载 |
| ✅ | `lazyload.enable`（含 blur/progressive） | 图片懒加载 |
| ✅ | `snackbar.enable` | 操作提示条 |
| ✅ | `translate.enable` | 简繁转换 |
| ✅ | `readmode` | 阅读模式 |
| ✅ | `darkmode.enable` | 深色模式 |
| ✅ | `centerConsole.enable` | 中控台 |
| ✅ | `diytitle.enable` | 切标签页卖萌提示 |
| ✅ 🔧 | `greetingBox.enable` | 首页欢迎语（3 秒消失） |
| ✅ 🔧 | `subtitle.enable` | 打字机副标题 ⚠️ 接一言 API |
| ✅ | `ptool.enable` | 文章底部工具 |
| ⬜ | `shortcutKey.enable` | 快捷键 |
| ⬜ | `rightClickMenu.enable` | 自定义右键菜单 |
| ⬜ | `pangu.enable` | 中英文空格 |
| ⬜ | `agreementPopup.enable` | 隐私弹窗 |
| ⬜ | `medium_zoom` | 另一种图片缩放 |

### 10. 页脚

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `footer.owner.enable` / `since` | 版权所有者 / 起始年份 |
| ✅ | `footer.footerBar.enable` | 底部栏 |
| ⬜ | `footer.footerBar.cc.enable` | CC 协议图标 |
| ⬜ | `footer.footerBar.subTitle.enable` | 副标题 |
| ⬜ | `footer.runtime.enable` | 上下班状态徽章 |
| ⬜ | `footer.bdageitem.enable` | 徽标墙 |
| ⬜ | `footer.socialBar.enable` | 社交栏 |
| ⬜ | `footer.list.enable` | 多栏链接（原站有这个） |
| ⬜ | `footer_bg` | 页脚背景图 |

### 11. 性能与构建

| 状态 | 配置项 | 作用 |
| --- | --- | --- |
| ✅ | `CDN.internal_provider` = `local` | 主题内部 JS 走本地 |
| ✅ | `CDN.third_party_provider` = `cbd` | 第三方库走 `cdn.cbd.int` |
| ✅ | `CDN.version` | CDN 地址带版本号 |
| ✅ | `css_prefix` | 自动加浏览器前缀 |
| ✅ | `Open_Graph_meta` | OG 分享元信息 |
| ⬜ | `pwa.enable` | PWA |

---

## 四、非主题原生的自定义组件（我加的）

这些不在主题配置里，是我为了实现需求额外加的。

| 文件 | 作用 | 怎么关 |
| --- | --- | --- |
| `source/js/visitor-board.js` | 访客小板报（归属地/距离/IP/天气），挂在**侧边栏** `.sticky_layout` 首位 | 删掉 `inject.bottom` 第一行即可；只想在首页显示就把文件里的 `homeOnly` 改成 `true` |
| `source/css/visitor-board.css` | 小板报排版微调（外框继承主题 `.card-widget`，深色模式自动适配） | 删掉 `inject.head` 那一行 |
| `api/weather.js` | Vercel 云函数，代理 uapis.cn 天气 | 删文件即可，前端会自动降级 |
| `inject.bottom` 看板娘 | Live2D（`l2d-widget`） | 删掉对应两行 |
| `inject.bottom` 时钟 | 导航栏时钟（主题没有此功能） | 删掉对应一行 |
| `source/_data/link.yml` | 友链数据 | 删掉后 `/link/` 页变空但不会报错 |
| `source/_data/album.yml` | 相册数据 | 删掉后 `/album/` 会渲染成 **0 字节空页** ⚠️ |

---

## 五、需要外部服务 / 密钥的项（⚠️ 汇总）

| 配置项 | 需要的服务 | 现状 |
| --- | --- | --- |
| `twikoo.envId` | MongoDB Atlas + Vercel 云函数 | **待你部署**，未填则评论框不加载 |
| `api/weather.js` | 无需密钥，但需部署到 Vercel | 本地自动降级 Open-Meteo |
| `local_search` | 无（已装插件） | ✅ 可用 |
| `busuanzi` | 无密钥，但按域名计数 | ✅ 可用（换域名会清零） |
| `subtitle.source: 1` | 一言 API（`hitokoto.cn`） | ✅ 可用，国内速度一般 |
| `reward` | 你的收款码图片 | ⚠️ 还是主题作者的图 |
| `nav_music` | 网易云歌单 ID | ⚠️ 现在放的是主题作者的歌单 |
| `avatar.img` | 你的头像图片 | ⚠️ 还是主题作者的图 |
| `cover.default_cover` | 你的封面图片 | ⚠️ 现在是 picsum 占位图 |
| `social` | 你的 GitHub / 邮箱 | ⚠️ GitHub 用户名是我猜的 |
| `newest_comments` | 依赖 Twikoo | 随评论系统一起生效 |
| 看板娘模型 | `model.hacxy.cn` | ✅ 可达 |
| Live2D / 时钟 CDN | `cdn.cbd.int` | ✅ 可达 |

---

## 六、几个实测结论（避免你踩坑）

1. **`nav.clock` 不是时钟**，是和风天气组件，写死了主题作者的 key，且其 CDN `widget.qweather.net` 已不可达（curl 返回 000）。真正的时钟是我用 `inject` 注入的。
2. **`uapis.cn` 拒绝浏览器跨域**（403 `CORS_FORBIDDEN`），且不支持 JSONP。必须在服务端调用，所以有了 `api/weather.js`。`v2.xxapi.cn` 则返回 `Access-Control-Allow-Origin: *`，可直连。
3. **`public/css/var.css` 是 0 字节**，但它是主题的遗留产物，全站没有任何页面引用它。主题色实际是通过 `var.styl` 编译进 `index.css` 的，所以改 `theme_color.main` **是生效的**。
4. **不蒜子按域名计数**：`localhost` 无法注册，会落进共享全局桶（实测返回 5700 万 UV）。上线到真实域名后从 0 开始。
5. **`source/_data/album.yml` 不能删**：`album_detail.pug` 直接执行 `new Date(item.date).toISOString()`，没有空值保护，缺数据会把页面渲染成 0 字节。
6. **`hexo-server` 的端口默认是 4000**，不是 Hugo 的 1313。
7. **`job_kill` 杀不掉 `hexo server` 的 node 子进程**，会一直占着端口。停服务要按端口找 PID 再 `Stop-Process`。
