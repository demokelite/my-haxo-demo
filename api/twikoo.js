/**
 * Twikoo 评论后端，直接挂在本站的 Vercel 项目下。
 *
 * 访问地址就是 https://www.zbnr.skin/api/twikoo
 * 所以不需要为评论单独建账号、绑域名或加 DNS 记录。
 *
 * 这段代码来自 Twikoo 官方模板 templates/vercel-min/api/index.js，
 * 官方注释说明了两点，都很关键：
 *
 *   1. 必须保持纯 JS 且自包含。Vercel 只克隆 api/ 目录、跑一次 npm install
 *      就启动这个文件，不会执行仓库的构建流程，所以不能 import TS 源码。
 *
 *   2. 导出形态要兼容两代发布包：2.0 的双格式产物按 ESM 语义导出
 *      （CJS 侧是 exports.default），1.7.x 则是 module.exports = <handler>。
 *      Vercel 需要的是可调用函数，所以取 .default，没有再退回模块本身。
 *
 * 上线前必须在 Vercel 项目的 Environment Variables 里设置：
 *
 *   MONGODB_URI = mongodb+srv://<用户名>:<密码>@<集群>/?retryWrites=true&w=majority
 *
 * 这个值只放在 Vercel 后台，不要写进仓库。
 */

const vercel = require('twikoo-vercel');

module.exports = vercel.default ?? vercel;
module.exports.default = module.exports;
