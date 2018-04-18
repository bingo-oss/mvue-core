<template>
    <div v-if="preprocessed" class="meta-form-panel" :class="{'has-buttons':hasButtons()}">
        <div style="height:30px;position:relative;" v-show="loadingFormData">
            <Spin fix>
            </Spin>
        </div>
        <template v-if="metaFormLayout">
            <div v-for="formItem in metaForm.layout" :key="formItem.id">
                <div class="control-tmpl-panel" v-show="!formItem.hidden">
                    <component v-if="formItem.isContainer" :is="'Meta'+formItem.componentType" :form-item="formItem">
                        <div v-for="containerFormItem in formItem.children" :key="containerFormItem.id" v-show="!containerFormItem.hidden">
                            <component v-if="containerFormItem.isDataField" :context="{metaEntity,action}" :validator="$validator" v-model="entity[containerFormItem.dataField]" @exDataChanged="exDataChanged" :is="componentName(formItem)" :form-item="containerFormItem" :paths="paths" :model="entity"></component>
                            <component v-else-if="containerFormItem.isExternal" :context="{metaEntity,action}" @on-register-after-save-chain="registerAfterSaveChain" :is="componentName(containerFormItem)" :form-item="containerFormItem" :paths="paths" :model="entity"></component>
                            <component v-else :is="'Meta'+containerFormItem.componentType" :form-item="containerFormItem"></component>
                        </div>
                    </component>
                    <component v-else-if="formItem.isDataField" :context="{metaEntity,action}" :validator="$validator" v-model="entity[formItem.dataField]" @exDataChanged="exDataChanged" :is="componentName(formItem)" :form-item="formItem" :paths="paths" :model="entity"></component>
                    <component v-else-if="formItem.isExternal" :context="{metaEntity,action}" @on-register-after-save-chain="registerAfterSaveChain" :is="componentName(formItem)" :form-item="formItem" :paths="paths" :model="entity"></component>
                    <component v-else :is="'Meta'+formItem.componentType" :form-item="formItem"></component>
                </div>
            </div>
        </template>
        <template v-if="!metaFormLayout">
            <slot>
                <meta-field v-for="key in metaEntity.getDefaultFormFields()" :key="key" :name="key">
                </meta-field>
            </slot>
        </template>
        <div v-transfer-dom="'#default-form-uuid-'+entityName" :data-transfer="transfer" class="form-toolbar" :class="{'has-buttons':hasButtons()}" slot="toolbar">
            <div v-if="hasButtons()" :class="{'onepx-stroke':hasButtons()}"></div>
            <Button v-if="innerPermissions.cancel" type="ghost" size="small"  @click.stop.prevent="doCancel">取消</Button>
            <Button v-if="innerPermissions.openEdit&&isView" type="primary" size="small" @click.stop.prevent="doOpenEdit">编辑</Button>
            <Button v-if="innerPermissions.edit&&!isView" type="primary" size="small" @click.stop.prevent="doSaveModel">保存</Button>
            <Button v-if="innerPermissions.del && isEdit" type="primary" size="small" @click.stop.prevent="doDelete">删除</Button>
        </div>
    </div>
</template>
<script>
    import TransferDom from './js/transfer_dom';
    import constants from './js/constants';
    import metaformUtils from './js/metaform_utils';
    import metaservice from '../../services/meta/metaservice';

    var co = require('co');

    export default {
        directives: { TransferDom },
        props:{
            entityName:{                        //实体名
                type:String,
                required:true
            },
            recordId:{                              //当前表单编辑的实体数据id
                type:String,
                required:false,
            },
            isView:{                                 //表示是否查看模式的表单
                type:Boolean,
                default:false
            },
            editToView:{                        //编辑完成后，是否跳转到查看到页面
                type : Boolean,
                default: false
            },
            onInited:{
                type:Function,
            },
            onSubmit:{
                type:Function
            },
            onSaved:{
                type:Function
            },
            permissions:{//控制按钮的权限
                type:Object,
                require:false,
                default:function(){
                    return {
                        openEdit:false,//开启编辑按钮权限
                        edit:true,//修改或者保存按钮权限
                        del:true,//删除按钮权限
                        cancel:true//取消按钮
                    };
                }
            },
            transfer: {
                type: Boolean,
                default: false
            }
        },
        computed:{
            isCreate:function () {
                return !this.isView && this.formStatus==Utils.formActions.create;
            },
            isEdit:function () {
                return !this.isView && this.formStatus==Utils.formActions.edit;
            },
            action(){
                if(this.isView){
                    return Utils.formActions.view;
                }
                return this.formStatus;
            }
        },
        data:function(){
            var metaEntity=this.$metaBase.findMetaEntity(this.entityName);
            var dsWrapper=metaEntity.dataResourceWrapper();
            var formStatus=Utils.formActions.create;
            if(!_.isEmpty(this.recordId)){
                formStatus=Utils.formActions.edit;
            }
            var entity=null;
            var entityId=this.recordId;
            entity=metaEntity.getDefaultModel();
            return {
                dataResource:dsWrapper.$resource,
                dataResourceInnerVueInst:dsWrapper.$innerVueInst,
                changedQueue:[],//智能验证变化队列
                formStatus:formStatus,
                metaEntity:metaEntity,
                entity:entity,
                entityId:entityId,
                isMetaForm:true,
                openEditClicked:false,
                innerPermissions:_.cloneDeep(this.permissions),
                isSavingToServer:false,//表示是否正在保存数据到服务器，用来处理保存时触发重复提交数据的bug
                formActions:Utils.formActions,
                preprocessed: false,
                metaFormLayout:false,//true表示已经在控制台设计过表单，按设计过的表单显示表单
                metaForm:null,
                paths:constants.paths,
                //begin 处理脚本相关data定义
                scriptModel:{
                    formDataCreated:null,//(model)
                    beforeSave:null,//(model)
                    afterSave:null//(model)
                },
                loadingFormData:false,//表示是否正在远程请求数据
                subcomponentAfterSaveChain:[]//所有需要在表单保存后做继续操作的子组件集合
            };
        },
        watch:{
            permissions:{
                handler:function(){
                    this.innerPermissions=_.cloneDeep(this.permissions);
                },
                deep:true
            },
            entity:{
                handler:function(){
                    if(this.preprocessed){
                        this.doValidation();
                    }
                },
                deep:true
            }
        },
        mounted:function () {
            //初始化表单相关逻辑
            this.initForm();
        },
        methods:{
            componentName(formItem){
                return metaformUtils.metaComponentType(formItem);
            },
            doOpenEdit(){
                let _query=_.extend({},this.$route.query);
                _query[Utils.queryKeys.action]=Utils.formActions.edit;
                router.push({
                    name:this.$route.name,
                    params:this.$route.params,
                    query:_query
                });
            },
            doSaveModel:function(){
                var _this=this;
                this.doValidation(function(){
                    let before=_this.beforeSave();
                    if (before && before.then){//返回的Promise对象
                        before.then(function(valid){
                            if(false!==valid){//true 表示可继续保存
                                _this.doSave();
                            }
                        });
                    }else if(before!==false){//普通true or false
                        _this.doSave();
                    }
                });
            },
            doSave(){
                var _this=this;
                if(_this.isSavingToServer){
                    return;
                }
                _this.isSavingToServer=true;
                if(this.isEdit){//更新
                    let _model=this.ignoreReadonlyFields();
                    _this.dataResource.update({id:this.entityId},_model).then(function({data}){
                        _this.isSavingToServer=false;
                        _this.afterSave("on-edited",data,'编辑成功');
                    },function(){
                        _this.isSavingToServer=false;
                    });
                }else{//新建
                    let _model=this.ignoreReadonlyFields();
                    _this.dataResource.save(_model).then(function({data}){
                        _this.isSavingToServer=false;
                        _this.entityId=data[_this.metaEntity.getIdField().name];
                        _this.afterSave("on-created",data,'保存成功');
                    },function(){
                        _this.isSavingToServer=false;
                    });
                }
            },
            doCancel:function(){
                router.go(-1);
            },
            doDelete:function(){
                var _this = this;
                var delParams={id:this.entityId};
                var tips='确定删除吗?';
                iview$Modal.confirm({
                    title: '提示',
                    content: tips,
                    onOk: () => {
                        _this.dataResource.delete(delParams).then(function(res){
                            iview$Message.success('删除成功');
                            _this.$emit("on-deleted");
                            _this.onDeleted();
                        });
                    }
                });
            },
            doValidation:function(callback){
                var _this=this;
                //启用智能校验
                Utils.smartValidate(_this,this.entity,this.$validator,function(){
                    callback&&callback();
                });
            },

            initForm(){
                 var formShortId=this.$route.query.formShortId;
                if(_.isEmpty(formShortId)){
                    this.initDefault();
                    return;
                }
                var _this = this;
                metaservice.getFormByShortId({id:formShortId,resolve:true})
                    .then(({ data }) => {
                        //存在自定义表单，按表单元数据构建表单
                        _this.metaFormLayout=true;
                        _this.metaForm=data;
                        let res=_this.getEditModelIfNeeded();
                        if(res&&res.then){
                            res.then(function(){
                                _this.metaFormToForm(data);
                                _this.onFormInited();
                            });
                        }else{
                            _this.metaFormToForm(data);
                            _this.onFormInited();
                        }
                    },(resp)=>{
                        _this.initDefault();
                    });
            },
            registerAfterSaveChain(subcomponent){
                this.subcomponentAfterSaveChain.push(subcomponent);
            },
             //表单记录扩展数据填充，如选择用户之后用户名称存储、选项类型其他选项对应的填写值等
            exDataChanged:function(newValue,dataField){
                metaformUtils.exDataChanged(this.entity,newValue,dataField);
            },
            setValue(fieldName,newValue){//设置fieldName字段的值为newValue
                this.entity[fieldName]=newValue;
            },
            getValue(fieldName){//获取fieldName字段的值
                return this.entity[fieldName];
            },
            showField(fieldName){//显示fieldName字段
                var formItem=metaformUtils.formItemByFieldName(this.metaForm,fieldName);
                if(formItem){
                    formItem.hidden=false;
                }
            },
            hideField(fieldName){//隐藏fieldName字段
                var formItem=metaformUtils.formItemByFieldName(this.metaForm,fieldName);
                if(formItem){
                    formItem.hidden=true;
                }
            },
            hasButtons(){//工具栏是否有按钮存在，没有按钮的话，工具栏隐藏
                if(this.innerPermissions.cancel){
                    return true;
                }
                if(this.innerPermissions.openEdit&&this.isView){
                    return true;
                }
                if(!this.entityId||(this.innerPermissions.edit&&!this.isView)){
                    return true;
                }
                if(this.entityId&&this.innerPermissions.del&&!this.isView){
                    return true;
                }
                return false;
            },

            initDefault(){
                var _this=this;
                let res=_this.getEditModelIfNeeded();
                if(res&&res.then){
                    res.then(function(){
                        _this.preprocessed=true;
                        _this.onFormInited();
                    });
                }else{
                    _this.preprocessed=true;
                    _this.onFormInited();
                }
            },
            fillDefaultByQuery(_model,metaEntity){//创建模式时model用url参数填充
                var query=this.$route.query;
                _.each(query,function(value,key){
                    let metaField=metaEntity.findField(key);
                    if(metaField){
                        _model[key]=value;
                    }
                });
            },
            getEditModelIfNeeded(){//如果是编辑模式，根据数据id或者表单数据model
                var _this=this;
                this.dataResourceInnerVueInst.showLoading=false;
                this.loadingFormData=true;
                return this.dataResource.get({id:this.entityId}).then(function({data}){
                    _this.loadingFormData=false;
                    _this.initPerm(data);
                    if(_this.metaForm){//已经定义过表单，以表单定义字段为准初始化模型
                        let fields=metaformUtils.getAllFieldItems(_this.metaForm);
                        _.each(fields,function(field){
                            let key=field.dataField;
                            _this.entity[key]=data[key];
                        });
                        _this.entity[constants.entityModelRedundantKey]=data[constants.entityModelRedundantKey];
                    }else{//没有定义表单的情况下，使用默认实体表单字段
                        _.each(_this.entity,function(value,key){
                            _this.entity[key]=data[key];
                        });
                    }
                    return true;
                },function(){
                    _this.loadingFormData=false;
                });
                return true;
            },
            //实体已经在控制台定义过表单，由表单元数据生成表单
            metaFormToForm(metaForm){
                var _this=this;
                //初始化表单验证
                var formItems=metaformUtils.getAllFieldItems(metaForm);
                _.each(formItems,function(formItem){
                    metaformUtils.initValidation(_this.$validator,formItem,_this.metaEntity,_this.entityId);
                });
                //执行表单脚本
                this.handleFormScript(metaForm);
                this.handleFieldOptionsToggle();
                this.preprocessed=true;
            },
            handleFieldOptionsToggle:function(){//处理选择某个选项时，显示和隐藏某些组件逻辑
                var logistics=this.metaForm.logistics;
                var _this=this;
                if(logistics.optionsToggleComponentsConfig){
                    //遍历每一个单选项配置的逻辑
                    _.each(logistics.optionsToggleComponentsConfig,function(value,key){
                        let curFormItem=metaformUtils.getFormItemById(_this.metaForm,key);
                        //如果此单选项组件存在
                        if(curFormItem){
                            //选项要控制的组件集合
                            let toggleFields=value.toggleFields;
                            let dataFields=metaFormUtils.getAllFieldItems(_this.metaForm);
                            _.each(dataFields,function(fi,index){
                                if(_.includes(toggleFields,fi.id)){
                                    fi.hidden=true;
                                }
                            });
                            //监听单选项的值变化，从而显示和隐藏其他组件
                            _this.$watch('formData.'+curFormItem.dataField,function(newV,oldV){
                                //选项特殊的可切换字段
                                let visibleFields=value.toggleSetting[newV];
                                if(visibleFields){
                                    _.each(dataFields,function(fi,index){
                                        if(fi.id===curFormItem.id){
                                            fi.hidden=false;
                                        }else if((!_.includes(visibleFields,fi.id))&&_.includes(toggleFields,fi.id)){
                                            fi.hidden=true;
                                        }else{
                                            fi.hidden=false;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            },
            handleFormScript(metaForm){
                var logistics=metaForm.logistics;
                if(logistics.script){
                    let fun= new Function(logistics.script);
                    fun.call(this);
                }
            },
            ignoreReadonlyFields(){
                let _model={};
                let _this=this;
                _.each(_this.entity,function(v,k){
                    let metaField=_this.metaEntity.findField(k);
                    if(metaField&&metaField.readonly){
                        //readonly字段不提交
                    }else{
                        _model[k]=v;
                    }
                });
                return _model;
            },
            initPerm(data){//初始化表单数据操作权限
                this.innerPermissions={
                    "openEdit":false,
                    "edit":Utils.hasPerm(data[Utils.dataPermField],Utils.permValues.edit),
                    "del":Utils.hasPerm(data[Utils.dataPermField],Utils.permValues.del),
                    "cancel":true
                };
            },
            onFormInited(){//表单数据初始化后
                if(this.scriptModel&&_.isFunction(this.scriptModel.formDataCreated)){
                    this.scriptModel.formDataCreated.call(this,this.entity);
                }
                if(this.onInited){
                    this.onInited(this);
                }
            },
            beforeSave(){//表单数据提交前
                var isContinue=true;
                if(this.onSubmit){
                    isContinue=_.defaultTo(this.onSubmit(this),true);
                }
                if(!isContinue){
                    return false;
                }

                if(this.scriptModel&&_.isFunction(this.scriptModel.beforeSave)){
                       return this.scriptModel.beforeSave.call(this,this.entity);
                }
                return true;
            },

            afterSave(evtName,data,msg){
                let _this=this;
                //调用内部组件保存事件
                let after=_this.afterSaveChain(data);
                //抛出保存事件
                if (after && after.then){//返回的Promise对象
                    after.then(function(valid){
                        if(false!==valid){//true 表示可继续保存
                            iview$Message.success(msg);
                            _this.$emit(evtName,data);
                            _this.onCompleted();
                        }
                    });
                }else if(after!==false){
                    iview$Message.success(msg);
                    _this.$emit(evtName,data);
                    _this.onCompleted();
                }
            },
            afterSaveChain(data){//表单数据提交后
                let result=true;
                if(this.scriptModel&&_.isFunction(this.scriptModel.afterSave)){
                    result=this.scriptModel.afterSave.call(this,data);
                }
                //如果子组件在保存后需要做自己的保存操作，在这里进行
                //注意这里使用了generator函数(function*)和co库，保证子组件afterSave一个一个串行执行，如果出错不会往下执行，直接返回结果
                let subcomponentAfterSaveChain=this.subcomponentAfterSaveChain;
                if(!_.isEmpty(subcomponentAfterSaveChain)){
                    function* nextAfterSave(){
                        for(let i=0;i<subcomponentAfterSaveChain.length;++i){
                            let subcomponent=subcomponentAfterSaveChain[i];
                            if(subcomponent&&_.isFunction(subcomponent.afterSave)){
                                yield new Promise(function (resolve, reject){
                                    let res=subcomponent.afterSave(data);
                                    if(res&&res.then){
                                        res.then(function(valid){
                                            if(false!==valid){
                                                resolve();
                                            }else{
                                                reject();
                                            }
                                        });
                                    }else if(false!==res){
                                        resolve();
                                    }else{
                                        reject();
                                    }
                                });
                            }
                        }
                    }
                    result = co(nextAfterSave);
                }
                return result;
            },
            onCompleted(){
                var isContinue=true;
                if(this.onSaved){
                    isContinue=_.defaultTo(this.onSaved(this),true);
                }
                if(!isContinue){
                    return false;
                }
                if(this.editToView){//如果需要从编辑页保存数据后，跳转回查看页
                    let _query=_.extend({},this.$route.query);
                    _query[Utils.queryKeys.action]=Utils.formActions.view;
                    router.push({
                        name:this.$route.name,
                        params:this.$route.params,
                        query:_query
                    });
                }else{
                    router.go(-1);
                }
            },

            onDeleted(){
                this.gotoViewList();
            },
            gotoViewList(){
                var path=this.metaEntity.viewPath();
                router.push({
                    path:path,
                    query:{
                        formShortId:this.$route.query.formShortId,
                        viewShortId:this.$route.query.viewShortId
                    }
                });
            }
        }
    }
</script>
<style lang="scss" scoped>
    .meta-form-panel{
        position: relative;
        .form-toolbar{
            position: absolute;
        }
        &.has-buttons{
            padding-bottom: 88px;
        }
    }
</style>


