<template>
    <Row type="flex" justify="center" class="bvue-select-tree-group">
        <i-col span="8">
            <div class="bvue-select-tree">
                <search :query="queryKeyword" @on-query-clear="handleQueryClear" @on-query-change="handleQueryChange" :placeholder="queryPlaceholder" class="mb-sm"></search>
                <Tree :multiple="multiple" :data="orgTreeData" :load-data="queryOrgByParent" @on-select-change="handleOrgSelectChange"></Tree>
            </div>
        </i-col>
        <i-col span="16">
            <div class="bvue-list-transfer" style="height:375px;">
                <div class="bvue-list-transfer-header">
                    <h4>已选部门</h4>
                </div>
                <div class="bvue-list-transfer-body">
                    <ul class="bvue-transfer-list-content" >
                        <li class="bvue-transfer-list-content-item" v-for="(orgId,index) in selectedIds" :key="orgId">
                            <span>{{selectedOrgDetails[orgId]&&selectedOrgDetails[orgId][labelKey]}}</span>
                            <Icon class="hover-show-item" type="ios-trash" @click="delOrg(index)"></Icon>
                        </li>
                    </ul>
                </div>
            </div>
        </i-col>
    </Row>
</template>

<script>
    import context from '../../../../libs/context';
    import orgTree from '../user-select/org-tree';
    import queryMethods from '../user-select/query-methods';
    export default {
        mixins: [orgTree],
        props: {
            initialValue: {
                type: [String, Array],
                default() {
                    return null;
                }
            },
            queryMethods: {
                type: Object,
                default(){
                    return queryMethods;
                }
            },
            multiple: {
                type: Boolean,
                default: false
            },
            labelKey: {
                type: String,
                default() {
                    return context.getSettings().control.orgSelect.nameField;
                }
            },
            valueKey: {
                type: String,
                default() {
                    return context.getSettings().control.orgSelect.idField;
                }
            },
            queryPlaceholder: {
                type: String
            }
        },
        data() {
            return {
                selectedIds: [],
                selectedOrgDetails: {},
                queryKeyword: ''
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
                            this.selectedOrgDetails = {};
                            return;
                        }
                        this.queryMethods.queryOrgByIds(ids).then(data => {
                            this.selectedIds = ids;
                            this.selectedOrgDetails = _.keyBy(data, item => {
                                return item[this.valueKey];
                            })
                        });
                    }
                },
                immediate: true
            },
            queryKeyword: {
                handler() {
                    this.buildRootOrgByKeyword();
                }
            },
            selectedOrgDetails:function(){
                this.$emit('on-change',this.selectedOrgDetails);
            }
        },
        mounted() {
            this.buildRootOrg();
        },
        methods: {
            handleOrgSelectChange(dataItems) {
                if (!this.multiple) {//单选直接替换
                    if (dataItems.length == 1) {
                        let id = dataItems[0].id;
                        this.selectedIds = [id];
                        let selectedItem = {};
                        selectedItem[id] = dataItems[0];
                        this.selectedOrgDetails = selectedItem;
                    } else {
                        this.selectedIds = [];
                        this.selectedOrgDetails = {};
                    }
                } else {//多选去重
                    let selectedOrgDetails=_.cloneDeep(this.selectedOrgDetails);
                    _.each(dataItems, item => {
                        var id = item.id;
                        if (!_.includes(this.selectedIds, id)) {
                            this.selectedIds.push(id);
                            selectedOrgDetails[id] = item;
                        }
                    });
                    this.selectedOrgDetails=selectedOrgDetails;
                }
            },
            delOrg(index) {
                var toDeletedId = this.selectedIds[index];
                this.selectedIds.splice(index, 1);
                delete this.selectedOrgDetails[toDeletedId];
                this.selectedOrgDetails=_.cloneDeep(this.selectedOrgDetails);
            },
            handleQueryClear() {
                this.queryKeyword = '';
                //TODO
            },
            handleQueryChange(val) {
                this.queryKeyword = val;
                //TODO
            }
        },
        components: {
            search: require('../user-select/search').default
        }
    };
</script>