#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "rotate-token.sh must run as root" >&2
    exit 1
fi

deployment_file=/etc/lightops/deployment.env
env_file=/etc/lightops/lightops.env
# shellcheck disable=SC1090,SC1091
. "$deployment_file"
public_port=${LIGHTOPS_PUBLIC_PORT:-8080}
systemctl_path=${LIGHTOPS_SYSTEMCTL_PATH:-$(command -v systemctl)}

new_token=$(openssl rand -hex 32)
temporary=$(mktemp /etc/lightops/lightops.env.XXXXXX)
awk -v replacement="$new_token" '
    BEGIN { changed = 0 }
    /^LIGHTOPS_API_TOKEN=/ {
        print "LIGHTOPS_API_TOKEN=" replacement
        changed = 1
        next
    }
    { print }
    END {
        if (!changed) {
            print "LIGHTOPS_API_TOKEN=" replacement
        }
    }
' "$env_file" > "$temporary"

chown root:lightops "$temporary"
chmod 0640 "$temporary"
mv -f "$temporary" "$env_file"
"$systemctl_path" restart lightops

healthy=0
# shellcheck disable=SC2034
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl --fail --silent http://127.0.0.1:8000/api/health >/dev/null; then
        healthy=1
        break
    fi
    sleep 1
done
if [ "$healthy" -ne 1 ]; then
    unset new_token
    echo "TOKEN_ROTATION_HEALTH_FAILED" >&2
    exit 1
fi

unauthorized_status=$(curl --silent --output /dev/null --write-out "%{http_code}" "http://127.0.0.1:$public_port/api/audit")
authorized_status=$(curl --silent --output /dev/null --write-out "%{http_code}" --header "Authorization: Bearer $new_token" "http://127.0.0.1:$public_port/api/audit")
unset new_token

if [ "$unauthorized_status" != 401 ] || [ "$authorized_status" != 200 ]; then
    echo "TOKEN_ROTATION_AUTH_FAILED unauthorized=$unauthorized_status authorized=$authorized_status" >&2
    exit 1
fi
echo "TOKEN_ROTATED unauthorized=401 authorized=200"
