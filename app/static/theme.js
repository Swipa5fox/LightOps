/* LightOps 主题模块 —— 在样式渲染前同步初始化（防闪烁），并提供读写接口。
   与面板、登录页共享 localStorage 键 lightops_theme。
   写入操作集中在此文件，保证 app.js 不触碰 localStorage（安全铁律）。 */
(function () {
  "use strict";
  var THEME_KEY = "lightops_theme";

  function read() {
    try {
      return window.localStorage.getItem(THEME_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function save(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // 存储被禁用时主题仍可在当前页面生效，只是不做持久化。
    }
  }

  function system() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
  }

  window.LightOpsTheme = {
    read: read,
    save: save,
    system: system,
    apply: apply
  };

  // 首帧同步初始化：localStorage 优先，其次跟随系统偏好，避免主题闪烁。
  var initial = read();
  if (initial !== "light" && initial !== "dark") {
    initial = system();
  }
  apply(initial);
})();
