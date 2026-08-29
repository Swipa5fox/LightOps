/* LightOps 会话存储 —— 面板与登录页共享同一份实现。
   会话只存 sessionStorage（关标签即失效），localStorage 由 theme.js 独占。 */
(function () {
  "use strict";
  var SESSION_KEY = "lightops_session";
  var WEATHER_PLACE_KEY = "lightops_weather_place";

  function storage(key) {
    return {
      read: function () {
        try {
          return window.sessionStorage.getItem(key) || "";
        } catch (error) {
          return "";
        }
      },
      write: function (value) {
        try {
          if (value) {
            window.sessionStorage.setItem(key, value);
          } else {
            window.sessionStorage.removeItem(key);
          }
        } catch (error) {
          // Storage can be unavailable in hardened or private browser contexts.
        }
      }
    };
  }

  var session = storage(SESSION_KEY);

  window.LightOpsSession = {
    read: session.read,
    write: session.write,
    weatherPlace: storage(WEATHER_PLACE_KEY)
  };
})();
