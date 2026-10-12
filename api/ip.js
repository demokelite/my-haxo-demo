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

/**
 * 校验一个字符串是否是合法的 IP。
 *
 * ⚠️ 为什么必须校验：这个函数不带鉴权，任何人都能调。
 * 不校验的话，任何人都能拿它当免费的 IP 归属地查询代理用，
 * 上游接口的额度会被别人刷掉。而且上游是按 IP 查询的，
 * 除了 IP 本身没有任何合法输入。
 */
function isIpv4(s) {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) return false;
  return s.split('.').every(function (n) {
    if (n.length > 1 && n.charAt(0) === '0') return false; // 前导零不是合法写法
    return Number(n) <= 255;
  });
}

function isIpv6(s) {
  // 宽松校验：只允许十六进制和冒号，且至少两个冒号段，长度合规即可。
  // 严格解析 IPv6 没必要，上游自己会再判断一次。
  if (s.indexOf(':') === -1) return false;
  if (!/^[0-9a-fA-F:]+$/.test(s)) return false;
  return s.split(':').length >= 3;
}

function isValidIp(s) {
  if (typeof s !== 'string') return false;
  var v = s.trim();
  if (v.length < 3 || v.length > 45) return false; // IPv6 最长 45 字符
  return isIpv4(v) || isIpv6(v);
}

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

  if (!isValidIp(ip)) {
    res.status(400).json({ error: 'invalid ip: 只接受合法的 IPv4 或 IPv6 地址' });
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
