#!/usr/bin/env bash
set -Eeuo pipefail

PACKAGE_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/platform.sh
. "$PACKAGE_ROOT/deploy/lib/platform.sh"

if ! lightops_detect_platform; then
    cat >&2 <<'EOF'

PRECHECK_FAILED
Do not continue with installation. This package supports Debian/Ubuntu and
RHEL-family systemd hosts on x86_64 or aarch64. It intentionally refuses
Alpine/OpenRC, non-systemd hosts and containers that cannot manage host services.
EOF
    exit 1
fi

lightops_print_platform
printf 'cloud_provider=%s\n' "$(lightops_detect_cloud_provider)"

nginx_unit=$(lightops_first_installed_service nginx || true)
mysql_unit=$(lightops_first_installed_service mysqld mysql mariadb || true)
redis_unit=$(lightops_first_installed_service redis redis-server || true)
printf 'installed_nginx_service=%s\n' "${nginx_unit:-not-installed-yet}"
printf 'installed_mysql_service=%s\n' "${mysql_unit:-not-installed}"
printf 'installed_redis_service=%s\n' "${redis_unit:-not-installed}"

if python_path=$(lightops_find_python); then
    printf 'python=%s\n' "$python_path"
    printf 'python_status=ready\n'
else
    printf 'python=not-found-or-older-than-3.9\n'
    printf 'python_status=installer-will-attempt-package-install\n'
fi

printf 'preflight=PASS\n'
printf 'next_step=review config.env, then run bash deploy/install.sh as root\n'
