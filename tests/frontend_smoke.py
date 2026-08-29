from __future__ import annotations

import re
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
        # <a href> is a navigation link, not a subresource: it is exempt from
        # the CSP default-src check and may point at an external site.
        if tag != "a":
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


index = (STATIC / "index.html").read_text(encoding="utf-8")
style = (STATIC / "style.css").read_text(encoding="utf-8")
script = (STATIC / "app.js").read_text(encoding="utf-8")
render = (STATIC / "render.js").read_text(encoding="utf-8")
login_html = (STATIC / "login.html").read_text(encoding="utf-8")
login_script = (STATIC / "login.js").read_text(encoding="utf-8")
session_script = (STATIC / "session.js").read_text(encoding="utf-8")
version_source = (ROOT / "app" / "__init__.py").read_text(encoding="utf-8")
version_match = re.search(r'^__version__\s*=\s*"([0-9]+\.[0-9]+\.[0-9]+(?:\.[0-9]+)?)"$', version_source, re.MULTILINE)
assert version_match, "application version source is missing"
current_version = version_match.group(1)
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
    "/vendor/vue.runtime.global.prod.js",
    "/render.js",
    "/app.js",
}, "the production scripts must load locally and defer in dependency order"

for reference in parser.references:
    parsed = urlsplit(reference)
    assert not parsed.scheme and not parsed.netloc, f"external frontend resource: {reference}"
    local_path = local_file_for(reference)
    if local_path is not None:
        assert local_path.is_file(), f"missing frontend resource: {reference}"

login_parser = FrontendParser()
login_parser.feed(login_html)
assert len(login_parser.ids) == len(set(login_parser.ids)), "login HTML ids must be unique"
assert not login_parser.inline_script, "login inline scripts violate the production CSP"
assert not login_parser.inline_style, "login inline style blocks violate the production CSP"
assert not login_parser.inline_event_handler, "login inline event handlers violate the production CSP"
assert not login_parser.inline_style_attribute, "login inline style attributes violate the production CSP"
for reference in login_parser.references:
    parsed = urlsplit(reference)
    assert not parsed.scheme and not parsed.netloc, f"external login resource: {reference}"
    local_path = local_file_for(reference)
    if local_path is not None:
        assert local_path.is_file(), f"missing login resource: {reference}"
assert "/api/login" in login_script
assert "/api/auth/me" in login_script
# 会话存储由 session.js 独占，登录页与面板都走它，避免两份实现漂移。
assert "lightops_session" in session_script
# 只有 session.js 触碰 sessionStorage，登录页与面板都经它读写，避免两份实现漂移。
assert "sessionStorage" in session_script
assert "sessionStorage" not in script, "app.js must read storage through session.js"
assert "/session.js" in login_html and "/session.js" in index
assert "sessionStorage" not in login_script, "login.js must use the shared session module"
assert "placeholder" not in login_html, "login inputs must not show placeholder hints"
assert "window.location.replace" in login_script, "login flow must redirect after auth"

assert (STATIC / "vendor" / "vue.runtime.global.prod.js").is_file()

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

assert "localStorage" not in script, "app.js must not touch localStorage; only theme.js owns it"
assert "lightops_session" not in script, "the session token must be read through session.js"
assert 'class="user-menu"' in index, "user menu dropdown must exist in the topbar"
assert 'window.location.replace("/login.html")' in script, "unauthenticated visits must redirect to the login page"
assert 'v-if="isAdmin"' in index, "admin-only controls must be hidden for guest users"
assert "user-menu-role" in index and "role-guest" in index, "user menu must expose the account role badge"
assert "AbortController" in script, "requests must be abortable so the 10s timeout can fire"
assert 'class="weather-emblem"' in index
assert 'aria-label="每日天气"' in index
assert "/icons/weather-" in index, "weather icons must be referenced from /icons/weather-<code>.svg"
assert 'href="/icons/favicon.svg"' in index, "favicon must be referenced from /icons/favicon.svg"
assert (STATIC / "icons" / "favicon.svg").is_file(), "icons/favicon.svg must exist"
assert (STATIC / "icons" / "weather-150.svg").is_file(), "icons/weather-150.svg must exist"
assert "/api/weather" in script
assert 'role="progressbar"' in index
assert 'aria-live="polite"' in index
assert 'id="trend-description"' in index
assert "button:focus-visible" in style
assert "prefers-reduced-motion" in style
assert "每 60 秒采样" not in index, "the CPU sampling note must stay removed"
assert "每 60 秒采样" not in render, "render.js must be regenerated after removing the CPU sampling note"
assert 'summary.version ? "v" + summary.version : "版本加载中"' in index
assert current_version not in index, "the frontend must not hardcode a fallback application version"
assert f'"版本加载中"' in render, "render.js must expose a neutral loading state"
assert f'|| "{current_version}"' not in render, "render.js must not hardcode a fallback application version"

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
assert "app/static/vendor/vue.runtime.global.prod.js" in installer

print("LightOps frontend smoke test passed")
