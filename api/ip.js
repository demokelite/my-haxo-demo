/**
 * Vercel 云函数：/api/ip?ip=1.2.3.4
 * 不传 ip 时返回**访客**自己的归属地。
 *
 * 背景：uapis.cn 拒绝浏览器跨域，实测带 Origin 请求返回
 *   HTTP 403 {"code":"CORS_FORBIDDEN","message":"当前接口不允许浏览器跨域直接调用..."}
 * 所以只能放在服务端转发。
 *
 * ⚠️ 这里踩过一个坑，务必别改回去：
 * 最初「不传 ip」时直接转发到 uapis 的 /network/myip。那个接口返回的是
 * **调用方自己的 IP**，也就是 Vercel 云函数所在机器的 IP（AWS 网段），
 * 而不是访客的 IP。现象是访客看到自己的 IP 变成了 3.81.96.184 (亚马逊)，
 * 小板报还算出上万公里的假距离。
 *
 * 正确做法是从 x-forwarded-for 取访客真实 IP，再走 /network/ipinfo?ip=。
 * Vercel 会在该头里带上访客地址，多级代理时取第一段。
 *
 * 另外 uapis 的归属地只解析到「市级」：
 *   {"region":"中国 湖南 长沙", ...}    ← 空格分隔，没有区县
 * 区县级详情由前端另用 v2.xxapi.cn 补齐（那个接口允许跨域）。
 */

const IPINFO = 'https://uapis.cn/api/v1/network/ipinfo';

function clientIp(req) {
  const headers = req.headers || {};
  const raw = headers['x-forwarded-for'] || headers['x-real-ip'] || headers['cf-connecting-ip'] || '';
  // x-forwarded-for 可能是 "访客IP, 代理1, 代理2"，第一段才是访客
  return String(raw).split(',')[0].trim();
}

module.exports = async (req, res) => {
  const explicit = (req.query && req.query.ip) || '';
  const ip = explicit || clientIp(req);

  if (!ip) {
    res.status(400).json({ error: '无法确定访客 IP（请求里没有 x-forwarded-for）' });
    return;
  }

  const url = `${IPINFO}?ip=${encodeURIComponent(ip)}`;

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

    // 同一个访客反复刷新，结果不会变，缓存久一点
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
};
