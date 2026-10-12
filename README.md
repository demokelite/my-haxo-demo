# my-haxo-demo

一个基于 Hexo 的静态博客，使用安知鱼（AnZhiYu）主题，部署到 Vercel。

站点地址：<https://www.zbnr.skin>

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Hexo | 8.1.2 |
| 主题 | hexo-theme-anzhiyu 1.7.1（Git 子模块，锁定在 72439d9） |
| 模板与样式 | hexo-renderer-pug、hexo-renderer-stylus |
| Markdown | hexo-renderer-marked |
| 内容扩展 | hexo-generator-searchdb（本地搜索）、hexo-wordcount（字数统计）、hexo-generator-feed、hexo-generator-sitemap |
| 评论 | Twikoo（后端跑在同一个 Vercel 项目里，见下） |
| 部署 | Vercel（静态输出 + 三个云函数） |

开发环境实测：Node.js 26.3.1、npm 11.16.0。

## 目录结构

```
.
├── _config.yml                 Hexo 站点配置
├── _config.anzhiyu.yml         主题配置（覆盖主题自带配置）
├── vercel.json                 Vercel 构建配置
├── .gitattributes              行尾统一为 LF
├── api/                        Vercel 云函数
│   ├── ip.js                   代理 IP 归属地查询
│   ├── weather.js              代理天气查询
│   └── twikoo.js               Twikoo 评论后端（入口只有两行，实现在 twikoo-vercel 包里）
├── docs/                       项目说明文档
├── scaffolds/                  Hexo 新建文件的模板
├── source/
│   ├── _data/                  数据文件（友链、相册、关于页、技能图标）
│   ├── _posts/                 文章
│   ├── css/                    自定义样式
│   ├── js/                     自定义脚本
│   ├── img/mine/               头像、赞赏码等自有图片
│   ├── img/photos/             配图（Unsplash 授权，见 docs/photo-credits.md）
│   ├── img/skills/             技能图标（本地 SVG）
│   ├── robots.txt              爬虫规则 + sitemap 声明
│   └── <页面名>/index.md       独立页面
└── themes/anzhiyu/             主题（Git 子模块，不要直接修改）
```

## 本地运行

需要 Node.js 18 以上和 Git。

```bash
# 克隆时必须带子模块，否则 themes/anzhiyu 是空目录，构建会失败
git clone --recurse-submodules git@github.com:demokelite/my-haxo-demo.git
cd my-haxo-demo

# 如果克隆时忘了加 --recurse-submodules，补执行这一句
git submodule update --init --recursive

npm install
npm run server
```

浏览器打开 http://localhost:4000 预览。

可用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run server` | 本地预览，默认端口 4000 |
| `npm run build` | 生成静态文件到 `public/` |
| `npm run clean` | 清除缓存与 `public/` |
| `npx hexo new "标题"` | 新建文章 |
| `npx hexo new page "名称"` | 新建独立页面 |

注意 Hexo 的默认端口是 4000，不是 1313（1313 是 Hugo 的默认端口）。

## 写文章与管理

有两种方式。

### 方式一：本地写

```bash
npx hexo new "文章标题"     # 在 source/_posts/ 下生成 Markdown
npm run server              # 打开 http://localhost:4000 预览
git add -A && git commit -m "post: 文章标题" && git push
```

推送后 Vercel 会自动重新构建并发布。

### 方式二：网页后台（Pages CMS）

仓库根目录的 `.pages.yml` 配置了 [Pages CMS](https://app.pagescms.org) 在线管理后台。

使用步骤：

1. 打开 <https://app.pagescms.org>，用 GitHub 账号登录。
2. 首次使用需安装 Pages CMS 的 GitHub App，并授权访问 `my-haxo-demo` 仓库。
3. 进入仓库即可在网页上编辑。

可编辑的内容：

| 菜单 | 对应文件 |
| --- | --- |
| 文章 | `source/_posts/*.md` |
| 主题设置 | `_config.anzhiyu.yml` |
| 站点设置 | `_config.yml` |
| 关于页数据 | `source/_data/about.yml` |
| 友链数据 | `source/_data/link.yml` |
| 相册数据 | `source/_data/album.yml` |
| 技能图标 | `source/_data/creativity.yml` |
| 独立页面 | `source/about`、`link`、`comments`、`privacy` 下的 `index.md` |
| 站点图片 | `source/img/mine/` |
| ★ 信息填写清单 | `docs/site-info-form.md` |

保存时直接提交到 `main` 分支，Vercel 随即自动重新构建，本地不需要做任何操作。

注意：`_config.anzhiyu.yml`、`_config.yml` 这类配置文件在后台是以**纯文本编辑器**打开的（`format: code`）。
不要改成 `format: yaml` —— 那样 Pages CMS 会解析后重新序列化，把文件里的大量中文注释全部抹掉。

## 部署到 Vercel

1. 在 Vercel 新建项目，导入本仓库。
2. 框架预设选 Hexo 或 Other 都可以，构建配置已由 `vercel.json` 声明。
3. **必须配置一个环境变量** `MONGODB_URI`，否则评论和阅读量不可用：

   ```
   mongodb+srv://<用户名>:<密码>@<集群>/?retryWrites=true&w=majority
   ```

   这个值只放在 Vercel 后台，**不要写进仓库**（`.gitignore` 已忽略 `.env` / `*.env`）。

   **注意：改完环境变量必须重新部署才生效。** Vercel 的环境变量在部署时固化进函数，
   只改值不重新部署的话，函数仍然用旧值 —— 这个坑我们踩过一次，表现为评论报 `bad auth`。

4. 静态文件的 `url` 在 `_config.yml` 里（**不是** `_config.anzhiyu.yml`），
   必须指向线上域名，否则 canonical、og:url、sitemap、RSS 全都会指向 localhost。
   本站现在是 `https://www.zbnr.skin`（用 www，因为 Vercel 把 apex 308 跳转到 www）。

`vercel.json` 内容：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "git submodule update --init --recursive; npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "functions": {
    "api/*.js": { "maxDuration": 30 }
  }
}
```

四点说明：

- `installCommand` 里的 `git submodule update` 是保险措施。Vercel 拉取子模块偶尔会失败并报 `Warning: Failed to fetch one or more git submodules`，结果是构建出一个没有主题的空壳。该命令是幂等的，成功时不会产生副作用。
- 构建命令用 `npm run build` 而不是直接写 `hexo generate`，是为了让 `node_modules/.bin` 进入 PATH，不依赖全局安装的 Hexo。
- `api/` 下的三个文件会被 Vercel 自动识别为云函数，与静态站点共存，不需要额外配置。
- `maxDuration: 30` 是给 Twikoo 留的余量：它冷启动时要加载 jsdom 和 DOMPurify，默认的 10 秒偏紧。

## 各项配置的当前状态

### 已完成

| 项目 | 状态 |
| --- | --- |
| 站点基础信息 | 标题、作者、副标题、描述、关键词均已填写 |
| 域名 | `https://www.zbnr.skin`，已在 `_config.yml` 的 `url` 中配置 |
| 评论与阅读量 | Twikoo 后端跑在同一个 Vercel 项目下，接口是 `/api/twikoo` |
| 站点图标 | 由头像生成的 32/64/180 三个尺寸 |
| 配图 | 14 张 Unsplash 授权照片，全部本地化，无外部图床依赖 |
| 关于页 | 卡片式布局，数据在 `source/_data/about.yml` |
| SEO | `robots.txt`、JSON-LD 结构化数据、大图分享卡片 |

### 还需要作者提供

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| 真实友链 | `source/_data/link.yml` | 目前只有「本站的基石」一组，是本站真正依赖的项目，不是友链 |
| 社交账号 | `_config.anzhiyu.yml` 的 `social` | 目前只有 GitHub 和邮箱 |
| 音乐馆歌单 | `_config.anzhiyu.yml` 的 `nav_music.id` | 播放器当前关闭；开启前必须换成自己的歌单 ID |
| 相册照片 | `source/_data/album.yml` | 现在是收集来的照片，定位为「收藏的照片」而非个人日常 |

清单文件在 `docs/site-info-form.md`，可以在 Pages CMS 里直接编辑。

### 评论后端为什么放在本项目里

Twikoo 官方推荐单独部署，但**不要部署到 Vercel 的免费域名**：实测 `*.vercel.app`
在中国大陆被 SNI 阻断，对一个绝对不存在的子域也是同样的失败，说明拦的是整个后缀。
后端如果落在那里，会和站点一起打不开。

本站已有自定义域名，所以直接把 Twikoo 挂在同一个项目的 `api/twikoo.js` 上，
接口地址就是 `https://www.zbnr.skin/api/twikoo`，不需要第二个账号、域名或 DNS 记录。

`api/twikoo.js` 只有两行有效代码，来自官方 `templates/vercel-min`：

```js
const vercel = require('twikoo-vercel');
module.exports = vercel.default ?? vercel;
```

它必须保持纯 JS 且自包含：Vercel 只克隆 `api/` 目录、跑一次 `npm install` 就启动这个文件，
不会执行仓库的构建流程。导出形态要兼容两代发布包（2.0 走 `exports.default`，1.7.x 直接给函数），
所以取 `.default` 再回退。

### 图片

配图都在 `source/img/` 下，**本地存储，不引用外部图床**，避免国内访问慢或外链失效：

| 目录 | 内容 |
| --- | --- |
| `img/mine/` | 头像、赞赏码、favicon、404 背景 |
| `img/photos/` | 文章默认封面、卡片底图、相册照片 |
| `img/skills/` | 技能图标（本地生成的 SVG） |

来源与作者见 `docs/photo-credits.md`（Unsplash 授权，不强制署名）。

需要注意：不要试图用「在 `source/` 放同名文件」的方式覆盖主题图片。实测主题的同名文件优先，站点文件会被忽略。必须使用不冲突的新路径。

## 自定义组件

主题本身没有的功能通过 `inject` 注入，配置项都写在各自文件顶部的 `CONFIG` 区域。

| 文件 | 作用 |
| --- | --- |
| `source/js/visitor-board.js` | 侧边栏「小板报」：访客归属地、与博主的距离、IP、天气 |
| `source/js/live2d-init.js` | 看板娘（Live2D），配置了 9 个可切换模型 |
| `source/css/visitor-board.css` | 小板报排版 |
| `source/css/site-fixes.css` | 赞赏码防变形修正 |
| `_config.anzhiyu.yml` 的 `inject.bottom` | 导航栏时钟（内联脚本） |

云函数说明：

- `api/ip.js`：转发到 uapis.cn 的 IP 归属地接口。该接口禁止浏览器跨域，只能服务端调用。
  注意：不传 `ip` 参数时必须从 `x-forwarded-for` 取**访客**的真实 IP 再查 `ipinfo`。
  早期版本直接转发到 `myip`，那返回的是**云函数自己**的 IP（AWS 网段），
  结果是访客看到「您的IP地址为 3.81.96.184 (亚马逊)」并被算出上万公里的假距离。
- `api/weather.js`：转发到 uapis.cn 的天气接口，原因相同。
- `api/twikoo.js`：Twikoo 评论后端，见上文。

本地 `hexo server` 没有 `/api` 路由，这些请求会返回 404，前端会自动降级到可跨域的备用接口
（归属地用 v2.xxapi.cn，天气用 Open-Meteo），因此本地与线上的显示结果可能略有差异。
评论功能在本地无法验证，需要连线上。

## 已知注意事项

1. **主题配置里的数组不能缩短。** Hexo 会把 `_config.anzhiyu.yml` 与主题自带的 `_config.yml` 深合并，而 `hexo-util` 的 `deepMerge` 对数组是按索引递归合并的。少写一项时，主题的默认值会补上该位置，可能指向不存在的页面。
2. **uapis.cn 不允许浏览器跨域**，必须经云函数调用，且不支持 JSONP。
3. **不蒜子按域名统计访问量**。`localhost` 无法注册，会落进共享计数池并显示异常大的数字，绑定真实域名后从 0 开始计算。
4. **主题的 `nav.clock` 不是时钟**，而是和风天气组件，其中写死了第三方密钥且依赖的 CDN 已不可达。导航栏时钟是自行注入的。
5. **`source/_data/album.yml` 不能删除**，否则相册页会因为缺少数据被渲染成 0 字节的空文件，且不会有报错。
   `album_list` 的每一项都必须有 `date` —— `album_detail.pug` 直接执行 `new Date(item.date).toISOString()`，没有空值保护。
6. **`source/_data/creativity.yml` 缺失会让「技能」卡变成一个空框。** `tags-group-all.pug` 第一行是
   `if site.data.creativity`，文件不在就整块跳过，页面上只剩一个有边框没内容的卡片，且构建不报错。
7. **`about.yml` 里被解构的键不能删。** `about.pug` 有 `let {a,b,c} = item.maxim` 这类写法，
   **键本身缺失会让构建直接报错**；但键存在、内部值为空只会渲染成空白。留空的项随时能补，删键会崩。
8. **行尾统一为 LF**。仓库已设置 `core.autocrlf=false` 并添加 `.gitattributes`，避免 Windows 下工作区被转成 CRLF 导致文本编辑不匹配。
9. **用后台删文章后，要回头看一眼首页的分类按钮。** `_config.anzhiyu.yml` 里 `home_top.category` 的三项指向的是分类页路径。某个分类下的文章被删光后，那个分类页就不再生成，首页对应的按钮会变成死链。改动方式是编辑该配置里的 `name` 与 `path`（注意三项都不能删，原因见第 1 条）。
10. **Pages CMS 里不要把配置文件改成 `format: yaml`。** `_config.anzhiyu.yml` 和 `_config.yml` 必须保持 `format: code`，否则 Pages CMS 会解析后重新序列化，把文件里的大量中文注释抹掉。
11. **Vercel 改环境变量后必须重新部署。** 环境变量在部署时固化，只改值不重新部署，函数仍用旧值。
12. **`peoplecanvas` 和 `home_top` 的标题是二选一。** 模板里 `if theme.peoplecanvas.enable` 为真时渲染画布，
    `else` 分支才渲染 `home_top.title / subTitle / siteText`。开着画布，那三个字段永远不显示。
13. **本地测量的体积不可信。** `hexo server` 不做 gzip/brotli，本地看到的 CSS 是 711 KB，
    线上经 brotli 压缩实际只有约 88 KB。判断传输体积要 `curl` 线上并带 `Accept-Encoding` 头。
14. **主题源码里写死了主题作者的网易云歌单。** `themes/anzhiyu/source/js/utils.js` 的
    `getCustomPlayList` 有一行 `const userId = "8152976493"`，访问 `/music/` 且没带
    `?id=&server=` 参数时会用它。本站已清空 `nav_music.id`、移除导航入口，播放器不再渲染，
    那段代码找不到目标元素会直接返回，实际无影响。但以后若要启用音乐馆，**不能只填配置** ——
    这个写死的值会作为兜底出现，需要用 URL 参数覆盖或改主题源码，而改主题源码会在升级子模块时丢失。

## 相关文档

- `docs/site-info-form.md`：站点信息填写清单，以及各项的完成状态。
- `docs/deploy-comments.md`：评论区（Twikoo）部署完整步骤与排查方法。
- `docs/photo-credits.md`：所有配图的来源与作者。
- `docs/theme-config-checklist.md`：主题配置清单，列出 208 个开关的当前状态。
- `docs/image-replacement-and-status.md`：图片清单与格式尺寸建议（部分内容已被上文取代）。

## 许可

主题 hexo-theme-anzhiyu 使用 GPL-3.0 许可，文章内容版权归作者所有。
