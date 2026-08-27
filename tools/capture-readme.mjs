/* LightOps README 截图脚本（无第三方依赖）
   目标：拉真实线上数据，从 http://119.91.47.89:1224 取实现截图。
   用法：node tools/capture-readme.mjs
   输出：outputs/screenshots/ */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "..", "outputs", "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = "http://119.91.47.89:1224";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PROFILE = resolve(OUT, ".chrome-profile");
const PORT = 9223; // 避开 verify-theme.mjs 的 9222

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchChrome() {
  return new Promise((resolve, reject) => {
    const child = spawn(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--window-size=1440,1700", // 高一点，把整个 dashboard 截进去
      "about:blank"
    ], { stdio: "ignore" });
    child.on("error", reject);
    resolve(child);
  });
}

async function waitForJson() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return;
    } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint did not come up");
}

async function newTab() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  return res.json();
}

function cdpConnect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (e) => reject(new Error("WebSocket error"));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };
  const evaluate = async (expression, awaitPromise = true) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error("evaluate failed: " + JSON.stringify(result.exceptionDetails));
    }
    return result.result ? result.result.value : undefined;
  };
  return { send, evaluate, close: () => ws.close(), ready };
}

async function screenshot(cdp, name) {
  // captureBeyondViewport=false, 但实际 viewport 已经是 1440x1700
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = resolve(OUT, name);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log("saved", file);
}

// 等待面板数据卡片就绪（CPU/内存等数值出现 %）
async function waitForDashboard(cdp) {
  for (let i = 0; i < 30; i++) {
    const ready = await cdp.evaluate(`(async () => {
      const cards = document.querySelectorAll(".metric-card").length;
      const v = (document.querySelector(".metric-card .metric-value") || {}).textContent || "";
      return cards >= 2 && v.indexOf("%") !== -1;
    })()`);
    if (ready) return true;
    await sleep(500);
  }
  return false;
}

// 等待趋势曲线至少有两个采样点（曲线会画出来）
async function waitForTrend(cdp) {
  for (let i = 0; i < 20; i++) {
    const ok = await cdp.evaluate(`(async () => {
      const paths = document.querySelectorAll("#trendChart svg path, #trendChart path").length;
      return paths >= 3; // CPU + 内存 + 磁盘 三条线
    })()`);
    if (ok) return true;
    await sleep(400);
  }
  return false;
}

async function main() {
  const chrome = await launchChrome();
  await waitForJson();
  const tab = await newTab();
  const cdp = cdpConnect(tab.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // ============== 1. 登录页（日间） ==============
  // 先去登录页让 theme.js 跟随系统偏好（headless 无系统偏好 → 落夜间）
  await cdp.send("Page.navigate", { url: BASE + "/login.html" });
  await sleep(1500);
  // 切到日间
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.setItem("lightops_theme", "light");
    return true;
  })()`);
  await sleep(700);
  await screenshot(cdp, "01-login-light.png");

  // ============== 2. 登录页（夜间） ==============
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "night";
    window.localStorage.setItem("lightops_theme", "night");
    return true;
  })()`);
  await sleep(700);
  await screenshot(cdp, "02-login-dark.png");

  // ============== 3. 登录进面板 ==============
  const loginOk = await cdp.evaluate(`(async () => {
    const res = await fetch("${BASE}/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Admin", password: "123456" })
    });
    const body = await res.json();
    if (!body || !body.token) return { ok: false, status: res.status, body };
    window.sessionStorage.setItem("lightops_session", body.token);
    window.localStorage.setItem("lightops_theme", "night");
    document.documentElement.dataset.theme = "night";
    return { ok: true, user: body.user || body.role || null };
  })()`);
  console.log("login:", JSON.stringify(loginOk));

  await cdp.send("Page.navigate", { url: BASE + "/" });
  await sleep(2500);
  const dashOk = await waitForDashboard(cdp);
  const trendOk = await waitForTrend(cdp);
  console.log("dashboard ready:", dashOk, "trend drawn:", trendOk);

  // 强制指定夜间，确保画面干净
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "night";
    return true;
  })()`);
  await sleep(500);

  // ============== 4. Dashboard 主视图（夜间，完整） ==============
  await screenshot(cdp, "03-dashboard-dark.png");

  // ============== 5. Dashboard 主视图（日间） ==============
  await cdp.evaluate(`(async () => {
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.click();
    return !!btn;
  })()`);
  await sleep(900);
  await screenshot(cdp, "04-dashboard-light.png");

  // ============== 6. Admin 用户菜单（展示 RBAC + 改密） ==============
  // 切回夜间（菜单截图更明显），点用户名按钮展开菜单
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "night";
    return true;
  })()`);
  await sleep(400);
  const menuOpened = await cdp.evaluate(`(async () => {
    const trigger = document.querySelector(".user-menu .user-button, .user-menu button, [data-user-menu-trigger]");
    if (trigger) {
      // hover 才显示下拉，先派发 mouseenter
      const menu = trigger.closest(".user-menu");
      if (menu) {
        menu.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      }
      trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      // 如果还是 display:none，则强制打开
      const dropdown = document.querySelector(".user-menu-dropdown, .user-menu .dropdown, .user-menu ul");
      if (dropdown && getComputedStyle(dropdown).display === "none") {
        dropdown.style.display = "block";
      }
      return { hasTrigger: true, dropdownForced: !!(dropdown && getComputedStyle(dropdown).display === "block") };
    }
    return { hasTrigger: false };
  })()`);
  console.log("user-menu:", JSON.stringify(menuOpened));
  await sleep(400);
  await screenshot(cdp, "05-admin-user-menu.png");

  cdp.close();
  chrome.kill();
  console.log("done ->", OUT);
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});