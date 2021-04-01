<template>
    <div class="grid-fill-data-con">
        <div @click="handleBtnClick" style="width:100%;">
            <slot>
                <Button type="primary"  :icon="operation.icon">{{operation.title}}</Button>
            </slot>
        </div>
        <Drawer
            :title="title"
            v-model="showDrawer"
            :width="80"
            :mask-closable="false"
            :styles="styles"
            class="grid-drawer-con"
        >
            <m-form ref="form" 
                :entity-name="metaEntity.name" 
                :ignore-required-validate="true" 
                @on-ref-selected-changed="handleOnRefSelectedChanged"
                style="height: calc(100% - 55px); overflow: auto;"
                :on-inited="handleOnInited">
                <template v-for="fieldName in formFields">
                    <Row :key="fieldName" v-if="editable(fieldName)">
                        <i-col :span="12">
                            <m-field :name="fieldName"></m-field>
                        </i-col>
                        <i-col :span="12">
                            <FormItem class="clear-model-check">
                                <Checkbox v-model="clearModel[fieldName]">全部置空</Checkbox>
                            </FormItem>
                        </i-col>
                    </Row>
                </template>
            </m-form>
            <div class="drawer-footer">
                <Button style="margin-right: 8px" @click="showDrawer = false">取消</Button>
                <Button type="primary" @click="handleOnConfirmClick">确定</Button>
            </div>
        </Drawer>
    </div>
</template>
<script>
import context from "../../libs/context";
export default {
    props:{
        operation:{
            type:Object,
            required:true
        },
        widgetContext:{
            type:Object,
            required:true
        }
    },
    data:function(){
        let metaEntity=this.widgetContext.metaEntity;
        let formFields=this.buildFormFields();
        let clearModel=this.buildClearFieldsModel(formFields);
        return {
            title:"批量设值",
            showDrawer:false,
            styles:{
                height: 'calc(100% - 55px)',
                overflow: 'visible'
            },
            metaEntity:metaEntity,
            formFields:formFields,
            clearModel:clearModel,
            currentMeta:{}
        }
    },
    methods:{
        handleOnRefSelectedChanged(refControl,selectedItem){
            let fieldName=refControl.formItem.dataField;
            let data={
                title:selectedItem&&selectedItem[refControl.getTitleField()]
            };
            this.currentMeta[fieldName]=data;
        },
        handleOnInited(form){
            //清空所有表单项
            this.formFields.forEach(fieldName => {
                form.entity[fieldName]=null;
            });
        },
        handleBtnClick(){
            this.showDrawer=true;
        },
        handleOnConfirmClick(){
            let form=this.$refs.form;
            form.$refs["formRef"].validate(valid => {
                if(valid){
                    let entity=form.entity;
                    let _model={};
                    this.formFields.forEach(fieldName => {
                        _model[fieldName]=entity[fieldName];
                    });
                    let _currentMeta={};
                    for (const key in this.currentMeta) {
                        if (this.currentMeta.hasOwnProperty(key)) {
                            const value = this.currentMeta[key];
                            _currentMeta[key]=value;
                        }
                    }
                    this.widgetContext.grid.$emit("on-batch-fill-data",_model,this.clearModel,this.currentMeta);
                    this.showDrawer=false;
                }
            });
        },
        buildFormFields(){
            let metaEntity=this.widgetContext.metaEntity;
            let grid=this.widgetContext.grid;
            let columns=grid.columns;
            let fields=[];
            columns.forEach(col => {
                if(metaEntity.findField(col.key)){
                    fields.push(col.key);
                }
            });
            return fields;
        },
        buildClearFieldsModel(formFields){
            let clearModel={};
            formFields.forEach(fieldName => {
                clearModel[fieldName]=false;
            });
            return clearModel;
        },
        editable(fieldName){
            let metaEntity=this.widgetContext.metaEntity;
            let metaField=metaEntity.findField(fieldName);
            if(metaField.updatable===false||metaField.readonly){
                return false;
            }
            return true;
        }
    }
}
</script>


