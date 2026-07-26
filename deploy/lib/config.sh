#!/usr/bin/env bash

lightops_write_env_setting() {
    target_file=$1
    setting_name=$2
    setting_value=$3
    target_dir=$(dirname -- "$target_file")
    temporary_file=$(mktemp "$target_dir/.lightops-env.XXXXXX")
    awk -v key="$setting_name" -v value="$setting_value" '
        BEGIN { written = 0 }
        index($0, key "=") == 1 {
            print key "='\''" value "'\''"
            written = 1
            next
        }
        { print }
        END {
            if (!written) {
                print key "='\''" value "'\''"
            }
        }
    ' "$target_file" > "$temporary_file"
    mv -f "$temporary_file" "$target_file"
}

lightops_ensure_env_setting() {
    target_file=$1
    setting_name=$2
    setting_value=$3
    if ! grep -q "^$setting_name=" "$target_file"; then
        lightops_write_env_setting "$target_file" "$setting_name" "$setting_value"
    fi
}

lightops_render_sudoers() {
    target_file=$1
    systemctl_path=$2
    service_csv=$3
    {
        printf 'Cmnd_Alias LIGHTOPS_RESTART = '
        first_service=1
        old_ifs=$IFS
        IFS=,
        for allowed_service in $service_csv; do
            if [ "$first_service" -eq 0 ]; then
                printf ', '
            fi
            printf '%s restart %s' "$systemctl_path" "$allowed_service"
            first_service=0
        done
        IFS=$old_ifs
        printf '\nlightops ALL=(root) NOPASSWD: LIGHTOPS_RESTART\n'
    } > "$target_file"
}
