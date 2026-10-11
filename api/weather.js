/**
 * Vercel 云函数：/api/weather?city=承德
 *
 * 这个文件存在的唯一原因：
 * uapis.cn 明确拒绝浏览器跨域调用。实测带 Origin 请求时返回
 *   HTTP 403 {"code":"CORS_FORBIDDEN","message":"当前接口不允许浏览器跨域直接调用，请携带有效 key 后重试"}
 * OPTIONS 预检同样 403，且不支持 JSONP，所以客户端无法直连。
 * 放在服务端转发就不受同源策略约束。
 *
 * 该函数是可选的：
 * 部署到 Vercel 后小板报会优先走它；本地 `hexo server` 没有这个路由，
 * 前端会自动降级到 Open-Meteo（免密钥、允许跨域），所以删掉它也不会坏。
 */

const UPSTREAM = 'https://uapis.cn/api/v1/misc/weather?city=';

module.exports = async (req, res) => {
  const city = (req.query && req.query.city) || '';

  if (!city) {
    res.status(400).json({ error: 'missing query param: city' });
    return;
  }

  try {
    const upstream = await fetch(UPSTREAM + encodeURIComponent(city), {
      headers: {
        // 只带 UA 即可；不要试图伪造 Origin/Referer，服务端也没有这个必要
        'User-Agent': 'Mozilla/5.0 (compatible; hexo-visitor-board/1.0)',
        Accept: 'application/json'
      }
    });

    if (!upstream.ok) {
      throw new Error('upstream responded ' + upstream.status);
    }

    const data = await upstream.json();

    // 让 Vercel 边缘缓存 10 分钟，省上游额度（该接口有速率限制）
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
};
