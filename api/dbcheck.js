/**
 * 临时诊断接口：/api/dbcheck
 *
 * 用途：排查 Vercel 上 MONGODB_URI 环境变量到底长什么样。
 * 评论后端报 bad auth 时，最常见的原因是值里混进了不该有的字符，例如：
 *   - 把 env 文件里整行粘进去，值变成 MONGODB_URI="mongodb+srv://..."
 *   - 把两端的引号一起复制了
 *   - 密码是旧的 / 有手误
 *
 * ⚠️ 本接口只输出结构信息，**绝不输出密码、主机名或用户名**。
 * 评论确认可用后请删掉本文件。
 */

const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  const raw = process.env.MONGODB_URI;
  const uri = typeof raw === 'string' ? raw : '';

  const report = {
    env: {
      isSet: raw !== undefined,
      type: typeof raw,
      length: uri.length,
      // 值是否以合法协议开头
      startsCorrectly: uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      // 是否误把 "MONGODB_URI=" 也粘进去了
      containsKeyPrefix: /^\s*MONGODB_URI\s*=/.test(uri),
      // 是否带引号（env 文件里是带引号的，直接整段复制就会这样）
      containsQuote: /["']/.test(uri),
      // 首尾字符是不是可疑字符（只报是不是字母数字，不报具体字符）
      firstCharIsAlnum: /^[A-Za-z0-9]/.test(uri),
      lastCharIsAlnum: /[A-Za-z0-9]$/.test(uri),
      // 是否包含 SRV 后缀与查询串
      hasSrvScheme: uri.startsWith('mongodb+srv://'),
      hasQuery: uri.includes('?')
    }
  };

  // 从 URI 里解出结构（长度而已，不输出内容）
  const m = uri.match(/^mongodb(\+srv)?:\/\/([^:@/]+):([^@]*)@([^/?]+)/);
  if (m) {
    report.parsed = {
      scheme: m[1] ? 'mongodb+srv' : 'mongodb',
      usernameLength: m[2].length,
      passwordLength: m[3].length,
      // 密码里是否含需要 URL 编码的字符
      passwordHasSpecialChars: /[^A-Za-z0-9]/.test(m[3]),
      passwordIsUrlEncoded: /%[0-9A-Fa-f]{2}/.test(m[3]),
      hostLength: m[4].length
    };
  } else {
    report.parsed = null;
    report.parseError = '无法按 mongodb://user:pass@host 的结构解析';
  }

  // 真的连一次，把原始报错带回来
  if (report.env.isSet && report.parsed) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
    const t0 = Date.now();
    try {
      await client.connect();
      await client.db().admin().command({ ping: 1 });
      report.connect = { ok: true, ms: Date.now() - t0 };
    } catch (e) {
      report.connect = { ok: false, ms: Date.now() - t0, error: String(e.message).split('\n')[0] };
    } finally {
      await client.close().catch(() => {});
    }
  } else {
    report.connect = { ok: false, error: '环境变量缺失或格式不可解析，未尝试连接' };
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(report);
};
