#!/usr/bin/env bash
# LightOps 服务器内存诊断脚本
# 用途：在生产服务器上一键排查各服务内存占用 + MySQL/Redis 业务概况，为降内存提供依据。
# 用法：bash mem-diag.sh
#   如 MySQL/Redis 需要凭据：
#     MYSQL_CONN="-u root -p你的密码" REDIS_CONN="-a 你的密码" bash mem-diag.sh
# 安全：只读查询，不修改任何配置或数据。
# 注意：密码会出现在 shell history 中，跑完建议执行 history -c。
set -u

MYSQL_CONN="${MYSQL_CONN:-}"
REDIS_CONN="${REDIS_CONN:-}"

run_mysql() { mysql $MYSQL_CONN "$@" 2>/dev/null; }
run_redis() { redis-cli $REDIS_CONN "$@" 2>/dev/null; }

echo "================ 系统内存总览 ================"
free -h
echo

echo "================ 内存占用 TOP 15 进程 (按 RSS) ================"
printf "%-8s %10s %10s %6s  %s\n" "PID" "RSS(KB)" "VSZ(KB)" "%MEM" "COMMAND"
ps -eo pid,rss,vsz,pmem,comm --sort=-rss | head -16
echo

echo "================ 关键服务内存 ================"
for svc in lightops nginx mysqld redis; do
    pid=$(systemctl show -p MainPID "$svc" 2>/dev/null | cut -d= -f2)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        rss=$(ps -o rss= -p "$pid" 2>/dev/null | tr -d ' ')
        rss_mb=$((rss / 1024))
        echo "  $svc (pid=$pid): RSS=${rss}KB (~${rss_mb}MB)"
    else
        echo "  $svc: 未运行或非 systemd 管理"
    fi
done
echo

echo "================ LightOps systemd 内存 ================"
systemctl show lightops -p MemoryCurrent -p MemoryMax -p MemoryHigh 2>/dev/null
echo

echo "================ MySQL 关键配置 ================"
run_mysql -N -e "
    SHOW VARIABLES WHERE Variable_name IN (
        'innodb_buffer_pool_size',
        'performance_schema',
        'max_connections',
        'table_open_cache',
        'table_definition_cache',
        'key_buffer_size',
        'tmp_table_size',
        'max_heap_table_size',
        'thread_cache_size'
    );" && echo "(如上)" || echo "(需要 MYSQL_CONN 凭据，跳过)"
echo

echo "================ MySQL 实际内存 ================"
mysqld_pid=$(systemctl show -p MainPID mysqld 2>/dev/null | cut -d= -f2)
if [ -n "$mysqld_pid" ] && [ "$mysqld_pid" != "0" ]; then
    rss=$(ps -o rss= -p "$mysqld_pid" 2>/dev/null | tr -d ' ')
    echo "  mysqld RSS: $((rss / 1024))MB"
    if command -v smem >/dev/null 2>&1; then
        smem -k -P mysqld 2>/dev/null | tail -2
    fi
fi
echo

echo "================ MySQL 业务概况 (判断能否调优) ================"
echo "--- 数据库列表 ---"
run_mysql -t -e "SHOW DATABASES;" && echo "(如上)" || echo "(需要 MYSQL_CONN 凭据，跳过)"
echo "--- 各库数据量(粗估, 排除系统库) ---"
run_mysql -N -e "
    SELECT table_schema AS db,
           COUNT(*) AS tables,
           ROUND(SUM(data_length+index_length)/1024/1024,1) AS size_mb
    FROM information_schema.tables
    WHERE table_schema NOT IN ('information_schema','performance_schema','mysql','sys')
    GROUP BY table_schema;" || echo "(需要 MYSQL_CONN 凭据，跳过)"
echo "--- 当前连接数 ---"
run_mysql -N -e "SHOW STATUS LIKE 'Threads_connected';" || echo "(需要 MYSQL_CONN 凭据，跳过)"
echo

echo "================ Redis 内存 ================"
run_redis INFO memory | grep -E "used_memory_human|used_memory_peak_human|used_memory_rss_human|maxmemory_human|maxmemory_policy" || echo "(需要 REDIS_CONN 凭据，跳过)"
echo

echo "================ Redis 业务概况 (判断能否调优) ================"
echo "--- key 总数 ---"
run_redis DBSIZE || echo "(需要 REDIS_CONN 凭据，跳过)"
echo "--- 各 db 的 key 数和过期情况 ---"
run_redis INFO keyspace || echo "(需要 REDIS_CONN 凭据，跳过)"
echo "--- 当前 maxmemory 配置 ---"
run_redis CONFIG GET maxmemory || echo "(需要 REDIS_CONN 凭据，跳过)"
run_redis CONFIG GET maxmemory-policy || echo "(需要 REDIS_CONN 凭据，跳过)"
echo

echo "================ Swap ================"
swapon --show 2>/dev/null || echo "  (无 Swap)"
echo

echo "================ 内核缓存 (可回收) ================"
grep -E "MemAvailable|Cached|Buffers|SReclaimable" /proc/meminfo
echo

echo "================================================================"
echo "诊断完成。请把以上完整输出贴回来，我来判断 MySQL/Redis 能否调优并给出精确的降内存命令。"
echo "若部分显示'需要凭据'，可用：MYSQL_CONN=\"-u root -p密码\" REDIS_CONN=\"-a 密码\" bash mem-diag.sh 重跑。"
echo "跑完记得 history -c 清理密码痕迹。"
