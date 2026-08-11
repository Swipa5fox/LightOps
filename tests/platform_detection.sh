#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=deploy/lib/platform.sh
. "$PROJECT_ROOT/deploy/lib/platform.sh"

fixture_root=$(mktemp -d)
trap 'rm -rf "$fixture_root" 2>/dev/null || true' EXIT

assert_equal() {
    expected=$1
    actual=$2
    label=$3
    if [ "$expected" != "$actual" ]; then
        printf 'FAIL %s expected=%s actual=%s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
}

run_supported_case() {
    case_name=$1
    os_id=$2
    os_like=$3
    expected_family=$4
    package_manager=$5
    architecture=$6

    case_dir=$fixture_root/$case_name
    mkdir -p "$case_dir/dmi"
    {
        printf 'ID=%s\n' "$os_id"
        printf 'ID_LIKE="%s"\n' "$os_like"
        printf 'VERSION_ID="test"\n'
        printf 'PRETTY_NAME="%s fixture"\n' "$case_name"
    } > "$case_dir/os-release"

    LIGHTOPS_TEST_MODE=1
    LIGHTOPS_OS_RELEASE_FILE=$case_dir/os-release
    LIGHTOPS_INIT_OVERRIDE=systemd
    LIGHTOPS_CONTAINER_OVERRIDE=no
    LIGHTOPS_ARCH_OVERRIDE=$architecture
    LIGHTOPS_KERNEL_OVERRIDE=6.8.0-fixture
    LIGHTOPS_PACKAGE_MANAGER_OVERRIDE=$package_manager
    LIGHTOPS_SYSTEMCTL_PATH_OVERRIDE=/usr/bin/systemctl
    export LIGHTOPS_TEST_MODE LIGHTOPS_OS_RELEASE_FILE LIGHTOPS_INIT_OVERRIDE
    export LIGHTOPS_CONTAINER_OVERRIDE LIGHTOPS_ARCH_OVERRIDE LIGHTOPS_KERNEL_OVERRIDE
    export LIGHTOPS_PACKAGE_MANAGER_OVERRIDE LIGHTOPS_SYSTEMCTL_PATH_OVERRIDE

    lightops_detect_platform
    assert_equal "$expected_family" "$LIGHTOPS_OS_FAMILY" "$case_name family"
    assert_equal "$package_manager" "$LIGHTOPS_PACKAGE_MANAGER" "$case_name package manager"
    case "$architecture" in
        amd64) expected_arch=x86_64 ;;
        arm64) expected_arch=aarch64 ;;
        *) expected_arch=$architecture ;;
    esac
    assert_equal "$expected_arch" "$LIGHTOPS_ARCH" "$case_name architecture"
}

run_supported_case ubuntu-22 ubuntu debian debian apt-get amd64
run_supported_case debian-12 debian '' debian apt-get arm64
run_supported_case rocky-9 rocky 'rhel centos fedora' rhel dnf x86_64
run_supported_case amazon-2023 amzn fedora rhel dnf aarch64
run_supported_case oracle-9 ol fedora rhel yum x86_64

alpine_dir=$fixture_root/alpine
mkdir -p "$alpine_dir"
printf 'ID=alpine\nPRETTY_NAME="Alpine fixture"\n' > "$alpine_dir/os-release"
LIGHTOPS_OS_RELEASE_FILE=$alpine_dir/os-release
LIGHTOPS_PACKAGE_MANAGER_OVERRIDE=apk
LIGHTOPS_ARCH_OVERRIDE=x86_64
export LIGHTOPS_OS_RELEASE_FILE LIGHTOPS_PACKAGE_MANAGER_OVERRIDE LIGHTOPS_ARCH_OVERRIDE
if lightops_detect_platform >/dev/null 2>&1; then
    echo "FAIL Alpine must be rejected" >&2
    exit 1
fi

unsupported_arch_dir=$fixture_root/unsupported-arch
mkdir -p "$unsupported_arch_dir"
printf 'ID=ubuntu\nID_LIKE=debian\n' > "$unsupported_arch_dir/os-release"
LIGHTOPS_OS_RELEASE_FILE=$unsupported_arch_dir/os-release
LIGHTOPS_PACKAGE_MANAGER_OVERRIDE=apt-get
LIGHTOPS_ARCH_OVERRIDE=riscv64
export LIGHTOPS_OS_RELEASE_FILE LIGHTOPS_PACKAGE_MANAGER_OVERRIDE LIGHTOPS_ARCH_OVERRIDE
if lightops_detect_platform >/dev/null 2>&1; then
    echo "FAIL unsupported architecture must be rejected" >&2
    exit 1
fi

cloud_dir=$fixture_root/cloud
mkdir -p "$cloud_dir"
printf '%s\n' 'Amazon EC2' > "$cloud_dir/sys_vendor"
LIGHTOPS_DMI_ROOT=$cloud_dir
LIGHTOPS_CLOUD_PROVIDER=auto
export LIGHTOPS_DMI_ROOT LIGHTOPS_CLOUD_PROVIDER
assert_equal 'Amazon Web Services' "$(lightops_detect_cloud_provider)" 'cloud provider'

echo "LightOps platform detection fixtures passed"
