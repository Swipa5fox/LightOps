/* LightOps 主题视觉验证脚本（本地开发用，无第三方依赖）
   用法：先启动本地 uvicorn（127.0.0.1:8765），再运行：
   node verify-theme.mjs
   流程：登录面板 → 截图夜间 → 点击主题切换按钮 → 截图日间 → 登录页夜间/日间各一张 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "..", "outputs", "theme-preview");
mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:8765";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PROFILE = resolve(OUT, ".chrome-profile");
const PORT = 9222;

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
      "--window-size=1440,1000",
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
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = resolve(OUT, name);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log("saved", file);
}

async function main() {
  const chrome = await launchChrome();
  await waitForJson();
  const tab = await newTab();
  const cdp = cdpConnect(tab.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // 1. 登录页（默认跟随系统，headless 无系统偏好 → 夜间）
  await cdp.send("Page.navigate", { url: BASE + "/login.html" });
  await sleep(1500);
  await screenshot(cdp, "login-dark.png");

  // 2. 登录页日间（模拟用户点击不可能，直接用主题 API 切换，验证背景与卡片）
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "light";
    return true;
  })()`);
  await sleep(800);
  await screenshot(cdp, "login-light.png");

  // 3. 登录进入面板（夜间）
  await cdp.evaluate(`(async () => {
    const res = await fetch("${BASE}/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Admin", password: "123456" })
    });
    const body = await res.json();
    window.sessionStorage.setItem("lightops_session", body.token || "");
    window.location.href = "/";
    return true;
  })()`);
  await sleep(4000);
  // 确保面板渲染完成
  for (let i = 0; i < 20; i++) {
    const ready = await cdp.evaluate(`(async () => {
      const cards = document.querySelectorAll(".metric-card").length;
      const hasData = (document.querySelector(".metric-card .metric-value") || {}).textContent || "";
      return cards >= 2 && hasData.indexOf("%") !== -1;
    })()`);
    if (ready) break;
    await sleep(500);
  }
  await screenshot(cdp, "panel-dark.png");

  // 4. 点击主题切换按钮 → 日间
  const clicked = await cdp.evaluate(`(async () => {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  console.log("theme-toggle clicked:", clicked);
  await sleep(1200);
  await screenshot(cdp, "panel-light.png");

  // 5. 验证状态：data-theme 与 localStorage
  const state = await cdp.evaluate(`(async () => ({
    theme: document.documentElement.dataset.theme,
    stored: window.localStorage.getItem("lightops_theme"),
    label: document.querySelector(".theme-toggle") && document.querySelector(".theme-toggle").getAttribute("aria-label"),
    isLightClass: document.querySelector(".theme-toggle") && document.querySelector(".theme-toggle").classList.contains("is-light")
  }))()`);
  console.log("theme state:", JSON.stringify(state));

  cdp.close();
  chrome.kill();
  console.log("done ->", OUT);
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
