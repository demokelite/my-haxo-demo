# my-haxo-demo

一个基于 Hexo 的静态博客，使用安知鱼（AnZhiYu）主题，部署到 Vercel。

站点地址：部署后填写。

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Hexo | 8.1.2 |
| 主题 | hexo-theme-anzhiyu 1.7.1（Git 子模块，锁定在 72439d9） |
| 模板与样式 | hexo-renderer-pug、hexo-renderer-stylus |
| Markdown | hexo-renderer-marked |
| 内容扩展 | hexo-generator-searchdb（本地搜索）、hexo-wordcount（字数统计）、hexo-generator-feed、hexo-generator-sitemap |
| 部署 | Vercel（静态输出 + 两个云函数） |

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
│   └── weather.js              代理天气查询
├── docs/                       项目说明文档
├── scaffolds/                  Hexo 新建文件的模板
├── source/
│   ├── _data/                  数据文件（友链、相册）
│   ├── _posts/                 文章
│   ├── css/                    自定义样式
│   ├── js/                     自定义脚本
│   ├── img/mine/               自己的图片
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

## 部署到 Vercel

1. 在 Vercel 新建项目，导入本仓库。
2. 框架预设选 Hexo 或 Other 都可以，构建配置已由 `vercel.json` 声明。
3. 不需要配置环境变量，两个云函数不依赖密钥。
4. 部署完成后，把 `_config.anzhiyu.yml` 里的 `url` 改成实际域名并重新部署。

`vercel.json` 内容：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "git submodule update --init --recursive; npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "public"
}
```

三点说明：

- `installCommand` 里的 `git submodule update` 是保险措施。Vercel 拉取子模块偶尔会失败并报 `Warning: Failed to fetch one or more git submodules`，结果是构建出一个没有主题的空壳。该命令是幂等的，成功时不会产生副作用。
- 构建命令用 `npm run build` 而不是直接写 `hexo generate`，是为了让 `node_modules/.bin` 进入 PATH，不依赖全局安装的 Hexo。
- `api/` 下的两个文件会被 Vercel 自动识别为云函数，与静态站点共存，不需要额外配置。

## 需要自己配置的部分

以下内容目前是占位值或尚未填写，上线前需要处理。

### 必须处理

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| Twikoo 评论 | `_config.anzhiyu.yml` 的 `twikoo.envId` | 留空时评论框不会加载，站点仍能正常构建 |
| 博主坐标 | `source/js/visitor-board.js` 顶部的 `CONFIG.owner` | 用于计算「距博主约 N 公里」，目前是占位坐标 |
| 社交账号 | `_config.anzhiyu.yml` 的 `social` | 目前是占位值 |
| 站点图标 | `_config.anzhiyu.yml` 的 `favicon` | 目前使用主题自带图标 |

### 评论系统部署

评论使用 Twikoo，需要单独部署后端。完整步骤（含 MongoDB Atlas 配置、常见问题排查）见
`docs/deploy-comments.md`，要点如下：

1. 注册 MongoDB Atlas 免费实例，创建数据库用户，网络白名单填 `0.0.0.0/0`，取得连接字符串（记得替换用户名密码）。
2. 用 Twikoo 官方模板一键部署到 Vercel：<https://vercel.com/import/project?template=https://github.com/twikoojs/twikoo/tree/main/templates/vercel-min>
3. 在 Vercel 项目中添加环境变量 `MONGODB_URI`，把 Deployment Protection 设为 Disabled，然后重新部署。
4. 把部署后的域名（含 `https://`，结尾不带斜杠）填入 `_config.anzhiyu.yml` 第 380 行的 `twikoo.envId`。

前端由主题固定为 Twikoo 1.6.44，后端使用最新版可正常配合。

### 占位图片

| 用途 | 位置 |
| --- | --- |
| 友链头像 | `source/_data/link.yml` |
| 相册封面与照片 | `source/_data/album.yml` |
| 文章默认封面 | `_config.anzhiyu.yml` 的 `cover.default_cover` |
| 首页人物粒子背景 | `_config.anzhiyu.yml` 的 `peoplecanvas.img` |
| 首页推荐卡封面 | `_config.anzhiyu.yml` 的 `home_top.banner.image` |
| 音乐馆歌单 | `_config.anzhiyu.yml` 的 `nav_music.id` |

替换方法：把图片放到 `source/img/mine/` 下，再把配置改指到新路径，然后重新构建。

需要注意：不要试图用「在 `source/` 放同名文件」的方式覆盖主题图片。实测主题的同名文件优先，站点文件会被忽略。必须使用不冲突的新路径。

完整的图片清单和尺寸建议见 `docs/image-replacement-and-status.md`。

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
- `api/weather.js`：转发到 uapis.cn 的天气接口，原因相同。

本地 `hexo server` 没有 `/api` 路由，这两个请求会返回 404，前端会自动降级到可跨域的备用接口（归属地用 v2.xxapi.cn，天气用 Open-Meteo），因此本地与线上的显示结果可能略有差异。

## 已知注意事项

1. **主题配置里的数组不能缩短。** Hexo 会把 `_config.anzhiyu.yml` 与主题自带的 `_config.yml` 深合并，而 `hexo-util` 的 `deepMerge` 对数组是按索引递归合并的。少写一项时，主题的默认值会补上该位置，可能指向不存在的页面。
2. **uapis.cn 不允许浏览器跨域**，必须经云函数调用，且不支持 JSONP。
3. **不蒜子按域名统计访问量**。`localhost` 无法注册，会落进共享计数池并显示异常大的数字，绑定真实域名后从 0 开始计算。
4. **主题的 `nav.clock` 不是时钟**，而是和风天气组件，其中写死了第三方密钥且依赖的 CDN 已不可达。导航栏时钟是自行注入的。
5. **`source/_data/album.yml` 不能删除**，否则相册页会因为缺少数据被渲染成 0 字节的空文件，且不会有报错。
6. **行尾统一为 LF**。仓库已设置 `core.autocrlf=false` 并添加 `.gitattributes`，避免 Windows 下工作区被转成 CRLF 导致文本编辑不匹配。

## 相关文档

- `docs/deploy-comments.md`：评论区（Twikoo）部署完整步骤与排查方法。
- `docs/theme-config-checklist.md`：主题配置清单，列出 208 个开关的当前状态和我修改过的项。
- `docs/image-replacement-and-status.md`：图片替换清单（含格式与尺寸建议）与功能自检。

## 许可

主题 hexo-theme-anzhiyu 使用 GPL-3.0 许可，文章内容版权归作者所有。
