<template>
    <div>
        <template v-if="viewMode">
            <m-operation class="form-item-view" v-if="canView" :operation="refEntityViewOpt"  :widget-context="widgetContext">
                <a href="javascript:void(0)" v-text="viewModeValue" :title="viewModeValue"></a>
            </m-operation>
            <div v-else class="form-item-view" :class="{'deleted-ref':isRefDeleted()}" v-text="realViewModeValue()||emptyText" :title="realViewModeValue()||emptyText"></div>
        </template>
        <template v-else-if="!hasReadPerm">
            <Input readonly type="text" :value="realViewModeValue()"></Input>
        </template>
        <template v-else>
            <div class="bvue-select-wrapper bvue-select-group bvue-select-with-append">
                <Multiselect v-model="selectedItem"
                            :options="dataItems"
                            :placeholder="formItem.componentParams.placeholder||'请输入关键字搜索'"
                            :loading="isLoading"
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
                            <span class="option__title">{{ buildOptionTitle(props.option,formItem.componentParams)}}</span>
                        </div>
                    </template>
                    <template slot="noResult">
                        根据关键字，搜索不到任何数据
                    </template>
                    <template slot="noOptions">
                        无数据
                    </template>
                    <template slot="singleLabel" slot-scope="{option}">
                        <span :class="{'deleted-ref':!!option[rowMetaFakeKey]}">{{option[getTitleField()]}}</span>
                    </template>
                </Multiselect>
                <m-entity-select
                    :entity-name="formItem.componentParams.entityId"
                    :value="selectedItem"
                    :append="true"
                    :disabled="disabled"
                    :query-options="innerQueryOptions"
                    :grid-settings="gridSettings"
                    @on-select-change="confirmSelect">
                </m-entity-select>
            </div>
        </template>
    </div>
</template>
<script>
import context from '../../../libs/context';
import sc from '../../../libs/security/permission';
import controlBase from '../js/control_base';
import entitySelect from '../mixins/entity-select';
import rowMeta from '../../form/js/row-meta';

export default {
    mixins: [controlBase,entitySelect],
    props: {
        "value":{type:[String,Number],default:null}
    },
    data: function(){
        var entityResource=null;
        let metaEntity=this.$metaBase.findMetaEntity(this.formItem.componentParams.entityId);
        if(this.formItem.componentParams.entityResourceUrl){
            entityResource= context.buildResource(this.formItem.componentParams.entityResourceUrl);
        }else{
            entityResource= metaEntity.dataResource();
        }
        let hasReadPerm=sc.hasReadPerm(this.formItem.componentParams.entityId);
        return {
            hasReadPerm:hasReadPerm,
            metaEntity:metaEntity,
            selectedItem:null,//已经选择的项
            entityResource:entityResource,//获取实体数据的操作resource
            hasViewPage:false,
            refEntityViewOpt:{}
        };
    },
    computed:{
        gridSettings(){
            let settings=this.formItem.componentParams.gridSettings ||{};
            if(this.formItem.componentParams.entityResourceUrl){
                settings.queryUrl=this.formItem.componentParams.entityResourceUrl;
            }
            return settings;
        },
        canView(){
            if(!this.selectedItem){
                return false;
            }
            //对当前实体是否有read权限
            if(!this.hasReadPerm){
                return false;
            }
            //对当前行是否有find权限
            let hasViewPerm=sc.hasRowPerm(this.selectedItem,'find');
            if(!hasViewPerm){
                return false;
            }
            //如果对引用的实体配置了view页面，并且有find权限，那么引用组件查看模式可以点击查看详情
            let baseOk= hasViewPerm&&this.hasViewPage;
            if(baseOk){
                this.buildRefEntityViewOpts();
            }
            //如果引用数据有问题，不可点击弹出查看
            if(this.selectedItem[rowMeta.rowMetaFakeKey]){
                return false;
            }
            return baseOk;
        }
    },
    mounted(){
        if(this.viewMode){
            this.judgeViewPage();
        }
    },
    methods: {
        judgeViewPage(){
            //首先判断对引用的实体是否配置了view页面
            let isUIEnable=this.metaEntity.isUIEnable();
            //如果实体没有ui配置，不用远程获取了
            if(!isUIEnable){
                this.hasViewPage=false;
            }else{
                this.metaEntity.getPage('view').then(settings=>{
                    if(settings){
                        this.hasViewPage=true;
                    }
                });
            }
        },
        buildQueryOptions(params,keyword){
            var encodeKeyword=context.getMvueToolkit().utils.leapQueryValueEncode(keyword);
            var filters=`${this.getTitleField()} like '%${encodeKeyword}%'`;
            params.filters=filters;
            if(this.formItem.componentParams.orderbyField){
                let orderbyType=this.formItem.componentParams.orderbyType||'asc';
                params.orderby=`${this.formItem.componentParams.orderbyField} ${orderbyType}`;
            }else{
                params.orderby=this.buildDefaultOrderBy();
            }
        },
        getIdField:function(){
            return this.formItem.componentParams.idField;
        },
        getTitleField:function(){
            return this.formItem.componentParams.titleField;
        },
        //从选择列表选择数据确认后，反应到多选组件
        confirmSelect(selectedItem){
            this.handleOnSelectChange(selectedItem,null);
        },
        buildRefEntityViewOpts(){
            this.refEntityViewOpt={
                operationType: 'popup',
                title: '详情',
                url: 'view'
            }
            this.widgetContext={
                metaEntity:this.metaEntity,
                selectedId:this.selectedItem[this.getIdField()],
                selectedItems:[this.selectedItem]
            };
        }
    }
}
</script>



