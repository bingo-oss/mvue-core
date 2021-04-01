<template>
    <Row type="flex" justify="center" class="bvue-select-tree-group"
        :class="{'single-user-select-transfer':!multiple}">
        <i-col span="5">
            <div class="bvue-select-tree"
                :style="{height:height+'px',overflow:'auto'}">
                <Tree :multiple="false" :data="orgTreeData" :load-data="queryOrgByParent" @on-select-change="handleOrgSelectChange"></Tree>
            </div>
        </i-col>
        <i-col span="19">
            <div class="bvue-select-transfer"
                :style="{height:height+'px',overflow:'auto'}">
                <search :query="queryKeyword" @on-query-clear="handleQueryClear" @on-query-change="handleQueryChange" :placeholder="queryPlaceholder" class="mb-sm" style="width:200px;" ></search>

                <Transfer ref="transferRef" :data="sourceUsers" :titles="transferTitles" :target-keys="selectedIds" :render-format="renderFormat" style="height:300px;"
                :list-style="listStyle" @on-change="handleTransferChange" @on-selected-change="handleTransferSelectedChange"></Transfer>

                <Page :current.sync="currentPage" :page-size="pageSize" :total="total" @on-change="handleCurrentPageChange" size="small" class="mt-sm"></Page>
            </div>
        </i-col>
    </Row>
</template>

<script>
    import context from '../../../../libs/context';
    import orgTree from './org-tree';
    import queryMethods from './query-methods';
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
                    return context.getSettings().control.userSelect.nameField;
                }
            },
            valueKey: {
                type: String,
                default(){
                    return context.getSettings().control.userSelect.idField;
                }
            },
            orgLabelKey: {
                type: String,
                default(){
                    return context.getSettings().control.orgSelect.nameField;
                }
            },
            orgValueKey: {
                type: String,
                default(){
                    return context.getSettings().control.orgSelect.idField;
                }
            },
            renderFormat: {
                type: Function,
                default:(item)=> {
                        let titleField = context.getSettings().control.userSelect.nameField;
                        return `${item[titleField]}`;
                }
            },
            queryPlaceholder: {
                type: String,
                default:"请输入用户姓名"
            },
            selectCurrentUserOrg:{//是否默认查询当前用户所在部门
                type:Boolean,
                default:false
            },
            onlySelectCurrentUserOrg:{//是否只允许选当前用户所在部门
                type:Boolean,
                default:false
            },
            height:{
                type:Number,
                default:370
            }
        },
        watch: {
            initialValue: {
                handler() {
                    var ids = [];
                    if ((!this.multiple) && this.initialValue) {
                        ids = [this.initialValue];
                    } else {
                        ids = _.cloneDeep(this.initialValue) || [];
                    }
                    if (!_.isEqual(ids, this.selectedIds)) {
                        this.selectedIds = ids;
                        this.pageQueryUserByOrg();
                    }
                },
                immediate: true
            },
            queryKeyword: {
                handler() {
                    this.currentPage=1;
                    this.doQuery();
                }
            },
            selectedUsers:function(){
                this.$emit('on-change',this.selectedUsers);
            }
        },
        data() {
            let selectedOrgIds=[];
            //如果指定默认选中当前用户所在部门
            let curUserOrgId=this.$session.getCurrentUser().org_id;
            if(this.selectCurrentUserOrg||this.onlySelectCurrentUserOrg){
                if(!_.isNil(curUserOrgId)){
                    selectedOrgIds.push(curUserOrgId);
                }
            }
            return {
                transferTitles:["用户列表","已选用户"],
                changedQueue: [],
                selectedOrgIds: selectedOrgIds,
                selectedIds: [],
                sourceUsers: [],
                selectedKeys: [],
                listStyle: {
                    height: '100%',
                    width: '45%'
                },
                currentPage: 1,
                pageSize: 10,
                total: 0,
                selectedUsers:{},
                queryKeyword: '',
                curUserOrgId:curUserOrgId
            };
        },
        mounted() {
            this.buildRootOrg();
            if(this.initialValue==null || this.initialValue.length==0){
                this.pageQueryUserByOrg();
            }
        },
        methods: {
            doQuery(){
                if(!this.queryKeyword){
                    this.pageQueryUserByOrg();
                }else{
                    this.pageQueryUserByKeyword();
                }
            },
            //选择部门树节点后，查询此部门的用户数据
            handleOrgSelectChange(data) {
                var orgIds = [];
                _.each(data, sd => {
                    orgIds.push(sd.id);
                });
                this.queryKeyword="";
                this.selectedOrgIds = orgIds;
                this.pageQueryUserByOrg();
            },
            pageQueryUserByOrg() {
                context.getMvueToolkit().utils.smartSearch(this, () => {
                  this.queryMethods.pageQueryUserByOrg(this.selectedOrgIds, this.selectedIds, { page: this.currentPage, pageSize: this.pageSize }).then(res => {
                      var users = res.data;
                      this.total = res.total;
                      _.each(users, user => {
                          user.key = user[this.valueKey];
                      })
                      this.sourceUsers = users;
                      this.updateSelectedUsers();
                  });
                }, "changedQueue");
            },
            pageQueryUserByKeyword() {
                context.getMvueToolkit().utils.smartSearch(this, () => {
                  this.queryMethods.pageQueryUserByKeyword(this.queryKeyword, this.selectedIds, { page: this.currentPage, pageSize: this.pageSize }).then(res => {
                      var users = res.data;
                      this.total = res.total;
                      _.each(users, user => {
                          user.key = user[this.valueKey];
                      })
                      this.sourceUsers = users;
                  });
                }, "changedQueue");
            },
            handleTransferChange(targetKeys, direction, moveKeys) {
                if (direction == 'right' && moveKeys.length > 0 && (!this.multiple)) {
                    this.selectedIds = [moveKeys[moveKeys.length - 1]];
                } else {
                    this.selectedIds = targetKeys;
                }
                this.updateSelectedUsers();
            },
            handleTransferSelectedChange(sourceSelected,targetSelected){
                //单选自动移到右边已选
                if(sourceSelected.length>0&&(!this.multiple)){
                    this.$refs.transferRef.moveTo("right");
                }
            },
            handleCurrentPageChange() {
                this.doQuery();
            },
            handleQueryClear() {
                this.queryKeyword = '';
                this.currentPage=1;
            },
            handleQueryChange(val) {
                this.queryKeyword = val;
            },
            updateSelectedUsers() {
                let users = {};
                _.forEach(this.selectedIds, (selectedId) => {
                    let user = this.selectedUsers[selectedId];
                    if (_.isEmpty(user)) {
                        _.forEach(this.sourceUsers, u => {
                            if (selectedId == u[this.valueKey]) {
                                user = u;
                                return false;
                            }
                        });
                    }
                    if (user) {
                        users[selectedId] = user;
                    }
                });
                this.selectedUsers=users;
            }
        },
        components: {
            search: require('./search').default
        }
    };
</script>
