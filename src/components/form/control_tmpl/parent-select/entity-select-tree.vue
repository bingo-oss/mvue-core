<template>
    <Row type="flex" justify="center" class="bvue-select-tree-group">
        <i-col span="8">
            <div class="bvue-select-tree">
                <!--
                <search :query="queryKeyword" @on-query-clear="handleQueryClear" @on-query-change="handleQueryChange" :placeholder="queryPlaceholder" class="mb-sm"></search>
                -->
                <Tree :multiple="multiple" :data="entityTreeData" :load-data="queryEntityByParent" @on-select-change="handleOrgSelectChange"></Tree>
            </div>
        </i-col>
        <i-col span="16">
            <div class="bvue-list-transfer" style="height:375px;">
                <div class="bvue-list-transfer-header">
                    <h4>已选</h4>
                </div>
                <div class="bvue-list-transfer-body">
                    <ul class="bvue-transfer-list-content" >
                        <li class="bvue-transfer-list-content-item" v-for="(dataId,index) in selectedIds" :key="dataId">
                            <span>{{selectedEntityDetails[dataId]&&selectedEntityDetails[dataId][labelKey]}}</span>
                            <Icon class="hover-show-item" type="ios-trash" @click="delSeleted(index)"></Icon>
                        </li>
                    </ul>
                </div>
            </div>
        </i-col>
    </Row>
</template>

<script>
    import entityTree from './entity-tree';
    export default {
        mixins: [entityTree],
        props: {
            initialValue: {
                type: [String, Array],
                default() {
                    return null;
                }
            },
            recordId: {
                type: [String,Number]
            },
            queryMethods: {
                type: Object,
                required: true,
                validator(value){
                    return value &&
                    value.queryEntityByIds &&
                    value.queryRootEntity && 
                    value.queryEntityByParent && 
                    value.queryEntityByKeyword;
                }
            },
            multiple: {
                type: Boolean,
                default: false
            },
            labelKey: {
                type: String
            },
            valueKey: {
                type: String
            },
            queryPlaceholder: {
                type: String
            }
        },
        data() {
            let selectLevel=this.formItem.componentParams.selectLevel;
            return {
                selectedIds: [],
                selectedEntityDetails: {},
                queryKeyword: '',
                selectLevel:selectLevel
            };
        },
        watch: {
            initialValue: {
                handler() {
                    var ids = [];
                    if ((!this.multiple) && this.initialValue) {
                        ids = [this.initialValue];
                    } else {
                        ids = _.cloneDeep(this.initialValue);
                    }
                    if (!_.isEqual(ids, this.selectedIds)) {
                        if (_.isEmpty(ids)) {
                            this.selectedIds = [];
                            this.selectedEntityDetails = {};
                            return;
                        }
                        this.queryMethods.queryEntityByIds(ids).then(data => {
                            this.selectedIds = ids;
                            this.selectedEntityDetails = _.keyBy(data, item => {
                                return item[this.valueKey];
                            })
                        });
                    }
                },
                immediate: true
            },
            queryKeyword: {
                handler() {
                    this.buildRootDataByKeyword();
                }
            }
        },
        mounted() {
            this.buildRootData();
        },
        methods: {
            handleOrgSelectChange(dataItems) {
                if (!this.multiple) {//单选直接替换
                    if (dataItems.length == 1) {
                        let id = dataItems[0].id;
                        this.selectedIds = [id];
                        let selectedItem = {};
                        selectedItem[id] = dataItems[0];
                        this.selectedEntityDetails = selectedItem;
                    } else {
                        this.selectedIds = [];
                        this.selectedEntityDetails = {};
                    }
                } else {//多选去重
                    _.each(dataItems, item => {
                        var id = item.id;
                        if (!_.includes(this.selectedIds, id)) {
                            this.selectedIds.push(id);
                            this.selectedEntityDetails[id] = item;
                        }
                    })
                }
            },
            delSeleted(index) {
                var toDeletedId = this.selectedIds[index];
                this.selectedIds.splice(index, 1);
                delete this.selectedEntityDetails[toDeletedId];
            },
            handleQueryClear() {
                this.queryKeyword = '';
            },
            handleQueryChange(val) {
                this.queryKeyword = val;
            }
        },
        components: {
            search: require('../user-select/search').default
        }
    };
</script>