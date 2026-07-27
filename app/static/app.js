(function () {
  "use strict";

  var createApp = window.Vue.createApp;
  var TOKEN_KEY = "lightops_api_token";
  var REQUEST_TIMEOUT_MS = 10000;

  function readToken() {
    try {
      return window.sessionStorage.getItem(TOKEN_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeToken(token) {
    try {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearToken() {
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      // Storage can be unavailable in hardened or private browser contexts.
    }
  }

  function migrateLegacyToken() {
    try {
      var legacy = window.localStorage.getItem(TOKEN_KEY);
      if (legacy && !readToken()) {
        writeToken(legacy);
      }
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      // A blocked localStorage must not prevent the read-only dashboard loading.
    }
  }

  createApp({
    render: window.LightOpsRender,
    data: function () {
      return {
        summary: { metric: {}, services: [], alerts: [], host: {} },
        history: [],
        range: "10m",
        ranges: [
          { value: "10m", label: "10 分钟" },
          { value: "1h", label: "1 小时" },
          { value: "24h", label: "24 小时" },
          { value: "7d", label: "7 天" }
        ],
        loading: false,
        restartBusy: "",
        updatedAt: "",
        error: "",
        trendHover: null,
        refreshTimer: null,
        refreshRequested: false
      };
    },
    computed: {
      metric: function () {
        return this.summary.metric || {};
      },
      services: function () {
        return this.summary.services || [];
      },
      alerts: function () {
        return this.summary.alerts || [];
      },
      host: function () {
        return this.summary.host || {};
      },
      servicesUp: function () {
        return this.services.filter(function (item) {
          return item.status === "active";
        }).length;
      },
      cpuStatus: function () {
        var value = Number(this.metric.cpu_percent);
        if (!Number.isFinite(value)) {
          return "等待数据";
        }
        if (value < 50) {
          return "运行平稳";
        }
        if (value < 80) {
          return "负载上升";
        }
        return "需要关注";
      },
      cpuStatusClass: function () {
        var value = Number(this.metric.cpu_percent);
        if (!Number.isFinite(value)) {
          return "waiting";
        }
        if (value < 50) {
          return "normal";
        }
        if (value < 80) {
          return "elevated";
        }
        return "critical";
      },
      trendCards: function () {
        var definitions = [
          { key: "cpu", field: "cpu_percent", label: "CPU" },
          { key: "memory", field: "memory_percent", label: "内存" },
          { key: "disk", field: "disk_percent", label: "磁盘" }
        ];
        return definitions.map(function (definition) {
          var values = this.history.map(function (item) {
            return Number(item[definition.field]);
          }).filter(Number.isFinite);
          return {
            key: definition.key,
            label: definition.label,
            current: values.length ? values[values.length - 1] : null,
            minimum: values.length ? Math.min.apply(Math, values) : null,
            maximum: values.length ? Math.max.apply(Math, values) : null
          };
        }.bind(this));
      },
      trendStartLabel: function () {
        return this.history.length ? this.formatTrendTime(this.history[0].ts) : "--";
      },
      trendEndLabel: function () {
        return this.history.length
          ? this.formatTrendTime(this.history[this.history.length - 1].ts)
          : "--";
      },
      trendDescription: function () {
        if (!this.history.length) {
          return "等待趋势数据";
        }
        return this.trendCards.map(function (card) {
          return card.label + " 当前 " + this.formatPercent(card.current) +
            "，最低 " + this.formatPercent(card.minimum) +
            "，最高 " + this.formatPercent(card.maximum);
        }.bind(this)).join("；");
      }
    },
    mounted: function () {
      migrateLegacyToken();
      this.refresh();
      this.refreshTimer = window.setInterval(this.refresh, 30000);
    },
    beforeUnmount: function () {
      window.clearInterval(this.refreshTimer);
    },
    methods: {
      authHeaders: function () {
        var token = readToken();
        return token ? { Authorization: "Bearer " + token } : {};
      },
      fetchJson: async function (url, options) {
        var controller = new AbortController();
        var timeout = window.setTimeout(function () {
          controller.abort();
        }, REQUEST_TIMEOUT_MS);
        var requestOptions = Object.assign({}, options || {}, {
          signal: controller.signal
        });
        try {
          var response = await window.fetch(url, options);
          var body = await response.json().catch(function () {
            return {};
          });
          if (!response.ok) {
            var requestError = new Error(
              body.detail || "请求失败（" + response.status + "）"
            );
            requestError.status = response.status;
            throw requestError;
          }
          return body;
        } catch (error) {
          if (error && error.name === "AbortError") {
            throw new Error("请求超时，请稍后重试");
          }
          throw error;
        } finally {
          window.clearTimeout(timeout);
        }
      },
      refresh: async function () {
        if (this.loading) {
          this.refreshRequested = true;
          return;
        }
        this.loading = true;
        this.error = "";
        var requestedRange = this.range;
        try {
          var results = await Promise.all([
            this.fetchJson("/api/summary"),
            this.fetchJson("/api/metrics?range=" + encodeURIComponent(requestedRange))
          ]);
          this.summary = results[0];
          if (this.range === requestedRange) {
            this.history = results[1].points || [];
          } else {
            this.refreshRequested = true;
          }
          this.trendHover = null;
          this.updatedAt = this.formatCurrentDate();
        } catch (error) {
          this.error = error.message || "无法加载监控数据";
        } finally {
          this.loading = false;
          if (this.refreshRequested) {
            this.refreshRequested = false;
            window.setTimeout(this.refresh, 0);
          }
        }
      },
      setRange: function (value) {
        if (this.range === value) {
          return;
        }
        this.range = value;
        this.trendHover = null;
        this.refresh();
      },
      chartPoints: function (key) {
        if (!this.history.length) {
          return "";
        }
        var lastIndex = Math.max(1, this.history.length - 1);
        return this.history.map(function (item, index) {
          var x = index / lastIndex * 1000;
          var value = Math.max(0, Math.min(100, Number(item[key]) || 0));
          var y = 260 - value * 2.6;
          return x.toFixed(2) + "," + y.toFixed(2);
        }).join(" ");
      },
      updateTrendHover: function (event) {
        var svg = this.$refs.trendSvg;
        if (!svg || !this.history.length) {
          this.trendHover = null;
          return;
        }

        var svgRect = svg.getBoundingClientRect();
        var shellRect = event.currentTarget.getBoundingClientRect();
        if (!svgRect.width || !shellRect.width) {
          return;
        }

        var ratio = Math.max(0, Math.min(1, (event.clientX - svgRect.left) / svgRect.width));
        var index = Math.round(ratio * Math.max(0, this.history.length - 1));
        var point = this.history[index];
        var x = this.history.length > 1
          ? index / (this.history.length - 1) * 1000
          : 0;
        var screenX = svgRect.left - shellRect.left + x / 1000 * svgRect.width;
        var tooltipLeft = Math.max(92, Math.min(shellRect.width - 92, screenX));
        var chartY = function (value) {
          var safe = Math.max(0, Math.min(100, Number(value) || 0));
          return 260 - safe * 2.6;
        };

        this.trendHover = {
          x: x,
          tooltipLeft: tooltipLeft,
          ts: point.ts,
          cpu: Number(point.cpu_percent),
          memory: Number(point.memory_percent),
          disk: Number(point.disk_percent),
          cpuY: chartY(point.cpu_percent),
          memoryY: chartY(point.memory_percent),
          diskY: chartY(point.disk_percent)
        };
      },
      clearTrendHover: function () {
        this.trendHover = null;
      },
      formatTrendTime: function (value) {
        return value
          ? new Date(value).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })
          : "--";
      },
      formatHoverTime: function (value) {
        return value
          ? new Date(value).toLocaleString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false
            })
          : "--";
      },
      saveToken: function () {
        var existing = readToken();
        var token = window.prompt(
          "输入管理令牌（仅保存在当前浏览器标签页会话）",
          existing
        );
        if (token === null) {
          return;
        }
        if (token.trim()) {
          if (writeToken(token.trim())) {
            window.alert("管理令牌已保存到当前会话");
          } else {
            window.alert("浏览器禁止会话存储，令牌未保存");
          }
        } else {
          clearToken();
          window.alert("管理令牌已清除");
        }
      },
      ensureToken: function () {
        if (readToken()) {
          return true;
        }
        this.saveToken();
        return Boolean(readToken());
      },
      handleAuthError: function (error) {
        if (!error || error.status !== 401) {
          return false;
        }
        clearToken();
        window.alert("管理令牌无效或已轮换，请重新输入");
        return true;
      },
      restartService: async function (service) {
        if (!this.ensureToken()) {
          return;
        }
        if (!window.confirm("确认重启服务 " + service + "？")) {
          return;
        }
        this.restartBusy = service;
        try {
          await this.fetchJson("/api/services/" + encodeURIComponent(service) + "/restart", {
            method: "POST",
            headers: this.authHeaders()
          });
          window.alert(service + " 已完成重启");
          await this.refresh();
        } catch (error) {
          if (!this.handleAuthError(error)) {
            window.alert("重启失败：" + error.message);
          }
        } finally {
          this.restartBusy = "";
        }
      },
      runMaintenance: async function () {
        if (!this.ensureToken()) {
          return;
        }
        try {
          var result = await this.fetchJson("/api/maintenance/run", {
            method: "POST",
            headers: this.authHeaders()
          });
          window.alert("备份已完成：" + result.backup);
        } catch (error) {
          if (!this.handleAuthError(error)) {
            window.alert("备份失败：" + error.message);
          }
        }
      },
      formatPercent: function (value) {
        return typeof value === "number" ? value.toFixed(1) + "%" : "--";
      },
      clampPercent: function () {
        return this.clampNumber(value) + "%";
      },
      clampNumber: function (value) {
        return Math.max(0, Math.min(100, Number(value) || 0));
      },
      statusLabel: function (value) {
        var safe = Number(value);
        if (!Number.isFinite(safe)) {
          return "等待数据";
        }
        if (safe < 50) {
          return "运行平稳";
        }
        if (safe < 80) {
          return "使用偏高";
        }
        return "需要关注";
      },
      statusClass: function (value) {
        var safe = Number(value);
        if (!Number.isFinite(safe)) {
          return "waiting";
        }
        if (safe < 50) {
          return "normal";
        }
        if (safe < 80) {
          return "elevated";
        }
        return "critical";
      },
      formatHardwareCapacity: function (value) {
        var bytes = Number(value);
        if (!Number.isFinite(bytes) || bytes <= 0) {
          return "--";
        }
        return Math.ceil(bytes / 1073741824) + "GB";
      },
      formatNumber: function (value) {
        return typeof value === "number" ? value.toFixed(2) : "--";
      },
      formatBytes: function (value) {
        if (!value) {
          return "--";
        }
        return (value / 1073741824).toFixed(1) + " GiB";
      },
      formatTime: function (value) {
        return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";
      },
      formatCurrentDate: function () {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, "0");
        var day = String(now.getDate()).padStart(2, "0");
        var hour = String(now.getHours()).padStart(2, "0");
        var minute = String(now.getMinutes()).padStart(2, "0");
        var second = String(now.getSeconds()).padStart(2, "0");
        return year + "年" + month + "月" + day + "日 " + hour + ":" + minute + ":" + second;
      }
    }
  }).mount("#app");
})();