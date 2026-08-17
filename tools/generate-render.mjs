import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compile } from "@vue/compiler-dom";


const toolsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(toolsDir, "..");
const htmlPath = resolve(projectRoot, "app/static/index.html");
const outputPath = resolve(projectRoot, "app/static/render.js");
const html = await readFile(htmlPath, "utf8");
const opening = '<div id="app" v-cloak>';
const start = html.indexOf(opening);
// 模板结束于 body 底部最后一个外部脚本之前（head 内可能已有同步脚本如 /theme.js）。
const lastScript = html.lastIndexOf('<script src=');
const end = lastScript >= 0 ? html.lastIndexOf("</div>", lastScript) : -1;

if (start < 0 || end < 0 || end <= start) {
  throw new Error("Unable to locate the LightOps Vue template in index.html");
}

const template = html.slice(start + opening.length, end);
const errors = [];
const compiled = compile(template, {
  mode: "function",
  prefixIdentifiers: true,
  hoistStatic: true,
  cacheHandlers: true,
  onError: (error) => errors.push(error)
});

if (errors.length) {
  throw new Error(errors.map(String).join("\n"));
}

const output = [
  "/* Generated from index.html by @vue/compiler-dom 3.5.17. */",
  "window.LightOpsRender = (function (Vue) {",
  compiled.code,
  "})(window.Vue);",
  ""
].join("\n");

await writeFile(outputPath, output, "utf8");
console.log("Generated " + outputPath);
