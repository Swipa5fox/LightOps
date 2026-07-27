# LightOps 优化改动说明

> 本文档记录本次对 LightOps 监控服务的健壮性 / 性能优化改动，包含改动明细、收益、服务器部署步骤与回滚方式。
> 对应提交：已推送到 `Swipa5fox/LightOps`（main 分支）。

---

## 一、改动概览

| # | 文件 | 改动 | 优先级 | 收益 |
|---|------|------|--------|------|
| 1 | `app/settings.py` | 新增 `_env_int` 辅助函数，整型配置改用其解析 | 高 | env 填错不再导致启动崩溃，报错更友好 |
| 2 | `app/main.py` | 操作系统名在导入时缓存为 `OS_NAME`，`/api/summary` 复用 | 中 | 每个请求不再读取 `/etc/os-release` |
| 3 | `app/db.py` | `PRAGMA journal_mode=WAL` 移至 `init_db` 仅设置一次 | 中 | 去掉每次连接的冗余 PRAGMA 调用 |

---

## 二、改动明细

### 1. `settings.py` —— 整型配置增加异常保护（高优先级）

**问题**：`collect_interval_seconds`、`retention_days`、`alert_cooldown_minutes` 三个整型配置使用裸 `int(os.getenv(...))`。一旦环境变量被配置成非整数（如 `LIGHTOPS_COLLECT_INTERVAL=abc`），模块在 import 阶段就会抛出 `ValueError`，导致服务起不来，且报错信息不直观。而同文件的 `_env_float` 已经做了保护，两者行为不一致。

**改动**：新增与 `_env_float` 风格一致的 `_env_int`：

```python
def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc
```

并将三处配置改为：

```python
collect_interval_seconds: int = _env_int("LIGHTOPS_COLLECT_INTERVAL", 60)
retention_days: int = _env_int("LIGHTOPS_RETENTION_DAYS", 7)
alert_cooldown_minutes: int = _env_int("LIGHTOPS_ALERT_COOLDOWN_MINUTES", 15)
```

**收益**：配置错误时启动即给出清晰错误（如 `LIGHTOPS_COLLECT_INTERVAL must be an integer`），而非原始 traceback，便于在服务器上快速定位。

---

### 2. `main.py` —— 缓存操作系统名称（中优先级）

**问题**：`operating_system_name()` 每次处理 `/api/summary` 请求都会打开并读取 `/etc/os-release` 文件。操作系统名称在进程生命周期内不会变化，逐请求读文件属于无谓 I/O。

**改动**：在模块导入时计算一次并缓存为常量：

```python
OS_NAME = operating_system_name()
```

`/api/summary` 中 `"os_name": operating_system_name()` 改为 `"os_name": OS_NAME`。

**收益**：消除每请求一次的文件读取；功能与之前完全一致。

---

### 3. `db.py` —— WAL 模式只设置一次（中优先级）

**问题**：`connect()` 每次建立连接都执行 `PRAGMA journal_mode=WAL`。WAL 模式是持久化在数据库文件头中的，设置一次后所有后续连接自动继承，逐连接重复设置属于冗余调用。

**改动**：从 `connect()` 中移除该 PRAGMA，仅在 `init_db()` 执行一次：

```python
def init_db() -> None:
    with connect() as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript(SCHEMA)
```

注意：`PRAGMA foreign_keys=ON` 与 `PRAGMA busy_timeout=15000` 是**每连接**设置、不会持久化，因此仍保留在 `connect()` 中。本仓库 schema 未定义外键约束，功能不受影响。

**收益**：减少连接建立时的冗余语句；`init_db` 仍保证数据库以 WAL 模式运行。

---

## 三、未改动项（已评估，暂不动）

- **读接口鉴权**：`/api/summary`、`/api/metrics`、`/api/services`、`/api/alerts` 经 nginx 无 `auth_basic`，主机信息对能连上服务的人可见。若服务器仅在 VPN/防火墙内则风险可接受；若端口对公网开放，建议在 `deploy/lightops.nginx.conf` 的 `location /api/` 增加 `auth_basic`。本次未自动改，需你确认部署拓扑后再决定。
- **`metric_history` 降采样**：当前 7 天 ×60s ≈ 1 万行规模下完全够用，未来 retention 调大再考虑 SQL 层时间分桶。
- **CI / 依赖 hash 锁定**：建议在仓库接入 GitHub Actions（pytest + shellcheck + pip-audit），属工程化增强，非本次范围。

---

## 四、服务器部署更新步骤

> 假设服务器通过 git 拉取 `Swipa5fox/LightOps` 并以后台 systemd 服务运行（与 `deploy/lightops.service` 一致）。

### 方式 A：服务器上直接拉取并重启（推荐）

```bash
# 进入部署目录（按实际路径调整，默认 /opt/lightops）
cd /opt/lightops

# 拉取最新代码
git pull --ff-only origin main

# 若依赖有变化则更新（本次未改依赖，可跳过）
# source .venv/bin/activate && pip install -r requirements.txt

# 重启服务（uvicorn workers 必须保持 1，见下方注意事项）
sudo systemctl restart lightops

# 确认状态
sudo systemctl status lightops --no-pager
```

### 方式 B：若使用部署脚本 `lightopsctl`

```bash
sudo lightopsctl update      # 如脚本支持自更新；否则退回到方式 A
sudo systemctl restart lightops
```

### 验证

```bash
# 健康检查（degraded 时返回 503）
curl -fsS http://127.0.0.1:8000/api/health

# 查看配置解析是否正常（错误配置现在会给出明确报错）
sudo journalctl -u lightops -n 50 --no-pager
```

---

## 五、注意事项

- **uvicorn `--workers` 必须保持为 1**。`deploy/lightops.service` 中 `ExecStart` 已是 `--workers 1`，请勿提高。APScheduler 调度器运行在进程内，多 worker 会导致采集与维护任务重复执行、重复写库。
- 配置错误现在会**直接阻止启动**并给出可读报错，这是预期行为（更早暴露问题），不是回归。

---

## 六、回滚

```bash
cd /opt/lightops
git pull --ff-only origin main          # 先回到本提交之后的状态（若已推）
git revert <本次提交哈希>                # 或直接 revert 本次提交
sudo systemctl restart lightops
```

或临时回退单文件：

```bash
git checkout <上一个提交> -- app/settings.py app/main.py app/db.py
sudo systemctl restart lightops
```
