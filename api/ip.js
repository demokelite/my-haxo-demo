/**
 * Vercel 云函数：/api/ip?ip=1.2.3.4   （不传 ip 则返回调用者自己的归属地）
 *
 * 和 api/weather.js 同样的原因：uapis.cn 拒绝浏览器跨域。
 * 实测带 Origin 请求返回：
 *   HTTP 403 {"code":"CORS_FORBIDDEN","message":"当前接口不允许浏览器跨域直接调用，请携带有效 key 后重试"}
 * 所以只能放在服务端转发。
 *
 * 注意两个端点不能混用（实测）：
 *   /network/ipinfo?ip=x  → 查指定 IP；不带 ip 参数会返回 400 INVALID_PARAMETER
 *   /network/myip         → 查调用者自己的 IP，不接受参数
 *
 * 另外 uapis 的归属地只解析到「市级」：
 *   {"region":"中国 河北 承德", ...}    ← 空格分隔，没有区县
 * 区县级详情由前端另用 v2.xxapi.cn 补齐（那个接口允许跨域）。
 */

const IPINFO = 'https://uapis.cn/api/v1/network/ipinfo';
const MYIP = 'https://uapis.cn/api/v1/network/myip';

module.exports = async (req, res) => {
  const ip = (req.query && req.query.ip) || '';
  const url = ip ? `${IPINFO}?ip=${encodeURIComponent(ip)}` : MYIP;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; hexo-visitor-board/1.0)',
        Accept: 'application/json'
      }
    });

    if (!upstream.ok) {
      throw new Error('upstream responded ' + upstream.status);
    }

    const data = await upstream.json();

    // 归属地基本不变，缓存久一点
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
};
