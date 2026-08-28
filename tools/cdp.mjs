/* LightOps headless Chrome 辅助（无第三方依赖：原生 WebSocket + CDP）
   供 tools/verify-theme.mjs 与 tools/capture-readme.mjs 共用。 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function launchChrome(port, profile, windowSize) {
  return new Promise((resolve, reject) => {
    const child = spawn(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${windowSize}`,
      "about:blank"
    ], { stdio: "ignore" });
    child.on("error", reject);
    resolve(child);
  });
}

async function waitForJson(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint did not come up");
}

async function newTab(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
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

/* 起一个 headless Chrome，把已就绪的 CDP 连接交给 task，收尾时关标签页并杀进程。 */
export async function withChrome({ port, profile, windowSize }, task) {
  const chrome = await launchChrome(port, profile, windowSize);
  let cdp = null;
  try {
    await waitForJson(port);
    const tab = await newTab(port);
    cdp = cdpConnect(tab.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    return await task(cdp);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }
}

export async function screenshot(cdp, file) {
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log("saved", file);
}
