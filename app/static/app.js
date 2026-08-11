(function () {
  "use strict";

  var createApp = window.Vue.createApp;
  var TOKEN_KEY = "lightops_api_token";
  var WEATHER_PLACE_KEY = "lightops_weather_place";
  var REQUEST_TIMEOUT_MS = 10000;
  var WEATHER_REFRESH_MS = 30 * 60 * 1000;
  var CLOCK_REFRESH_MS = 60 * 1000;

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

  function readWeatherPlace() {
    try {
      return window.sessionStorage.getItem(WEATHER_PLACE_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeWeatherPlace(place) {
    try {
      if (place) {
        window.sessionStorage.setItem(WEATHER_PLACE_KEY, place);
      } else {
        window.sessionStorage.removeItem(WEATHER_PLACE_KEY);
      }
    } catch (error) {
      // Weather still works when session storage is unavailable.
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
        refreshRequested: false,
        weather: null,
        weatherLoading: false,
        weatherError: "",
        weatherPlace: "",
        weatherTimer: null,
        clockTimer: null,
        currentTime: new Date()
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
        return this.statusInfo(this.metric.cpu_percent, "负载上升").label;
      },
      cpuStatusClass: function () {
        return this.statusInfo(this.metric.cpu_percent, "负载上升").cls;
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
      },
      weatherCode: function () {
        if (!this.weather) {
          return null;
        }
        var current = this.weather.current || {};
        var today = this.weather.today || {};
        return Number.isFinite(Number(current.weather_code))
          ? Number(current.weather_code)
          : Number(today.weather_code);
      },
      weatherKind: function () {
        return this.weatherKindForCode(this.weatherCode);
      },
      qweatherCode: function () {
        var code = Number(this.weatherCode);
        var isDay = this.weather && this.weather.current ? this.weather.current.is_day !== false : true;
        if (!Number.isFinite(code)) {
          return isDay ? 100 : 150;
        }
        return this.qweatherCodeForCode(code, isDay);
      },
      weatherLabel: function () {
        var labels = {
          clear: "晴朗",
          partlyCloudy: "晴间多云",
          cloudy: "多云",
          fog: "有雾",
          drizzle: "细雨",
          rain: "有雨",
          snow: "有雪",
          storm: "雷暴"
        };
        return labels[this.weatherKind] || "天气未知";
      },
      weatherTip: function () {
        if (!this.weather) {
          return "";
        }
        var hour = this.currentTime.getHours();
        if (hour >= 23 || hour < 6) {
          var nightTips = hour < 2
            ? [
                "夜色已上线，今天辛苦啦，早点睡 zZZ",
                "23 点后的风景留给梦里，收好电脑，去和周公碰个面吧"
              ]
            : hour < 5
              ? [
                  "夜深啦，别让思绪加班到凌晨，泡杯温水就准备休息吧",
                  "月亮都在值夜班，你就别跟它抢工位啦，早点睡 zZZ"
                ]
              : [
                  "天快亮了，先别急着硬撑，能睡一会儿就把被子盖好吧",
                  "凌晨的风很轻，眼睛也该下班啦，补个好觉再出发"
                ];
          return nightTips[this.currentTime.getDate() % nightTips.length];
        }
        var tip = this.weather.tip;
        return typeof tip === "string" ? tip : "";
      },
      weatherCandidates: function () {
        if (!this.weather || !Array.isArray(this.weather.candidates)) {
          return [];
        }
        return this.weather.candidates;
      },
      activeCandidateLabel: function () {
        if (this.weather && typeof this.weather.location_label === "string") {
          return this.weather.location_label;
        }
        return "";
      },
      uptimeLabel: function () {
        var boot = Number(this.host.boot_time);
        if (!Number.isFinite(boot) || boot <= 0) {
          return "";
        }
        var seconds = Math.max(0, Math.floor(Date.now() / 1000 - boot));
        if (seconds < 60) {
          return seconds + " 秒";
        }
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0) {
          return days + " 天 " + hours + " 小时 " + minutes + " 分";
        }
        if (hours > 0) {
          return hours + " 小时 " + minutes + " 分";
        }
        return minutes + " 分";
      }
    },
      mounted: function () {
        migrateLegacyToken();
        this.refresh();
        this.initializeWeather();
        this.refreshTimer = window.setInterval(this.refresh, 30000);
        this.weatherTimer = window.setInterval(this.refreshWeather, WEATHER_REFRESH_MS);
        this.clockTimer = window.setInterval(function () {
          this.currentTime = new Date();
        }.bind(this), CLOCK_REFRESH_MS);
      },
      beforeUnmount: function () {
        window.clearInterval(this.refreshTimer);
        window.clearInterval(this.weatherTimer);
        window.clearInterval(this.clockTimer);
      },
    methods: {
      authHeaders: function () {
        var token = readToken();
        return token ? { Authorization: "Bearer " + token } : {};
      },
      initializeWeather: function () {
        this.weatherPlace = readWeatherPlace();
        if (this.weatherPlace) {
          this.refreshWeather();
        }
      },
      pickDistrict: async function (candidate) {
        if (!candidate || this.weatherLoading) {
          return;
        }
        this.weatherLoading = true;
        this.weatherError = "";
        try {
          var lat = Number(candidate.latitude);
          var lon = Number(candidate.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw new Error("坐标无效");
          }
          // The lat/lon endpoint returns no district candidates; cache the
          // city-wide list so the district picker stays visible after refining.
          var previousCandidates = this.weather && Array.isArray(this.weather.candidates)
            ? this.weather.candidates
            : [];
          var response = await this.fetchJson(
            "/api/weather?latitude=" + lat + "&longitude=" + lon
          );
          if (
            previousCandidates.length > 1 &&
            (!Array.isArray(response.candidates) ||
              response.candidates.length < previousCandidates.length)
          ) {
            response.candidates = previousCandidates;
          }
          // The lat/lon endpoint labels the location "当前位置"; substitute the
          // picked district's label so the picker and emblem show e.g.
          // "广州-海珠区".
          if (candidate.label) {
            response.location_label = candidate.label;
          }
          this.weather = response;
        } catch (error) {
          this.weatherError = error.message || "天气数据暂时不可用";
        } finally {
          this.weatherLoading = false;
        }
      },
      searchWeather: function () {
        var place = (this.weatherPlace || "").trim();
        if (!place) {
          this.weatherError = "请输入城市名称";
          return;
        }
        writeWeatherPlace(place);
        this.refreshWeather();
      },
      refreshWeather: async function () {
        var place = (this.weatherPlace || "").trim();
        if (!place || this.weatherLoading) {
          return;
        }
        this.weatherLoading = true;
        this.weatherError = "";
        try {
          this.weather = await this.fetchJson(
            "/api/weather?place=" + encodeURIComponent(place)
          );
        } catch (error) {
          this.weatherError = error.message || "天气数据暂时不可用";
        } finally {
          this.weatherLoading = false;
        }
      },
      weatherKindForCode: function (value) {
        var code = Number(value);
        if (!Number.isFinite(code)) {
          return "unknown";
        }
        if (code === 0) return "clear";
        if (code === 1 || code === 2) return "partlyCloudy";
        if (code === 3) return "cloudy";
        if (code === 45 || code === 48) return "fog";
        if (code >= 51 && code <= 57) return "drizzle";
        if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
        if (code >= 95) return "storm";
        return "unknown";
      },
      qweatherCodeForCode: function (value, isDay) {
        var code = Number(value);
        var day = isDay !== false;
        if (!Number.isFinite(code)) {
          return day ? 100 : 150;
        }
        if (code === 0) return day ? 100 : 150;
        if (code === 1) return day ? 101 : 151;
        if (code === 2) return day ? 102 : 152;
        if (code === 3) return day ? 103 : 153;
        if (code === 45 || code === 48) return day ? 501 : 501;
        if (code === 51 || code === 53) return 300;
        if (code === 55) return 301;
        if (code === 56 || code === 57) return 306;
        if (code === 61) return 305;
        if (code === 63) return 306;
        if (code === 65) return 308;
        if (code === 66 || code === 67) return 312;
        if (code === 71) return 400;
        if (code === 73) return 401;
        if (code === 75) return 402;
        if (code === 77) return 407;
        if (code === 80) return 305;
        if (code === 81) return 306;
        if (code === 82) return 308;
        if (code === 85) return 400;
        if (code === 86) return 401;
        if (code === 95) return 302;
        if (code === 96 || code === 99) return 302;
        return day ? 103 : 153;
      },
      formatTemperature: function (value) {
        return Number.isFinite(Number(value)) ? Math.round(Number(value)) + "°" : "--";
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
          var response = await window.fetch(url, requestOptions);
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
      formatLoad: function (value) {
        var n = Number(value);
        return Number.isFinite(n) ? n.toFixed(2) : "--";
      },
      clampPercent: function (value) {
        return this.clampNumber(value) + "%";
      },
      clampNumber: function (value) {
        return Math.max(0, Math.min(100, Number(value) || 0));
      },
      statusInfo: function (value, risingLabel) {
        var safe = Number(value);
        if (!Number.isFinite(safe)) {
          return { label: "等待数据", cls: "waiting" };
        }
        if (safe < 50) {
          return { label: "运行平稳", cls: "normal" };
        }
        if (safe < 80) {
          return { label: risingLabel, cls: "elevated" };
        }
        return { label: "需要关注", cls: "critical" };
      },
      statusLabel: function (value) {
        return this.statusInfo(value, "使用偏高").label;
      },
      statusClass: function (value) {
        return this.statusInfo(value, "使用偏高").cls;
      },
      formatHardwareCapacity: function (value) {
        var bytes = Number(value);
        if (!Number.isFinite(bytes) || bytes <= 0) {
          return "--";
        }
        return Math.ceil(bytes / 1073741824) + "GB";
      },
      formatBytes: function (value) {
        if (!value) {
          return "--";
        }
        return (value / 1073741824).toFixed(1) + " GB";
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