<template>
    <Form @submit.native.prevent v-if="preprocessed" :ref="'formRef'" :model="entity"
          :rules="innerRules" :inline="inline" :label-position="labelPosition" :label-width="itemLabelWidth"
          :class="{'mform-show-border':bordered}"
          :show-message="showMessage" :autocomplete="autocomplete">
        <slot name="prepend"></slot>
        <slot>
            <meta-layout :flex="bordered" :layout="layout" :itemProcessor="itemProcessor"></meta-layout>
        </slot>
        <slot name="append"></slot>
        <FormItem v-if="hasButtons() || $slots.toolbar" class="form-toolbar"
                v-transfer-dom="toolbarTransferDomId" :data-transfer="transfer">
            <slot name="toolbar" >
                <template v-if="isView">
                    <template v-for="(btn,index) in innerToolbar.viewBtns">
                        <meta-operation v-if="!btnIsHidden(btn)" :key="index" :operation="btn" :widget-context="getWidgetContext()">
                            <Button slot-scope="{operation}" :disabled="btnIsDisabled(operation)" :type="operation.btnType||'primary'"  :title="operation.title">
                                <m-icon :type="operation.icon" v-if="operation.icon"></m-icon>
                                {{operation.title}}
                            </Button>
                        </meta-operation>
                    </template>
                </template>
                <template v-if="!isView">
                    <template v-for="(btn,index) in innerToolbar.editBtns">
                        <meta-operation  v-if="!btnIsHidden(btn)" :key="index" :operation="btn" :widget-context="getWidgetContext()">
                            <Button slot-scope="{operation}" :disabled="btnIsDisabled(operation)" :type="operation.btnType||'primary'"  :title="operation.title">
                                <m-icon :type="operation.icon" v-if="operation.icon"></m-icon>
                                {{operation.title}}
                            </Button>
                        </meta-operation>
                    </template>
                    <Checkbox v-if="showCreateAnother()" v-model="createAnother">继续创建</Checkbox>
                </template>
            </slot>
        </FormItem>
    </Form>
</template>
<script>
    import metaformUtils from './js/metaform_utils';
    import controlTypeService from './js/control_type_service';
    import initByMetadata from './init-by-metadata';
    import formBase from './form-base';
    import contextHelper from "../../libs/context";
    import sc from '../../libs/security/permission';
    export default {
        name: 'mForm',
        mixins:[formBase],
        props:{
            entityName:{//必填参数，表示元数据实体的名称）
                type:String,
                required:true
            },
            layout:{
              type:Array,
                default:function(){
                    return [];
                }
            },
            pageTitleTmpl:{//页面title的模板，与es6模板语法一致，例如'新建--${entity.title}'
                type:String
            },
            id:{
                type:String
            },
            relationField:{//由关系列表关系设置的过滤字段名，如果有多个字段对同一个目标实体有多对一关系，需要设置这个字段明确是哪一个
                type:String,
                required:false
            },
            createParams:{//由弹出部件操作设置的创建时查询参数
                type:Object,
                required:false
            },
            ignoreRequiredValidate:{//是否忽略必填验证
                type:Boolean,
                default:false
            },
            inBatchEditor:{//是否在批量编辑grid中
                type:Boolean,
                default:false
            }
        },
        watch:{
            recordId(newV,oldV){
                //每次切换recordId时，需要先去掉entity的监听器
                if(this.entityUnWatcher){
                    this.entityUnWatcher();
                    this.entityUnWatcher=null;
                }
                this.recordIdChangedPreprocessed=false;
                this.entityId=this.recordId;
                if(!!this.entityId||(this.entityId===0)){
                    this.formStatus=contextHelper.getMvueToolkit().utils.formActions.edit;
                }
                this.reinitEntityModel();
            }
        },
        data:function(){
            var metaEntity=this.$metaBase.findMetaEntity(this.entityName);
            let idFieldName=metaEntity.getIdField().name;
            var dataResource=metaEntity.dataResource();
            //构造实体数据操作的基本数据模型，会包含需要提交到后台的所有字段：会过滤掉主键、创建时间等维护字段
            //这里提前初始化entity数据，保证字段的存在性，对于双向绑定和表单验证是必须的
               var entity=metaEntity.getDefaultModel();
            //初始化自动生成的批量字段
            this.initBatchFields(entity);
            if(this.layout.length==0){
                _.forEach(metaEntity.getDefaultFormFields(),(metaFieldName)=>{
                    this.layout.push({
                        ctype:"m-field",
                        name:metaFieldName,
                        context:this.fieldContext(metaFieldName)
                    });
                });
            }
            return {
                entityUnWatcher:null,
                recordIdChangedPreprocessed:false,
                idFieldName:idFieldName,
                metaEntity:metaEntity,
                dataResource:dataResource,
                entity:entity,
                firstEntityData:null,
                isLayout:true
            };
        },
        computed:{
            itemProcessor(){
                return this.layoutProcessor;
            }
        },
        mounted:function () {
            //创建模式，继续初始化，因为初始模型数据已经存在了
            if(this.isCreate){
                //先根据后端定义填充所有属性的默认值
                let p=null;
                if(this.localModel){
                    p=Promise.resolve(this.localModel);
                }else{
                    p=this.metaEntity.fillDefault(this.entity,this.calc);
                }
                p.then(_entity=>{
                    this.entity=_entity;
                    //如果url参数是实体的字段则填充相应的模型数据
                    initByMetadata.initModelByQueryParams(this,this.entity);
                    //根据关系填充模型关系字段数据：只考虑多对一关系
                    initByMetadata.initModelByRelation(this,this.entity);
                    //最后根据前端附加的默认固定值填充表单entity
                    if(!_.isEmpty(this.defaultValues)){
                        _.forIn(this.defaultValues, (value, key) => {
                            if(this.entity.hasOwnProperty(key)){
                                this.entity[key]=value;
                            }
                        });
                    }
                    this.$store.commit("core/setEntity",{entityName:this.entityName,entity:this.entity});
                    this.initOthers();
                });
            }else{//编辑或查看模式，需要从后端获取实体记录数据覆盖初始的模型数据，之后再继续初始化
                this.reinitEntityModel();
            }
        },
        methods:{
            initBatchFields(entity){
                if(this.isBatchMode()){
                    _.each(this.batchForm.fields,f=>{
                        var batchFieldName=this.getBatchFieldProp(f);
                        entity[batchFieldName]=[];
                    });
                }
            },
            commitPageTitle(){
                var title='';
                if(this.pageTitleTmpl){
                    let func= new Function('entity',`return \`${this.pageTitleTmpl}\``);
                    title=func(this.entity);
                }else {
                    let titleField = this.metaEntity.firstTitleField();
                    let recordTitle=titleField==null?"":`-${this.entity[titleField.name]}`;
                    if (this.isCreate) {
                        title = `新建${this.metaEntity.title}`;
                    } else if (this.isEdit) {
                        title = `编辑${this.metaEntity.title}${recordTitle}`;
                    } else {
                        title = `查看${this.metaEntity.title}${recordTitle}`;
                    }
                }
                this.$store.commit('core/setPageTitle',{title:title,sourceId:this.id});
            },
            initOthers(){
                //根据实体字段信息初始化表单默认验证规则
                if(!this.isView){
                    this.initValidateRulesByMetaEntity();
                }
                //通知页面表单这边需要修改页面标题，并提交变化后的标题数据
                this.commitPageTitle();
                //预处理完毕，表单可以渲染了
                this.preprocessed=true;
                this.recordIdChangedPreprocessed=true;
                //调用外部传入的初始化回调函数
                if(this.onInited){
                    this.onInited(this);
                }
                this.$emit("on-inited",this);
                //TODO 如何保证entity变化后激发，而不是初始化是也激发
                if(this.isEdit){
                    this.$nextTick(()=>{
                        //初始化完成后注册entity的监听器
                        this.entityUnWatcher=this.$watch('entity',{
                            handler:(newV,oldV)=>{
                                let oldId=oldV[this.idFieldName];
                                if(!oldId&&(oldId!==0)){
                                    return;
                                }
                                if(this.recordIdChangedPreprocessed&&this.isEdit&&newV[this.idFieldName]===oldV[this.idFieldName]){
                                    this.$emit("on-form-entity-changed",this.entity);
                                }
                            },
                            deep:true
                        });
                    });
                }
            },
            //根据数据id重新初始化entity模型数据
            reinitEntityModel(){
                var expand= this.metaEntity.getExpand();
                let p=null;
                if(this.localModel){
                    p=Promise.resolve({data:this.localModel});
                }else{
                    p=this.dataResource.get({id: this.entityId,expand:expand})
                }
                return p.then(({data})=> {
                    let hasEditPerm=sc.hasRowPerm(data,'edit');
                    this.hasEditPerm=hasEditPerm;
                    this.firstEntityData=data;
                    this.$store.commit("core/setEntity",{entityName:this.entityName,entity:data});
                    //根据实体记录数据初始化操作权限
                    //this.initPerm(data);
                    /*_.forIn(this.entity, (value, key) => {
                        this.entity[key] = data[key];
                    });*/
                    if(data==this.localModel){
                        this.entity=this.localModel;
                    }else{
                        _.forIn(data, (value, key) => {
                            //保存从服务端获取的entity数据中，不是当前实体字段的冗余数据key
                            let mField=this.metaEntity.findField(key);
                            if(!mField){
                                this.ignoreKeys[key]=true;
                            }
                            //将所有数据项设置到当前entity对象中
                            this.$set(this.entity,key,value);
                        });
                    }
                    this.initOthers();
                });
            },
            //根据实体字段信息初始化表单默认验证规则
            initValidateRulesByMetaEntity:function () {
                var _this=this;
                _.forEach(_this.metaEntity.getDefaultFormFieldsWithIds(),function (fieldName) {
                    var metaField=_this.metaEntity.findField(fieldName);
                    var formItem=controlTypeService.buildFormItemByMetaField(metaField);
                    var rules=metaformUtils.initValidation(formItem,_this.metaEntity,_this.entityId,_this.entity,_this.ignoreRequiredValidate);
                    if(rules.length>0) {
                        _this.innerRules[formItem.dataField] = rules;
                    }
                });
            },
            layoutProcessor:function(item){
                //处理["name","title"]写法的字段布局
                let _item=null;
                if(_.isString(item)){
                    _item = {
                        ctype:"m-field",
                        name:item
                    }
                }else{
                    //已经由命令行解析程序处理后的对象：参数解析完毕，--width 100
                    //定义哪些是表单内部的控件，需要将value转为name
                    let formControls={
                        "meta-field":true,
                        "metaField":true,
                        "m-field":true,
                        "m-expand":true,
                        "m-confirm":true,
                        "m-relation":true
                    };
                    if(_.has(item,"value") && formControls[item.ctype]){
                        item["name"]=item["value"];
                        delete item["value"];
                    }
                    // var ignores=["value","icon","ctype","name","title","input-type","span","inputType","action","entityName","preprocessor",
                    //     "context","model","showLabel","label","rules","required","error","showMessage",
                    //     "labelFor","labelWidth","initWhenCreate","params"];
                    // var params=item.params||{};
                    // _.forIn(item,(v,k)=>{
                    //     if(!_.includes(ignores,k)){
                    //         params[k]=v;
                    //     }
                    // });
                    // item.params=params;
                    _item=item;
                }
                //表单上下文都要附加到m-field组件上去
                _item.context=_.extend({},this.fieldContext(),_item.context);
                this.batchFieldConvert(_item);
                //如果是关系，而不是字段，切换成关系控件
                if(this.metaEntity.relations[_item.name]){
                    _item.ctype='m-relation';
                }
                return _item;
            },
            handleFormItemChange(itemEvent,formItem){
                this.$emit("on-change",itemEvent,{
                    form:this,
                    formItem:formItem
                });
            },
            validate(callback){
                return this.$ref["formRef"].validate(callback);
            },
            validateField(fieldName,callback){
                return this.$ref["formRef"].validateField(fieldName,callback);
            },
            resetFields(callback){
                return this.$ref["formRef"].resetFields();
            }
        }
    }
</script>


