/*!
 * 看板娘（Live2D）
 * 由 _config.anzhiyu.yml 的 inject.bottom 引入
 *
 * 用的是 l2d-widget（原 oh-my-live2d 已改名迁移到该包）。
 * CDN 走 cdn.cbd.int —— 主题同款，jsDelivr 直连在部分网络下不可达。
 */
(function () {
  'use strict';

  /* ============================ 配置区（改这里） ============================ */

  var CONFIG = {
    // 模型列表：写**完整路径**，不要只写目录名。
    // 原因：这个模型仓库里各模型的入口文件名并不统一，实测如下 ——
    //   shizuku              → shizuku.model.json
    //   Haru / Hiyori / Mao  → <Name>.model3.json   （Cubism 3 格式）
    //   z16                  → z16.model.json
    //   koharu / rem / kobayaxi / cat-* / chino / umaru / Pio / tia / uni → model.json
    // 全部模型目录见 https://model.hacxy.cn/ ，加新模型前先点进目录确认入口文件名。
    //
    // ⚠️⚠️ 另一条更容易踩的坑：**MOC3 格式的版本号必须 ≥ 3**。
    //   l2d-widget 用的是 Cubism 5 核心库，里面有一道一致性检查：
    //       if (!hasMocConsistency(buffer)) -> "Inconsistent MOC3." -> 直接拒绝加载
    //   而它对 **MOC3 v1 和 v2 会判定为不一致**，模型怎么都出不来，控制台只留一行
    //   "Inconsistent MOC3."，很容易误以为是网络问题。
    //
    //   实测（2026-10-13）：
    //     Haru.moc3      MOC3 v1  ★ 加载失败 ← 最初列表里的第 3 个就是它
    //     Wanko.moc3     MOC3 v1  ★
    //     Natori.moc3    MOC3 v1  ★
    //     abeikelongbi_3 MOC3 v2  ★
    //     Rice.moc3      MOC3 v3  ✓
    //     Mark.moc3      MOC3 v3  ✓
    //     Mao.moc3       MOC3 v5  ✓
    //     Ren.moc3       MOC3 v6  ✓
    //   注意 **Cubism 2 格式（.moc）不受这条限制** —— 它走的是另一套运行时，
    //   所以列表里那些 Cubism 2 模型（shizuku / rem / z16 等）一直都能用。
    //
    //   加模型前先查版本，第 5 个字节就是版本号：
    //     curl -sL <moc地址> | head -c 5 | xxd | head -1
    //   MOC3 的魔数是 "MOC3"，紧跟的那个字节就是版本；若是 "moc\0" 则是 Cubism 2。
    //
    // 传多个模型时，页面上会自动出现「切换模型」按钮，可以直接点击切换。
    models: [
      { path: 'https://model.hacxy.cn/shizuku/shizuku.model.json' },   // 雫，最经典的 Live2D 模型
      { path: 'https://model.hacxy.cn/koharu/model.json' },            // 小春
      // 第 3 个原来是 Haru，MOC3 v1 加载不出来，换成 Mark（同为 MOC3 但版本是 v3，能用）
      { path: 'https://model.hacxy.cn/Mark/Mark.model3.json' },        // Mark
      { path: 'https://model.hacxy.cn/Hiyori/Hiyori.model3.json' },    // 日和
      { path: 'https://model.hacxy.cn/Mao/Mao.model3.json' },          // Mao
      { path: 'https://model.hacxy.cn/z16/z16.model.json' },           // Z16
      { path: 'https://model.hacxy.cn/rem/model.json' },               // 蕾姆
      { path: 'https://model.hacxy.cn/kobayaxi/model.json' },          // 康娜
      { path: 'https://model.hacxy.cn/cat-white/model.json' }          // 白猫
    ],

    position: 'bottom-right',                       // 'bottom-left' 或 'bottom-right'
    size: { width: 260, height: 340 },              // 传数字则为正方形
    transitionType: 'slide',                        // 'slide' 或 'fade'
    transitionDuration: 1000,
    primaryColor: '',                               // 留空用默认主题色，可写 'rgba(255,130,130,.9)'

    // 容器样式是 position:fixed; bottom:0; right:0（bottom-right 时），贴住右下角。
    // 右下角原本是 #rightside 那排按钮（返回顶部 / 深色模式等，z-index 100），
    // 会看板娘被盖住，所以改用「把按钮整体上移」的方式避让：
    // 见 _config.anzhiyu.yml 的 rightside-bottom（已设为 360px，大于本模型高度 340px）。
    // 想让模型离底部有点距离，把这里改成 '20px' 之类即可。
    bottomOffset: '0px',

    // 移动端是否加载看板娘。默认关闭：手机屏幕小，模型会挡住内容，还费流量。
    // 判定依据是窗口宽度，不是 UA —— 窄窗口的桌面浏览器同样会被判定为移动端。
    disableOnMobile: true,
    mobileMaxWidth: 768,

    // 提示气泡（对列表里每个模型都生效）
    tips: {
      welcomeMessage: ['欢迎来到本站～'],
      messages: ['记得常来看看哦～', '今天也要加油鸭！'],
      duration: 4000,
      interval: 8000
    }
  };

  /* ============================== 初始化 ============================== */

  // 是否应跳过（移动端 / 窄窗口）
  function shouldSkip() {
    if (!CONFIG.disableOnMobile) return false;
    // 优先用窗口宽度；顺带兜一层 UA，避免某些移动端浏览器视口宽度被放大
    var narrow = window.innerWidth <= CONFIG.mobileMaxWidth;
    var mobileUA = /Android|iPhone|iPod|iPad|Mobile|HarmonyOS/i.test(navigator.userAgent);
    return narrow || mobileUA;
  }

  function boot() {
    if (window.__l2dBooted) return;
    window.__l2dBooted = true;

    if (shouldSkip()) return;   // 移动端直接不加载，连模型请求都不发

    if (!window.L2D_WIDGET || typeof window.L2D_WIDGET.createWidget !== 'function') {
      console.warn('[live2d] l2d-widget 未加载，跳过看板娘');
      return;
    }

    // 每个模型都带上同一份提示气泡配置
    var models = CONFIG.models.map(function (m) {
      return { path: m.path, tips: CONFIG.tips };
    });

    var options = {
      model: models,
      position: CONFIG.position,
      size: CONFIG.size,
      transitionType: CONFIG.transitionType,
      transitionDuration: CONFIG.transitionDuration
    };
    if (CONFIG.primaryColor) options.primaryColor = CONFIG.primaryColor;

    try {
      window.L2D_WIDGET.createWidget(options);
    } catch (e) {
      console.warn('[live2d] 初始化失败', e);
      return;
    }

    // l2d-widget 的容器没有 id 也没有 class，只能按它写死的样式认出来
    // （position:fixed + z-index:9999 + 无 id）。这里只做垂直偏移，
    // 其他一切交给库自己的 position / size 选项。
    if (!CONFIG.bottomOffset || CONFIG.bottomOffset === '0px') return;

    var tries = 0;
    var timer = setInterval(function () {
      var el = Array.prototype.find.call(document.body.children, function (n) {
        return n.style && n.style.position === 'fixed'
          && n.style.zIndex === '9999'
          && !n.id;                       // 排除主题自己的固定元素
      });
      if (el) {
        el.style.bottom = CONFIG.bottomOffset;
        clearInterval(timer);
      } else if (++tries > 40) {
        clearInterval(timer);
      }
    }, 250);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', boot);
  } else {
    boot();
  }
})();
