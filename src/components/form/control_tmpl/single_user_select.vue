<template>
    <div>
        <template v-if="viewMode">
                <div class="form-item-view" :class="{'deleted-ref':isRefDeleted()}" v-text="realViewModeValue()||emptyText" :title="realViewModeValue()||emptyText"></div>
        </template>
        <template v-else>
            <div class="bvue-select-wrapper bvue-select-group bvue-select-with-append">
                <Multiselect v-model="selectedItem"
                            :options="dataItems"
                            :loading="isLoading"
                            :placeholder="selectPlaceholder"
                            :disabled="disabled"
                            select-label="按enter键选择"
                            selected-label="已选"
                            deselect-label="按enter键取消选择"
                            :show-no-results="true"
                            :internal-search="false"
                            :label="getTitleField()"
                            @search-change="searchChange"
                            @input="handleOnSelectChange"
                            :track-by="getIdField()">
                    <template slot="option" slot-scope="props">
                        <div class="option__desc">
                            <span class="option__title">{{ props.option[getTitleField()] }}</span>
                            <span class="option__small">{{ (props.option.email||props.option[getLoginField()]) ? '-'+(props.option.email||props.option[getLoginField()]):''}}</span>
                        </div>
                    </template>
                    <template slot="noResult">
                        根据关键字，搜索不到任何用户
                    </template>
                    <template slot="noOptions">
                        无用户数据
                    </template>
                    <template slot="singleLabel" slot-scope="{option}">
                        <span :class="{'deleted-ref':!!option[rowMetaFakeKey]}">{{option[getTitleField()]}}</span>
                    </template>
                </Multiselect>
                <div class="ivu-btn ivu-btn-primary bvue-select-group-append" :disabled="disabled" @click="toggleModal">
                    <Icon :type="btnIcon"></Icon>
                </div>
                <Modal class="bvue-select-modal" v-model="popupWidgetModal"
                        :width="modalWidth"
                        :title="modalTitle"
                        :scrollable="true"
                        :mask-closable="false"
                        >
                        <div class="bvue-select-modal" :style="{height:innerModalHeight+'px',overflow:'auto'}">
                            <select-user ref="selectRef" v-if="popupWidgetModal"
                            :initial-value="value"
                            :multiple="false"
                            :label-key="getTitleField()"
                            :value-key="getIdField()"
                            :org-label-key="orgLabelKey()"
                            :org-value-key="orgValueKey()"
                            :render-format="renderFormat"
                            :query-placeholder="selectPlaceholder"
                            :tree-expand-level="treeExpandLevel"
                            :tree-leaf-key="treeLeafKey"
                            :select-current-user-org="!!formItem.componentParams.selectCurrentUserOrg"
                            :only-select-current-user-org="!!formItem.componentParams.onlySelectCurrentUserOrg"
                            :query-methods="queryMethods"></select-user>
                        </div>
                        <div slot="footer">
                            <Button type="default" @click="close">取消</Button>
                            <Button type="primary" @click="confirmSelect">确定</Button>
                        </div>
                </Modal>
            </div>
        </template>
    </div>
</template>
<script>
import context from '../../../libs/context';
import controlBase from '../js/control_base';
import entitySelect from '../mixins/entity-select';
import selectModal from '../mixins/select-modal';
import selectUserBase from './user-select/select-user-base';
export default {
    mixins: [controlBase,entitySelect,selectModal,selectUserBase],
    props: {
        "value":{type:[String,Number],default:null}
    },
    data: function(){
        let entityResource=null;
        if(this.paths&&this.paths.userApiUrl){
            entityResource= context.buildResource(this.paths.userApiUrl);
        }
        return {
            selectedItem:null,//已经选择的项
            entityResource:entityResource,//获取用户数据的操作resource
            queryFields:this.buildSelectFields()//查询的冗余数据
        };
    },
    computed:{
        selectPlaceholder(){
            return this.formItem.componentParams.placeholder||'请输入用户姓名';
        }
    },
    watch:{
        "paths.userApiUrl":function(newValue,oldValue){//监听地址，一旦设置值，用户操作的resource就可以构造了
            var _this=this;
            if(newValue){
                this.entityResource= context.buildResource(newValue);
                this.firstSearch();
            }
        },
    },
    methods: {
        buildQueryOptions(params,keyword){
            var encodeKeyword=context.getMvueToolkit().utils.leapQueryValueEncode(keyword);
            let defaultFilters=this.getFilters();
            var filters= `(${this.getTitleField()} like '%${encodeKeyword}%' or ${this.getLoginField()}  like '%${encodeKeyword}%')`;
            //如果设置了只查询当前用户部门数据，附加此条件
            if(this.formItem.componentParams.onlySelectCurrentUserOrg){
                filters =`(${filters} and ${context.getSettings().control.userSelect.orgField} eq ${this.curUserOrgId})`;
            }
            if(defaultFilters){
                filters=`${defaultFilters} and ${filters}`;
            }
            params.filters=filters;
        },
        buildSelectFields(){
            return `${this.getIdField()},${this.getTitleField()},${this.getLoginField()},${context.getSettings().control.userSelect.detailFields}`;
        },
        getFilters(){
            return context.getSettings().control.userSelect.filters;
        },
        getEntityName(){
            return context.getSettings().control.userSelect.entityName;
        },
        getIdField:function(){
            return context.getSettings().control.userSelect.idField;
        },
        getTitleField:function(){
            return context.getSettings().control.userSelect.nameField;
        },
        getLoginField(){
            return context.getSettings().control.userSelect.loginField;
        },
        //从选择列表选择数据确认后，反应到多选组件
        confirmSelect(){
            var selectRef=this.$refs.selectRef;
            var selectedIds=selectRef.selectedIds||[];
            var value=null;
            if(selectedIds.length>0){
                value=selectedIds[0];
            }
            if(!value){
                this.$Modal.info({
                    content:"请选择一行数据"
                });
                return;
            }
            this.entityResource.get({id:value}).then(({data})=>{
                this.selectedItem=data;
                this.handleOnSelectChange(data,null);
                this.close();
            });
        }
    },
    components:{
        selectUser:require('./user-select/select-user').default
    }
}
</script>


