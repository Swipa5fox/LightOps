/* LightOps README 截图脚本（无第三方依赖）
   目标：拉真实线上数据，从 http://119.91.47.89:1224 取实现截图。
   用法：node tools/capture-readme.mjs
   输出：outputs/screenshots/ */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { screenshot, sleep, withChrome } from "./cdp.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "..", "outputs", "screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = "http://119.91.47.89:1224";
const PROFILE = resolve(OUT, ".chrome-profile");
const PORT = 9223; // 避开 verify-theme.mjs 的 9222

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

withChrome({ port: PORT, profile: PROFILE, windowSize: "1440,1700" }, async (cdp) => {
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
  await screenshot(cdp, resolve(OUT, "01-login-light.png"));

  // ============== 2. 登录页（夜间） ==============
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("lightops_theme", "dark");
    return true;
  })()`);
  await sleep(700);
  await screenshot(cdp, resolve(OUT, "02-login-dark.png"));

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
    window.localStorage.setItem("lightops_theme", "dark");
    document.documentElement.dataset.theme = "dark";
    return { ok: true, user: body.username || null };
  })()`);
  console.log("login:", JSON.stringify(loginOk));

  await cdp.send("Page.navigate", { url: BASE + "/" });
  await sleep(2500);
  const dashOk = await waitForDashboard(cdp);
  const trendOk = await waitForTrend(cdp);
  console.log("dashboard ready:", dashOk, "trend drawn:", trendOk);

  // 强制指定夜间，确保画面干净
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    return true;
  })()`);
  await sleep(500);

  // ============== 4. Dashboard 主视图（夜间，完整） ==============
  await screenshot(cdp, resolve(OUT, "03-dashboard-dark.png"));

  // ============== 5. Dashboard 主视图（日间） ==============
  await cdp.evaluate(`(async () => {
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.click();
    return !!btn;
  })()`);
  await sleep(900);
  await screenshot(cdp, resolve(OUT, "04-dashboard-light.png"));

  // ============== 6. Admin 用户菜单（展示 RBAC + 改密） ==============
  // 切回夜间（菜单截图更明显），点用户名按钮展开菜单
  await cdp.evaluate(`(async () => {
    document.documentElement.dataset.theme = "dark";
    return true;
  })()`);
  await sleep(400);
  const menuOpened = await cdp.evaluate(`(async () => {
    const trigger = document.querySelector(".user-menu-trigger");
    if (trigger) {
      // hover 才显示下拉，先派发 mouseenter
      const menu = trigger.closest(".user-menu");
      if (menu) {
        menu.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      }
      trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      // 如果还是 display:none，则强制打开
      const dropdown = document.querySelector(".user-menu-dropdown");
      if (dropdown && getComputedStyle(dropdown).display === "none") {
        dropdown.style.display = "block";
      }
      return { hasTrigger: true, dropdownForced: !!(dropdown && getComputedStyle(dropdown).display === "block") };
    }
    return { hasTrigger: false };
  })()`);
  console.log("user-menu:", JSON.stringify(menuOpened));
  await sleep(400);
  await screenshot(cdp, resolve(OUT, "05-admin-user-menu.png"));

  console.log("done ->", OUT);
}).catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
