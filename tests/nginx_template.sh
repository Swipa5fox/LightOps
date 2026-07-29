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

cat > "$fixture_root/http.conf" <<EOF
pid $fixture_root/nginx.pid;
error_log $fixture_root/error.log;
events {}
http {
    include /etc/nginx/mime.types;
    include $http_rendered;
}
EOF

"$nginx_path" -t -c "$fixture_root/http.conf"
echo "LightOps Nginx template test passed"
