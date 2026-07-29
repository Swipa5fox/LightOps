# 更新日志

本项目所有重要变更均记录于此文件。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-07-30

本次发布聚焦「首页天气体验」「生产安全与性能」「部署可观测性」三条主线，并补齐 CI 与运维脚本。

### 新增

- **首页天气模块**：在 hero 区中部新增天气卡片，支持城市名查询（Open-Meteo 免密钥代理，无需 API Key）。
  - QWeather Icons 图标（48px）按天气种类染色，白天/夜间自动切换变体。
  - 暖心天气提示语（晴/多云/阴/雨/雪/雷暴/雾等 27 种 WMO 码）。
  - 区级细化：内置北/沪/穗/深/蓉/杭/汉/西安/南京/渝 10 城主城区，候选 >1 时展示区级标签一键切换。
  - 新增后端 `app/weather.py`（`/api/weather?place=城市`，30 分钟内存缓存、8 秒超时）。
  - 新增配置项 `LIGHTOPS_WEATHER_CACHE_SECONDS`、`LIGHTOPS_WEATHER_REQUEST_TIMEOUT_SECONDS`（含取值校验）。
- **自定义 404/500 错误页**：`app/static/404.html`、`500.html`、`error.css`，深色玻璃卡片风格，复用仪表盘主题色；Nginx `error_page` + `internal` 保护，直接访问错误页本身返回 404，防滥用与被索引。
- **GitHub Actions CI**：`.github/workflows/ci.yml`，push / PR 自动执行 Python 编译 + 冒烟/API/前端安全测试、前端渲染构建 + CSP 底线（禁止 `eval`/`new Function`）、shellcheck 全量部署脚本、夹具测试、发布包构建 + SHA-256 输出。
- **内存优化脚本**：`deploy/mem-diag.sh`（只读诊断各进程 RSS / MySQL·Redis 配置 / Swap / 内核缓存）、`deploy/optimize-mem.sh`（journal 限容 + 停 Docker + MySQL drop-in 调优，可回滚）。

### 变更

- **Nginx 性能**：开启 gzip 静态压缩，`app.js` / `style.css` 传输体积下降约 75%。
- **Nginx 安全**：`server_tokens off` 隐藏 Nginx 版本号，减少信息泄露面。
- **Nginx 路由**：`try_files $uri $uri/ =404` 取代 SPA fallback，未知路径返回真实 404 以触发自定义错误页（此前未知路径被吞成 200 空体）。
- **趋势图图例**：汇总栏「CPU / 内存 / 磁盘」由纯文字改为带颜色小圆点的图例（CPU 青、内存 紫、磁盘 琥珀），与图表线色、悬停 tooltip 配色一致。
- **HTTPS 回退**：移除自签证书相关代码（`install.sh` 的 `ensure_self_signed_certificate`/`build_https_block`、`lightops.nginx.conf` 的 HTTPS 块占位、`build-release.py` 的 `.nginx.https.conf` 归一化），仅保留 HTTP 8080。
- **collector 子进程编码**：`_systemctl` / `restart_service` 显式 `encoding="utf-8", errors="replace"`，兼容 Windows 测试环境下中文输出的解码。
- **build-release.py**：CRLF→LF 归一化扩展到 `deploy/*.conf`、`*.service`、`*.sudoers`、`*.nginx.conf`，防 Windows 编辑导致远端 `sed` 替换失败。
- **generate-render.mjs**：修正 CRLF 模板边界兼容，`index.html` 改动后能稳定重生成 `render.js`。

### 文档

- 新增本 `CHANGELOG.md`。
- `README.md` 同步天气模块与采集说明。

---

## [0.1.1] - 2026-07

首个公开迭代版本，奠定监控核心能力。

### 新增

- 服务存储桶自动识别：从 systemd unit 文件自动探测 s3 / cos / oss / gs 桶并在服务名后展示。
- 顶部「最后更新时间」显示为本地化日期 + 时间（YYYY年MM月DD日 HH:mm:ss）。

### 修复

- `collector` 的 `load_15` 取错数组索引（误取 `[1]`）。
- `clampPercent` 缺少 value 参数导致首屏白屏。
- `fetchJson` 丢失 `requestOptions`，且更新时间标签缺失时间部分。
- `service_samples` 未持久化返回服务桶信息。

---

## 版本号约定

- **主版本.次版本.修订号**：不兼容改动 / 新功能（默认向上兼容）/ 兼容性修复。
- 生产服务器 systemd `MemoryMax=400M`，Uvicorn 单 worker 仅监听 `127.0.0.1:8000`，Nginx 对外 `8080`。
- 升级前在临时目录完成全套测试 + 自动备份，远端 `upgrade=PASS` 才算成功；失败自动回滚。
