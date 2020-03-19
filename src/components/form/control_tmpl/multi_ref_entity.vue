<template>
    <div>
        <template v-if="viewMode">
            <div class="form-item-view" :title="realViewModeValue()||emptyText">
                <template v-for="(val,index) in multiRefDeletedValue()">
                    <span :key="index" :class="{'deleted-ref':val.deleted}" v-text="(index<multiRefDeletedValue().length-1)?(val.text+','):val.text"></span>
                </template>
            </div>
        </template>
        <template v-else-if="!hasReadPerm">
            <Input readonly type="text" :value="realViewModeValue()"></Input>
        </template>
        <template v-else>
            <div class="bvue-select-wrapper bvue-select-group bvue-select-with-append">
                <Multiselect :multiple="true" v-model="selectedItem"
                            :options="dataItems"
                            :placeholder="formItem.componentParams.placeholder||'请输入关键字搜索'"
                            :loading="isLoading"
                            :disabled="disabled"
                            select-label="按enter键选择"
                            selected-label="已选"
                            deselect-label="按enter键取消选择"
                            :show-no-results="true"
                            :internal-search="false"
                             :closeOnSelect="formItem.componentParams.closeOnSelect || false"
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
                    <template slot="tag" slot-scope="{option,search,remove}">
                        <span class="multiselect__tag" :key="option[getIdField()]">
                            <span :class="{'deleted-ref':!!option[rowMetaFakeKey]}" v-text="option[getTitleField()]"></span>
                            <i aria-hidden="true" tabindex="1" @keypress.enter.prevent="remove(option)"  @mousedown.prevent="remove(option)" class="multiselect__tag-icon"></i>
                        </span>
                    </template>
                </Multiselect>
                <m-entity-select
                    :entity-name="formItem.componentParams.entityId"
                    :value="selectedItem"
                    :append="true"
                    :multiple="true"
                    :disabled="disabled"
                    :grid-settings="gridSettings"
                    :query-options="innerQueryOptions"
                    @on-select-change="confirmSelect">
                </m-entity-select>
            </div>
        </template>
    </div>
</template>
<script>
import sc from '../../../libs/security/permission';
import context from '../../../libs/context';
import controlBase from '../js/control_base';
import entitySelect from '../mixins/entity-select';
export default {
    mixins: [controlBase,entitySelect],
    props: {
        "value":{
            type:Array,
            default(){
                return [];
            }
        }
    },
    data: function(){
        let entityResource=null;
        let metaEntity=this.$metaBase.findMetaEntity(this.formItem.componentParams.entityId);
        if(this.formItem.componentParams.entityResourceUrl){
            entityResource= context.buildResource(this.formItem.componentParams.entityResourceUrl);
        }else{
            entityResource= metaEntity.dataResource();
        }
        let hasReadPerm=sc.hasReadPerm(this.formItem.componentParams.entityId);
        return {
            hasReadPerm:hasReadPerm,
            selectedItem:[],//已经选择的项
            entityResource:entityResource//获取实体数据的操作resource
        };
    },
    computed:{
        gridSettings(){
            let settings=this.formItem.componentParams.gridSettings ||{};
            if(this.formItem.componentParams.entityResourceUrl){
                settings.queryUrl=this.formItem.componentParams.entityResourceUrl;
            }
            return settings;
        }
    },
    methods: {
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
        }
    }
}
</script>


