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
const closing = "\n    </div>\n\n    <script";
const start = html.indexOf(opening);
const end = html.lastIndexOf(closing);

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
