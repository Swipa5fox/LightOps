# LightOps

LightOps 是面向小型 Linux 云服务器的轻量监控与受限运维面板。后端使用 FastAPI、psutil、APScheduler 和 SQLite，前端使用 Vue 3 与原生 SVG，部署后由 systemd 管理应用、由 Nginx 提供网页入口。当前开发版本为 **0.1.2**。

## 0.1.2 重点

- 新增城市天气查询、区级候选、QWeather Icons 天气图标与暖心提示语；
- 增加自定义 404/500 错误页、Nginx gzip 压缩与版本信息隐藏；
- 补齐 GitHub Actions CI、内存诊断/优化脚本及发布包校验流程；
- 保留 0.1.0/0.1.1 已验证的跨发行版预检、动态服务白名单、运维 CLI、10 分钟趋势和曲线悬停；
- 管理令牌从永久 localStorage 自动迁移到当前标签页的 sessionStorage，401 后立即清除；
- 所有前端 API 请求增加 10 秒超时，并修复切换趋势范围时旧请求覆盖新范围的竞态；
- 增加进度条语义、状态播报、键盘焦点和减少动画偏好支持；
- 收紧 CSP，增加 Permissions-Policy，并避免入口文件在升级后继续使用旧缓存；
- 移除未被页面引用的 ECharts，发布包只保留 Vue 运行时和原生 SVG 曲线；
- 同一秒内多次手动备份使用不同文件名，定期清理已解决的过期告警。
- 健康接口同时检查数据库、调度器和最近采样时间，采集停滞时返回 HTTP 503。

## 自动适配范围

部署脚本不会只根据内核版本猜测系统。它会组合读取 /etc/os-release、PID 1、包管理器、CPU 架构、命令实际路径和 systemd unit，再自动选择部署方案。

已支持：

- Ubuntu / Debian：apt-get
- RHEL / Rocky / AlmaLinux / CentOS Stream / Oracle Linux：dnf 或 yum
- Amazon Linux：dnf 或 yum
- x86_64 与 aarch64/arm64
- 上述系统的物理机或云主机，且 PID 1 必须是 systemd

会安全停止而不是猜测部署：

- Alpine / OpenRC
- 非 systemd 主机
- Docker、Podman 等不能管理宿主机 systemd 服务的容器
- 不支持的发行版或 CPU 架构
- Python 低于 3.9 且系统仓库无法提供合适版本

LightOps 需要监控和受限重启宿主机服务，因此不会静默切换到 Docker。

## 从 0 到 1 部署

先解压源码，进入包含本 README 的目录，以普通用户执行只读预检：

~~~bash
bash deploy/preflight.sh
~~~

只有输出 preflight=PASS 才继续。默认配置可直接使用；需要改端口、域名显示或服务选择时：

~~~bash
cp config.env.example config.env
vi config.env
~~~

然后以 root 执行：

~~~bash
bash deploy/install.sh
~~~

安装器将自动：

1. 识别系统、架构、systemd、包管理器和云厂商；
2. 安装 Python、Nginx、curl、sudo 等运行依赖；
3. 只识别已安装的 MySQL/MariaDB 和 Redis，不为监控而安装它们；
4. 创建 lightops 系统用户、虚拟环境、随机管理令牌和 SQLite 数据目录；
5. 根据实际 systemctl 路径与服务名生成最小 sudoers 白名单；
6. 渲染可配置端口的 Nginx 文件，验证后启动服务；
7. 执行内部与 Nginx 健康检查；
8. 输出非敏感部署摘要和备份目录。

安装器不会修改 MySQL/Redis 配置或认证，不会自动修改云安全组/防火墙，也不会默认创建 Swap。Vue 运行时和预编译模板均随发布包提供，安装期间不会从 CDN 下载前端资源。

## 可配置项

config.env.example 中包含全部首次部署选项。常用项：

- LIGHTOPS_PUBLIC_PORT=8080
- LIGHTOPS_SERVER_NAME=_
- LIGHTOPS_PUBLIC_HOST=SERVER_IP
- LIGHTOPS_CLOUD_PROVIDER=auto
- LIGHTOPS_*_SERVICE=auto
- LIGHTOPS_ENABLE_SWAP=0

auto 服务检测候选：

- Nginx：nginx
- MySQL/MariaDB：mysqld、mysql、mariadb
- Redis：redis、redis-server

可选服务未安装时会被忽略。若手工指定了不存在的服务名，安装会失败并说明原因。

## 运行结构

| 资源 | 位置或限制 |
|---|---|
| 应用 | /opt/lightops |
| Python 虚拟环境 | /opt/lightops/.venv |
| SQLite 数据 | /var/lib/lightops/lightops.db |
| 自动备份 | /var/lib/lightops/backups |
| 含管理令牌的配置 | /etc/lightops/lightops.env，0640 root:lightops |
| 非敏感部署信息 | /etc/lightops/deployment.env |
| systemd unit | /etc/systemd/system/lightops.service |
| Nginx 站点 | /etc/nginx/conf.d/lightops.conf |
| sudoers 白名单 | /etc/sudoers.d/lightops |
| Uvicorn | 仅 127.0.0.1:8000，单 worker |
| systemd 内存上限 | MemoryMax=400M |
| 默认公网入口 | TCP 8080，可配置 |

## 页面功能

- 每 60 秒采集 CPU、内存、系统盘、负载和网络累计流量；
- 资源卡显示 CPU 总核数、内存“已使用 / 总容量”、磁盘“已使用 / 总容量”；
- 趋势支持 10 分钟、1 小时、24 小时和 7 天；
- 鼠标移动到趋势曲线时自动吸附最近采样点，并显示精确时间及 CPU、内存、磁盘占用率；
- 自动显示云厂商、主机名、Linux 发行版与内核；
- 只监控安装器识别并写入白名单的 systemd 服务；
- 指标和审计保留 7 天，每天进行 SQLite 一致性备份；
- 管理操作要求 Bearer 令牌，令牌不会出现在安装输出中；
- 浏览器仅在当前标签页会话保存管理令牌，失效令牌会自动清除；
- 前端请求具有 10 秒超时，并提供键盘焦点、状态播报和趋势文本摘要。

## 日常操作

~~~bash
lightopsctl status
lightopsctl health
lightopsctl doctor
lightopsctl logs 100
lightopsctl restart
lightopsctl backup
lightopsctl nginx-reload
lightopsctl url
sudo lightops-verify
~~~

管理令牌只允许在服务器本地从 /etc/lightops/lightops.env 读取。面板只在当前浏览器标签页会话中保存它，关闭标签页后需要重新输入。不要把令牌、SSH 私钥、MySQL 密码或 Redis 密码粘贴到聊天中。

## 修改前端

离线编译工具已锁定在 tools/package-lock.json：

~~~bash
npm ci --prefix tools
node tools/generate-render.mjs
node --check app/static/render.js
node --check app/static/app.js
~~~

修改 app/static/index.html 后必须重新生成 app/static/render.js。不要手工编辑生成文件，也不要把 CSP 放宽到 unsafe-eval。

## 测试

先在开发虚拟环境安装锁定的运行与测试依赖：

~~~bash
python -m pip install -r requirements-dev.txt
~~~

~~~bash
python -m compileall -q app tests
python tests/smoke.py
python tests/api_smoke.py
python tests/frontend_smoke.py
node --check app/static/app.js
node --check app/static/render.js
bash tests/platform_detection.sh
bash tests/install_helpers.sh
bash tests/nginx_template.sh
bash -n deploy/lib/platform.sh deploy/lib/config.sh deploy/preflight.sh deploy/install.sh
bash -n deploy/lightopsctl deploy/verify-server.sh deploy/rotate-token.sh
~~~

发行版分支测试使用隔离的 /etc/os-release、架构和包管理器夹具，不会修改测试主机。真实发布仍需在目标服务器执行预检、安装和验收。
