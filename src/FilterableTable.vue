<template>
    <div class="filterable-table">
        <!-- Item showcount & Trigger buttons -->
        <div class="level">
            <div class="level-left">
                <button class="button is-medium" :class="{'is-primary': hiddenPanels.filterables, 'is-dark': !hiddenPanels.filterables}" v-if="hasFilterables" @click="hiddenPanels.filterables = !hiddenPanels.filterables">
                    <span class="icon"><i class="fa fa-filter"></i></span>
                    <span>Filter opties</span>
                </button>
            </div>
            <div class="level-right">
                <label for="chunkSize" class="is-bold">Aantal weer te geven items</label>
                <div class="select is-fullwidth">
                    <select id="chunkSize" v-model="chunkSize">
                        <option value="50" selected>50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                        <option value="500">500</option>
                        <option value="1000">1000</option>
                    </select>
                </div>
            </div>
        </div>
        <!-- ./ Item showcount & Trigger buttons -->

        <!-- Filterable buttons -->
        <div class="columns" v-if="hasFilterables" :class="{'is-hidden' : !hiddenPanels.filterables}">
            <div class="column">
                <div class="filter-options menu-card">
                    <button v-for="filterable in filterables" :ref="filterable.refKey || filterable.key" class="button is-light is-medium" @click="toggleFilter(filterable.key, filterable.filterValue, filterable.refKey)">
                        <span class="icon"><i class="fa fa-toggle-off"></i></span>
                        <span>{{ filterable.display_name }}</span>
                    </button>
                </div>
            </div>
        </div>
        <!-- ./ Filter buttons -->

        <!-- Search inputs -->
        <div class="columns is-multiline" v-if="hasSearchables">
            <div class="column is-12">
                <p class="title is-6">Beschikbare zoekvelden</p>
            </div>
            <div class="column is-12">
                <div class="columns">
                    <div class="column" v-for="searchable in searchables">
                        <input :type="searchable.hasOwnProperty('type') ? searchable.type : 'text'" class="input" :placeholder="searchable.display_name" v-model="queries[searchable.key]">
                    </div>
                </div>
            </div>
        </div>
        <!-- ./ Search inputs -->

        <!-- Textual display count -->
        <div class="columns">
            <div class="column">
                <div class="level">
                    <div class="level-left">
                        <p class="is-block">
                            <span class="icon"><i class="fa fa-filter"></i></span>
                            Er worden op dit moment <strong>{{ currentProductPageResources.length }}</strong> van de totaal <strong>{{ resourcesWithFilterApplied.length }} </strong><span v-if="resourcesWithFilterApplied.length != resources.length">(<strong>{{ resources.length }}</strong>)</span> items weegegeven.
                        </p>
                    </div>
                    <div class="level-right">
                        <div class="columns">
                            <div class="column table-controls">
                                <div class="columnized">
                                    <div class="row">
                                        <button class="button is-light" @click.prevent="currentProductPage = 1">&laquo;</button>
                                        <button class="button is-light" @click="previousPage()">&lsaquo;</button>
                                        <input id="pageNumber" type="number" class="input" style="width: 3vw;" v-model="currentProductPage">
                                        <button class="button is-light" @click="nextPage()">&rsaquo;</button>
                                        <button class="button is-light" @click.prevent="currentProductPage = chunkedProductResources.length">&raquo;</button>
                                    </div>
                                </div>
                                <div class="columnized textual">
                                    <p>Pagina <strong>{{ currentProductPage }}</strong> van de <strong>{{ chunkedProductResources.length }}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- ./ Textual display count -->

        <!-- Datatable -->
        <table class="table is-striped is-fullwidth">
            <thead>
            <tr>
                <th style="width: 10vw;" v-if="shouldHaveLabelColumn">Labels</th>
                <th :class="{'small-cell' : row.small}" v-for="row in tableKeys" class="cursor-pointer" @click="handleColumnOrderClick(row.key)">
                    <template v-if="row.key == state.orderable.key">
                        <span>{{ row.display_name}}</span>
                        <span class="icon">
                            <i class="fa fa-arrow-up" v-if="state.orderable.direction.toLowerCase() == 'asc'"></i>
                            <i class="fa fa-arrow-down" v-if="state.orderable.direction.toLowerCase() == 'desc'"></i>
                        </span>
                    </template>
                    <template v-else>
                        {{ row.display_name }}
                    </template>
                </th>
                <th style="width: 5vw" v-if="hasActions">Acties</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in currentProductPageResources">
                <td v-if="shouldHaveLabelColumn" v-html="applyLabelConditionsAndGetLabelDOM(row)"></td>
                <td v-for="keyRow in tableKeys">{{ row[keyRow.key] }}</td>
                <td v-if="hasActions">
                    <ul style="margin:0">
                        <template v-for="action in actions">
                            <template v-if="action.hasOwnProperty('confirm') && action.confirm">
                                <li v-if="canActionBeDisplayed(row, action)">
                                    <a :target="action.target" :title="action.title" @click="executeConfirmable(action, generateActionRoute(action, row))">
                                        <span class="icon" :class="action.class">
                                            <i :class="action.icon"></i>
                                        </span>
                                    </a>
                                </li>
                            </template>
                            <template v-else>
                                <li v-if="canActionBeDisplayed(row, action)">
                                    <a :href="generateActionRoute(action, row)" :target="action.target" :title="action.title">
                                        <span class="icon" :class="action.class">
                                            <i :class="action.icon"></i>
                                        </span>
                                    </a>
                                </li>
                            </template>
                        </template>
                    </ul>
                </td>
            </tr>
            <tr v-if="1 > currentProductPageResources.length">
                <td>There are no existing records.</td>
            </tr>
            </tbody>
        </table>
        <!-- ./ Datatable -->
    </div>
</template>

<script>
    /**
     * @author Remy Kooistra
     * @email <remy.kooistra.km@gmail.com>
     * @description This module will dynamically put together
     * tables and works with static content - so no AJAX.
     * For extra information check the
     * `/docs/Modules/VueJS/FilterableTable.md` file.
     */
    export default {
        name: "FilterableTable",
        props : {
            idKey : {
                type : String,
                default () {
                    return 'id';
                }
            },
            resources : {
                type : Array,
                default () {
                    return [];
                }
            },
            // The keys that will be turned into filters.
            filterables : {
                type : Array,
                default () {
                    // [{key : String, display_name : String}]
                    return [];
                }
            },
            // The keys of a resource which can
            // be searched for by text-input.
            searchables : {
                type : Array,
                default () {
                    // [String [, ...]] [Optional : [type : String, default text]]
                    return [];
                }
            },
            // Which data should be shown.
            tableKeys : {
                type : Array,
                default () {
                    return [
                        {key : 'id', display_name : 'Database ID'}
                    ];
                }
            },
            // Show an icon on specific conditions.
            conditionalIcons : {
                type : Array,
                default () {
                    return [];
                }
            },
            // The action routes/icons to be displayed.
            actions : {
                type : Array,
                default () {
                    return [];
                }
            }
        },
        data () {
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
            resourcesWithFilterApplied () {
                return this.applyFilters(this.resources);
            },
            chunkedProductResources () {
                return _.chunk(this.resourcesWithFilterApplied, this.chunkSize);
            },
            currentProductPageResources () {
                return this.chunkedProductResources[this.currentProductPage-1] || [];
            },
            hasFilterables () {
                return 0 < Object.keys(this.filterables).length;
            },
            hasSearchables () {
                return 0 < this.searchables.length;
            },
            shouldHaveLabelColumn () {
                return 0 < this.conditionalIcons.length;
            },
            hasActions () {
                return 0 < this.actions.length;
            }
        },
        methods : {
            executeConfirmable (action, redirectRoute) {
                if (!action.hasOwnProperty('confirm')) {
                    this.redirectWindowToRoute(redirectRoute);
                    return true;
                }
                let _confirm = confirm(action.confirmMessage);
                if (!_confirm) return true;
                this.redirectWindowToRoute(redirectRoute);
            },
            redirectWindowToRoute (route) {
                axios.get(route, {_method: 'DELETE'})
                    .then(response => {
                        alert('Het item is verwijderd, ververs de pagina om de veranderingen te zien.');
                    }).catch(exception => {
                    alert('Er is een fout opgetreden!');
                    console.error(exception);
                });
            },
            canActionBeDisplayed(row, action) {
                if (!action.hasOwnProperty('conditionals')) return true;
                let _mayDisplay = true;
                action.conditionals.forEach(condition => {
                    if (row[condition.key] != condition.value) _mayDisplay = false;
                });
                return _mayDisplay;
            },
            generateActionRoute (action, row) {
                if (!action.appendable && !action.replaceable) return action.route;
                if (action.appendable && !action.replaceable) return action.route+row[this.idKey];
                if (!action.appendable && action.replaceable) return action.route.replace('/0', '/'+row[this.idKey]);
            },
            applyLabelConditionsAndGetLabelDOM(row) {
                let _dom = "";
                this.conditionalIcons.forEach(condition => {
                    if (row[condition.key] == condition.whenValue) {
                        _dom += "<span class='icon' title='"+condition.title+"'>" +
                            "<i class='"+condition.icon+" "+condition.class+"'></i>" +
                            "</span>"
                    }
                });
                return _dom;
            },
            toggleFilter (key, filterValue, refKey) {
                let _refKey = refKey || key;
                let buttonDOM = $(this.$refs[_refKey]);
                let buttonIcon = buttonDOM.find('.icon > i');
                let offClass = 'is-light';
                let onClass = 'is-light';

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

            applyFilters (resources) {
                let _resources = resources;
                let _filters = this.filters;
                let _orderable = this.state.orderable;

                // Apply all filterables.
                Object.keys(_filters).forEach(key => {
                    let _row = _filters[key];
                    _resources = _resources.filter(row => {
                        return row[_row.key] == _row.value;
                    });
                })

                // Apply all searchables.
                let _searchables = this.searchables;
                let _queries = this.queries;
                _searchables.forEach(searchable => {
                    _resources = _resources.filter(row => {
                        let _queryValue = _queries[searchable.key];
                        if (!_queryValue) return true;
                        if (!row[searchable.key]) return false;

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
            _sortOrderableByKeyAndDirection(a,b) {
                if (this.state.orderable.direction.toLowerCase() === 'asc') {
                    if (a[this.state.orderable.key] < b[this.state.orderable.key] )
                        return -1;
                    if (a[this.state.orderable.key]  > b[this.state.orderable.key] )
                        return 1;
                    return 0;
                } else {
                    if (a[this.state.orderable.key] < b[this.state.orderable.key] )
                        return 1;
                    if (a[this.state.orderable.key]  > b[this.state.orderable.key] )
                        return -1;
                    return 0;
                }
            },
            previousPage () {
                if (1 === this.currentProductPage) return;
                this.currentProductPage--;
            },
            nextPage () {
                if (this.chunkedProductResources.length === this.currentProductPage) return;
                this.currentProductPage++;
            },
            followMaxPossiblePageOnShrink () {
                if (this.currentProductPage > this.chunkedProductResources.length) {
                    this.currentProductPage = this.chunkedProductResources.length;
                }
            },
            handleColumnOrderClick (columnKey) {
                this._handleOrderStateSwitch(columnKey);
            },
            _handleOrderStateSwitch(columnKey) {
                if (this.state.orderable.key === columnKey) {
                    let _direction = this.state.orderable.direction.toLowerCase() === 'asc'
                        ? 'desc' : 'asc';
                    Vue.set(this.state.orderable, 'direction', _direction);
                } else {
                    Vue.set(this.state.orderable, 'key', columnKey);
                    Vue.set(this.state.orderable, 'direction', 'asc');
                }
            }
        },
        watch : {
            currentProductPage () {
                this.followMaxPossiblePageOnShrink();
                if (this.currentProductPage < 1) {
                    this.currentProductPage = 1;
                }
            },
            chunkSize () {
                this.currentProductPage = 1;
            },
            queries : {
                deep : true,
                handler () {
                    this.followMaxPossiblePageOnShrink();
                }
            }
        },
        created () {
            this.searchables.forEach(row => {
                Vue.set(this.$data.queries, row.key, null);
            });
            Vue.set(this.state.orderable, 'key', this.idKey);
        }
    }
</script>

<style lang="scss">
    $table-header-background-color  : #494949;
    $table-header-text-color        : #f5f4f4;
    $pagination-color               : #5c5754;

    .filterable-table {
        display: flex;
        flex-direction: column;

        .table-controls {
            flex-direction: column;
            justify-items: end;

            .textual {
                align-self: end;
            }
        }

        .columnized {
            flex-direction: column;
        }
    }

    table {
        thead {
            tr {
                background: $table-header-background-color;

                th {
                    color : $table-header-text-color !important;
                    &.small-cell {
                        width : 8vw;
                    }
                }

                &:hover {
                    background-color: $table-header-background-color !important;
                }
            }
        }

        tbody {
            td {
                padding: 0 0.75rem !important;
                ul > li {
                    display: inline;
                }
            }
        }
    }


    .menu-card {
        padding: 2rem 1.5rem;
        background: #f5f5f5;
        margin-bottom: 15px;
    }
</style>
