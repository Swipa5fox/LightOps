/* LightOps 主题视觉验证脚本（本地开发用，无第三方依赖）
   用法：先启动本地 uvicorn（127.0.0.1:8765），再运行：
   node tools/verify-theme.mjs
   流程：登录页夜间/日间各一张 → 登录进面板 → 截图夜间 → 点击主题切换按钮 → 截图日间 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { screenshot, sleep, withChrome } from "./cdp.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "..", "outputs", "theme-preview");
mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:8765";
const PROFILE = resolve(OUT, ".chrome-profile");
const PORT = 9222;

withChrome({ port: PORT, profile: PROFILE, windowSize: "1440,1000" }, async (cdp) => {
  // 1. 登录页（默认跟随系统，headless 无系统偏好 → 夜间）
  await cdp.send("Page.navigate", { url: BASE + "/login.html" });
  await sleep(1500);
  await screenshot(cdp, resolve(OUT, "login-dark.png"));

  // 2. 登录页日间（模拟用户点击不可能，直接用主题 API 切换，验证背景与卡片）
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "light";
    return true;
  })()`);
  await sleep(800);
  await screenshot(cdp, resolve(OUT, "login-light.png"));

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
  await screenshot(cdp, resolve(OUT, "panel-dark.png"));

  // 4. 点击主题切换按钮 → 日间
  const clicked = await cdp.evaluate(`(async () => {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  console.log("theme-toggle clicked:", clicked);
  await sleep(1200);
  await screenshot(cdp, resolve(OUT, "panel-light.png"));

  // 5. 验证状态：data-theme 与 localStorage
  const state = await cdp.evaluate(`(async () => ({
    theme: document.documentElement.dataset.theme,
    stored: window.localStorage.getItem("lightops_theme"),
    label: document.querySelector(".theme-toggle") && document.querySelector(".theme-toggle").getAttribute("aria-label")
  }))()`);
  console.log("theme state:", JSON.stringify(state));

  console.log("done ->", OUT);
}).catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
