# 部署评论区（Twikoo）完整步骤

本站评论使用 Twikoo。它分为两部分：

- **后端（云函数）**：负责存取评论，需要单独部署，本文主要讲这部分。
- **前端**：博客页面里的评论框，已配置完成，只差一个后端地址。

前端已固定使用 Twikoo 1.6.44（主题 `plugins.yml` 里写死的版本）。
官方要求前端不低于 1.4.0，所以版本是匹配的。

完成后，评论会出现在三个位置：文章底部、留言板页面、中控台的「最新评论」，
首页文章卡片也会显示评论数。它们共用同一份配置。

---

## 需要准备的东西

| 项目 | 用途 | 是否必须 |
| --- | --- | --- |
| MongoDB Atlas 账号 | 存评论数据，免费额度 500 MiB，够用很久 | 必须 |
| Vercel 账号 | 跑云函数 | 必须 |
| 自定义域名 | 改善中国大陆访问速度 | 可选 |

整个流程大约 10 分钟。

---

## 第一步：创建数据库（MongoDB Atlas）

1. 注册账号：<https://www.mongodb.com/cloud/atlas/register>

2. 创建一个免费（M0）集群。

   区域选择建议靠近云函数所在地。不确定就选 `AWS / Oregon (us-west-2)`，基建成熟、故障率低。

3. 创建数据库用户。

   左侧 **Database Access** → **Add New Database User**：

   - Authentication Method 选 **Password**
   - 设置用户名和密码。建议点 **Auto Generate** 生成一个不含特殊符号的强密码，**然后保存好**
   - 下方 **Database User Privileges** → **Add Built In Role** → Select Role 选 **Atlas Admin**
   - 点 **Add User**

4. 配置网络白名单。

   左侧 **Network Access** → **Add IP Address**：

   - Access List Entry 填 `0.0.0.0/0`（允许所有 IP）
   - 点 **Confirm**

   为什么是全放行：Vercel 这类 Serverless 平台的出口 IP 不固定，无法预先指定。
   代价是任何人都能尝试连接你的数据库，所以第 3 步的密码强度很重要。

5. 获取连接字符串。

   左侧 **Database** → **Connect** → 连接方式选 **Drivers** → 复制连接字符串。

   形如：

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   **必须把 `<username>:<password>` 替换成第 3 步实际创建的用户名和密码**，并且把尖括号一起去掉。
   这是最容易出错的一步——直接复制不改，后面必然连不上。

   （可选）默认会连到名为 `test` 的数据库。如果同一个 MongoDB 还要跑别的业务，
   在 `mongodb.net/` 后面加上数据库名，例如 `mongodb.net/twikoo?retryWrites=...`。

> 连接字符串等于数据库的完全控制权，泄露后别人可以任意增删改你的评论，
> 还可能拿到你配置的 SMTP、图床等凭据。不要提交到 Git 仓库，不要发到公开渠道。

---

## 第二步：部署云函数（Vercel）

1. 注册或登录 Vercel：<https://vercel.com/signup>

2. 点击官方一键部署链接：

   <https://vercel.com/import/project?template=https://github.com/twikoojs/twikoo/tree/main/templates/vercel-min>

   这个模板会把它 fork 到你自己的账号下并自动部署。项目名可以随意，例如 `twikoo`。

3. 配置环境变量。

   进入项目 → **Settings** → **Environment Variables** → 添加：

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | 第一步拿到的连接字符串（已替换用户名密码） |

   环境选 Production（勾选全部也可以），保存。

4. **关闭部署保护。**

   进入 **Settings** → **Deployment Protection** → 把 **Vercel Authentication** 设为 **Disabled**，保存。

   这一步不能跳过。默认开启时，云函数只允许带 Vercel 登录态的请求访问，
   你博客的评论请求会被拦在门外，表现为评论框一直加载不出来。

5. **重新部署。**

   进入 **Deployments** → 任意一条记录右侧的 **⋯** → **Redeploy** → 确认。

   环境变量只对新部署生效，不重新部署的话第 3 步的设置不会起作用。

6. 验证部署结果。

   进入 **Overview**，点击 **Domains** 下面的那条链接，如果看到类似
   「Twikoo 云函数运行正常」的提示，说明后端已经跑起来了。

7. 记下这个地址。

   **Domains 里的完整地址就是环境 id**，形如 `https://twikoo-xxxx.vercel.app`。

   注意两点：要**带 `https://` 前缀**，**结尾不要带斜杠**。

---

## 第三步：接入博客

把上一步的地址填进主题配置：

`_config.anzhiyu.yml` 第 380 行：

```yaml
twikoo:
  envId: https://twikoo-xxxx.vercel.app    # 换成你自己的地址
  region:
  visitor: true
  option:
```

`region` 保持为空。只有当你的云函数部署在腾讯云 CloudBase 且不在上海时，
才需要填 `ap-guangzhou` 之类的区域值。Vercel 部署不需要填。

改完执行：

```bash
npx hexo clean && npx hexo generate
```

本地预览 `npx hexo server` 也能看到评论框了。

---

## 第四步：验证清单

部署完逐项确认：

| 检查项 | 预期结果 | 不符时看这里 |
| --- | --- | --- |
| 直接访问云函数地址 | 显示「Twikoo 云函数运行正常」 | 回到第二步第 3、5 步，确认 `MONGODB_URI` 正确且已重新部署 |
| 文章页底部 | 出现评论输入框 | 确认 `envId` 填对、构建已重新执行 |
| `_config.anzhiyu.yml` 第 332 行 | `use: Twikoo` | 没设置的话评论区根本不渲染 |
| 留言板 `/comments/` | 可以发表评论 | 同文章页 |
| 浏览器控制台 | 无 CORS 报错 | 回到第二步第 4 步，Deployment Protection 必须是 Disabled |
| 首页文章卡片 | 显示评论数 | 需要 `comments.card_post_count: true`（已开启） |

发表一条测试评论，然后去 MongoDB Atlas 的 **Database** → **Browse Collections**，
能看到 `comment` 集合里出现数据，就说明整条链路通了。

---

## 常见问题

**评论框一直没有内容，转圈或空白**

按顺序排查：

1. 浏览器控制台有没有报错，特别是 CORS 相关的
2. 云函数地址直接访问是否正常
3. `envId` 是否带了 `https://`、结尾有没有多余的斜杠
4. Deployment Protection 是否为 Disabled

**中国大陆访问评论很慢甚至加载不出来**

`*.vercel.app` 的默认域名在国内访问不稳定。两个办法：

- 在 Vercel 项目里绑定自己的域名，然后在 Twikoo 后台把 `envId` 换成新域名
- 改用 Netlify 部署后端（官方对 Netlify 的国内访问评价更好）。
  前端配置不用改，只换 `envId` 即可

**评论数据存在哪，怎么备份**

存在你自己的 MongoDB Atlas 里。免费额度 500 MiB，纯文字评论用很久都用不完。
备份可以用 `mongodump`，或在 Atlas 界面里导出集合。

**想收评论邮件通知**

在云函数部署好之后，浏览器访问 `你的云函数地址`，会进入 Twikoo 管理面板。
首次进入需要设置管理员密码，之后在「邮件通知」里配置 SMTP 或 SendGrid 等通道。
这些配置存在数据库里，不是环境变量。

**换域名后评论会丢吗**

不会。评论按页面路径关联，只要文章链接结构不变，换域名后评论照常显示。

---

## 关于成本

- MongoDB Atlas 免费额度：500 MiB 存储，永久免费
- Vercel 免费额度：个人博客的评论量远远够用

正常使用不需要付费。

---

## 相关链接

- Twikoo 官方文档：<https://twikoo.js.org/>
- MongoDB Atlas 配置：<https://twikoo.js.org/mongodb-atlas.html>
- 云函数部署：<https://twikoo.js.org/backend.html>
- 常见问题：<https://twikoo.js.org/faq.html>
