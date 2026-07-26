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
rendered=$fixture_root/lightops.conf
main_config=$fixture_root/nginx.conf

sed -e 's/__LIGHTOPS_PUBLIC_PORT__/18080/g' -e 's/__LIGHTOPS_SERVER_NAME__/_/g' "$PROJECT_ROOT/deploy/lightops.nginx.conf" > "$rendered"
if grep -q '__LIGHTOPS_' "$rendered"; then
    echo "unresolved Nginx template placeholder" >&2
    exit 1
fi

cat > "$main_config" <<EOF
pid $fixture_root/nginx.pid;
error_log $fixture_root/error.log;
events {}
http {
    include /etc/nginx/mime.types;
    include $rendered;
}
EOF

"$nginx_path" -t -c "$main_config"
echo "LightOps Nginx template test passed"
