/* Generated from index.html by @vue/compiler-dom 3.5.17. */
window.LightOpsRender = (function (Vue) {
const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, normalizeStyle: _normalizeStyle, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, renderList: _renderList, Fragment: _Fragment, normalizeClass: _normalizeClass, vModelText: _vModelText, withKeys: _withKeys, withDirectives: _withDirectives, createTextVNode: _createTextVNode, createStaticVNode: _createStaticVNode } = Vue

const _hoisted_1 = { class: "topbar" }
const _hoisted_2 = { class: "header-actions" }
const _hoisted_3 = {
  class: "muted",
  "aria-live": "polite"
}
const _hoisted_4 = ["disabled", "aria-busy"]
const _hoisted_5 = { class: "page-shell" }
const _hoisted_6 = {
  class: "hero",
  "aria-labelledby": "page-title"
}
const _hoisted_7 = { class: "host-summary" }
const _hoisted_8 = {
  class: "hero-weather",
  "aria-label": "每日天气"
}
const _hoisted_9 = ["title"]
const _hoisted_10 = {
  key: 0,
  class: "weather-emblem-readout"
}
const _hoisted_11 = {
  key: 0,
  class: "weather-emblem-tip"
}
const _hoisted_12 = {
  key: 1,
  class: "weather-emblem-readout"
}
const _hoisted_13 = {
  key: 2,
  class: "weather-district-list",
  role: "listbox",
  "aria-label": "细化到区"
}
const _hoisted_14 = ["disabled", "onClick"]
const _hoisted_15 = { class: "weather-picker" }
const _hoisted_16 = { class: "weather-picker-place" }
const _hoisted_17 = { class: "weather-picker-row" }
const _hoisted_18 = ["disabled"]
const _hoisted_19 = ["disabled"]
const _hoisted_20 = { class: "hero-status" }
const _hoisted_21 = { class: "muted" }
const _hoisted_22 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_23 = {
  class: "metric-grid",
  "aria-label": "资源概览"
}
const _hoisted_24 = { class: "metric-card cpu-card" }
const _hoisted_25 = { class: "metric-card-head" }
const _hoisted_26 = { class: "metric-value" }
const _hoisted_27 = { class: "processor-spec" }
const _hoisted_28 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_29 = { class: "metric-card" }
const _hoisted_30 = { class: "metric-card-head" }
const _hoisted_31 = { class: "metric-value" }
const _hoisted_32 = { class: "capacity-details" }
const _hoisted_33 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_34 = { class: "metric-foot" }
const _hoisted_35 = { class: "metric-card" }
const _hoisted_36 = { class: "metric-card-head" }
const _hoisted_37 = { class: "metric-value" }
const _hoisted_38 = { class: "capacity-details" }
const _hoisted_39 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_40 = { class: "metric-foot" }
const _hoisted_41 = { class: "metric-card" }
const _hoisted_42 = { class: "metric-value" }
const _hoisted_43 = { class: "metric-foot" }
const _hoisted_44 = {
  class: "panel trend-panel",
  "aria-labelledby": "trend-title"
}
const _hoisted_45 = { class: "panel-head" }
const _hoisted_46 = {
  class: "segment-control",
  "aria-label": "趋势时间范围"
}
const _hoisted_47 = ["aria-pressed", "onClick"]
const _hoisted_48 = { class: "trend-summary" }
const _hoisted_49 = {
  key: 0,
  class: "trend-stats"
}
const _hoisted_50 = { class: "trend-stat-name" }
const _hoisted_51 = {
  ref: "trendSvg",
  class: "trend-svg",
  viewBox: "0 0 1000 260",
  preserveAspectRatio: "none",
  role: "img",
  "aria-label": "CPU、内存和磁盘使用率趋势",
  "aria-describedby": "trend-description",
  tabindex: "0"
}
const _hoisted_52 = ["points"]
const _hoisted_53 = ["points"]
const _hoisted_54 = ["points"]
const _hoisted_55 = {
  key: 0,
  class: "trend-hover-layer"
}
const _hoisted_56 = ["x1", "x2"]
const _hoisted_57 = ["cx", "cy"]
const _hoisted_58 = ["cx", "cy"]
const _hoisted_59 = ["cx", "cy"]
const _hoisted_60 = { class: "chart-time-axis" }
const _hoisted_61 = {
  key: 2,
  class: "chart-empty"
}
const _hoisted_62 = {
  id: "trend-description",
  class: "sr-only",
  "aria-live": "polite"
}
const _hoisted_63 = { class: "two-column" }
const _hoisted_64 = {
  class: "panel",
  "aria-labelledby": "services-title"
}
const _hoisted_65 = { class: "service-list" }
const _hoisted_66 = { class: "service-name" }
const _hoisted_67 = ["title"]
const _hoisted_68 = ["disabled", "onClick"]
const _hoisted_69 = {
  key: 0,
  class: "empty-state"
}
const _hoisted_70 = {
  class: "panel",
  "aria-labelledby": "alerts-title"
}
const _hoisted_71 = { class: "panel-head compact" }
const _hoisted_72 = { class: "alert-list" }
const _hoisted_73 = {
  key: 0,
  class: "empty-state success"
}

return function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock(_Fragment, null, [
    _createElementVNode("header", _hoisted_1, [
      _cache[9] || (_cache[9] = _createElementVNode("div", { class: "brand" }, [
        _createElementVNode("div", {
          class: "brand-mark",
          "aria-hidden": "true"
        }, [
          _createElementVNode("span")
        ]),
        _createElementVNode("div", null, [
          _createElementVNode("div", { class: "brand-title" }, "LightOps"),
          _createElementVNode("div", { class: "brand-subtitle" }, "轻量运维控制台")
        ])
      ], -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_2, [
        _cache[8] || (_cache[8] = _createElementVNode("span", {
          class: "live-dot",
          "aria-hidden": "true"
        }, null, -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_3, "最后更新 " + _toDisplayString(_ctx.updatedAt || "等待数据"), 1 /* TEXT */),
        _createElementVNode("button", {
          type: "button",
          class: "ghost-button",
          onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.saveToken && _ctx.saveToken(...args)))
        }, "管理令牌"),
        _createElementVNode("button", {
          type: "button",
          class: "primary-button",
          disabled: _ctx.loading,
          "aria-busy": _ctx.loading,
          onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.refresh && _ctx.refresh(...args)))
        }, _toDisplayString(_ctx.loading ? "刷新中" : "刷新"), 9 /* TEXT, PROPS */, _hoisted_4)
      ])
    ]),
    _createElementVNode("main", _hoisted_5, [
      _createElementVNode("section", _hoisted_6, [
        _createElementVNode("div", null, [
          _cache[10] || (_cache[10] = _createElementVNode("div", { class: "eyebrow" }, "SYSTEM OVERVIEW", -1 /* CACHED */)),
          _cache[11] || (_cache[11] = _createElementVNode("div", { class: "hero-heading" }, [
            _createElementVNode("h1", { id: "page-title" }, "轻量服务器监控系统"),
            _createElementVNode("span", { class: "environment-badge" }, "LIGHTOPS")
          ], -1 /* CACHED */)),
          _createElementVNode("p", _hoisted_7, [
            _createElementVNode("span", null, _toDisplayString(_ctx.host.cloud_provider || "云服务器"), 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.formatHardwareCapacity(_ctx.host.memory_total)) + " 内存", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.formatHardwareCapacity(_ctx.host.disk_total)) + " 系统盘", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.host.os_name || "Linux"), 1 /* TEXT */)
          ])
        ]),
        _createElementVNode("div", _hoisted_8, [
          _createElementVNode("div", {
            class: _normalizeClass(["weather-emblem", 'weather-' + (_ctx.weatherKind || 'idle')])
          }, [
            _createElementVNode("div", {
              class: "weather-emblem-icon",
              style: _normalizeStyle({ '--qi-url': 'url(/vendor/qweather/' + (_ctx.qweatherCode || 150) + '.svg)' }),
              title: _ctx.weather ? (_ctx.weather.location_label || _ctx.weatherLabel) : '每日天气',
              "aria-hidden": "true"
            }, null, 12 /* STYLE, PROPS */, _hoisted_9),
            (_ctx.weather)
              ? (_openBlock(), _createElementBlock("div", _hoisted_10, [
                  _createElementVNode("strong", null, _toDisplayString(_ctx.formatTemperature(_ctx.weather.current.temperature)), 1 /* TEXT */),
                  _createElementVNode("span", null, _toDisplayString(_ctx.weatherLabel), 1 /* TEXT */),
                  (_ctx.weatherTip)
                    ? (_openBlock(), _createElementBlock("span", _hoisted_11, _toDisplayString(_ctx.weatherTip), 1 /* TEXT */))
                    : _createCommentVNode("v-if", true)
                ]))
              : (_openBlock(), _createElementBlock("div", _hoisted_12, [
                  _cache[12] || (_cache[12] = _createElementVNode("strong", null, "--°", -1 /* CACHED */)),
                  _createElementVNode("span", null, _toDisplayString(_ctx.weatherLoading ? "查询中" : (_ctx.weatherError || "选择城市查看天气")), 1 /* TEXT */)
                ])),
            (_ctx.weather && _ctx.weatherCandidates.length > 1)
              ? (_openBlock(), _createElementBlock("div", _hoisted_13, [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.weatherCandidates, (candidate) => {
                    return (_openBlock(), _createElementBlock("button", {
                      key: candidate.label,
                      type: "button",
                      class: _normalizeClass(["weather-district-tag", { active: candidate.label === _ctx.activeCandidateLabel }]),
                      disabled: _ctx.weatherLoading,
                      onClick: $event => (_ctx.pickDistrict(candidate))
                    }, _toDisplayString(candidate.label.split("-").slice(-1)[0]), 11 /* TEXT, CLASS, PROPS */, _hoisted_14))
                  }), 128 /* KEYED_FRAGMENT */))
                ]))
              : _createCommentVNode("v-if", true)
          ], 2 /* CLASS */),
          _createElementVNode("div", _hoisted_15, [
            _createElementVNode("div", _hoisted_16, _toDisplayString(_ctx.weather ? _ctx.weather.location_label : "选择城市查看天气"), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_17, [
              _withDirectives(_createElementVNode("input", {
                class: "weather-picker-input",
                type: "text",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.weatherPlace) = $event)),
                onKeyup: _cache[3] || (_cache[3] = _withKeys((...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)), ["enter"])),
                disabled: _ctx.weatherLoading,
                placeholder: "输入城市名，如 北京",
                "aria-label": "城市名称"
              }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_18), [
                [_vModelText, _ctx.weatherPlace]
              ]),
              _createElementVNode("button", {
                type: "button",
                class: "weather-picker-btn",
                disabled: _ctx.weatherLoading,
                onClick: _cache[4] || (_cache[4] = (...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)))
              }, "查询", 8 /* PROPS */, _hoisted_19)
            ])
          ])
        ]),
        _createElementVNode("div", _hoisted_20, [
          _createElementVNode("span", {
            class: _normalizeClass(["status-badge", { healthy: _ctx.updatedAt && !_ctx.error, pending: !_ctx.updatedAt && !_ctx.error }]),
            role: "status",
            "aria-live": "polite"
          }, _toDisplayString(_ctx.error ? "数据异常" : (_ctx.updatedAt ? "系统运行中" : "正在连接")), 3 /* TEXT, CLASS */),
          _createElementVNode("span", _hoisted_21, "v" + _toDisplayString(_ctx.summary.version || "0.1.1"), 1 /* TEXT */)
        ])
      ]),
      (_ctx.error)
        ? (_openBlock(), _createElementBlock("div", _hoisted_22, _toDisplayString(_ctx.error), 1 /* TEXT */))
        : _createCommentVNode("v-if", true),
      _createElementVNode("section", _hoisted_23, [
        _createElementVNode("article", _hoisted_24, [
          _createElementVNode("div", _hoisted_25, [
            _cache[13] || (_cache[13] = _createElementVNode("div", { class: "metric-label" }, "处理器负载", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.cpuStatusClass])
            }, _toDisplayString(_ctx.cpuStatus), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_26, _toDisplayString(_ctx.formatPercent(_ctx.metric.cpu_percent)), 1 /* TEXT */),
          _createElementVNode("div", _hoisted_27, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU ", 1 /* TEXT */),
          _createElementVNode("div", {
            class: "progress-track",
            role: "progressbar",
            "aria-label": "CPU 使用率",
            "aria-valuemin": "0",
            "aria-valuemax": "100",
            "aria-valuenow": Number.isFinite(Number(_ctx.metric.cpu_percent)) ? _ctx.clampNumber(_ctx.metric.cpu_percent) : undefined,
            "aria-valuetext": _ctx.formatPercent(_ctx.metric.cpu_percent)
          }, [
            _createElementVNode("span", {
              style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.cpu_percent) })
            }, null, 4 /* STYLE */)
          ], 8 /* PROPS */, _hoisted_28),
          _cache[14] || (_cache[14] = _createElementVNode("div", { class: "metric-foot" }, "当前整体 CPU 占用 · 每 60 秒采样", -1 /* CACHED */))
        ]),
        _createElementVNode("article", _hoisted_29, [
          _createElementVNode("div", _hoisted_30, [
            _cache[15] || (_cache[15] = _createElementVNode("div", { class: "metric-label" }, "内存使用情况", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.memory_percent)])
            }, _toDisplayString(_ctx.statusLabel(_ctx.metric.memory_percent)), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_31, _toDisplayString(_ctx.formatPercent(_ctx.metric.memory_percent)), 1 /* TEXT */),
          _createElementVNode("div", _hoisted_32, [
            _createElementVNode("strong", null, _toDisplayString(_ctx.formatBytes(_ctx.host.memory_used)), 1 /* TEXT */),
            _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatBytes(_ctx.host.memory_total)), 1 /* TEXT */)
          ]),
          _createElementVNode("div", {
            class: "progress-track violet",
            role: "progressbar",
            "aria-label": "内存使用率",
            "aria-valuemin": "0",
            "aria-valuemax": "100",
            "aria-valuenow": Number.isFinite(Number(_ctx.metric.memory_percent)) ? _ctx.clampNumber(_ctx.metric.memory_percent) : undefined,
            "aria-valuetext": _ctx.formatPercent(_ctx.metric.memory_percent)
          }, [
            _createElementVNode("span", {
              style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.memory_percent) })
            }, null, 4 /* STYLE */)
          ], 8 /* PROPS */, _hoisted_33),
          _createElementVNode("div", _hoisted_34, "当前可用 " + _toDisplayString(_ctx.formatBytes(_ctx.host.memory_available)), 1 /* TEXT */)
        ]),
        _createElementVNode("article", _hoisted_35, [
          _createElementVNode("div", _hoisted_36, [
            _cache[16] || (_cache[16] = _createElementVNode("div", { class: "metric-label" }, "系统盘使用情况", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.disk_percent)])
            }, _toDisplayString(_ctx.statusLabel(_ctx.metric.disk_percent)), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_37, _toDisplayString(_ctx.formatPercent(_ctx.metric.disk_percent)), 1 /* TEXT */),
          _createElementVNode("div", _hoisted_38, [
            _createElementVNode("strong", null, _toDisplayString(_ctx.formatBytes(_ctx.host.disk_used)), 1 /* TEXT */),
            _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatBytes(_ctx.host.disk_total)), 1 /* TEXT */)
          ]),
          _createElementVNode("div", {
            class: "progress-track amber",
            role: "progressbar",
            "aria-label": "磁盘使用率",
            "aria-valuemin": "0",
            "aria-valuemax": "100",
            "aria-valuenow": Number.isFinite(Number(_ctx.metric.disk_percent)) ? _ctx.clampNumber(_ctx.metric.disk_percent) : undefined,
            "aria-valuetext": _ctx.formatPercent(_ctx.metric.disk_percent)
          }, [
            _createElementVNode("span", {
              style: _normalizeStyle({ width: _ctx.clampPercent(_ctx.metric.disk_percent) })
            }, null, 4 /* STYLE */)
          ], 8 /* PROPS */, _hoisted_39),
          _createElementVNode("div", _hoisted_40, "剩余空间 " + _toDisplayString(_ctx.formatBytes(_ctx.host.disk_free)), 1 /* TEXT */)
        ]),
        _createElementVNode("article", _hoisted_41, [
          _cache[17] || (_cache[17] = _createElementVNode("div", { class: "metric-label" }, "活动告警", -1 /* CACHED */)),
          _createElementVNode("div", _hoisted_42, _toDisplayString(_ctx.alerts.length), 1 /* TEXT */),
          _createElementVNode("div", {
            class: _normalizeClass(["alert-summary", { clear: _ctx.alerts.length === 0 }])
          }, _toDisplayString(_ctx.alerts.length ? "需要关注" : "当前无异常"), 3 /* TEXT, CLASS */),
          _createElementVNode("div", _hoisted_43, _toDisplayString(_ctx.servicesUp) + " / " + _toDisplayString(_ctx.services.length) + " 服务正常", 1 /* TEXT */)
        ])
      ]),
      _createElementVNode("section", _hoisted_44, [
        _createElementVNode("div", _hoisted_45, [
          _cache[18] || (_cache[18] = _createElementVNode("div", null, [
            _createElementVNode("div", { class: "eyebrow" }, "RESOURCE TREND"),
            _createElementVNode("h2", { id: "trend-title" }, "资源趋势")
          ], -1 /* CACHED */)),
          _createElementVNode("div", _hoisted_46, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.ranges, (item) => {
              return (_openBlock(), _createElementBlock("button", {
                type: "button",
                key: item.value,
                class: _normalizeClass({ active: _ctx.range === item.value }),
                "aria-pressed": _ctx.range === item.value,
                onClick: $event => (_ctx.setRange(item.value))
              }, _toDisplayString(item.label), 11 /* TEXT, CLASS, PROPS */, _hoisted_47))
            }), 128 /* KEYED_FRAGMENT */))
          ])
        ]),
        _createElementVNode("div", _hoisted_48, [
          _createElementVNode("span", null, [
            _createElementVNode("strong", null, _toDisplayString(_ctx.history.length), 1 /* TEXT */),
            _cache[19] || (_cache[19] = _createTextVNode(" 个采样点"))
          ]),
          _cache[20] || (_cache[20] = _createElementVNode("span", null, "每 60 秒采集一次", -1 /* CACHED */)),
          _cache[21] || (_cache[21] = _createElementVNode("span", { class: "trend-legend" }, [
            _createElementVNode("i", { class: "cpu" }),
            _createTextVNode("CPU "),
            _createElementVNode("i", { class: "memory" }),
            _createTextVNode("内存 "),
            _createElementVNode("i", { class: "disk" }),
            _createTextVNode("磁盘 ")
          ], -1 /* CACHED */))
        ]),
        (_ctx.history.length)
          ? (_openBlock(), _createElementBlock("div", _hoisted_49, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.trendCards, (card) => {
                return (_openBlock(), _createElementBlock("div", {
                  key: card.key,
                  class: "trend-stat-card"
                }, [
                  _createElementVNode("div", _hoisted_50, [
                    _createElementVNode("span", {
                      class: _normalizeClass(["trend-dot", card.key])
                    }, null, 2 /* CLASS */),
                    _createTextVNode(" " + _toDisplayString(card.label), 1 /* TEXT */)
                  ]),
                  _createElementVNode("strong", null, _toDisplayString(_ctx.formatPercent(card.current)), 1 /* TEXT */),
                  _createElementVNode("small", null, "最低 " + _toDisplayString(_ctx.formatPercent(card.minimum)) + " · 最高 " + _toDisplayString(_ctx.formatPercent(card.maximum)), 1 /* TEXT */)
                ]))
              }), 128 /* KEYED_FRAGMENT */))
            ]))
          : _createCommentVNode("v-if", true),
        (_ctx.history.length)
          ? (_openBlock(), _createElementBlock("div", {
              key: 1,
              class: "svg-chart-shell",
              onMousemove: _cache[5] || (_cache[5] = (...args) => (_ctx.updateTrendHover && _ctx.updateTrendHover(...args))),
              onMouseleave: _cache[6] || (_cache[6] = (...args) => (_ctx.clearTrendHover && _ctx.clearTrendHover(...args)))
            }, [
              _cache[26] || (_cache[26] = _createElementVNode("div", { class: "chart-y-axis" }, [
                _createElementVNode("span", null, "100%"),
                _createElementVNode("span", null, "75%"),
                _createElementVNode("span", null, "50%"),
                _createElementVNode("span", null, "25%"),
                _createElementVNode("span", null, "0%")
              ], -1 /* CACHED */)),
              (_openBlock(), _createElementBlock("svg", _hoisted_51, [
                _cache[22] || (_cache[22] = _createStaticVNode("<g class=\"trend-grid\"><line x1=\"0\" y1=\"0\" x2=\"1000\" y2=\"0\"></line><line x1=\"0\" y1=\"65\" x2=\"1000\" y2=\"65\"></line><line x1=\"0\" y1=\"130\" x2=\"1000\" y2=\"130\"></line><line x1=\"0\" y1=\"195\" x2=\"1000\" y2=\"195\"></line><line x1=\"0\" y1=\"260\" x2=\"1000\" y2=\"260\"></line></g>", 1)),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('cpu_percent'),
                  class: "trend-line cpu"
                }, null, 8 /* PROPS */, _hoisted_52),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('memory_percent'),
                  class: "trend-line memory"
                }, null, 8 /* PROPS */, _hoisted_53),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('disk_percent'),
                  class: "trend-line disk"
                }, null, 8 /* PROPS */, _hoisted_54),
                (_ctx.trendHover)
                  ? (_openBlock(), _createElementBlock("g", _hoisted_55, [
                      _createElementVNode("line", {
                        x1: _ctx.trendHover.x,
                        y1: "0",
                        x2: _ctx.trendHover.x,
                        y2: "260",
                        class: "trend-hover-line"
                      }, null, 8 /* PROPS */, _hoisted_56),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.cpuY,
                        r: "5",
                        class: "trend-hover-point cpu"
                      }, null, 8 /* PROPS */, _hoisted_57),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.memoryY,
                        r: "5",
                        class: "trend-hover-point memory"
                      }, null, 8 /* PROPS */, _hoisted_58),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.diskY,
                        r: "5",
                        class: "trend-hover-point disk"
                      }, null, 8 /* PROPS */, _hoisted_59)
                    ]))
                  : _createCommentVNode("v-if", true)
              ], 512 /* NEED_PATCH */)),
              (_ctx.trendHover)
                ? (_openBlock(), _createElementBlock("div", {
                    key: 0,
                    class: "trend-tooltip",
                    style: _normalizeStyle({ left: _ctx.trendHover.tooltipLeft + 'px' }),
                    "aria-hidden": "true"
                  }, [
                    _createElementVNode("strong", null, _toDisplayString(_ctx.formatHoverTime(_ctx.trendHover.ts)), 1 /* TEXT */),
                    _createElementVNode("span", null, [
                      _cache[23] || (_cache[23] = _createElementVNode("i", { class: "cpu" }, null, -1 /* CACHED */)),
                      _createTextVNode("CPU " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.cpu)), 1 /* TEXT */)
                    ]),
                    _createElementVNode("span", null, [
                      _cache[24] || (_cache[24] = _createElementVNode("i", { class: "memory" }, null, -1 /* CACHED */)),
                      _createTextVNode("内存 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.memory)), 1 /* TEXT */)
                    ]),
                    _createElementVNode("span", null, [
                      _cache[25] || (_cache[25] = _createElementVNode("i", { class: "disk" }, null, -1 /* CACHED */)),
                      _createTextVNode("磁盘 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.disk)), 1 /* TEXT */)
                    ])
                  ], 4 /* STYLE */))
                : _createCommentVNode("v-if", true),
              _createElementVNode("div", _hoisted_60, [
                _createElementVNode("span", null, _toDisplayString(_ctx.trendStartLabel), 1 /* TEXT */),
                _createElementVNode("span", null, _toDisplayString(_ctx.trendEndLabel), 1 /* TEXT */)
              ])
            ], 32 /* NEED_HYDRATION */))
          : (_openBlock(), _createElementBlock("div", _hoisted_61, " 正在等待这个时间范围内的监控数据 ")),
        _createElementVNode("p", _hoisted_62, _toDisplayString(_ctx.trendDescription), 1 /* TEXT */)
      ]),
      _createElementVNode("section", _hoisted_63, [
        _createElementVNode("article", _hoisted_64, [
          _cache[27] || (_cache[27] = _createElementVNode("div", { class: "panel-head compact" }, [
            _createElementVNode("div", null, [
              _createElementVNode("div", { class: "eyebrow" }, "SERVICE HEALTH"),
              _createElementVNode("h2", { id: "services-title" }, "服务状态")
            ])
          ], -1 /* CACHED */)),
          _createElementVNode("div", _hoisted_65, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.services, (service) => {
              return (_openBlock(), _createElementBlock("div", {
                key: service.service,
                class: "service-row"
              }, [
                _createElementVNode("div", _hoisted_66, [
                  _createElementVNode("span", {
                    class: _normalizeClass(["service-dot", { up: service.status === 'active' }])
                  }, null, 2 /* CLASS */),
                  _createElementVNode("div", null, [
                    _createElementVNode("strong", null, [
                      _createTextVNode(_toDisplayString(service.service), 1 /* TEXT */),
                      (service.buckets && service.buckets.length)
                        ? (_openBlock(), _createElementBlock("span", {
                            key: 0,
                            class: "service-bucket",
                            title: service.buckets.join('\n')
                          }, " [" + _toDisplayString(service.buckets.join(', ')) + "]", 9 /* TEXT, PROPS */, _hoisted_67))
                        : _createCommentVNode("v-if", true)
                    ]),
                    _createElementVNode("small", null, _toDisplayString(service.status), 1 /* TEXT */)
                  ])
                ]),
                _createElementVNode("button", {
                  type: "button",
                  class: "small-button",
                  disabled: _ctx.restartBusy === service.service,
                  onClick: $event => (_ctx.restartService(service.service))
                }, _toDisplayString(_ctx.restartBusy === service.service ? "处理中" : "重启"), 9 /* TEXT, PROPS */, _hoisted_68)
              ]))
            }), 128 /* KEYED_FRAGMENT */)),
            (!_ctx.services.length)
              ? (_openBlock(), _createElementBlock("div", _hoisted_69, "等待服务采样"))
              : _createCommentVNode("v-if", true)
          ])
        ]),
        _createElementVNode("article", _hoisted_70, [
          _createElementVNode("div", _hoisted_71, [
            _cache[28] || (_cache[28] = _createElementVNode("div", null, [
              _createElementVNode("div", { class: "eyebrow" }, "ACTIVE ALERTS"),
              _createElementVNode("h2", { id: "alerts-title" }, "当前告警")
            ], -1 /* CACHED */)),
            _createElementVNode("button", {
              type: "button",
              class: "text-button",
              onClick: _cache[7] || (_cache[7] = (...args) => (_ctx.runMaintenance && _ctx.runMaintenance(...args)))
            }, "立即备份")
          ]),
          _createElementVNode("div", _hoisted_72, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.alerts, (alert) => {
              return (_openBlock(), _createElementBlock("div", {
                key: alert.id,
                class: "alert-row"
              }, [
                _cache[29] || (_cache[29] = _createElementVNode("span", { class: "alert-icon" }, "!", -1 /* CACHED */)),
                _createElementVNode("div", null, [
                  _createElementVNode("strong", null, _toDisplayString(alert.message), 1 /* TEXT */),
                  _createElementVNode("small", null, _toDisplayString(_ctx.formatTime(alert.created_at)), 1 /* TEXT */)
                ])
              ]))
            }), 128 /* KEYED_FRAGMENT */)),
            (!_ctx.alerts.length)
              ? (_openBlock(), _createElementBlock("div", _hoisted_73, _cache[30] || (_cache[30] = [
                  _createElementVNode("span", null, "✓", -1 /* CACHED */),
                  _createTextVNode(" 当前没有活动告警 ")
                ])))
              : _createCommentVNode("v-if", true)
          ])
        ])
      ]),
      _cache[31] || (_cache[31] = _createElementVNode("footer", null, [
        _createElementVNode("span", null, "LightOps · FastAPI / Vue 3 / SVG"),
        _createElementVNode("span", null, "指标每 60 秒采集 · 保留 7 天")
      ], -1 /* CACHED */))
    ])
  ], 64 /* STABLE_FRAGMENT */))
}
})(window.Vue);
