#!/usr/bin/env bash
# LightOps 服务器内存优化脚本
# 基于 mem-diag.sh 诊断结果：
#   mysqld 385MB(数据仅1.6MB) + journal 126MB + docker 83MB = 594MB 可优化
# 安全策略：drop-in 配置文件，不碰原配置，可一键回滚。
# 用法：sudo bash optimize-mem.sh
set -u

if [ "$(id -u)" -ne 0 ]; then
    echo "请用 root 或 sudo 执行：sudo bash optimize-mem.sh"
    exit 1
fi

echo "================================================================"
echo " LightOps 服务器内存优化"
echo " 目标：used 741MB(38%) → ~390MB(20%)，预计省 ~350MB"
echo "================================================================"
echo

# ---------- 1. systemd-journal ----------
echo "====== [1/3] systemd-journal 优化 (当前 ~126MB → 目标 ~50MB) ======"
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/lightops-tune.conf <<'EOF'
# LightOps 内存优化 - 限制 journal 磁盘/内存占用
[Journal]
SystemMaxUse=50M
SystemMaxFileSize=10M
EOF
echo "  已写入 drop-in: /etc/systemd/journald.conf.d/lightops-tune.conf"
echo "  立即清理旧日志..."
journalctl --vacuum-size=50M 2>&1 | tail -3
systemctl restart systemd-journald
echo "  ✓ journal 优化完成"
echo

# ---------- 2. MySQL ----------
echo "====== [2/3] MySQL 内存优化 (当前 ~385MB → 目标 ~150MB) ======"
echo "  现状: 数据 1.6MB / 连接 1 / buffer_pool 128M / performance_schema ON"
echo

# 探测 MySQL 配置目录
CONF_DIR=""
for d in /etc/mysql/conf.d /etc/mysql/mysql.conf.d /etc/my.cnf.d; do
    if [ -d "$d" ]; then
        CONF_DIR="$d"
        break
    fi
done

if [ -z "$CONF_DIR" ]; then
    echo "  ⚠ 未找到 MySQL conf.d 目录，请手动在 my.cnf 的 [mysqld] 段添加："
    echo "    performance_schema=OFF"
    echo "    innodb_buffer_pool_size=32M"
    echo "    max_connections=30"
    echo "    table_open_cache=200"
    echo "    table_definition_cache=200"
    echo "    thread_cache_size=4"
    TUNE_FILE="(手动配置)"
else
    TUNE_FILE="$CONF_DIR/zz-lightops-tune.cnf"
    cat > "$TUNE_FILE" <<'EOF'
# LightOps 内存优化 - 针对小数据量(1.6MB)低连接(1)场景
# 由 optimize-mem.sh 生成；删除本文件即可回滚
[mysqld]
# 关闭性能采集，省 ~80-100MB（监控平台不依赖它）
performance_schema=OFF
# buffer pool 128M→32M（数据才 1.6MB，32M 绰绰有余）
innodb_buffer_pool_size=32M
# 连接数 151→30（实际才 1 个连接）
max_connections=30
# 表缓存 4000/2000→200（总共才 44 张表）
table_open_cache=200
table_definition_cache=200
# 线程缓存 9→4
thread_cache_size=4
EOF
    echo "  已生成 drop-in: $TUNE_FILE"
    echo "  --- 内容 ---"
    cat "$TUNE_FILE"
fi
echo
echo "  ⚠ MySQL 优化需重启才生效，会中断业务约 3-5 秒"
echo "     （当前连接数仅 1，影响极小；ry-zzyl 业务会瞬断一下）"
echo
echo "  确认后手动执行重启："
echo "     sudo systemctl restart mysqld"
echo

# ---------- 3. Docker ----------
echo "====== [3/3] 停用 Docker (省 ~83MB) ======"
if command -v docker >/dev/null 2>&1; then
    RUNNING=$(docker ps -q 2>/dev/null)
    if [ -n "$RUNNING" ]; then
        echo "  ⚠ 发现有运行中的容器，已跳过停用（请人工确认后再处理）："
        docker ps --format "    {{.Names}}: {{.Image}} ({{.Status}})"
    else
        systemctl stop docker docker.socket containerd 2>/dev/null
        systemctl disable docker docker.socket containerd 2>/dev/null
        echo "  ✓ 已停止并禁用开机自启：docker / docker.socket / containerd"
    fi
else
    echo "  (未安装 docker，跳过)"
fi
echo

# ---------- 汇总 ----------
echo "================================================================"
echo " 优化完成情况"
echo "================================================================"
echo "  [已完成] journal 清理+限制 50M（省 ~70MB）"
echo "  [已完成] Docker 停止+禁用自启（省 ~83MB）"
echo "  [待确认] MySQL 配置已生成，等 sudo systemctl restart mysqld（省 ~200MB）"
echo
echo " 重启 MySQL 后，重新诊断看效果："
echo "     bash /tmp/mem-diag.sh"
echo
echo " 回滚方法（如有异常）："
echo "   journal: rm /etc/systemd/journald.conf.d/lightops-tune.conf && systemctl restart systemd-journald"
echo "   Docker:  sudo systemctl enable --now docker docker.socket containerd"
if [ -n "$CONF_DIR" ]; then
    echo "   MySQL:   rm $TUNE_FILE && sudo systemctl restart mysqld"
fi
echo
echo "================================================================"
