//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/**
 * @author Remy Kooistra
 * @email <remy.kooistra.km@gmail.com>
 * @description This module will dynamically put together
 * tables and works with static content - so no AJAX.
 * For extra information check the
 * `/docs/Modules/VueJS/FilterableTable.md` file.
 */
var script = {
    name: "FilterableTable",
    props : {
        idKey : {
            type : String,
            default: function default$1 () {
                return 'id';
            }
        },
        resources : {
            type : Array,
            default: function default$2 () {
                return [];
            }
        },
        // The keys that will be turned into filters.
        filterables : {
            type : Array,
            default: function default$3 () {
                // [{key : String, display_name : String}]
                return [];
            }
        },
        // The keys of a resource which can
        // be searched for by text-input.
        searchables : {
            type : Array,
            default: function default$4 () {
                // [String [, ...]] [Optional : [type : String, default text]]
                return [];
            }
        },
        // Which data should be shown.
        tableKeys : {
            type : Array,
            default: function default$5 () {
                return [
                    {key : 'id', display_name : 'Database ID'}
                ];
            }
        },
        // Show an icon on specific conditions.
        conditionalIcons : {
            type : Array,
            default: function default$6 () {
                return [];
            }
        },
        // The action routes/icons to be displayed.
        actions : {
            type : Array,
            default: function default$7 () {
                return [];
            }
        }
    },
    data: function data () {
        return {
            currentProductPage : 1,
            chunkSize : 50,
            filters : {},
            queries : {},
            hiddenPanels : {
                filterables : false,
                searchables : false
            },
            state : {
                orderable: {
                    key : null,
                    direction : 'asc'
                }
            }
        }
    },
    computed : {
        resourcesWithFilterApplied: function resourcesWithFilterApplied () {
            return this.applyFilters(this.resources);
        },
        chunkedProductResources: function chunkedProductResources () {
            return _.chunk(this.resourcesWithFilterApplied, this.chunkSize);
        },
        currentProductPageResources: function currentProductPageResources () {
            return this.chunkedProductResources[this.currentProductPage-1] || [];
        },
        hasFilterables: function hasFilterables () {
            return 0 < Object.keys(this.filterables).length;
        },
        hasSearchables: function hasSearchables () {
            return 0 < this.searchables.length;
        },
        shouldHaveLabelColumn: function shouldHaveLabelColumn () {
            return 0 < this.conditionalIcons.length;
        },
        hasActions: function hasActions () {
            return 0 < this.actions.length;
        }
    },
    methods : {
        executeConfirmable: function executeConfirmable (action, redirectRoute) {
            if (!action.hasOwnProperty('confirm')) {
                this.redirectWindowToRoute(redirectRoute);
                return true;
            }
            var _confirm = confirm(action.confirmMessage);
            if (!_confirm) { return true; }
            this.redirectWindowToRoute(redirectRoute);
        },
        redirectWindowToRoute: function redirectWindowToRoute (route) {
            axios.get(route, {_method: 'DELETE'})
                .then(function (response) {
                    alert('Het item is verwijderd, ververs de pagina om de veranderingen te zien.');
                }).catch(function (exception) {
                alert('Er is een fout opgetreden!');
                console.error(exception);
            });
        },
        canActionBeDisplayed: function canActionBeDisplayed(row, action) {
            if (!action.hasOwnProperty('conditionals')) { return true; }
            var _mayDisplay = true;
            action.conditionals.forEach(function (condition) {
                if (row[condition.key] != condition.value) { _mayDisplay = false; }
            });
            return _mayDisplay;
        },
        generateActionRoute: function generateActionRoute (action, row) {
            if (!action.appendable && !action.replaceable) { return action.route; }
            if (action.appendable && !action.replaceable) { return action.route+row[this.idKey]; }
            if (!action.appendable && action.replaceable) { return action.route.replace('/0', '/'+row[this.idKey]); }
        },
        applyLabelConditionsAndGetLabelDOM: function applyLabelConditionsAndGetLabelDOM(row) {
            var _dom = "";
            this.conditionalIcons.forEach(function (condition) {
                if (row[condition.key] == condition.whenValue) {
                    _dom += "<span class='icon' title='"+condition.title+"'>" +
                        "<i class='"+condition.icon+" "+condition.class+"'></i>" +
                        "</span>";
                }
            });
            return _dom;
        },
        toggleFilter: function toggleFilter (key, filterValue, refKey) {
            var _refKey = refKey || key;
            var buttonDOM = $(this.$refs[_refKey]);
            var buttonIcon = buttonDOM.find('.icon > i');
            var offClass = 'is-light';
            var onClass = 'is-light';

            if (this.filters.hasOwnProperty(_refKey)) {
                Vue.delete(this.$data.filters, _refKey);
                buttonDOM.removeClass(onClass);
                buttonDOM.addClass(offClass);
                buttonIcon.removeClass('fa-toggle-on');
                buttonIcon.addClass('fa-toggle-off');
                return;
            }
            Vue.set(this.$data.filters, _refKey, {key: key, value : filterValue});
            // Vue.set(this.$data.filters, _refKey, filterValue);

            buttonDOM.removeClass(offClass);
            buttonDOM.addClass(onClass);
            buttonIcon.removeClass('fa-toggle-off');
            buttonIcon.addClass('fa-toggle-on');
        },

        applyFilters: function applyFilters (resources) {
            var _resources = resources;
            var _filters = this.filters;
            var _orderable = this.state.orderable;

            // Apply all filterables.
            Object.keys(_filters).forEach(function (key) {
                var _row = _filters[key];
                _resources = _resources.filter(function (row) {
                    return row[_row.key] == _row.value;
                });
            });

            // Apply all searchables.
            var _searchables = this.searchables;
            var _queries = this.queries;
            _searchables.forEach(function (searchable) {
                _resources = _resources.filter(function (row) {
                    var _queryValue = _queries[searchable.key];
                    if (!_queryValue) { return true; }
                    if (!row[searchable.key]) { return false; }

                    if ($.isNumeric(_queryValue)) {
                        // Match value on numeric comparisons.
                        return parseInt(row[searchable.key]) === parseInt(_queryValue);
                    } else {
                        // See if the query applies even a bit.
                        return -1 < row[searchable.key].toLowerCase()
                            .indexOf(_queryValue.toLowerCase());
                    }
                });
            });

            _resources.sort(this._sortOrderableByKeyAndDirection);
            return _resources;
        },
        _sortOrderableByKeyAndDirection: function _sortOrderableByKeyAndDirection(a,b) {
            if (this.state.orderable.direction.toLowerCase() === 'asc') {
                if (a[this.state.orderable.key] < b[this.state.orderable.key] )
                    { return -1; }
                if (a[this.state.orderable.key]  > b[this.state.orderable.key] )
                    { return 1; }
                return 0;
            } else {
                if (a[this.state.orderable.key] < b[this.state.orderable.key] )
                    { return 1; }
                if (a[this.state.orderable.key]  > b[this.state.orderable.key] )
                    { return -1; }
                return 0;
            }
        },
        previousPage: function previousPage () {
            if (1 === this.currentProductPage) { return; }
            this.currentProductPage--;
        },
        nextPage: function nextPage () {
            if (this.chunkedProductResources.length === this.currentProductPage) { return; }
            this.currentProductPage++;
        },
        followMaxPossiblePageOnShrink: function followMaxPossiblePageOnShrink () {
            if (this.currentProductPage > this.chunkedProductResources.length) {
                this.currentProductPage = this.chunkedProductResources.length;
            }
        },
        handleColumnOrderClick: function handleColumnOrderClick (columnKey) {
            this._handleOrderStateSwitch(columnKey);
        },
        _handleOrderStateSwitch: function _handleOrderStateSwitch(columnKey) {
            if (this.state.orderable.key === columnKey) {
                var _direction = this.state.orderable.direction.toLowerCase() === 'asc'
                    ? 'desc' : 'asc';
                Vue.set(this.state.orderable, 'direction', _direction);
            } else {
                Vue.set(this.state.orderable, 'key', columnKey);
                Vue.set(this.state.orderable, 'direction', 'asc');
            }
        }
    },
    watch : {
        currentProductPage: function currentProductPage () {
            this.followMaxPossiblePageOnShrink();
            if (this.currentProductPage < 1) {
                this.currentProductPage = 1;
            }
        },
        chunkSize: function chunkSize () {
            this.currentProductPage = 1;
        },
        queries : {
            deep : true,
            handler: function handler () {
                this.followMaxPossiblePageOnShrink();
            }
        }
    },
    created: function created () {
        var this$1 = this;

        this.searchables.forEach(function (row) {
            Vue.set(this$1.$data.queries, row.key, null);
        });
        Vue.set(this.state.orderable, 'key', this.idKey);
    }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function () {
      style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

var normalizeComponent_1 = normalizeComponent;

var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
  return function (id, style) {
    return addStyle(id, style);
  };
}
var HEAD;
var styles = {};

function addStyle(id, css) {
  var group = isOldIE ? css.media || 'default' : id;
  var style = styles[group] || (styles[group] = {
    ids: new Set(),
    styles: []
  });

  if (!style.ids.has(id)) {
    style.ids.add(id);
    var code = css.source;

    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

      code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
    }

    if (!style.element) {
      style.element = document.createElement('style');
      style.element.type = 'text/css';
      if (css.media) { style.element.setAttribute('media', css.media); }

      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0];
      }

      HEAD.appendChild(style.element);
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code);
      style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
    } else {
      var index = style.ids.size - 1;
      var textNode = document.createTextNode(code);
      var nodes = style.element.childNodes;
      if (nodes[index]) { style.element.removeChild(nodes[index]); }
      if (nodes.length) { style.element.insertBefore(textNode, nodes[index]); }else { style.element.appendChild(textNode); }
    }
  }
}

var browser = createInjector;

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "filterable-table" }, [
    _c("div", { staticClass: "level" }, [
      _c("div", { staticClass: "level-left" }, [
        _vm.hasFilterables
          ? _c(
              "button",
              {
                staticClass: "button is-medium",
                class: {
                  "is-primary": _vm.hiddenPanels.filterables,
                  "is-dark": !_vm.hiddenPanels.filterables
                },
                on: {
                  click: function($event) {
                    _vm.hiddenPanels.filterables = !_vm.hiddenPanels.filterables;
                  }
                }
              },
              [_vm._m(0), _vm._v(" "), _c("span", [_vm._v("Filter opties")])]
            )
          : _vm._e()
      ]),
      _vm._v(" "),
      _c("div", { staticClass: "level-right" }, [
        _c("label", { staticClass: "is-bold", attrs: { for: "chunkSize" } }, [
          _vm._v("Aantal weer te geven items")
        ]),
        _vm._v(" "),
        _c("div", { staticClass: "select is-fullwidth" }, [
          _c(
            "select",
            {
              directives: [
                {
                  name: "model",
                  rawName: "v-model",
                  value: _vm.chunkSize,
                  expression: "chunkSize"
                }
              ],
              attrs: { id: "chunkSize" },
              on: {
                change: function($event) {
                  var $$selectedVal = Array.prototype.filter
                    .call($event.target.options, function(o) {
                      return o.selected
                    })
                    .map(function(o) {
                      var val = "_value" in o ? o._value : o.value;
                      return val
                    });
                  _vm.chunkSize = $event.target.multiple
                    ? $$selectedVal
                    : $$selectedVal[0];
                }
              }
            },
            [
              _c("option", { attrs: { value: "50", selected: "" } }, [
                _vm._v("50")
              ]),
              _vm._v(" "),
              _c("option", { attrs: { value: "100" } }, [_vm._v("100")]),
              _vm._v(" "),
              _c("option", { attrs: { value: "250" } }, [_vm._v("250")]),
              _vm._v(" "),
              _c("option", { attrs: { value: "500" } }, [_vm._v("500")]),
              _vm._v(" "),
              _c("option", { attrs: { value: "1000" } }, [_vm._v("1000")])
            ]
          )
        ])
      ])
    ]),
    _vm._v(" "),
    _vm.hasFilterables
      ? _c(
          "div",
          {
            staticClass: "columns",
            class: { "is-hidden": !_vm.hiddenPanels.filterables }
          },
          [
            _c("div", { staticClass: "column" }, [
              _c(
                "div",
                { staticClass: "filter-options menu-card" },
                _vm._l(_vm.filterables, function(filterable) {
                  return _c(
                    "button",
                    {
                      ref: filterable.refKey || filterable.key,
                      refInFor: true,
                      staticClass: "button is-light is-medium",
                      on: {
                        click: function($event) {
                          return _vm.toggleFilter(
                            filterable.key,
                            filterable.filterValue,
                            filterable.refKey
                          )
                        }
                      }
                    },
                    [
                      _vm._m(1, true),
                      _vm._v(" "),
                      _c("span", [_vm._v(_vm._s(filterable.display_name))])
                    ]
                  )
                }),
                0
              )
            ])
          ]
        )
      : _vm._e(),
    _vm._v(" "),
    _vm.hasSearchables
      ? _c("div", { staticClass: "columns is-multiline" }, [
          _vm._m(2),
          _vm._v(" "),
          _c("div", { staticClass: "column is-12" }, [
            _c(
              "div",
              { staticClass: "columns" },
              _vm._l(_vm.searchables, function(searchable) {
                return _c("div", { staticClass: "column" }, [
                  (searchable.hasOwnProperty("type")
                    ? searchable.type
                    : "text") === "checkbox"
                    ? _c("input", {
                        directives: [
                          {
                            name: "model",
                            rawName: "v-model",
                            value: _vm.queries[searchable.key],
                            expression: "queries[searchable.key]"
                          }
                        ],
                        staticClass: "input",
                        attrs: {
                          placeholder: searchable.display_name,
                          type: "checkbox"
                        },
                        domProps: {
                          checked: Array.isArray(_vm.queries[searchable.key])
                            ? _vm._i(_vm.queries[searchable.key], null) > -1
                            : _vm.queries[searchable.key]
                        },
                        on: {
                          change: function($event) {
                            var $$a = _vm.queries[searchable.key],
                              $$el = $event.target,
                              $$c = $$el.checked ? true : false;
                            if (Array.isArray($$a)) {
                              var $$v = null,
                                $$i = _vm._i($$a, $$v);
                              if ($$el.checked) {
                                $$i < 0 &&
                                  _vm.$set(
                                    _vm.queries,
                                    searchable.key,
                                    $$a.concat([$$v])
                                  );
                              } else {
                                $$i > -1 &&
                                  _vm.$set(
                                    _vm.queries,
                                    searchable.key,
                                    $$a.slice(0, $$i).concat($$a.slice($$i + 1))
                                  );
                              }
                            } else {
                              _vm.$set(_vm.queries, searchable.key, $$c);
                            }
                          }
                        }
                      })
                    : (searchable.hasOwnProperty("type")
                        ? searchable.type
                        : "text") === "radio"
                    ? _c("input", {
                        directives: [
                          {
                            name: "model",
                            rawName: "v-model",
                            value: _vm.queries[searchable.key],
                            expression: "queries[searchable.key]"
                          }
                        ],
                        staticClass: "input",
                        attrs: {
                          placeholder: searchable.display_name,
                          type: "radio"
                        },
                        domProps: {
                          checked: _vm._q(_vm.queries[searchable.key], null)
                        },
                        on: {
                          change: function($event) {
                            return _vm.$set(_vm.queries, searchable.key, null)
                          }
                        }
                      })
                    : _c("input", {
                        directives: [
                          {
                            name: "model",
                            rawName: "v-model",
                            value: _vm.queries[searchable.key],
                            expression: "queries[searchable.key]"
                          }
                        ],
                        staticClass: "input",
                        attrs: {
                          placeholder: searchable.display_name,
                          type: searchable.hasOwnProperty("type")
                            ? searchable.type
                            : "text"
                        },
                        domProps: { value: _vm.queries[searchable.key] },
                        on: {
                          input: function($event) {
                            if ($event.target.composing) {
                              return
                            }
                            _vm.$set(
                              _vm.queries,
                              searchable.key,
                              $event.target.value
                            );
                          }
                        }
                      })
                ])
              }),
              0
            )
          ])
        ])
      : _vm._e(),
    _vm._v(" "),
    _c("div", { staticClass: "columns" }, [
      _c("div", { staticClass: "column" }, [
        _c("div", { staticClass: "level" }, [
          _c("div", { staticClass: "level-left" }, [
            _c("p", { staticClass: "is-block" }, [
              _vm._m(3),
              _vm._v("\n                        Er worden op dit moment "),
              _c("strong", [
                _vm._v(_vm._s(_vm.currentProductPageResources.length))
              ]),
              _vm._v(" van de totaal "),
              _c("strong", [
                _vm._v(_vm._s(_vm.resourcesWithFilterApplied.length) + " ")
              ]),
              _vm.resourcesWithFilterApplied.length != _vm.resources.length
                ? _c("span", [
                    _vm._v("("),
                    _c("strong", [_vm._v(_vm._s(_vm.resources.length))]),
                    _vm._v(")")
                  ])
                : _vm._e(),
              _vm._v(" items weegegeven.\n                    ")
            ])
          ]),
          _vm._v(" "),
          _c("div", { staticClass: "level-right" }, [
            _c("div", { staticClass: "columns" }, [
              _c("div", { staticClass: "column table-controls" }, [
                _c("div", { staticClass: "columnized" }, [
                  _c("div", { staticClass: "row" }, [
                    _c(
                      "button",
                      {
                        staticClass: "button is-light",
                        on: {
                          click: function($event) {
                            $event.preventDefault();
                            _vm.currentProductPage = 1;
                          }
                        }
                      },
                      [_vm._v("«")]
                    ),
                    _vm._v(" "),
                    _c(
                      "button",
                      {
                        staticClass: "button is-light",
                        on: {
                          click: function($event) {
                            return _vm.previousPage()
                          }
                        }
                      },
                      [_vm._v("‹")]
                    ),
                    _vm._v(" "),
                    _c("input", {
                      directives: [
                        {
                          name: "model",
                          rawName: "v-model",
                          value: _vm.currentProductPage,
                          expression: "currentProductPage"
                        }
                      ],
                      staticClass: "input",
                      staticStyle: { width: "3vw" },
                      attrs: { id: "pageNumber", type: "number" },
                      domProps: { value: _vm.currentProductPage },
                      on: {
                        input: function($event) {
                          if ($event.target.composing) {
                            return
                          }
                          _vm.currentProductPage = $event.target.value;
                        }
                      }
                    }),
                    _vm._v(" "),
                    _c(
                      "button",
                      {
                        staticClass: "button is-light",
                        on: {
                          click: function($event) {
                            return _vm.nextPage()
                          }
                        }
                      },
                      [_vm._v("›")]
                    ),
                    _vm._v(" "),
                    _c(
                      "button",
                      {
                        staticClass: "button is-light",
                        on: {
                          click: function($event) {
                            $event.preventDefault();
                            _vm.currentProductPage =
                              _vm.chunkedProductResources.length;
                          }
                        }
                      },
                      [_vm._v("»")]
                    )
                  ])
                ]),
                _vm._v(" "),
                _c("div", { staticClass: "columnized textual" }, [
                  _c("p", [
                    _vm._v("Pagina "),
                    _c("strong", [_vm._v(_vm._s(_vm.currentProductPage))]),
                    _vm._v(" van de "),
                    _c("strong", [
                      _vm._v(_vm._s(_vm.chunkedProductResources.length))
                    ])
                  ])
                ])
              ])
            ])
          ])
        ])
      ])
    ]),
    _vm._v(" "),
    _c("table", { staticClass: "table is-striped is-fullwidth" }, [
      _c("thead", [
        _c(
          "tr",
          [
            _vm.shouldHaveLabelColumn
              ? _c("th", { staticStyle: { width: "10vw" } }, [_vm._v("Labels")])
              : _vm._e(),
            _vm._v(" "),
            _vm._l(_vm.tableKeys, function(row) {
              return _c(
                "th",
                {
                  staticClass: "cursor-pointer",
                  class: { "small-cell": row.small },
                  on: {
                    click: function($event) {
                      return _vm.handleColumnOrderClick(row.key)
                    }
                  }
                },
                [
                  row.key == _vm.state.orderable.key
                    ? [
                        _c("span", [_vm._v(_vm._s(row.display_name))]),
                        _vm._v(" "),
                        _c("span", { staticClass: "icon" }, [
                          _vm.state.orderable.direction.toLowerCase() == "asc"
                            ? _c("i", { staticClass: "fa fa-arrow-up" })
                            : _vm._e(),
                          _vm._v(" "),
                          _vm.state.orderable.direction.toLowerCase() == "desc"
                            ? _c("i", { staticClass: "fa fa-arrow-down" })
                            : _vm._e()
                        ])
                      ]
                    : [
                        _vm._v(
                          "\n                    " +
                            _vm._s(row.display_name) +
                            "\n                "
                        )
                      ]
                ],
                2
              )
            }),
            _vm._v(" "),
            _vm.hasActions
              ? _c("th", { staticStyle: { width: "5vw" } }, [_vm._v("Acties")])
              : _vm._e()
          ],
          2
        )
      ]),
      _vm._v(" "),
      _c(
        "tbody",
        [
          _vm._l(_vm.currentProductPageResources, function(row) {
            return _c(
              "tr",
              [
                _vm.shouldHaveLabelColumn
                  ? _c("td", {
                      domProps: {
                        innerHTML: _vm._s(
                          _vm.applyLabelConditionsAndGetLabelDOM(row)
                        )
                      }
                    })
                  : _vm._e(),
                _vm._v(" "),
                _vm._l(_vm.tableKeys, function(keyRow) {
                  return _c("td", [_vm._v(_vm._s(row[keyRow.key]))])
                }),
                _vm._v(" "),
                _vm.hasActions
                  ? _c("td", [
                      _c(
                        "ul",
                        { staticStyle: { margin: "0" } },
                        [
                          _vm._l(_vm.actions, function(action) {
                            return [
                              action.hasOwnProperty("confirm") && action.confirm
                                ? [
                                    _vm.canActionBeDisplayed(row, action)
                                      ? _c("li", [
                                          _c(
                                            "a",
                                            {
                                              attrs: {
                                                target: action.target,
                                                title: action.title
                                              },
                                              on: {
                                                click: function($event) {
                                                  _vm.executeConfirmable(
                                                    action,
                                                    _vm.generateActionRoute(
                                                      action,
                                                      row
                                                    )
                                                  );
                                                }
                                              }
                                            },
                                            [
                                              _c(
                                                "span",
                                                {
                                                  staticClass: "icon",
                                                  class: action.class
                                                },
                                                [
                                                  _c("i", {
                                                    class: action.icon
                                                  })
                                                ]
                                              )
                                            ]
                                          )
                                        ])
                                      : _vm._e()
                                  ]
                                : [
                                    _vm.canActionBeDisplayed(row, action)
                                      ? _c("li", [
                                          _c(
                                            "a",
                                            {
                                              attrs: {
                                                href: _vm.generateActionRoute(
                                                  action,
                                                  row
                                                ),
                                                target: action.target,
                                                title: action.title
                                              }
                                            },
                                            [
                                              _c(
                                                "span",
                                                {
                                                  staticClass: "icon",
                                                  class: action.class
                                                },
                                                [
                                                  _c("i", {
                                                    class: action.icon
                                                  })
                                                ]
                                              )
                                            ]
                                          )
                                        ])
                                      : _vm._e()
                                  ]
                            ]
                          })
                        ],
                        2
                      )
                    ])
                  : _vm._e()
              ],
              2
            )
          }),
          _vm._v(" "),
          1 > _vm.currentProductPageResources.length
            ? _c("tr", [_c("td", [_vm._v("There are no existing records.")])])
            : _vm._e()
        ],
        2
      )
    ])
  ])
};
var __vue_staticRenderFns__ = [
  function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("span", { staticClass: "icon" }, [
      _c("i", { staticClass: "fa fa-filter" })
    ])
  },
  function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("span", { staticClass: "icon" }, [
      _c("i", { staticClass: "fa fa-toggle-off" })
    ])
  },
  function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { staticClass: "column is-12" }, [
      _c("p", { staticClass: "title is-6" }, [_vm._v("Beschikbare zoekvelden")])
    ])
  },
  function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("span", { staticClass: "icon" }, [
      _c("i", { staticClass: "fa fa-filter" })
    ])
  }
];
__vue_render__._withStripped = true;

  /* style */
  var __vue_inject_styles__ = function (inject) {
    if (!inject) { return }
    inject("data-v-3f7bac84_0", { source: ".filterable-table {\n  display: flex;\n  flex-direction: column;\n}\n.filterable-table .table-controls {\n  flex-direction: column;\n  justify-items: end;\n}\n.filterable-table .table-controls .textual {\n  align-self: end;\n}\n.filterable-table .columnized {\n  flex-direction: column;\n}\ntable thead tr {\n  background: #494949;\n}\ntable thead tr th {\n  color: #f5f4f4 !important;\n}\ntable thead tr th.small-cell {\n  width: 8vw;\n}\ntable thead tr:hover {\n  background-color: #494949 !important;\n}\ntable tbody td {\n  padding: 0 0.75rem !important;\n}\ntable tbody td ul > li {\n  display: inline;\n}\n.menu-card {\n  padding: 2rem 1.5rem;\n  background: #f5f5f5;\n  margin-bottom: 15px;\n}\n\n/*# sourceMappingURL=FilterableTable.vue.map */", map: {"version":3,"sources":["/var/www/Packages/npm/vuejs-filterable-datatable/src/FilterableTable.vue","FilterableTable.vue"],"names":[],"mappings":"AA0aA;EACA,aAAA;EACA,sBAAA;ACzaA;AD2aA;EACA,sBAAA;EACA,kBAAA;ACzaA;AD2aA;EACA,eAAA;ACzaA;AD6aA;EACA,sBAAA;AC3aA;ADibA;EACA,mBAzBA;ACrZA;ADgbA;EACA,yBAAA;AC9aA;AD+aA;EACA,UAAA;AC7aA;ADibA;EACA,oCAAA;AC/aA;ADqbA;EACA,6BAAA;ACnbA;ADobA;EACA,eAAA;AClbA;ADybA;EACA,oBAAA;EACA,mBAAA;EACA,mBAAA;ACtbA;;AAEA,8CAA8C","file":"FilterableTable.vue","sourcesContent":["<template>\n    <div class=\"filterable-table\">\n        <!-- Item showcount & Trigger buttons -->\n        <div class=\"level\">\n            <div class=\"level-left\">\n                <button class=\"button is-medium\" :class=\"{'is-primary': hiddenPanels.filterables, 'is-dark': !hiddenPanels.filterables}\" v-if=\"hasFilterables\" @click=\"hiddenPanels.filterables = !hiddenPanels.filterables\">\n                    <span class=\"icon\"><i class=\"fa fa-filter\"></i></span>\n                    <span>Filter opties</span>\n                </button>\n            </div>\n            <div class=\"level-right\">\n                <label for=\"chunkSize\" class=\"is-bold\">Aantal weer te geven items</label>\n                <div class=\"select is-fullwidth\">\n                    <select id=\"chunkSize\" v-model=\"chunkSize\">\n                        <option value=\"50\" selected>50</option>\n                        <option value=\"100\">100</option>\n                        <option value=\"250\">250</option>\n                        <option value=\"500\">500</option>\n                        <option value=\"1000\">1000</option>\n                    </select>\n                </div>\n            </div>\n        </div>\n        <!-- ./ Item showcount & Trigger buttons -->\n\n        <!-- Filterable buttons -->\n        <div class=\"columns\" v-if=\"hasFilterables\" :class=\"{'is-hidden' : !hiddenPanels.filterables}\">\n            <div class=\"column\">\n                <div class=\"filter-options menu-card\">\n                    <button v-for=\"filterable in filterables\" :ref=\"filterable.refKey || filterable.key\" class=\"button is-light is-medium\" @click=\"toggleFilter(filterable.key, filterable.filterValue, filterable.refKey)\">\n                        <span class=\"icon\"><i class=\"fa fa-toggle-off\"></i></span>\n                        <span>{{ filterable.display_name }}</span>\n                    </button>\n                </div>\n            </div>\n        </div>\n        <!-- ./ Filter buttons -->\n\n        <!-- Search inputs -->\n        <div class=\"columns is-multiline\" v-if=\"hasSearchables\">\n            <div class=\"column is-12\">\n                <p class=\"title is-6\">Beschikbare zoekvelden</p>\n            </div>\n            <div class=\"column is-12\">\n                <div class=\"columns\">\n                    <div class=\"column\" v-for=\"searchable in searchables\">\n                        <input :type=\"searchable.hasOwnProperty('type') ? searchable.type : 'text'\" class=\"input\" :placeholder=\"searchable.display_name\" v-model=\"queries[searchable.key]\">\n                    </div>\n                </div>\n            </div>\n        </div>\n        <!-- ./ Search inputs -->\n\n        <!-- Textual display count -->\n        <div class=\"columns\">\n            <div class=\"column\">\n                <div class=\"level\">\n                    <div class=\"level-left\">\n                        <p class=\"is-block\">\n                            <span class=\"icon\"><i class=\"fa fa-filter\"></i></span>\n                            Er worden op dit moment <strong>{{ currentProductPageResources.length }}</strong> van de totaal <strong>{{ resourcesWithFilterApplied.length }} </strong><span v-if=\"resourcesWithFilterApplied.length != resources.length\">(<strong>{{ resources.length }}</strong>)</span> items weegegeven.\n                        </p>\n                    </div>\n                    <div class=\"level-right\">\n                        <div class=\"columns\">\n                            <div class=\"column table-controls\">\n                                <div class=\"columnized\">\n                                    <div class=\"row\">\n                                        <button class=\"button is-light\" @click.prevent=\"currentProductPage = 1\">&laquo;</button>\n                                        <button class=\"button is-light\" @click=\"previousPage()\">&lsaquo;</button>\n                                        <input id=\"pageNumber\" type=\"number\" class=\"input\" style=\"width: 3vw;\" v-model=\"currentProductPage\">\n                                        <button class=\"button is-light\" @click=\"nextPage()\">&rsaquo;</button>\n                                        <button class=\"button is-light\" @click.prevent=\"currentProductPage = chunkedProductResources.length\">&raquo;</button>\n                                    </div>\n                                </div>\n                                <div class=\"columnized textual\">\n                                    <p>Pagina <strong>{{ currentProductPage }}</strong> van de <strong>{{ chunkedProductResources.length }}</strong></p>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n        <!-- ./ Textual display count -->\n\n        <!-- Datatable -->\n        <table class=\"table is-striped is-fullwidth\">\n            <thead>\n            <tr>\n                <th style=\"width: 10vw;\" v-if=\"shouldHaveLabelColumn\">Labels</th>\n                <th :class=\"{'small-cell' : row.small}\" v-for=\"row in tableKeys\" class=\"cursor-pointer\" @click=\"handleColumnOrderClick(row.key)\">\n                    <template v-if=\"row.key == state.orderable.key\">\n                        <span>{{ row.display_name}}</span>\n                        <span class=\"icon\">\n                            <i class=\"fa fa-arrow-up\" v-if=\"state.orderable.direction.toLowerCase() == 'asc'\"></i>\n                            <i class=\"fa fa-arrow-down\" v-if=\"state.orderable.direction.toLowerCase() == 'desc'\"></i>\n                        </span>\n                    </template>\n                    <template v-else>\n                        {{ row.display_name }}\n                    </template>\n                </th>\n                <th style=\"width: 5vw\" v-if=\"hasActions\">Acties</th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr v-for=\"row in currentProductPageResources\">\n                <td v-if=\"shouldHaveLabelColumn\" v-html=\"applyLabelConditionsAndGetLabelDOM(row)\"></td>\n                <td v-for=\"keyRow in tableKeys\">{{ row[keyRow.key] }}</td>\n                <td v-if=\"hasActions\">\n                    <ul style=\"margin:0\">\n                        <template v-for=\"action in actions\">\n                            <template v-if=\"action.hasOwnProperty('confirm') && action.confirm\">\n                                <li v-if=\"canActionBeDisplayed(row, action)\">\n                                    <a :target=\"action.target\" :title=\"action.title\" @click=\"executeConfirmable(action, generateActionRoute(action, row))\">\n                                        <span class=\"icon\" :class=\"action.class\">\n                                            <i :class=\"action.icon\"></i>\n                                        </span>\n                                    </a>\n                                </li>\n                            </template>\n                            <template v-else>\n                                <li v-if=\"canActionBeDisplayed(row, action)\">\n                                    <a :href=\"generateActionRoute(action, row)\" :target=\"action.target\" :title=\"action.title\">\n                                        <span class=\"icon\" :class=\"action.class\">\n                                            <i :class=\"action.icon\"></i>\n                                        </span>\n                                    </a>\n                                </li>\n                            </template>\n                        </template>\n                    </ul>\n                </td>\n            </tr>\n            <tr v-if=\"1 > currentProductPageResources.length\">\n                <td>There are no existing records.</td>\n            </tr>\n            </tbody>\n        </table>\n        <!-- ./ Datatable -->\n    </div>\n</template>\n\n<script>\n    /**\n     * @author Remy Kooistra\n     * @email <remy.kooistra.km@gmail.com>\n     * @description This module will dynamically put together\n     * tables and works with static content - so no AJAX.\n     * For extra information check the\n     * `/docs/Modules/VueJS/FilterableTable.md` file.\n     */\n    export default {\n        name: \"FilterableTable\",\n        props : {\n            idKey : {\n                type : String,\n                default () {\n                    return 'id';\n                }\n            },\n            resources : {\n                type : Array,\n                default () {\n                    return [];\n                }\n            },\n            // The keys that will be turned into filters.\n            filterables : {\n                type : Array,\n                default () {\n                    // [{key : String, display_name : String}]\n                    return [];\n                }\n            },\n            // The keys of a resource which can\n            // be searched for by text-input.\n            searchables : {\n                type : Array,\n                default () {\n                    // [String [, ...]] [Optional : [type : String, default text]]\n                    return [];\n                }\n            },\n            // Which data should be shown.\n            tableKeys : {\n                type : Array,\n                default () {\n                    return [\n                        {key : 'id', display_name : 'Database ID'}\n                    ];\n                }\n            },\n            // Show an icon on specific conditions.\n            conditionalIcons : {\n                type : Array,\n                default () {\n                    return [];\n                }\n            },\n            // The action routes/icons to be displayed.\n            actions : {\n                type : Array,\n                default () {\n                    return [];\n                }\n            }\n        },\n        data () {\n            return {\n                currentProductPage : 1,\n                chunkSize : 50,\n                filters : {},\n                queries : {},\n                hiddenPanels : {\n                    filterables : false,\n                    searchables : false\n                },\n                state : {\n                    orderable: {\n                        key : null,\n                        direction : 'asc'\n                    }\n                }\n            }\n        },\n        computed : {\n            resourcesWithFilterApplied () {\n                return this.applyFilters(this.resources);\n            },\n            chunkedProductResources () {\n                return _.chunk(this.resourcesWithFilterApplied, this.chunkSize);\n            },\n            currentProductPageResources () {\n                return this.chunkedProductResources[this.currentProductPage-1] || [];\n            },\n            hasFilterables () {\n                return 0 < Object.keys(this.filterables).length;\n            },\n            hasSearchables () {\n                return 0 < this.searchables.length;\n            },\n            shouldHaveLabelColumn () {\n                return 0 < this.conditionalIcons.length;\n            },\n            hasActions () {\n                return 0 < this.actions.length;\n            }\n        },\n        methods : {\n            executeConfirmable (action, redirectRoute) {\n                if (!action.hasOwnProperty('confirm')) {\n                    this.redirectWindowToRoute(redirectRoute);\n                    return true;\n                }\n                let _confirm = confirm(action.confirmMessage);\n                if (!_confirm) return true;\n                this.redirectWindowToRoute(redirectRoute);\n            },\n            redirectWindowToRoute (route) {\n                axios.get(route, {_method: 'DELETE'})\n                    .then(response => {\n                        alert('Het item is verwijderd, ververs de pagina om de veranderingen te zien.');\n                    }).catch(exception => {\n                    alert('Er is een fout opgetreden!');\n                    console.error(exception);\n                });\n            },\n            canActionBeDisplayed(row, action) {\n                if (!action.hasOwnProperty('conditionals')) return true;\n                let _mayDisplay = true;\n                action.conditionals.forEach(condition => {\n                    if (row[condition.key] != condition.value) _mayDisplay = false;\n                });\n                return _mayDisplay;\n            },\n            generateActionRoute (action, row) {\n                if (!action.appendable && !action.replaceable) return action.route;\n                if (action.appendable && !action.replaceable) return action.route+row[this.idKey];\n                if (!action.appendable && action.replaceable) return action.route.replace('/0', '/'+row[this.idKey]);\n            },\n            applyLabelConditionsAndGetLabelDOM(row) {\n                let _dom = \"\";\n                this.conditionalIcons.forEach(condition => {\n                    if (row[condition.key] == condition.whenValue) {\n                        _dom += \"<span class='icon' title='\"+condition.title+\"'>\" +\n                            \"<i class='\"+condition.icon+\" \"+condition.class+\"'></i>\" +\n                            \"</span>\"\n                    }\n                });\n                return _dom;\n            },\n            toggleFilter (key, filterValue, refKey) {\n                let _refKey = refKey || key;\n                let buttonDOM = $(this.$refs[_refKey]);\n                let buttonIcon = buttonDOM.find('.icon > i');\n                let offClass = 'is-light';\n                let onClass = 'is-light';\n\n                if (this.filters.hasOwnProperty(_refKey)) {\n                    Vue.delete(this.$data.filters, _refKey);\n                    buttonDOM.removeClass(onClass);\n                    buttonDOM.addClass(offClass);\n                    buttonIcon.removeClass('fa-toggle-on');\n                    buttonIcon.addClass('fa-toggle-off');\n                    return;\n                }\n                Vue.set(this.$data.filters, _refKey, {key: key, value : filterValue});\n                // Vue.set(this.$data.filters, _refKey, filterValue);\n\n                buttonDOM.removeClass(offClass);\n                buttonDOM.addClass(onClass);\n                buttonIcon.removeClass('fa-toggle-off');\n                buttonIcon.addClass('fa-toggle-on');\n            },\n\n            applyFilters (resources) {\n                let _resources = resources;\n                let _filters = this.filters;\n                let _orderable = this.state.orderable;\n\n                // Apply all filterables.\n                Object.keys(_filters).forEach(key => {\n                    let _row = _filters[key];\n                    _resources = _resources.filter(row => {\n                        return row[_row.key] == _row.value;\n                    });\n                })\n\n                // Apply all searchables.\n                let _searchables = this.searchables;\n                let _queries = this.queries;\n                _searchables.forEach(searchable => {\n                    _resources = _resources.filter(row => {\n                        let _queryValue = _queries[searchable.key];\n                        if (!_queryValue) return true;\n                        if (!row[searchable.key]) return false;\n\n                        if ($.isNumeric(_queryValue)) {\n                            // Match value on numeric comparisons.\n                            return parseInt(row[searchable.key]) === parseInt(_queryValue);\n                        } else {\n                            // See if the query applies even a bit.\n                            return -1 < row[searchable.key].toLowerCase()\n                                .indexOf(_queryValue.toLowerCase());\n                        }\n                    });\n                });\n\n                _resources.sort(this._sortOrderableByKeyAndDirection);\n                return _resources;\n            },\n            _sortOrderableByKeyAndDirection(a,b) {\n                if (this.state.orderable.direction.toLowerCase() === 'asc') {\n                    if (a[this.state.orderable.key] < b[this.state.orderable.key] )\n                        return -1;\n                    if (a[this.state.orderable.key]  > b[this.state.orderable.key] )\n                        return 1;\n                    return 0;\n                } else {\n                    if (a[this.state.orderable.key] < b[this.state.orderable.key] )\n                        return 1;\n                    if (a[this.state.orderable.key]  > b[this.state.orderable.key] )\n                        return -1;\n                    return 0;\n                }\n            },\n            previousPage () {\n                if (1 === this.currentProductPage) return;\n                this.currentProductPage--;\n            },\n            nextPage () {\n                if (this.chunkedProductResources.length === this.currentProductPage) return;\n                this.currentProductPage++;\n            },\n            followMaxPossiblePageOnShrink () {\n                if (this.currentProductPage > this.chunkedProductResources.length) {\n                    this.currentProductPage = this.chunkedProductResources.length;\n                }\n            },\n            handleColumnOrderClick (columnKey) {\n                this._handleOrderStateSwitch(columnKey);\n            },\n            _handleOrderStateSwitch(columnKey) {\n                if (this.state.orderable.key === columnKey) {\n                    let _direction = this.state.orderable.direction.toLowerCase() === 'asc'\n                        ? 'desc' : 'asc';\n                    Vue.set(this.state.orderable, 'direction', _direction);\n                } else {\n                    Vue.set(this.state.orderable, 'key', columnKey);\n                    Vue.set(this.state.orderable, 'direction', 'asc');\n                }\n            }\n        },\n        watch : {\n            currentProductPage () {\n                this.followMaxPossiblePageOnShrink();\n                if (this.currentProductPage < 1) {\n                    this.currentProductPage = 1;\n                }\n            },\n            chunkSize () {\n                this.currentProductPage = 1;\n            },\n            queries : {\n                deep : true,\n                handler () {\n                    this.followMaxPossiblePageOnShrink();\n                }\n            }\n        },\n        created () {\n            this.searchables.forEach(row => {\n                Vue.set(this.$data.queries, row.key, null);\n            });\n            Vue.set(this.state.orderable, 'key', this.idKey);\n        }\n    }\n</script>\n\n<style lang=\"scss\">\n    $table-header-background-color  : #494949;\n    $table-header-text-color        : #f5f4f4;\n    $pagination-color               : #5c5754;\n\n    .filterable-table {\n        display: flex;\n        flex-direction: column;\n\n        .table-controls {\n            flex-direction: column;\n            justify-items: end;\n\n            .textual {\n                align-self: end;\n            }\n        }\n\n        .columnized {\n            flex-direction: column;\n        }\n    }\n\n    table {\n        thead {\n            tr {\n                background: $table-header-background-color;\n\n                th {\n                    color : $table-header-text-color !important;\n                    &.small-cell {\n                        width : 8vw;\n                    }\n                }\n\n                &:hover {\n                    background-color: $table-header-background-color !important;\n                }\n            }\n        }\n\n        tbody {\n            td {\n                padding: 0 0.75rem !important;\n                ul > li {\n                    display: inline;\n                }\n            }\n        }\n    }\n\n\n    .menu-card {\n        padding: 2rem 1.5rem;\n        background: #f5f5f5;\n        margin-bottom: 15px;\n    }\n</style>\n",".filterable-table {\n  display: flex;\n  flex-direction: column;\n}\n.filterable-table .table-controls {\n  flex-direction: column;\n  justify-items: end;\n}\n.filterable-table .table-controls .textual {\n  align-self: end;\n}\n.filterable-table .columnized {\n  flex-direction: column;\n}\n\ntable thead tr {\n  background: #494949;\n}\ntable thead tr th {\n  color: #f5f4f4 !important;\n}\ntable thead tr th.small-cell {\n  width: 8vw;\n}\ntable thead tr:hover {\n  background-color: #494949 !important;\n}\ntable tbody td {\n  padding: 0 0.75rem !important;\n}\ntable tbody td ul > li {\n  display: inline;\n}\n\n.menu-card {\n  padding: 2rem 1.5rem;\n  background: #f5f5f5;\n  margin-bottom: 15px;\n}\n\n/*# sourceMappingURL=FilterableTable.vue.map */"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__ = undefined;
  /* module identifier */
  var __vue_module_identifier__ = undefined;
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* style inject SSR */
  

  
  var FilterableTable = normalizeComponent_1(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    browser,
    undefined
  );

// Import vue component

// Declare install function executed by Vue.use()
function install(Vue) {
    if (install.installed) { return; }
    install.installed = true;
    Vue.use(FilterableTable);
}

// Create module definition for Vue.use()
var plugin = {
    install: install,
};

// Auto-install when vue is found (eg. in browser via <script> tag)
var GlobalVue = null;
if (typeof window !== 'undefined') {
    GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
    GlobalVue = global.Vue;
}
if (GlobalVue) {
    GlobalVue.use(plugin);
}

export default FilterableTable;
export { install };
