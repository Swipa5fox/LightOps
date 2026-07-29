#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
nginx_path=${1:-$(command -v nginx || true)}
if [ -z "$nginx_path" ]; then
    echo "nginx is required for the template test" >&2
    exit 1
fi

fixture_root=$(mktemp -d)
trap 'rm -rf "$fixture_root"' EXIT

render_http() {
    local rendered=$fixture_root/lightops-http.conf
    sed \
        -e 's|__LIGHTOPS_PUBLIC_PORT__|18080|g' \
        -e 's|__LIGHTOPS_SERVER_NAME__|_|g' \
        -e '/^__LIGHTOPS_HTTPS_BLOCK__$/d' \
        "$PROJECT_ROOT/deploy/lightops.nginx.conf" > "$rendered"
    if grep -q '__LIGHTOPS_' "$rendered"; then
        echo "unresolved Nginx template placeholder" >&2
        exit 1
    fi
    printf '%s' "$rendered"
}

http_rendered=$(render_http)

# 自适应定位 mime.types：优先用 nginx 自带的，找不到再 fallback 常见发行版路径
mime_types=""
if [ -f /etc/nginx/mime.types ]; then
    mime_types=/etc/nginx/mime.types
elif [ -f /usr/local/nginx/conf/mime.types ]; then
    mime_types=/usr/local/nginx/conf/mime.types
elif "$nginx_path" -V 2>&1 | grep -q -o -- '--conf-path=[^ ]*'; then
    conf_path=$("$nginx_path" -V 2>&1 | grep -o -- '--conf-path=[^ ]*' | cut -d= -f2)
    candidate_dir=$(dirname -- "$conf_path")
    if [ -f "$candidate_dir/mime.types" ]; then
        mime_types="$candidate_dir/mime.types"
    fi
fi
if [ -z "$mime_types" ]; then
    echo "warn: mime.types not found, using minimal inline fallback" >&2
    mime_types=$fixture_root/mime.types.fallback
    printf 'types { text/html html; }\n' > "$mime_types"
fi

cat > "$fixture_root/http.conf" <<EOF
pid $fixture_root/nginx.pid;
error_log $fixture_root/error.log;
worker_processes 1;
events {
    worker_connections 64;
}
http {
    include $mime_types;
    include $http_rendered;
}
EOF

if ! "$nginx_path" -t -c "$fixture_root/http.conf" 2>"$fixture_root/nginx-t.err"; then
    echo "nginx -t failed. diagnostics:" >&2
    echo "--- nginx -V ---" >&2
    "$nginx_path" -V >&2 2>&1
    echo "--- rendered template ---" >&2
    cat "$http_rendered" >&2
    echo "--- http.conf ---" >&2
    cat "$fixture_root/http.conf" >&2
    echo "--- nginx -t stderr ---" >&2
    cat "$fixture_root/nginx-t.err" >&2
    exit 1
fi
echo "LightOps Nginx template test passed"
