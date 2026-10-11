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
    // 传多个模型时，页面上会自动出现「切换模型」按钮，可以直接点击切换。
    models: [
      { path: 'https://model.hacxy.cn/shizuku/shizuku.model.json' },   // 雫，最经典的 Live2D 模型
      { path: 'https://model.hacxy.cn/koharu/model.json' },            // 小春
      { path: 'https://model.hacxy.cn/Haru/Haru.model3.json' },        // Haru
      { path: 'https://model.hacxy.cn/Hiyori/Hiyori.model3.json' },    // 日和
      { path: 'https://model.hacxy.cn/Mao/Mao.model3.json' },          // Mao
      { path: 'https://model.hacxy.cn/z16/z16.model.json' },           // Z16
      { path: 'https://model.hacxy.cn/rem/model.json' },               // 蕾姆
      { path: 'https://model.hacxy.cn/kobayaxi/model.json' },          // 康娜
      { path: 'https://model.hacxy.cn/cat-white/model.json' }          // 白猫
    ],

    position: 'bottom-left',                        // 'bottom-left' 或 'bottom-right'
    size: { width: 280, height: 380 },              // 传数字则为正方形
    transitionType: 'slide',                        // 'slide' 或 'fade'
    transitionDuration: 1000,
    primaryColor: '',                               // 留空用默认主题色，可写 'rgba(255,130,130,.9)'

    // 容器是 position:fixed; bottom:0，会压在左下角的音乐播放器 #nav-music 上，
    // 所以整体抬高一点。不想抬高就设为 '0px'。
    bottomOffset: '90px',

    // 提示气泡（对列表里每个模型都生效）
    tips: {
      welcomeMessage: ['欢迎来到本站～'],
      messages: ['记得常来看看哦～', '今天也要加油鸭！'],
      duration: 4000,
      interval: 8000
    }
  };

  /* ============================== 初始化 ============================== */

  function boot() {
    if (window.__l2dBooted) return;
    window.__l2dBooted = true;

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
