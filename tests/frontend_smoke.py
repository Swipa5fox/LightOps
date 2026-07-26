from __future__ import annotations

import re
import shutil
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "app" / "static"


class FrontendParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.references: list[str] = []
        self.inline_script = False
        self.inline_style = False
        self.inline_event_handler = False
        self.inline_style_attribute = False
        self._script_without_src = False
        self._inside_style = False
        self.deferred_scripts: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if element_id := values.get("id"):
            self.ids.append(element_id)
        for name in ("src", "href"):
            if reference := values.get(name):
                self.references.append(reference)
        if any(name.lower().startswith("on") for name, _ in attrs):
            self.inline_event_handler = True
        if "style" in values:
            self.inline_style_attribute = True
        if tag == "script":
            source = values.get("src")
            self._script_without_src = not source
            if source and "defer" in values:
                self.deferred_scripts.add(source)
        elif tag == "style":
            self._inside_style = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._script_without_src = False
        elif tag == "style":
            self._inside_style = False

    def handle_data(self, data: str) -> None:
        if self._script_without_src and data.strip():
            self.inline_script = True
        if self._inside_style and data.strip():
            self.inline_style = True


def local_file_for(reference: str) -> Path | None:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith("/"):
        return None
    return STATIC / parsed.path.removeprefix("/")


for path in STATIC.rglob("*"):
    if path.is_file():
        path.read_text(encoding="utf-8", errors="strict")

index = (STATIC / "index.html").read_text(encoding="utf-8")
style = (STATIC / "style.css").read_text(encoding="utf-8")
script = (STATIC / "app.js").read_text(encoding="utf-8")
render = (STATIC / "render.js").read_text(encoding="utf-8")
nginx = (ROOT / "deploy" / "lightops.nginx.conf").read_text(encoding="utf-8")
installer = (ROOT / "deploy" / "install.sh").read_text(encoding="utf-8")

parser = FrontendParser()
parser.feed(index)

assert len(parser.ids) == len(set(parser.ids)), "HTML ids must be unique"
assert not parser.inline_script, "inline scripts violate the production CSP"
assert not parser.inline_style, "inline style blocks violate the production CSP"
assert not parser.inline_event_handler, "inline event handlers violate the production CSP"
assert not parser.inline_style_attribute, "inline style attributes violate the production CSP"
assert parser.deferred_scripts == {
    "/vendor/vue.global.prod.js",
    "/render.js",
    "/app.js",
}, "the production scripts must load locally and defer in dependency order"

for reference in parser.references:
    parsed = urlsplit(reference)
    assert not parsed.scheme and not parsed.netloc, f"external frontend resource: {reference}"
    local_path = local_file_for(reference)
    if local_path is not None:
        assert local_path.is_file(), f"missing frontend resource: {reference}"

assert (STATIC / "vendor" / "vue.global.prod.js").is_file()
assert not (STATIC / "vendor" / "echarts.min.js").exists(), "unused ECharts must not return"

dangerous_patterns = {
    "eval": r"\beval\s*\(",
    "Function constructor": r"\bnew\s+Function\b",
    "innerHTML": r"\binnerHTML\b",
    "outerHTML": r"\bouterHTML\b",
    "insertAdjacentHTML": r"\binsertAdjacentHTML\b",
    "document.write": r"\bdocument\.write\b",
}
for label, pattern in dangerous_patterns.items():
    assert not re.search(pattern, script), f"dangerous DOM/code operation found: {label}"

assert "localStorage.setItem" not in script, "tokens must not persist in localStorage"
assert "sessionStorage.setItem" in script, "session-only token storage is required"
assert "REQUEST_TIMEOUT_MS" in script and "AbortController" in script
assert "handleAuthError" in script and "error.status !== 401" in script
assert "refreshRequested" in script, "range changes during refresh must be replayed"
assert 'role="progressbar"' in index
assert 'aria-live="polite"' in index
assert 'id="trend-description"' in index
assert "button:focus-visible" in style
assert "prefers-reduced-motion" in style
assert '"0.1.1"' in render, "render.js must be regenerated for the current release"

csp_match = re.search(r'Content-Security-Policy "([^"]+)"', nginx)
assert csp_match, "Nginx CSP header is missing"
csp = csp_match.group(1)
for directive in (
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
):
    assert directive in csp, f"CSP directive is missing: {directive}"
assert "'unsafe-inline'" not in csp
assert "'unsafe-eval'" not in csp
assert "Permissions-Policy" in nginx
assert "cdn.jsdelivr.net" not in installer
assert "echarts" not in installer.lower()
assert "app/static/render.js" in installer
assert "app/static/vendor/vue.global.prod.js" in installer

node = shutil.which("node")
if node:
    subprocess.run([node, "--check", str(STATIC / "app.js")], check=True)
    subprocess.run([node, "--check", str(STATIC / "render.js")], check=True)

print("LightOps frontend smoke test passed")
