<template>
    <div>
        <template v-if="viewMode">
                <div class="form-item-view" v-text="viewModeValue||emptyText" :title="viewModeValue||emptyText"></div>
        </template>
        <template v-else>
            <div class="bvue-select-wrapper bvue-select-group bvue-select-with-append">
                <div class='ivu-input m-parent-select-input'>{{selectedItem&&selectedItem[getTitleField()]}}</div>
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
                            <entity-select-tree ref="selectRef"
                                v-if="popupWidgetModal"
                                :record-id="recordId"
                                :initial-value="value"
                                :label-key="getTitleField()"
                                :value-key="getIdField()"
                                :query-placeholder="selectPlaceholder"
                                :tree-expand-level="treeExpandLevel"
                                :tree-leaf-key="treeLeafKey"
                                :form-item="formItem"
                                :query-methods="queryMethods"
                            ></entity-select-tree>
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
import context from '../../../../libs/context';
import controlBase from '../../js/control_base';
import selectModal from '../../mixins/select-modal';
import entitySelect from '../../mixins/entity-select';
import queryMethodsBuilder from './query-methods';
export default {
    mixins: [controlBase,selectModal,entitySelect],
    components:{
        'entity-select-tree':require('./entity-select-tree').default
    },
    props: {
        'value':{type:[String,Number],default:null},

        treeExpandLevel:{//部门树默认展开到第几级
            type:Number,
            default:1
        },
        treeLeafKey:{//部门数据标志为叶子节点的字段属性
            type:String,
            default:''
        }
    },
    data(){
        var metaForm=this.getParentForm();
        let queryMethods=null;
        let entityResource=context.buildResource(this.formItem.componentParams.entityResourceUrl);
        queryMethods=queryMethodsBuilder.build(entityResource,this.getIdField(),this.getTitleField(),this.formItem.dataField,this.formItem.componentParams);
        return {
            entityResource:entityResource,
            queryMethods:queryMethods,
            recordId:metaForm&&metaForm.recordId
        };
    },
    computed:{
        selectPlaceholder(){
            return this.formItem.componentParams.placeholder||'请输入部门名称';
        }
    },
    methods:{
        getIdField:function(){
            return this.formItem.componentParams.idField;
        },
        getTitleField:function(){
            return this.formItem.componentParams.titleField;
        },
        confirmSelect(){
            var selectedIds=this.$refs.selectRef.selectedIds;
            if(!selectedIds.length==1){
                this.selectedItem=null;
            }else{
                this.selectedItem=this.$refs.selectRef.selectedEntityDetails[selectedIds[0]];
            }
            this.handleOnSelectChange(this.selectedItem,null);
            this.close();
        }
    }
}
</script>

