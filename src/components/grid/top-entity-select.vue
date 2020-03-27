<template>
    <Multiselect v-if="entityResource" style="display:inline-block;width:200px;float:right;"
        :multiple="false" v-model="selectedItem"
        :options="dataItems"
        :placeholder="placeholder"
        :loading="isLoading"
        select-label="按enter键选择"
        selected-label="已选"
        :deselect-label="mustSelect?'':'按enter键取消选择'"
        :show-no-results="true"
        :internal-search="false"
        :label="getTitleField()"
        :allowEmpty="!mustSelect"
        @search-change="searchChange"
        :track-by="getIdField()">
        <template slot="option" slot-scope="props">
            <div class="option__desc">
                <span class="option__title">{{ props.option[getTitleField()] }}</span>
            </div>
        </template>
        <template slot="noResult">
            根据关键字，搜索不到任何数据
        </template>
        <template slot="noOptions">
            无数据
        </template>
    </Multiselect>
</template>
<script>
import context from '../../libs/context';
import metabase from '../../libs/metadata/metabase';
import entitySelect from '../form/mixins/entity-select';
import topEntityService from "../../services/store/top-entity";

export default {
    mixins:[entitySelect],
    props:{
        entityName:{
            type:String,
            required:true
        },
        searchFields:{
            type:Array,
            default(){
                return [];
            }
        },
        queryOptions:{
            type:Object,
            default(){
                return {};
            }
        },
        placeholder:{
            type:String,
            default:''
        },
        mustSelect:{
            type:Boolean,
            default:false
        }
    },
    data(){
        var metaEntity = metabase.findMetaEntity(this.entityName);
        var entityResource=metaEntity.dataResource();
        return {
            metaEntity:metaEntity,
            entityResource:entityResource,
            changedQueue:[]
        };
    },
    watch:{
        selectedItem:{
            handler:function(){
                this.handleOnChange();
            },
            immediate:false
        }
    },
    methods:{
        getIdField(){
            return this.metaEntity.getIdField().name;
        },
        getTitleField(){
            return this.metaEntity.firstTitleField().name;
        },
        entitySelectInitialValue() {
            let topEntity = topEntityService.getHistory(this.entityName);
            if (topEntity) {
                topEntityService.set(topEntity.entityName, topEntity.value);
                return topEntity.value;
            }
            return null;
        },
        buildQueryOptions(params,keyword){
            var encodeKeyword=context.getMvueToolkit().utils.leapQueryValueEncode(keyword);
            var filters=`${this.getTitleField()} like '%${encodeKeyword}%'`;
            if(this.searchFields&&this.searchFields.length>0){
                let _f=[];
                this.searchFields.forEach(sf => {
                    _f.push(`${sf} like '%${encodeKeyword}%'`);
                });
                filters=_f.join(' or ');
            }
            if(this.queryOptions){
                for (const key in this.queryOptions) {
                    if (this.queryOptions.hasOwnProperty(key)) {
                        const element = this.queryOptions[key];
                        //filters作拼接
                        if(key=='filters'&&element){
                            filters=`(${this.queryOptions.filters}) and (${filters})`;
                        }else{//其他queryOptions直接覆盖
                            params[key]=element;
                        }
                    }
                }
            }
            params.filters=filters;
        },
        handleOnChange(){
            let topEntityRow='';
            if(this.selectedItem){
                let idFieldName=this.getIdField();
                topEntityService.set(this.entityName,this.selectedItem[idFieldName]);
            }else{
                topEntityService.remove();
            }
            this.$emit('on-top-entity-change');
        },
        initOnFirstLoaded(items){
            if(this.mustSelect&&_.isEmpty(this.selectedItem)&&!_.isEmpty(items)){
                this.selectedItem=items[0];
            }
        }
    }
}
</script>

