/* Generated from index.html by @vue/compiler-dom 3.5.17. */
window.LightOpsRender = (function (Vue) {
const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, createCommentVNode: _createCommentVNode, vModelText: _vModelText, withDirectives: _withDirectives, openBlock: _openBlock, createElementBlock: _createElementBlock, withModifiers: _withModifiers, normalizeStyle: _normalizeStyle, renderList: _renderList, Fragment: _Fragment, normalizeClass: _normalizeClass, withKeys: _withKeys, createTextVNode: _createTextVNode, createStaticVNode: _createStaticVNode } = Vue

const _hoisted_1 = { class: "topbar" }
const _hoisted_2 = { class: "header-actions" }
const _hoisted_3 = {
  class: "muted",
  "aria-live": "polite"
}
const _hoisted_4 = ["disabled", "aria-busy"]
const _hoisted_5 = {
  class: "modal",
  role: "dialog",
  "aria-modal": "true",
  "aria-labelledby": "login-title"
}
const _hoisted_6 = { class: "modal-head" }
const _hoisted_7 = { class: "modal-field" }
const _hoisted_8 = { class: "modal-field" }
const _hoisted_9 = {
  key: 0,
  class: "modal-error",
  role: "alert"
}
const _hoisted_10 = { class: "modal-actions" }
const _hoisted_11 = ["disabled"]
const _hoisted_12 = {
  class: "modal",
  role: "dialog",
  "aria-modal": "true",
  "aria-labelledby": "user-panel-title"
}
const _hoisted_13 = { class: "modal-head" }
const _hoisted_14 = { class: "modal-body" }
const _hoisted_15 = {
  key: 0,
  class: "user-info"
}
const _hoisted_16 = { class: "modal-field" }
const _hoisted_17 = { class: "modal-field" }
const _hoisted_18 = { class: "modal-field" }
const _hoisted_19 = {
  key: 0,
  class: "modal-error",
  role: "alert"
}
const _hoisted_20 = {
  key: 1,
  class: "modal-success",
  role: "status"
}
const _hoisted_21 = { class: "modal-actions" }
const _hoisted_22 = ["disabled"]
const _hoisted_23 = { class: "modal-actions user-panel-actions" }
const _hoisted_24 = ["disabled"]
const _hoisted_25 = { class: "page-shell" }
const _hoisted_26 = {
  class: "hero",
  "aria-labelledby": "page-title"
}
const _hoisted_27 = { class: "host-summary" }
const _hoisted_28 = {
  class: "hero-weather",
  "aria-label": "每日天气"
}
const _hoisted_29 = ["title"]
const _hoisted_30 = {
  key: 0,
  class: "weather-emblem-readout"
}
const _hoisted_31 = {
  key: 0,
  class: "weather-emblem-tip"
}
const _hoisted_32 = {
  key: 1,
  class: "weather-emblem-readout"
}
const _hoisted_33 = {
  key: 2,
  class: "weather-district-list",
  role: "listbox",
  "aria-label": "细化到区"
}
const _hoisted_34 = ["disabled", "onClick"]
const _hoisted_35 = { class: "weather-picker" }
const _hoisted_36 = { class: "weather-picker-place" }
const _hoisted_37 = { class: "weather-picker-row" }
const _hoisted_38 = ["disabled"]
const _hoisted_39 = ["disabled"]
const _hoisted_40 = { class: "hero-status" }
const _hoisted_41 = { class: "hero-status-row" }
const _hoisted_42 = { class: "muted" }
const _hoisted_43 = {
  class: "hero-status-uptime muted",
  "aria-label": "服务器运行时间"
}
const _hoisted_44 = {
  key: 0,
  class: "error-banner",
  role: "alert"
}
const _hoisted_45 = {
  class: "metric-grid",
  "aria-label": "资源概览"
}
const _hoisted_46 = { class: "metric-card cpu-card" }
const _hoisted_47 = { class: "metric-card-head" }
const _hoisted_48 = { class: "processor-spec" }
const _hoisted_49 = { class: "metric-body" }
const _hoisted_50 = { class: "metric-value" }
const _hoisted_51 = {
  class: "load-average",
  "aria-label": "平均负载（1 分钟 / 5 分钟 / 15 分钟）"
}
const _hoisted_52 = { class: "load-average-item" }
const _hoisted_53 = { class: "load-average-item" }
const _hoisted_54 = { class: "load-average-item" }
const _hoisted_55 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_56 = { class: "metric-card" }
const _hoisted_57 = { class: "metric-card-head" }
const _hoisted_58 = { class: "metric-body" }
const _hoisted_59 = { class: "metric-value" }
const _hoisted_60 = { class: "capacity-details" }
const _hoisted_61 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_62 = { class: "metric-foot" }
const _hoisted_63 = { class: "metric-card" }
const _hoisted_64 = { class: "metric-card-head" }
const _hoisted_65 = { class: "metric-body" }
const _hoisted_66 = { class: "metric-value" }
const _hoisted_67 = { class: "capacity-details" }
const _hoisted_68 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_69 = { class: "metric-foot" }
const _hoisted_70 = { class: "metric-card" }
const _hoisted_71 = { class: "metric-card-head" }
const _hoisted_72 = { class: "metric-body" }
const _hoisted_73 = { class: "metric-value" }
const _hoisted_74 = ["aria-valuenow", "aria-valuetext"]
const _hoisted_75 = { class: "metric-foot" }
const _hoisted_76 = {
  class: "panel trend-panel",
  "aria-labelledby": "trend-title"
}
const _hoisted_77 = { class: "panel-head" }
const _hoisted_78 = {
  class: "segment-control",
  "aria-label": "趋势时间范围"
}
const _hoisted_79 = ["aria-pressed", "onClick"]
const _hoisted_80 = { class: "trend-summary" }
const _hoisted_81 = {
  key: 0,
  class: "trend-stats"
}
const _hoisted_82 = { class: "trend-stat-name" }
const _hoisted_83 = {
  ref: "trendSvg",
  class: "trend-svg",
  viewBox: "0 0 1000 260",
  preserveAspectRatio: "none",
  role: "img",
  "aria-label": "CPU、内存和磁盘使用率趋势",
  "aria-describedby": "trend-description",
  tabindex: "0"
}
const _hoisted_84 = ["points"]
const _hoisted_85 = ["points"]
const _hoisted_86 = ["points"]
const _hoisted_87 = {
  key: 0,
  class: "trend-hover-layer"
}
const _hoisted_88 = ["x1", "x2"]
const _hoisted_89 = ["cx", "cy"]
const _hoisted_90 = ["cx", "cy"]
const _hoisted_91 = ["cx", "cy"]
const _hoisted_92 = { class: "chart-time-axis" }
const _hoisted_93 = {
  key: 2,
  class: "chart-empty"
}
const _hoisted_94 = {
  id: "trend-description",
  class: "sr-only",
  "aria-live": "polite"
}
const _hoisted_95 = { class: "two-column" }
const _hoisted_96 = {
  class: "panel",
  "aria-labelledby": "services-title"
}
const _hoisted_97 = { class: "service-list" }
const _hoisted_98 = { class: "service-name" }
const _hoisted_99 = ["title"]
const _hoisted_100 = ["disabled", "onClick"]
const _hoisted_101 = {
  key: 0,
  class: "empty-state"
}
const _hoisted_102 = {
  class: "panel",
  "aria-labelledby": "alerts-title"
}
const _hoisted_103 = { class: "panel-head compact" }
const _hoisted_104 = { class: "alert-list" }
const _hoisted_105 = {
  key: 0,
  class: "empty-state success"
}

return function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock(_Fragment, null, [
    _createElementVNode("header", _hoisted_1, [
      _cache[24] || (_cache[24] = _createElementVNode("div", { class: "brand" }, [
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
        _cache[23] || (_cache[23] = _createElementVNode("span", {
          class: "live-dot",
          "aria-hidden": "true"
        }, null, -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_3, "最后更新 " + _toDisplayString(_ctx.updatedAt || "等待数据"), 1 /* TEXT */),
        _createElementVNode("button", {
          type: "button",
          class: "ghost-button",
          onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.openUserPanel && _ctx.openUserPanel(...args)))
        }, _toDisplayString(_ctx.currentUser ? _ctx.currentUser : "登录"), 1 /* TEXT */),
        _createElementVNode("button", {
          type: "button",
          class: "ghost-button",
          onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.saveToken && _ctx.saveToken(...args)))
        }, "管理令牌"),
        _createElementVNode("button", {
          type: "button",
          class: "primary-button",
          disabled: _ctx.loading,
          "aria-busy": _ctx.loading,
          onClick: _cache[2] || (_cache[2] = (...args) => (_ctx.refresh && _ctx.refresh(...args)))
        }, _toDisplayString(_ctx.loading ? "刷新中" : "刷新"), 9 /* TEXT, PROPS */, _hoisted_4)
      ])
    ]),
    _createCommentVNode(" 登录弹窗 "),
    (_ctx.showLogin)
      ? (_openBlock(), _createElementBlock("div", {
          key: 0,
          class: "modal-mask",
          onClick: _cache[8] || (_cache[8] = _withModifiers((...args) => (_ctx.closeLogin && _ctx.closeLogin(...args)), ["self"]))
        }, [
          _createElementVNode("div", _hoisted_5, [
            _createElementVNode("div", _hoisted_6, [
              _cache[25] || (_cache[25] = _createElementVNode("h2", { id: "login-title" }, "登录", -1 /* CACHED */)),
              _createElementVNode("button", {
                type: "button",
                class: "modal-close",
                "aria-label": "关闭",
                onClick: _cache[3] || (_cache[3] = (...args) => (_ctx.closeLogin && _ctx.closeLogin(...args)))
              }, "×")
            ]),
            _createElementVNode("form", {
              class: "modal-body",
              onSubmit: _cache[7] || (_cache[7] = _withModifiers((...args) => (_ctx.submitLogin && _ctx.submitLogin(...args)), ["prevent"]))
            }, [
              _createElementVNode("label", _hoisted_7, [
                _cache[26] || (_cache[26] = _createElementVNode("span", null, "用户名", -1 /* CACHED */)),
                _withDirectives(_createElementVNode("input", {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.loginForm.username) = $event)),
                  type: "text",
                  autocomplete: "username",
                  placeholder: "Admin",
                  required: ""
                }, null, 512 /* NEED_PATCH */), [
                  [_vModelText, _ctx.loginForm.username]
                ])
              ]),
              _createElementVNode("label", _hoisted_8, [
                _cache[27] || (_cache[27] = _createElementVNode("span", null, "密码", -1 /* CACHED */)),
                _withDirectives(_createElementVNode("input", {
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.loginForm.password) = $event)),
                  type: "password",
                  autocomplete: "current-password",
                  placeholder: "••••••",
                  required: ""
                }, null, 512 /* NEED_PATCH */), [
                  [_vModelText, _ctx.loginForm.password]
                ])
              ]),
              (_ctx.loginError)
                ? (_openBlock(), _createElementBlock("p", _hoisted_9, _toDisplayString(_ctx.loginError), 1 /* TEXT */))
                : _createCommentVNode("v-if", true),
              _createElementVNode("div", _hoisted_10, [
                _createElementVNode("button", {
                  type: "button",
                  class: "ghost-button",
                  onClick: _cache[6] || (_cache[6] = (...args) => (_ctx.closeLogin && _ctx.closeLogin(...args)))
                }, "取消"),
                _createElementVNode("button", {
                  type: "submit",
                  class: "primary-button",
                  disabled: _ctx.loginBusy
                }, _toDisplayString(_ctx.loginBusy ? "登录中…" : "登录"), 9 /* TEXT, PROPS */, _hoisted_11)
              ])
            ], 32 /* NEED_HYDRATION */)
          ])
        ]))
      : _createCommentVNode("v-if", true),
    _createCommentVNode(" 用户管理弹窗 "),
    (_ctx.showUserPanel)
      ? (_openBlock(), _createElementBlock("div", {
          key: 1,
          class: "modal-mask",
          onClick: _cache[16] || (_cache[16] = _withModifiers((...args) => (_ctx.closeUserPanel && _ctx.closeUserPanel(...args)), ["self"]))
        }, [
          _createElementVNode("div", _hoisted_12, [
            _createElementVNode("div", _hoisted_13, [
              _cache[28] || (_cache[28] = _createElementVNode("h2", { id: "user-panel-title" }, "用户管理", -1 /* CACHED */)),
              _createElementVNode("button", {
                type: "button",
                class: "modal-close",
                "aria-label": "关闭",
                onClick: _cache[9] || (_cache[9] = (...args) => (_ctx.closeUserPanel && _ctx.closeUserPanel(...args)))
              }, "×")
            ]),
            _createElementVNode("div", _hoisted_14, [
              (_ctx.currentUser)
                ? (_openBlock(), _createElementBlock("div", _hoisted_15, [
                    _cache[29] || (_cache[29] = _createElementVNode("span", { class: "user-info-label" }, "当前用户", -1 /* CACHED */)),
                    _createElementVNode("strong", null, _toDisplayString(_ctx.currentUser), 1 /* TEXT */)
                  ]))
                : _createCommentVNode("v-if", true),
              (_ctx.currentUser)
                ? (_openBlock(), _createElementBlock("form", {
                    key: 1,
                    class: "modal-form",
                    onSubmit: _cache[13] || (_cache[13] = _withModifiers((...args) => (_ctx.submitChangePassword && _ctx.submitChangePassword(...args)), ["prevent"]))
                  }, [
                    _cache[33] || (_cache[33] = _createElementVNode("h3", { class: "modal-subtitle" }, "更改密码", -1 /* CACHED */)),
                    _createElementVNode("label", _hoisted_16, [
                      _cache[30] || (_cache[30] = _createElementVNode("span", null, "原密码", -1 /* CACHED */)),
                      _withDirectives(_createElementVNode("input", {
                        "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.passwordForm.oldPassword) = $event)),
                        type: "password",
                        autocomplete: "current-password",
                        required: ""
                      }, null, 512 /* NEED_PATCH */), [
                        [_vModelText, _ctx.passwordForm.oldPassword]
                      ])
                    ]),
                    _createElementVNode("label", _hoisted_17, [
                      _cache[31] || (_cache[31] = _createElementVNode("span", null, "新密码（至少 6 位）", -1 /* CACHED */)),
                      _withDirectives(_createElementVNode("input", {
                        "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((_ctx.passwordForm.newPassword) = $event)),
                        type: "password",
                        autocomplete: "new-password",
                        minlength: "6",
                        required: ""
                      }, null, 512 /* NEED_PATCH */), [
                        [_vModelText, _ctx.passwordForm.newPassword]
                      ])
                    ]),
                    _createElementVNode("label", _hoisted_18, [
                      _cache[32] || (_cache[32] = _createElementVNode("span", null, "确认新密码", -1 /* CACHED */)),
                      _withDirectives(_createElementVNode("input", {
                        "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((_ctx.passwordForm.confirmPassword) = $event)),
                        type: "password",
                        autocomplete: "new-password",
                        minlength: "6",
                        required: ""
                      }, null, 512 /* NEED_PATCH */), [
                        [_vModelText, _ctx.passwordForm.confirmPassword]
                      ])
                    ]),
                    (_ctx.passwordError)
                      ? (_openBlock(), _createElementBlock("p", _hoisted_19, _toDisplayString(_ctx.passwordError), 1 /* TEXT */))
                      : _createCommentVNode("v-if", true),
                    (_ctx.passwordSuccess)
                      ? (_openBlock(), _createElementBlock("p", _hoisted_20, _toDisplayString(_ctx.passwordSuccess), 1 /* TEXT */))
                      : _createCommentVNode("v-if", true),
                    _createElementVNode("div", _hoisted_21, [
                      _createElementVNode("button", {
                        type: "submit",
                        class: "primary-button",
                        disabled: _ctx.passwordBusy
                      }, _toDisplayString(_ctx.passwordBusy ? "保存中…" : "更改密码"), 9 /* TEXT, PROPS */, _hoisted_22)
                    ])
                  ], 32 /* NEED_HYDRATION */))
                : _createCommentVNode("v-if", true),
              _createElementVNode("div", _hoisted_23, [
                _createElementVNode("button", {
                  type: "button",
                  class: "ghost-button",
                  onClick: _cache[14] || (_cache[14] = (...args) => (_ctx.saveToken && _ctx.saveToken(...args)))
                }, "管理令牌"),
                _createElementVNode("button", {
                  type: "button",
                  class: "danger-button",
                  disabled: _ctx.logoutBusy,
                  onClick: _cache[15] || (_cache[15] = (...args) => (_ctx.logout && _ctx.logout(...args)))
                }, _toDisplayString(_ctx.logoutBusy ? "退出中…" : "退出登录"), 9 /* TEXT, PROPS */, _hoisted_24)
              ])
            ])
          ])
        ]))
      : _createCommentVNode("v-if", true),
    _createElementVNode("main", _hoisted_25, [
      _createElementVNode("section", _hoisted_26, [
        _createElementVNode("div", null, [
          _cache[34] || (_cache[34] = _createElementVNode("div", { class: "eyebrow" }, "SYSTEM OVERVIEW", -1 /* CACHED */)),
          _cache[35] || (_cache[35] = _createElementVNode("div", { class: "hero-heading" }, [
            _createElementVNode("h1", { id: "page-title" }, "轻量服务器监控系统"),
            _createElementVNode("span", { class: "environment-badge" }, "LIGHTOPS")
          ], -1 /* CACHED */)),
          _createElementVNode("p", _hoisted_27, [
            _createElementVNode("span", null, _toDisplayString(_ctx.host.cloud_provider || "云服务器"), 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.formatHardwareCapacity(_ctx.host.memory_total)) + " 内存", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.formatHardwareCapacity(_ctx.host.disk_total)) + " 系统盘", 1 /* TEXT */),
            _createElementVNode("span", null, _toDisplayString(_ctx.host.os_name || "Linux"), 1 /* TEXT */)
          ])
        ]),
        _createElementVNode("div", _hoisted_28, [
          _createElementVNode("div", {
            class: _normalizeClass(["weather-emblem", 'weather-' + (_ctx.weatherKind || 'idle')])
          }, [
            _createElementVNode("div", {
              class: "weather-emblem-icon",
              style: _normalizeStyle({ '--qi-url': 'url(/icons/weather-' + (_ctx.qweatherCode || 150) + '.svg)' }),
              title: _ctx.weather ? (_ctx.weather.location_label || _ctx.weatherLabel) : '每日天气',
              "aria-hidden": "true"
            }, null, 12 /* STYLE, PROPS */, _hoisted_29),
            (_ctx.weather)
              ? (_openBlock(), _createElementBlock("div", _hoisted_30, [
                  _createElementVNode("strong", null, _toDisplayString(_ctx.formatTemperature(_ctx.weather.current.temperature)), 1 /* TEXT */),
                  _createElementVNode("span", null, _toDisplayString(_ctx.weatherLabel), 1 /* TEXT */),
                  (_ctx.weatherTip)
                    ? (_openBlock(), _createElementBlock("span", _hoisted_31, _toDisplayString(_ctx.weatherTip), 1 /* TEXT */))
                    : _createCommentVNode("v-if", true)
                ]))
              : (_openBlock(), _createElementBlock("div", _hoisted_32, [
                  _cache[36] || (_cache[36] = _createElementVNode("strong", null, "--°", -1 /* CACHED */)),
                  _createElementVNode("span", null, _toDisplayString(_ctx.weatherLoading ? "查询中" : (_ctx.weatherError || "选择城市查看天气")), 1 /* TEXT */)
                ])),
            (_ctx.weather && _ctx.weatherCandidates.length > 1)
              ? (_openBlock(), _createElementBlock("div", _hoisted_33, [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.weatherCandidates, (candidate) => {
                    return (_openBlock(), _createElementBlock("button", {
                      key: candidate.label,
                      type: "button",
                      class: _normalizeClass(["weather-district-tag", { active: candidate.label === _ctx.activeCandidateLabel }]),
                      disabled: _ctx.weatherLoading,
                      onClick: $event => (_ctx.pickDistrict(candidate))
                    }, _toDisplayString(candidate.label.split("-").slice(-1)[0]), 11 /* TEXT, CLASS, PROPS */, _hoisted_34))
                  }), 128 /* KEYED_FRAGMENT */))
                ]))
              : _createCommentVNode("v-if", true)
          ], 2 /* CLASS */),
          _createElementVNode("div", _hoisted_35, [
            _createElementVNode("div", _hoisted_36, _toDisplayString(_ctx.weather ? _ctx.weather.location_label : "选择城市查看天气"), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_37, [
              _withDirectives(_createElementVNode("input", {
                class: "weather-picker-input",
                type: "text",
                "onUpdate:modelValue": _cache[17] || (_cache[17] = $event => ((_ctx.weatherPlace) = $event)),
                onKeyup: _cache[18] || (_cache[18] = _withKeys((...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)), ["enter"])),
                disabled: _ctx.weatherLoading,
                placeholder: "输入城市名，如 北京",
                "aria-label": "城市名称"
              }, null, 40 /* PROPS, NEED_HYDRATION */, _hoisted_38), [
                [_vModelText, _ctx.weatherPlace]
              ]),
              _createElementVNode("button", {
                type: "button",
                class: "weather-picker-btn",
                disabled: _ctx.weatherLoading,
                onClick: _cache[19] || (_cache[19] = (...args) => (_ctx.searchWeather && _ctx.searchWeather(...args)))
              }, "查询", 8 /* PROPS */, _hoisted_39)
            ])
          ])
        ]),
        _createElementVNode("div", _hoisted_40, [
          _createElementVNode("div", _hoisted_41, [
            _createElementVNode("span", {
              class: _normalizeClass(["status-badge", { healthy: _ctx.updatedAt && !_ctx.error, pending: !_ctx.updatedAt && !_ctx.error }]),
              role: "status",
              "aria-live": "polite"
            }, _toDisplayString(_ctx.error ? "数据异常" : (_ctx.updatedAt ? "系统运行中" : "正在连接")), 3 /* TEXT, CLASS */),
            _createElementVNode("span", _hoisted_42, _toDisplayString(_ctx.summary.version ? "v" + _ctx.summary.version : "版本加载中"), 1 /* TEXT */)
          ]),
          _createElementVNode("span", _hoisted_43, [
            _cache[37] || (_cache[37] = _createElementVNode("svg", {
              class: "uptime-glyph",
              width: "12",
              height: "12",
              viewBox: "0 0 16 16",
              fill: "none",
              "aria-hidden": "true"
            }, [
              _createElementVNode("circle", {
                cx: "8",
                cy: "8",
                r: "6.5",
                stroke: "currentColor",
                "stroke-width": "1.4"
              }),
              _createElementVNode("path", {
                d: "M8 4.5 V8 L10.4 9.6",
                stroke: "currentColor",
                "stroke-width": "1.4",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              })
            ], -1 /* CACHED */)),
            _createTextVNode(" 已运行 " + _toDisplayString(_ctx.uptimeLabel || "加载中"), 1 /* TEXT */)
          ])
        ])
      ]),
      (_ctx.error)
        ? (_openBlock(), _createElementBlock("div", _hoisted_44, _toDisplayString(_ctx.error), 1 /* TEXT */))
        : _createCommentVNode("v-if", true),
      _createElementVNode("section", _hoisted_45, [
        _createElementVNode("article", _hoisted_46, [
          _createElementVNode("div", _hoisted_47, [
            _cache[38] || (_cache[38] = _createElementVNode("div", { class: "metric-label" }, "处理器负载", -1 /* CACHED */)),
            _createElementVNode("span", _hoisted_48, _toDisplayString(_ctx.host.cpu_count || "--") + " 核 CPU", 1 /* TEXT */),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.cpuStatusClass])
            }, _toDisplayString(_ctx.cpuStatus), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_49, [
            _createElementVNode("div", _hoisted_50, _toDisplayString(_ctx.formatPercent(_ctx.metric.cpu_percent)), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_51, [
              _createElementVNode("div", _hoisted_52, [
                _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_1)), 1 /* TEXT */),
                _cache[39] || (_cache[39] = _createElementVNode("small", null, "1分", -1 /* CACHED */))
              ]),
              _cache[42] || (_cache[42] = _createElementVNode("span", {
                class: "load-average-sep",
                "aria-hidden": "true"
              }, "·", -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_53, [
                _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_5)), 1 /* TEXT */),
                _cache[40] || (_cache[40] = _createElementVNode("small", null, "5分", -1 /* CACHED */))
              ]),
              _cache[43] || (_cache[43] = _createElementVNode("span", {
                class: "load-average-sep",
                "aria-hidden": "true"
              }, "·", -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_54, [
                _createElementVNode("strong", null, _toDisplayString(_ctx.formatLoad(_ctx.metric.load_15)), 1 /* TEXT */),
                _cache[41] || (_cache[41] = _createElementVNode("small", null, "15分", -1 /* CACHED */))
              ])
            ])
          ]),
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
          ], 8 /* PROPS */, _hoisted_55),
          _cache[44] || (_cache[44] = _createElementVNode("div", { class: "metric-foot" }, "当前整体 CPU 占用", -1 /* CACHED */))
        ]),
        _createElementVNode("article", _hoisted_56, [
          _createElementVNode("div", _hoisted_57, [
            _cache[45] || (_cache[45] = _createElementVNode("div", { class: "metric-label" }, "内存使用情况", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.memory_percent)])
            }, _toDisplayString(_ctx.statusLabel(_ctx.metric.memory_percent)), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_58, [
            _createElementVNode("div", _hoisted_59, _toDisplayString(_ctx.formatPercent(_ctx.metric.memory_percent)), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_60, [
              _createElementVNode("strong", null, _toDisplayString(_ctx.formatBytes(_ctx.host.memory_used)), 1 /* TEXT */),
              _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatBytes(_ctx.host.memory_total)), 1 /* TEXT */)
            ])
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
          ], 8 /* PROPS */, _hoisted_61),
          _createElementVNode("div", _hoisted_62, "当前可用 " + _toDisplayString(_ctx.formatBytes(_ctx.host.memory_available)), 1 /* TEXT */)
        ]),
        _createElementVNode("article", _hoisted_63, [
          _createElementVNode("div", _hoisted_64, [
            _cache[46] || (_cache[46] = _createElementVNode("div", { class: "metric-label" }, "系统盘使用情况", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["metric-state", _ctx.statusClass(_ctx.metric.disk_percent)])
            }, _toDisplayString(_ctx.statusLabel(_ctx.metric.disk_percent)), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_65, [
            _createElementVNode("div", _hoisted_66, _toDisplayString(_ctx.formatPercent(_ctx.metric.disk_percent)), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_67, [
              _createElementVNode("strong", null, _toDisplayString(_ctx.formatBytes(_ctx.host.disk_used)), 1 /* TEXT */),
              _createElementVNode("span", null, "/ " + _toDisplayString(_ctx.formatBytes(_ctx.host.disk_total)), 1 /* TEXT */)
            ])
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
          ], 8 /* PROPS */, _hoisted_68),
          _createElementVNode("div", _hoisted_69, "剩余空间 " + _toDisplayString(_ctx.formatBytes(_ctx.host.disk_free)), 1 /* TEXT */)
        ]),
        _createElementVNode("article", _hoisted_70, [
          _createElementVNode("div", _hoisted_71, [
            _cache[47] || (_cache[47] = _createElementVNode("div", { class: "metric-label" }, "活动告警", -1 /* CACHED */)),
            _createElementVNode("span", {
              class: _normalizeClass(["alert-summary", { clear: _ctx.alerts.length === 0 }])
            }, _toDisplayString(_ctx.alerts.length ? "需要关注" : "当前无异常"), 3 /* TEXT, CLASS */)
          ]),
          _createElementVNode("div", _hoisted_72, [
            _createElementVNode("div", _hoisted_73, _toDisplayString(_ctx.alerts.length), 1 /* TEXT */)
          ]),
          _createElementVNode("div", {
            class: "progress-track",
            role: "progressbar",
            "aria-label": "服务健康率",
            "aria-valuemin": "0",
            "aria-valuemax": "100",
            "aria-valuenow": _ctx.services.length ? Math.round(_ctx.servicesUp / _ctx.services.length * 100) : 0,
            "aria-valuetext": (_ctx.services.length ? Math.round(_ctx.servicesUp / _ctx.services.length * 100) : 0) + '%'
          }, [
            _createElementVNode("span", {
              style: _normalizeStyle({ width: _ctx.services.length ? (_ctx.servicesUp / _ctx.services.length * 100) + '%' : '0%' })
            }, null, 4 /* STYLE */)
          ], 8 /* PROPS */, _hoisted_74),
          _createElementVNode("div", _hoisted_75, _toDisplayString(_ctx.servicesUp) + " / " + _toDisplayString(_ctx.services.length) + " 服务正常", 1 /* TEXT */)
        ])
      ]),
      _createElementVNode("section", _hoisted_76, [
        _createElementVNode("div", _hoisted_77, [
          _cache[48] || (_cache[48] = _createElementVNode("div", null, [
            _createElementVNode("div", { class: "eyebrow" }, "RESOURCE TREND"),
            _createElementVNode("h2", { id: "trend-title" }, "资源趋势")
          ], -1 /* CACHED */)),
          _createElementVNode("div", _hoisted_78, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.ranges, (item) => {
              return (_openBlock(), _createElementBlock("button", {
                type: "button",
                key: item.value,
                class: _normalizeClass({ active: _ctx.range === item.value }),
                "aria-pressed": _ctx.range === item.value,
                onClick: $event => (_ctx.setRange(item.value))
              }, _toDisplayString(item.label), 11 /* TEXT, CLASS, PROPS */, _hoisted_79))
            }), 128 /* KEYED_FRAGMENT */))
          ])
        ]),
        _createElementVNode("div", _hoisted_80, [
          _createElementVNode("span", null, [
            _createElementVNode("strong", null, _toDisplayString(_ctx.history.length), 1 /* TEXT */),
            _cache[49] || (_cache[49] = _createTextVNode(" 个采样点"))
          ]),
          _cache[50] || (_cache[50] = _createElementVNode("span", null, "每 60 秒采集一次", -1 /* CACHED */)),
          _cache[51] || (_cache[51] = _createElementVNode("span", { class: "trend-legend" }, [
            _createElementVNode("i", { class: "cpu" }),
            _createTextVNode("CPU "),
            _createElementVNode("i", { class: "memory" }),
            _createTextVNode("内存 "),
            _createElementVNode("i", { class: "disk" }),
            _createTextVNode("磁盘 ")
          ], -1 /* CACHED */))
        ]),
        (_ctx.history.length)
          ? (_openBlock(), _createElementBlock("div", _hoisted_81, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.trendCards, (card) => {
                return (_openBlock(), _createElementBlock("div", {
                  key: card.key,
                  class: "trend-stat-card"
                }, [
                  _createElementVNode("div", _hoisted_82, [
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
              onMousemove: _cache[20] || (_cache[20] = (...args) => (_ctx.updateTrendHover && _ctx.updateTrendHover(...args))),
              onMouseleave: _cache[21] || (_cache[21] = (...args) => (_ctx.clearTrendHover && _ctx.clearTrendHover(...args)))
            }, [
              _cache[56] || (_cache[56] = _createElementVNode("div", { class: "chart-y-axis" }, [
                _createElementVNode("span", null, "100%"),
                _createElementVNode("span", null, "75%"),
                _createElementVNode("span", null, "50%"),
                _createElementVNode("span", null, "25%"),
                _createElementVNode("span", null, "0%")
              ], -1 /* CACHED */)),
              (_openBlock(), _createElementBlock("svg", _hoisted_83, [
                _cache[52] || (_cache[52] = _createStaticVNode("<g class=\"trend-grid\"><line x1=\"0\" y1=\"0\" x2=\"1000\" y2=\"0\"></line><line x1=\"0\" y1=\"65\" x2=\"1000\" y2=\"65\"></line><line x1=\"0\" y1=\"130\" x2=\"1000\" y2=\"130\"></line><line x1=\"0\" y1=\"195\" x2=\"1000\" y2=\"195\"></line><line x1=\"0\" y1=\"260\" x2=\"1000\" y2=\"260\"></line></g>", 1)),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('cpu_percent'),
                  class: "trend-line cpu"
                }, null, 8 /* PROPS */, _hoisted_84),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('memory_percent'),
                  class: "trend-line memory"
                }, null, 8 /* PROPS */, _hoisted_85),
                _createElementVNode("polyline", {
                  points: _ctx.chartPoints('disk_percent'),
                  class: "trend-line disk"
                }, null, 8 /* PROPS */, _hoisted_86),
                (_ctx.trendHover)
                  ? (_openBlock(), _createElementBlock("g", _hoisted_87, [
                      _createElementVNode("line", {
                        x1: _ctx.trendHover.x,
                        y1: "0",
                        x2: _ctx.trendHover.x,
                        y2: "260",
                        class: "trend-hover-line"
                      }, null, 8 /* PROPS */, _hoisted_88),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.cpuY,
                        r: "5",
                        class: "trend-hover-point cpu"
                      }, null, 8 /* PROPS */, _hoisted_89),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.memoryY,
                        r: "5",
                        class: "trend-hover-point memory"
                      }, null, 8 /* PROPS */, _hoisted_90),
                      _createElementVNode("circle", {
                        cx: _ctx.trendHover.x,
                        cy: _ctx.trendHover.diskY,
                        r: "5",
                        class: "trend-hover-point disk"
                      }, null, 8 /* PROPS */, _hoisted_91)
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
                      _cache[53] || (_cache[53] = _createElementVNode("i", { class: "cpu" }, null, -1 /* CACHED */)),
                      _createTextVNode("CPU " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.cpu)), 1 /* TEXT */)
                    ]),
                    _createElementVNode("span", null, [
                      _cache[54] || (_cache[54] = _createElementVNode("i", { class: "memory" }, null, -1 /* CACHED */)),
                      _createTextVNode("内存 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.memory)), 1 /* TEXT */)
                    ]),
                    _createElementVNode("span", null, [
                      _cache[55] || (_cache[55] = _createElementVNode("i", { class: "disk" }, null, -1 /* CACHED */)),
                      _createTextVNode("磁盘 " + _toDisplayString(_ctx.formatPercent(_ctx.trendHover.disk)), 1 /* TEXT */)
                    ])
                  ], 4 /* STYLE */))
                : _createCommentVNode("v-if", true),
              _createElementVNode("div", _hoisted_92, [
                _createElementVNode("span", null, _toDisplayString(_ctx.trendStartLabel), 1 /* TEXT */),
                _createElementVNode("span", null, _toDisplayString(_ctx.trendEndLabel), 1 /* TEXT */)
              ])
            ], 32 /* NEED_HYDRATION */))
          : (_openBlock(), _createElementBlock("div", _hoisted_93, " 正在等待这个时间范围内的监控数据 ")),
        _createElementVNode("p", _hoisted_94, _toDisplayString(_ctx.trendDescription), 1 /* TEXT */)
      ]),
      _createElementVNode("section", _hoisted_95, [
        _createElementVNode("article", _hoisted_96, [
          _cache[57] || (_cache[57] = _createElementVNode("div", { class: "panel-head compact" }, [
            _createElementVNode("div", null, [
              _createElementVNode("div", { class: "eyebrow" }, "SERVICE HEALTH"),
              _createElementVNode("h2", { id: "services-title" }, "服务状态")
            ])
          ], -1 /* CACHED */)),
          _createElementVNode("div", _hoisted_97, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.services, (service) => {
              return (_openBlock(), _createElementBlock("div", {
                key: service.service,
                class: "service-row"
              }, [
                _createElementVNode("div", _hoisted_98, [
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
                          }, " [" + _toDisplayString(service.buckets.join(', ')) + "]", 9 /* TEXT, PROPS */, _hoisted_99))
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
                }, _toDisplayString(_ctx.restartBusy === service.service ? "处理中" : "重启"), 9 /* TEXT, PROPS */, _hoisted_100)
              ]))
            }), 128 /* KEYED_FRAGMENT */)),
            (!_ctx.services.length)
              ? (_openBlock(), _createElementBlock("div", _hoisted_101, "等待服务采样"))
              : _createCommentVNode("v-if", true)
          ])
        ]),
        _createElementVNode("article", _hoisted_102, [
          _createElementVNode("div", _hoisted_103, [
            _cache[58] || (_cache[58] = _createElementVNode("div", null, [
              _createElementVNode("div", { class: "eyebrow" }, "ACTIVE ALERTS"),
              _createElementVNode("h2", { id: "alerts-title" }, "当前告警")
            ], -1 /* CACHED */)),
            _createElementVNode("button", {
              type: "button",
              class: "text-button",
              onClick: _cache[22] || (_cache[22] = (...args) => (_ctx.runMaintenance && _ctx.runMaintenance(...args)))
            }, "立即备份")
          ]),
          _createElementVNode("div", _hoisted_104, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.alerts, (alert) => {
              return (_openBlock(), _createElementBlock("div", {
                key: alert.id,
                class: "alert-row"
              }, [
                _cache[59] || (_cache[59] = _createElementVNode("span", { class: "alert-icon" }, "!", -1 /* CACHED */)),
                _createElementVNode("div", null, [
                  _createElementVNode("strong", null, _toDisplayString(alert.message), 1 /* TEXT */),
                  _createElementVNode("small", null, _toDisplayString(_ctx.formatTime(alert.created_at)), 1 /* TEXT */)
                ])
              ]))
            }), 128 /* KEYED_FRAGMENT */)),
            (!_ctx.alerts.length)
              ? (_openBlock(), _createElementBlock("div", _hoisted_105, _cache[60] || (_cache[60] = [
                  _createElementVNode("span", null, "✓", -1 /* CACHED */),
                  _createTextVNode(" 当前没有活动告警 ")
                ])))
              : _createCommentVNode("v-if", true)
          ])
        ])
      ]),
      _cache[61] || (_cache[61] = _createElementVNode("footer", null, [
        _createElementVNode("span", null, "LightOps · FastAPI / Vue 3 / SVG"),
        _createElementVNode("span", null, "指标每 60 秒采集 · 保留 7 天")
      ], -1 /* CACHED */))
    ])
  ], 64 /* STABLE_FRAGMENT */))
}
})(window.Vue);
