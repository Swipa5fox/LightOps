#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOYMENT_FILE=/etc/lightops/deployment.env
ENV_FILE=/etc/lightops/lightops.env
# shellcheck disable=SC1090,SC1091
. "$DEPLOYMENT_FILE"

PUBLIC_PORT=${LIGHTOPS_PUBLIC_PORT:-8080}
MONITORED_SERVICES=${LIGHTOPS_MONITORED_SERVICES:-nginx}
SYSTEMCTL=${LIGHTOPS_SYSTEMCTL_PATH:-$(command -v systemctl)}
SUDO=${LIGHTOPS_SUDO_PATH:-$(command -v sudo)}

echo "PLATFORM"
printf 'os_family=%s package_manager=%s public_port=%s\n' "${LIGHTOPS_OS_FAMILY:-unknown}" "${LIGHTOPS_PACKAGE_MANAGER:-unknown}" "$PUBLIC_PORT"

echo "SERVICE_STATE"
service_list="lightops,$MONITORED_SERVICES"
IFS=',' read -r -a service_names <<< "$service_list"
for service_name in "${service_names[@]}"; do
    printf '%-24s ' "$service_name"
    "$SYSTEMCTL" is-active "$service_name"
done
"$SYSTEMCTL" is-enabled lightops

echo "SERVICE_LIMITS"
"$SYSTEMCTL" show lightops -p MainPID -p MemoryCurrent -p MemoryMax -p NRestarts -p ActiveEnterTimestamp

echo "LISTENERS"
ss -ltnp | grep -E "(:8000|:$PUBLIC_PORT)([[:space:]]|$)"

echo "API_HEALTH"
curl --fail --silent --show-error http://127.0.0.1:8000/api/health
echo
curl --fail --silent --show-error "http://127.0.0.1:$PUBLIC_PORT/api/health"
echo

echo "API_SUMMARY"
curl --fail --silent --show-error "http://127.0.0.1:$PUBLIC_PORT/api/summary"
echo

echo "AUTH_GUARD"
set -a
# shellcheck disable=SC1090,SC1091
. "$ENV_FILE"
set +a
unauthorized_status=$(curl --silent --output /dev/null --write-out "%{http_code}" "http://127.0.0.1:$PUBLIC_PORT/api/audit")
authorized_status=$(curl --silent --output /dev/null --write-out "%{http_code}" --header "Authorization: Bearer $LIGHTOPS_API_TOKEN" "http://127.0.0.1:$PUBLIC_PORT/api/audit")
unset LIGHTOPS_API_TOKEN
echo "unauthorized=$unauthorized_status authorized=$authorized_status"
test "$unauthorized_status" = 401
test "$authorized_status" = 200

echo "STATIC_ASSETS"
curl --fail --silent --show-error --head "http://127.0.0.1:$PUBLIC_PORT/vendor/vue.global.prod.js" | head -n 8
curl --fail --silent --show-error --head "http://127.0.0.1:$PUBLIC_PORT/render.js" | head -n 8

echo "PERMISSIONS"
for path in /etc/lightops/lightops.env /etc/lightops/deployment.env /var/lib/lightops /var/lib/lightops/lightops.db /opt/lightops/app; do
    if [ -e "$path" ]; then
        mode=$(stat -c %a "$path")
        owner=$(stat -c %U:%G "$path")
        echo "$mode $owner $path"
    fi
done

echo "DATABASE"
/opt/lightops/.venv/bin/python - <<'PY'
import sqlite3

connection = sqlite3.connect("/var/lib/lightops/lightops.db")
try:
    count, oldest, newest = connection.execute(
        "SELECT COUNT(*), MIN(ts), MAX(ts) FROM metrics"
    ).fetchone()
finally:
    connection.close()
print(f"metric_rows={count} oldest={oldest} newest={newest}")
PY

echo "SUDO_WHITELIST"
"$SUDO" -u lightops "$SUDO" -n -l

echo "RECENT_WARNINGS"
journalctl -u lightops --since "10 minutes ago" -p warning --no-pager
