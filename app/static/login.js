(function () {
  "use strict";

  var SESSION_KEY = "lightops_session";

  function readSession() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeSession(token) {
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

  // 已持有有效会话时直接进入控制台。
  (async function () {
    var session = readSession();
    if (!session) {
      return;
    }
    try {
      var response = await window.fetch("/api/auth/me", {
        headers: { Authorization: "Bearer " + session }
      });
      if (response.ok) {
        window.location.replace("/");
      }
    } catch (error) {
      // 网络异常时停留在登录页，不阻塞手动登录。
    }
  })();

  var form = document.getElementById("login-form");
  var errorBox = document.getElementById("login-error");
  var submit = document.getElementById("login-submit");
  var usernameInput = document.getElementById("username");
  var passwordInput = document.getElementById("password");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var username = (usernameInput.value || "").trim();
    var password = passwordInput.value || "";
    if (!username || !password) {
      showError("请输入账号和密码");
      return;
    }
    errorBox.hidden = true;
    submit.disabled = true;
    submit.textContent = "登录中…";
    try {
      var response = await window.fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password })
      });
      var body = await response.json().catch(function () {
        return {};
      });
      if (!response.ok) {
        throw new Error(body.detail || "登录失败（" + response.status + "）");
      }
      writeSession(body.token || "");
      window.location.replace("/");
    } catch (error) {
      showError(error.message || "登录失败，请稍后重试");
      submit.disabled = false;
      submit.textContent = "进入控制台";
    }
  });
})();
