#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/config.sh
. "$PROJECT_ROOT/deploy/lib/config.sh"

fixture_root=$(mktemp -d)
trap 'rm -rf "$fixture_root"' EXIT
env_file=$fixture_root/lightops.env
sudoers_file=$fixture_root/lightops.sudoers

printf "LIGHTOPS_API_TOKEN='test-only-not-a-real-token'\n" > "$env_file"
lightops_write_env_setting "$env_file" LIGHTOPS_CLOUD_PROVIDER 'Amazon Web Services'
lightops_write_env_setting "$env_file" LIGHTOPS_SERVICES 'nginx,redis-server'
lightops_ensure_env_setting "$env_file" LIGHTOPS_CPU_THRESHOLD 85
lightops_ensure_env_setting "$env_file" LIGHTOPS_CPU_THRESHOLD 99

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a
test "$LIGHTOPS_CLOUD_PROVIDER" = 'Amazon Web Services'
test "$LIGHTOPS_SERVICES" = 'nginx,redis-server'
test "$LIGHTOPS_CPU_THRESHOLD" = 85
test "$(grep -c '^LIGHTOPS_CPU_THRESHOLD=' "$env_file")" -eq 1

lightops_render_sudoers "$sudoers_file" /usr/bin/systemctl 'nginx,redis-server'
grep -Fq '/usr/bin/systemctl restart nginx, /usr/bin/systemctl restart redis-server' "$sudoers_file"
grep -Fq 'lightops ALL=(root) NOPASSWD: LIGHTOPS_RESTART' "$sudoers_file"
if command -v visudo >/dev/null 2>&1; then
    chmod 0440 "$sudoers_file"
    visudo -cf "$sudoers_file"
fi

# shellcheck disable=SC2016
grep -Fq '"$LIGHTOPS_SYSTEMCTL_PATH" enable lightops' "$PROJECT_ROOT/deploy/install.sh"
# shellcheck disable=SC2016
grep -Fq '"$LIGHTOPS_SYSTEMCTL_PATH" restart lightops' "$PROJECT_ROOT/deploy/install.sh"
if grep -Fq 'enable --now lightops' "$PROJECT_ROOT/deploy/install.sh"; then
    echo "install.sh must restart an already active LightOps service during upgrades" >&2
    exit 1
fi

for service_script in deploy/lightopsctl deploy/verify-server.sh; do
    grep -Fq 'read -r -a service_names' "$PROJECT_ROOT/$service_script"
    # shellcheck disable=SC2016
    grep -Fq '"${service_names[@]}"' "$PROJECT_ROOT/$service_script"
done
# shellcheck disable=SC2016
if grep -Fq 'for monitored_service in lightops,$MONITORED_SERVICES' "$PROJECT_ROOT/deploy/lightopsctl"; then
    echo "lightopsctl must split the complete service CSV instead of a literal prefix" >&2
    exit 1
fi

echo "LightOps install helper tests passed"
