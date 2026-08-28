/* LightOps 会话存储 —— 面板与登录页共享同一份实现。
   会话只存 sessionStorage（关标签即失效），localStorage 由 theme.js 独占。 */
(function () {
  "use strict";
  var SESSION_KEY = "lightops_session";

  function read() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function write(token) {
    try {
      if (token) {
        window.sessionStorage.setItem(SESSION_KEY, token);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      // Storage can be unavailable in hardened or private browser contexts.
    }
  }

  window.LightOpsSession = { read: read, write: write };
})();
