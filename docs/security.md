# 安全性说明

记录本站做过哪些安全处理、有哪些已知的取舍。每一条都写清「怎么验证的」，方便日后复查。

---

## 一、凭据

### 密钥不在仓库里

`MONGODB_URI` 只放在 Vercel 项目的环境变量里，不写进仓库。已扫描确认：

- 工作区：`mongodb+srv://` 只出现在三处**占位符**里（`<用户名>:<密码>`），无真实凭据
- **全部 git 历史**：真实密码、用户名、各类 token（AKIA / ghp_ / sk-）、私钥文件头，命中数均为 **0**
- 前端产物：搜 `MONGODB` / `mongodb+srv` / `password` / `token` 等，均无

`.gitignore` 已忽略 `.env` / `.env.*` / `*.env`。

### 复查命令

```bash
# 全历史搜真实密码
git log --all -p -S '你的真实密码' | head
# 前端是否泄漏
curl -s https://www.zbnr.skin/ | grep -i -E 'mongodb|password|secret|token'
```

---

## 二、Twikoo 评论后端

### 管理员面板只有登录者可见

| 检查 | 结果 |
| --- | --- |
| 匿名 `GET_CONFIG` | `{"IS_ADMIN": false}` |
| 匿名 `SET_CONFIG` | `{"code":1024,"message":"请先登录"}` |
| 匿名 `SET_PASSWORD` | `{"code":1010,"message":"请先登录再修改密码"}` |
| 页面 HTML 里的 admin / 管理 / 密码字样 | 搜不到 |

管理入口是云函数地址本身（`/api/twikoo`），不在博客页面上。

### 管理员密码

**必须设置**，否则第一个打开云函数地址的人就能接管。设置方法与自检命令见
[`deploy-comments.md`](deploy-comments.md) 的「管理员面板与安全」一节。

自检：用错误密码调 `LOGIN`，返回 `密码错误` 说明已设置；返回 `未配置管理密码` 说明还没有。

---

## 三、HTTP 响应头

`vercel.json` 里配置了六个头，作用于所有路径：

| 头 | 值 | 防的是什么 |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | 浏览器按内容猜测类型导致的脚本执行 |
| `X-Frame-Options` | `SAMEORIGIN` | 点击劫持（别人用 iframe 套你的站） |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 跳外链时泄漏完整 URL |
| `Permissions-Policy` | 关闭摄像头/麦克风/定位/支付/USB | 被嵌入时滥用设备权限 |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | 跨窗口引用（保留弹窗，兼容评论登录） |
| `Content-Security-Policy` | 见 `vercel.json` | 未授权来源的脚本执行 |

Vercel 默认只给 HSTS，其余都要自己声明 —— 这也是之前实测的结果：
修复前只有 `strict-transport-security` 存在。

### CSP 是实测过的，不是抄来的

CSP 配错会把站点弄坏，所以它是**在六种页面上逐个验证**过才上线的：

1. 把策略作为 `<meta>` 注入本地构建产物
2. 用一个**纯静态服务器**（不是 `hexo server`）提供这些页面
3. 无头浏览器加载，监听 `securitypolicyviolation` 事件
4. **阳性对照**：故意往页面里插一个不在白名单的脚本，确认它**真的被拦**

> 为什么必须用纯静态服务器：`hexo server` 有自己的路由表，会覆盖磁盘上的 `public/` 文件，
> 注入的内容根本不会被送出。第一次测试就栽在这里，得出的「零违规」是假的。
>
> 为什么必须做阳性对照：没有它，「零违规」既可能是策略生效了、也可能是策略压根没生效。

最终六个页面除阳性对照外零违规。

### CSP 里为什么有 'unsafe-inline' 和 'unsafe-eval'

主题大量使用内联脚本，去掉这两个站点就废了。所以这份 CSP 主要价值在于
**限制脚本的来源域名**、禁掉 `object-src`、锁死 `base-uri` 和 `form-action`，
而不是防住内联注入。这一点要清楚，别把它当成万能的。

### 已知未加的头

`Cross-Origin-Embedder-Policy` 没加。它会破坏外部图片和脚本的加载，
对一个全靠第三方 CDN 的静态博客得不偿失。

---

## 四、云函数的输入校验

`/api/ip` 和 `/api/weather` 都不带鉴权，**任何人都能调**。不校验的话，
它们就是两台免费的转发代理，上游接口的额度会被别人刷掉。

| 函数 | 规则 |
| --- | --- |
| `/api/ip` | 只接受合法的 IPv4 / IPv6（含前导零检查、长度上限），其余一律 400 |
| `/api/weather` | 城市名只允许中英文、数字、空格与连字符，最长 30 字，先 trim |

两个函数都会对参数做 `encodeURIComponent`，不存在拼进上游 URL 的可能。

**验证方式**：单元测试，覆盖 9 类非法 IP、5 类非法城市名、以及正常输入不被误伤。

### 未做的：速率限制

没有加。Vercel 边缘缓存（`s-maxage`）已经挡掉大部分重复请求，
再加一层有状态的限流需要引入 Redis 之类的组件，对个人博客不划算。
真被刷的话，Vercel 控制台能看到函数调用量。

---

## 五、前端脚本

### 转义

`source/js/visitor-board.js` 会把第三方接口返回的数据渲染到卡片上。
**所有值都过 `esc()`**，包括地区名、 ISP、天气、风向风力。

固定写法是 `element.textContent = ...` 或 `createElement`，不用 `innerHTML` 拼接。

发现并修复过一处：风向和风力（`windDirection` / `windPower`）原本没有转义就拼进 `innerHTML`。
触发条件是上游天气接口返回带标签的内容 —— 需要控制那家接口才能利用，
但转义成本为零，没有理由留这个口子。

### 没有的东西

四个自定义脚本里 `eval` / `new Function` / `document.write` 出现次数均为 **0**。

---

## 六、第三方内容（顺带清掉的）

严格说不是漏洞，但同属「站点在替别人做事」：

| 位置 | 原本是什么 | 现在 |
| --- | --- | --- |
| 音乐馆 | 加载**主题作者**的网易云歌单，并把访客 IP 送给第三方接口 | 页面已删除，`/music/` 301 跳首页 |
| 文章 AI 摘要卡 | 署名「AnZhiYu GPT」，按钮打开作者的爱发电收款页 | 改名「知识混子」，按钮指向本站关于页 |
| 页脚 | 链接文字只有一个「主题」 | 「安知鱼主题」 |

音乐的这条尤其值得记：清空配置**不够**。主题的 `utils.js` 里
`getCustomPlayList` 把作者歌单 ID **写死**，只要访问路径以 `/music/` 开头就会发起请求 ——
而且 `/music/` 当时还在 sitemap 里，搜索引擎也会去爬。
最终靠**删掉页面**让路径检查提前返回，才算彻底断掉。

---

## 七、复查清单

改动安全相关配置后，按顺序跑一遍：

```bash
# 1. 响应头是否齐全
curl -s -D - -o NUL https://www.zbnr.skin/ | grep -i -E 'content-security|x-content-type|x-frame|referrer|permissions'

# 2. 管理员密码是否已设置（应返回「密码错误」而不是「未配置管理密码」）
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"event":"LOGIN","password":"随便填"}' https://www.zbnr.skin/api/twikoo

# 3. 云函数输入校验
curl -s 'https://www.zbnr.skin/api/ip?ip=not-an-ip'      # 应 400
curl -s 'https://www.zbnr.skin/api/weather?city=%20%20'  # 应 400

# 4. 前端有没有泄漏环境变量
curl -s https://www.zbnr.skin/ | grep -i -E 'mongodb|db_user|secret'

# 5. 仓库里有没有密钥
git log --all -p | grep -E 'mongodb\+srv://[^<]|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}'
```
