<template>
    <FormItem class="m-relation-item">
        <template v-if="showLabel" slot="label">
            <slot name="label">{{innerTitle}}<info-tip v-if="description" :content="description"></info-tip></slot>
        </template>
        <m-grid v-if="preprocessed"
        :entity-name="entityName" 
        :columns="innnerColumns"
        :from-relation="fromRelation"
        :show-refresh-btn="false"
        :show-config-columns-btn="false"
        :size="size"
        :hide-pager-if-one-page="true"
        :show-selection="false"></m-grid>
    </FormItem>
</template>
<script>
import getParent from '../../../mixins/get-parent';
import context from '../../../../libs/context';
export default {
    mixins:[getParent],
    props:{
        showLabel:{
            type:Boolean,
            default:true
        },
        title:{
            type:String
        },
        description:{
            type:String
        },
        name:{//关系名称
            type:String,
            required:true
        },
        columns:{
            type:Array,
            default(){
                return [];
            }
        },
        size: {
            type: String,
            default:'small'
        }
    },
    data(){
        let metaForm=this.getParentForm();
        if(!metaForm){
            context.error({content:'关系控件必须在表单内部使用'});
            return {};
        }
        let fromMetaEntity=metaForm.metaEntity;
        let relation=fromMetaEntity.relations[this.name];
        if(!relation){
            context.error({content:`实体${fromMetaEntity.name}关系${this.name}不存在`});
            return {};
        }
        let innerTitle=this.title||relation.title;
        let entityName=relation.targetEntity;
        return {
            fromMetaEntity:fromMetaEntity,
            relation:relation,
            preprocessed:false,
            entityName:entityName,
            innerTitle:innerTitle,
            innnerColumns:[],
            fromRelation:{
                entityName:fromMetaEntity.name,
                name:this.name
            }
        };
    },
    created(){
        this.initColumns(this.fromMetaEntity,this.relation);
    },
    methods:{
        async initColumns(fromMetaEntity,relation){
            if(!_.isEmpty(this.columns)){
                this.innnerColumns=_.cloneDeep(this.columns);
            }else{
                let pageConfig = await fromMetaEntity.getRelationPage(relation.name,'list');
                if(pageConfig&&!_.isEmpty(pageConfig.columns)){
                    this.innnerColumns=_.cloneDeep(pageConfig.columns);
                }
            }
            this.preprocessed=true;
        }
    }
}
</script>
