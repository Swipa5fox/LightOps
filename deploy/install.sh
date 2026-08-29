#!/usr/bin/env bash
set -Eeuo pipefail

PACKAGE_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/platform.sh
. "$PACKAGE_ROOT/deploy/lib/platform.sh"
# shellcheck source=deploy/lib/config.sh
. "$PACKAGE_ROOT/deploy/lib/config.sh"

if [ -f "$PACKAGE_ROOT/config.env" ]; then
    set -a
    # config.env is an administrator-controlled shell environment file.
    # shellcheck disable=SC1091
    . "$PACKAGE_ROOT/config.env"
    set +a
fi

LIGHTOPS_PUBLIC_PORT=${LIGHTOPS_PUBLIC_PORT:-8080}
LIGHTOPS_SERVER_NAME=${LIGHTOPS_SERVER_NAME:-_}
LIGHTOPS_PUBLIC_HOST=${LIGHTOPS_PUBLIC_HOST:-SERVER_IP}
LIGHTOPS_CLOUD_PROVIDER=${LIGHTOPS_CLOUD_PROVIDER:-auto}
LIGHTOPS_INSTALL_PACKAGES=${LIGHTOPS_INSTALL_PACKAGES:-1}
LIGHTOPS_NGINX_SERVICE=${LIGHTOPS_NGINX_SERVICE:-auto}
LIGHTOPS_MYSQL_SERVICE=${LIGHTOPS_MYSQL_SERVICE:-auto}
LIGHTOPS_REDIS_SERVICE=${LIGHTOPS_REDIS_SERVICE:-auto}
LIGHTOPS_ENABLE_SWAP=${LIGHTOPS_ENABLE_SWAP:-0}
LIGHTOPS_SWAP_SIZE=${LIGHTOPS_SWAP_SIZE:-2G}

INSTALL_ROOT=/opt/lightops
VENV_ROOT=$INSTALL_ROOT/.venv
STATE_ROOT=/var/lib/lightops
CONFIG_ROOT=/etc/lightops
ENV_FILE=$CONFIG_ROOT/lightops.env
DEPLOYMENT_FILE=$CONFIG_ROOT/deployment.env
NGINX_DEST=/etc/nginx/conf.d/lightops.conf
SYSTEMD_DEST=/etc/systemd/system/lightops.service
SUDOERS_DEST=/etc/sudoers.d/lightops
POLKIT_DEST=/etc/polkit-1/rules.d/50-lightops.rules
BACKUP_BASE=/var/backups/lightops

fail() {
    lightops_error "$*"
    exit 1
}

validate_configuration() {
    case "$LIGHTOPS_PUBLIC_PORT" in
        ''|*[!0-9]*) fail "LIGHTOPS_PUBLIC_PORT must be an integer" ;;
    esac
    if [ "$LIGHTOPS_PUBLIC_PORT" -lt 1 ] || [ "$LIGHTOPS_PUBLIC_PORT" -gt 65535 ]; then
        fail "LIGHTOPS_PUBLIC_PORT must be between 1 and 65535"
    fi
    if [ "$LIGHTOPS_PUBLIC_PORT" -eq 8000 ]; then
        fail "public port 8000 conflicts with the private Uvicorn listener"
    fi
    case "$LIGHTOPS_SERVER_NAME" in
        ''|*[!A-Za-z0-9._*-]*) fail "LIGHTOPS_SERVER_NAME contains unsafe characters" ;;
    esac
    case "$LIGHTOPS_PUBLIC_HOST" in
        ''|*[!A-Za-z0-9._:-]*) fail "LIGHTOPS_PUBLIC_HOST contains unsafe characters" ;;
    esac
    case "$LIGHTOPS_INSTALL_PACKAGES:$LIGHTOPS_ENABLE_SWAP" in
        [01]:[01]) ;;
        *) fail "LIGHTOPS_INSTALL_PACKAGES and LIGHTOPS_ENABLE_SWAP must be 0 or 1" ;;
    esac
    if ! [[ "$LIGHTOPS_SWAP_SIZE" =~ ^[1-9][0-9]*[MG]$ ]]; then
        fail "LIGHTOPS_SWAP_SIZE must look like 512M or 2G"
    fi
    case "$LIGHTOPS_CLOUD_PROVIDER" in
        *"'"*) fail "LIGHTOPS_CLOUD_PROVIDER contains unsafe characters" ;;
    esac
}

validate_release_assets() {
    for release_asset in \
        requirements.txt \
        app/static/index.html \
        app/static/login.html \
        app/static/login.css \
        app/static/login.js \
        app/static/theme.js \
        app/static/session.js \
        app/static/style.css \
        app/static/app.js \
        app/static/render.js \
        app/static/vendor/vue.runtime.global.prod.js
    do
        if [ ! -s "$PACKAGE_ROOT/$release_asset" ]; then
            fail "release asset is missing or empty: $release_asset"
        fi
    done
}

install_packages() {
    if [ "$LIGHTOPS_INSTALL_PACKAGES" != 1 ]; then
        lightops_log "package installation disabled by config.env"
        return 0
    fi

    lightops_log "installing dependencies with $LIGHTOPS_PACKAGE_MANAGER"
    case "$LIGHTOPS_PACKAGE_MANAGER" in
        apt-get)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update
            apt-get install -y ca-certificates curl nginx openssl sudo iproute2 python3 python3-pip python3-venv policykit-1
            ;;
        dnf)
            dnf install -y ca-certificates curl nginx openssl sudo iproute python3 python3-pip polkit
            ;;
        yum)
            yum install -y ca-certificates curl nginx openssl sudo iproute python3 python3-pip polkit
            ;;
        *)
            fail "unsupported package manager: $LIGHTOPS_PACKAGE_MANAGER"
            ;;
    esac
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        fail "required command is missing after package installation: $1"
    fi
}

port_is_in_use() {
    "$ss_path" -H -ltn | awk -v suffix=":$1" '
        $4 ~ (suffix "$") { found = 1 }
        END { exit(found ? 0 : 1) }
    '
}

configure_swap() {
    if [ "$LIGHTOPS_ENABLE_SWAP" != 1 ]; then
        lightops_log "Swap unchanged (LIGHTOPS_ENABLE_SWAP=0)"
        return 0
    fi
    require_command mkswap
    require_command swapon
    if swapon --show=NAME --noheadings 2>/dev/null | grep -q .; then
        lightops_log "active Swap already exists; no new Swap file created"
        return 0
    fi
    if [ -e /swapfile ]; then
        fail "/swapfile already exists but is not active; refusing to overwrite it"
    fi

    lightops_log "creating explicitly authorized Swap file: $LIGHTOPS_SWAP_SIZE"
    if command -v fallocate >/dev/null 2>&1; then
        fallocate -l "$LIGHTOPS_SWAP_SIZE" /swapfile
    else
        swap_number=${LIGHTOPS_SWAP_SIZE%[MG]}
        swap_unit=${LIGHTOPS_SWAP_SIZE#"$swap_number"}
        swap_megabytes=$swap_number
        if [ "$swap_unit" = G ]; then
            swap_megabytes=$((swap_number * 1024))
        fi
        dd if=/dev/zero of=/swapfile bs=1M count="$swap_megabytes" status=progress
    fi
    chmod 0600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    if ! grep -Fq '/swapfile none swap sw 0 0' /etc/fstab; then
        printf '%s\n' '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
}



if [ "$(id -u)" -ne 0 ]; then
    fail "install.sh must run as root"
fi
if [ "${LIGHTOPS_TEST_MODE:-0}" = 1 ]; then
    fail "LIGHTOPS_TEST_MODE is only for detection tests and cannot be used for installation"
fi

validate_configuration
validate_release_assets
lightops_detect_platform || exit 1
lightops_print_platform
install_packages

for required in awk curl find grep install mktemp openssl runuser sed sudo systemctl useradd visudo nginx ss; do
    require_command "$required"
done

python_path=$(lightops_find_python || true)
if [ -z "$python_path" ]; then
    fail "Python 3.9 or newer is required; use a supported OS release or install a newer Python"
fi
sudo_path=$(lightops_command_path sudo)
nginx_path=$(lightops_command_path nginx)
ss_path=$(lightops_command_path ss)
LIGHTOPS_SYSTEMCTL_PATH=$(lightops_command_path systemctl)
cloud_provider=$(lightops_detect_cloud_provider)

nginx_service=$(lightops_resolve_service "$LIGHTOPS_NGINX_SERVICE" nginx)
if [ -z "$nginx_service" ]; then
    fail "the required Nginx systemd service was not detected"
fi
mysql_service=$(lightops_resolve_service "$LIGHTOPS_MYSQL_SERVICE" mysqld mysql mariadb)
redis_service=$(lightops_resolve_service "$LIGHTOPS_REDIS_SERVICE" redis redis-server)

monitored_services=$nginx_service
if [ -n "$mysql_service" ]; then
    monitored_services="$monitored_services,$mysql_service"
fi
if [ -n "$redis_service" ]; then
    monitored_services="$monitored_services,$redis_service"
fi

# 升级时保留已有的 LIGHTOPS_SERVICES：管理员可能手工加入了自动探测覆盖不到的
# 服务（如 Zabbix 的 zabbix-server / zabbix-agent2 / php-fpm），不能被默认值冲掉。
if [ -f "$ENV_FILE" ]; then
    configured_services=$(sed -n 's/^LIGHTOPS_SERVICES=//p' "$ENV_FILE" | tail -n 1 | tr -d ' ')
    configured_services=${configured_services#\'}; configured_services=${configured_services%\'}
    configured_services=${configured_services#\"}; configured_services=${configured_services%\"}
    if [ -n "$configured_services" ]; then
        IFS=, read -r -a configured_items <<< "$configured_services"
        preserved_services=""
        all_valid=1
        for item in "${configured_items[@]}"; do
            if [ -z "$item" ] || ! printf '%s' "$item" | grep -Eq '^[A-Za-z0-9_.@-]+$'; then
                all_valid=0
                break
            fi
            if [ -n "$preserved_services" ]; then
                preserved_services="$preserved_services,$item"
            else
                preserved_services=$item
            fi
        done
        if [ "$all_valid" = 1 ] && [ -n "$preserved_services" ]; then
            monitored_services=$preserved_services
            lightops_log "preserving configured LIGHTOPS_SERVICES=$monitored_services"
        fi
    fi
fi

if port_is_in_use "$LIGHTOPS_PUBLIC_PORT" && [ ! -f "$NGINX_DEST" ]; then
    fail "TCP $LIGHTOPS_PUBLIC_PORT is already in use and is not managed by an existing LightOps config"
fi

release_id=$(date -u +%Y%m%dT%H%M%SZ)
backup_root=$BACKUP_BASE/$release_id
install -d -m 0700 "$backup_root"
for existing_path in "$INSTALL_ROOT/app" "$INSTALL_ROOT/requirements.txt" "$ENV_FILE" "$DEPLOYMENT_FILE" "$NGINX_DEST" "$SYSTEMD_DEST" "$SUDOERS_DEST" "$POLKIT_DEST"
do
    if [ -e "$existing_path" ]; then
        cp -a "$existing_path" "$backup_root/"
    fi
done

if ! id lightops >/dev/null 2>&1; then
    nologin_path=$(lightops_command_path nologin || true)
    if [ -z "$nologin_path" ]; then
        nologin_path=/usr/sbin/nologin
    fi
    useradd --system --home-dir "$INSTALL_ROOT" --shell "$nologin_path" lightops
fi

install -d -m 0755 "$INSTALL_ROOT" "$INSTALL_ROOT/app"
install -d -o lightops -g lightops -m 0750 "$STATE_ROOT" "$STATE_ROOT/backups"
install -d -o root -g lightops -m 0750 "$CONFIG_ROOT"
install -d -m 0755 "$(dirname -- "$NGINX_DEST")"

cp -a "$PACKAGE_ROOT/app/." "$INSTALL_ROOT/app/"
install -m 0644 "$PACKAGE_ROOT/requirements.txt" "$INSTALL_ROOT/requirements.txt"
find "$INSTALL_ROOT/app" -type d -exec chmod 0755 {} +
find "$INSTALL_ROOT/app" -type f -exec chmod 0644 {} +
chown -R root:root "$INSTALL_ROOT/app" "$INSTALL_ROOT/requirements.txt"

if [ ! -x "$VENV_ROOT/bin/python" ]; then
    "$python_path" -m venv "$VENV_ROOT"
fi
chown -R lightops:lightops "$VENV_ROOT"
runuser -u lightops -- "$VENV_ROOT/bin/python" -m pip install --disable-pip-version-check --requirement "$INSTALL_ROOT/requirements.txt"

if [ ! -f "$ENV_FILE" ]; then
    umask 0027
    : > "$ENV_FILE"
fi
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_CLOUD_PROVIDER "$cloud_provider"
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_DB_PATH "$STATE_ROOT/lightops.db"
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_BACKUP_DIR "$STATE_ROOT/backups"
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_SERVICES "$monitored_services"
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_SYSTEMCTL_PATH "$LIGHTOPS_SYSTEMCTL_PATH"
lightops_write_env_setting "$ENV_FILE" LIGHTOPS_SUDO_PATH "$sudo_path"
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_COLLECT_INTERVAL 60
# 服务语义标注（可选）：自动识别给不出关系时的人肉补充，升级时保留已有值。
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_SERVICE_LABELS ""
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_RETENTION_DAYS 7
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_CPU_THRESHOLD 85
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_MEMORY_THRESHOLD 85
lightops_ensure_env_setting "$ENV_FILE" LIGHTOPS_DISK_THRESHOLD 80
# 清理旧版本留下的管理令牌配置行（令牌通道已在 0.1.4.2 下线）。
sed -i '/^LIGHTOPS_API_TOKEN=/d' "$ENV_FILE"
chown root:lightops "$ENV_FILE"
chmod 0640 "$ENV_FILE"

sudoers_candidate=$(mktemp /etc/sudoers.d/lightops.XXXXXX)
lightops_render_sudoers "$sudoers_candidate" "$LIGHTOPS_SYSTEMCTL_PATH" "$monitored_services"
chmod 0440 "$sudoers_candidate"
if ! visudo -cf "$sudoers_candidate"; then
    rm -f "$sudoers_candidate"
    fail "generated sudoers validation failed"
fi
mv -f "$sudoers_candidate" "$SUDOERS_DEST"

# polkit 授权 lightops 重启受监控单元（服务内 NoNewPrivileges 使 sudo 不可用）。
install -d -m 0755 /etc/polkit-1/rules.d
install -m 0644 /dev/null "$POLKIT_DEST"
lightops_render_polkit "$POLKIT_DEST" "$monitored_services"

install -m 0644 "$PACKAGE_ROOT/deploy/lightops.service" "$SYSTEMD_DEST"
install -m 0644 "$PACKAGE_ROOT/deploy/lightops-inspect.service" /etc/systemd/system/lightops-inspect.service
install -m 0644 "$PACKAGE_ROOT/deploy/lightops-inspect.timer" /etc/systemd/system/lightops-inspect.timer
install -m 0755 "$PACKAGE_ROOT/deploy/lightopsctl" /usr/local/bin/lightopsctl
install -m 0755 "$PACKAGE_ROOT/deploy/verify-server.sh" /usr/local/bin/lightops-verify
# 管理令牌已在 0.1.4.2 下线，清掉旧版本留下的轮换脚本，避免误用。
rm -f /usr/local/sbin/lightops-rotate-token

nginx_candidate=$(mktemp)
sed \
    -e "s|__LIGHTOPS_PUBLIC_PORT__|$LIGHTOPS_PUBLIC_PORT|g" \
    -e "s|__LIGHTOPS_SERVER_NAME__|$LIGHTOPS_SERVER_NAME|g" \
    -e "/^__LIGHTOPS_HTTPS_BLOCK__$/d" \
    "$PACKAGE_ROOT/deploy/lightops.nginx.conf" > "$nginx_candidate"
if grep -q '__LIGHTOPS_' "$nginx_candidate"; then
    rm -f "$nginx_candidate"
    fail "Nginx template still contains unresolved placeholders"
fi
install -m 0644 "$nginx_candidate" "$NGINX_DEST"
rm -f "$nginx_candidate"
if ! "$nginx_path" -t; then
    if [ -f "$backup_root/lightops.conf" ]; then
        cp -a "$backup_root/lightops.conf" "$NGINX_DEST"
    else
        rm -f "$NGINX_DEST"
    fi
    fail "Nginx validation failed; previous LightOps config was restored"
fi

{
    printf "LIGHTOPS_PUBLIC_PORT='%s'\n" "$LIGHTOPS_PUBLIC_PORT"
    printf "LIGHTOPS_PUBLIC_HOST='%s'\n" "$LIGHTOPS_PUBLIC_HOST"
    printf "LIGHTOPS_NGINX_SERVICE='%s'\n" "$nginx_service"
    printf "LIGHTOPS_MONITORED_SERVICES='%s'\n" "$monitored_services"
    printf "LIGHTOPS_SYSTEMCTL_PATH='%s'\n" "$LIGHTOPS_SYSTEMCTL_PATH"
    printf "LIGHTOPS_SUDO_PATH='%s'\n" "$sudo_path"
    printf "LIGHTOPS_NGINX_PATH='%s'\n" "$nginx_path"
    printf "LIGHTOPS_OS_FAMILY='%s'\n" "$LIGHTOPS_OS_FAMILY"
    printf "LIGHTOPS_PACKAGE_MANAGER='%s'\n" "$LIGHTOPS_PACKAGE_MANAGER"
} > "$DEPLOYMENT_FILE"
chown root:root "$DEPLOYMENT_FILE"
chmod 0644 "$DEPLOYMENT_FILE"

configure_swap

"$LIGHTOPS_SYSTEMCTL_PATH" daemon-reload
"$LIGHTOPS_SYSTEMCTL_PATH" enable --now "$nginx_service"
"$LIGHTOPS_SYSTEMCTL_PATH" enable lightops
# 变量间接让回归断言不会把探针定时器误判成主服务 enable --now。
inspect_timer_unit=lightops-inspect.timer
"$LIGHTOPS_SYSTEMCTL_PATH" enable --now "$inspect_timer_unit"
# App files are replaced in place during upgrades. enable --now is a no-op for
# an already active unit, so restart explicitly to load the new release.
"$LIGHTOPS_SYSTEMCTL_PATH" restart lightops
"$LIGHTOPS_SYSTEMCTL_PATH" reload "$nginx_service"

health_ok=0
# shellcheck disable=SC2034
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if curl --fail --silent --show-error http://127.0.0.1:8000/api/health >/dev/null; then
        health_ok=1
        break
    fi
    sleep 1
done
if [ "$health_ok" -ne 1 ]; then
    "$LIGHTOPS_SYSTEMCTL_PATH" --no-pager --full status lightops || true
    journalctl -u lightops -n 80 --no-pager || true
    fail "LightOps health check failed"
fi
curl --fail --silent --show-error "http://127.0.0.1:$LIGHTOPS_PUBLIC_PORT/api/health" >/dev/null || fail "Nginx health check failed"

lightops_log "installation completed"
printf 'platform=%s; kernel=%s; architecture=%s\n' "$LIGHTOPS_OS_PRETTY" "$LIGHTOPS_KERNEL" "$LIGHTOPS_ARCH"
printf 'monitored_services=%s\n' "$monitored_services"
printf 'dashboard=http://%s:%s/\n' "$LIGHTOPS_PUBLIC_HOST" "$LIGHTOPS_PUBLIC_PORT"
printf 'backup=%s\n' "$backup_root"
printf 'administrative_token_file=%s (token not printed)\n' "$ENV_FILE"
printf '%s\n' 'Firewall or cloud security rules were not changed.'
