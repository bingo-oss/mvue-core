import controlTypeService from './control_type_service';
import constants from './constants';
import widgetMode from './widget-mode';
import emitter from '../../mixins/emitter';
import getParent from '../../mixins/get-parent';
import globalContext from '../../../libs/context';
import optionsUtils from '../../../libs/metadata/options-utils';
import entityType from './entity_type';
import expr from '../../../libs/evaluate/expr';
import numberType from './number_type';

export default {
    mixins:[emitter,getParent],
    inheritAttrs: false,
    props:{
        formItem:{
            type:Object,
            required:true
        },
        design:{//表示组件是否是设计状态的组件，界面设计时有用
            type:Boolean,
            default:false
        },
        mode:{//组件输入状态控制widgetMode定义：readonly(只读)/invisible(不可见)/forceView(查看)
            type:String
        },
        validator:{
            type:Object
        },
        paths:{
            type:Object,
            default:function(){
                return {};
            }
        },
        model:{//表单的模型数据
            type:Object
        },
        firstEntityData:{//表单第一次从后端获取的原始数据
            type:Object
        },
        context:{//与上下文相关的对象，{metaEntity:"元数据实体对象",isCreate:true}
            type:Object
        },
        initWhenCreate:{//表单创建时，自动从服务器初始化默认值
            type:Boolean,
            default:false
        },
    },
    data:function(){
        return {
            controlTypeService:controlTypeService,
            changedQueue:[]
        };
    },
    mounted:function(){
        //如果控件指定需要focus的input，focus到ref=focusInput的输入框
        if(this.formItem.componentParams.autofocus){
            this.$nextTick(()=>{
                this.$refs.focusInput&&this.$refs.focusInput.focus();
            });
        }
        //设计模式不作处理
        if(this.design){
            return;
        }
        //如果是计算字段，增加计算字段的监听逻辑
        this.emitFixedValueIfNeeded();
        //创建模式时，组件默认值初始化：如果组件定义了默认值，调用具体组件的默认值初始化函数
        if(this.shouldInitDefault()&&this.initDefaultByType){
            this.initDefaultByType();
            return;
        }
        //用来将默认空值，填充到表单的formData中，否则无法验证
        if(!this.value&&this.value!==0&&this.value!==false){
            this.$emit('input',null);
        }else if(this.value&&this.value.length==0){
            this.$emit('input',[]);
        }
    },
    computed:{
        // labelWidth:function(){
        //     let lwidth=this.formItem.componentParams.horizontalLayoutLabelWidth;
        //     return lwidth+"%";
        // },
        // controlWidth:function(){
        //     let lwidth=this.formItem.componentParams.horizontalLayoutLabelWidth;
        //     let rwidth=100-_.toInteger(lwidth);
        //     return rwidth+"%";
        // },
        disabled:function(){
            return this.isReadonly();
        },
        viewMode(){//强制查看模式
            let mode= this.getMode();
            if(widgetMode.forceView===mode){
                return true;
            }
            return false;
        },
        emptyText(){
            let metaForm=this.getParentForm();
            if(metaForm){
                return metaForm.emptyText;
            }
            return '';
        }
    },
    methods:{
        //通过选项id获取选项字段类型数据的显示文字，供显示使用
        getOptionsExData(optionId,cascade){
            if(!optionId&&optionId!==0){
                return '';
            }
            var metaEntity=this.context.metaEntity;
            if(metaEntity){
                let metaField=metaEntity.findField(this.formItem.dataField);
                return optionsUtils.getOptionText(metaField,optionId,cascade);
            }
            return _.isArray(optionId)?[]:'';
        },
        //通过数据id获取引用实体数据的title语义数据，供显示使用
        getEntityExData(id){
            if(!id){
                return Promise.resolve('');
            }
            var metaEntity=this.context.metaEntity;
            var targetTitleField=this.getTitleField();
            //有元数据信息的，在expand的关系数据中取
            if(metaEntity){
                let metaField=metaEntity.findField(this.formItem.dataField);
                if (metaField) {
                    let formattedData=entityType.formatData(this.formItem.componentType,this.firstEntityData,metaField);
                    return Promise.resolve(_.isArray(id)?[formattedData]:formattedData);
                }
            }else if(this.entityResource){//没有元数据信息的，远程获取
                if(!_.isArray(id)){
                    return this.entityResource.get({id:id}).then(({data})=>{
                        return data[targetTitleField];
                    },()=>{
                        return id;
                    });
                }else{
                    let idFieldName=this.getIdField();
                    let inIds=globalContext.buildLeapIn(id);
                    return this.entityResource.query({filters:`${idFieldName} in ${inIds}`}).then(({data})=>{
                        let titleArray=[],idMap={};
                        _.each(data,d=>{
                            titleArray.push(d[targetTitleField]);
                            idMap[d[idFieldName]]=true;
                        });
                        //后端删除的数据id附加上去
                        _.each(id,idItem=>{
                            if(!idMap[idItem]){
                                titleArray.push(idItem);
                            }
                        });
                        return titleArray;
                    });
                }
            }
            return Promise.resolve(_.isArray(id)?[]:'');
        },
        isCreate(){//判断当前表单是否为新建模式
            if(this.context
                &&this.context.isCreate){
                return true;
            }else if(!this.context){
                return true;
            }
            return false;
        },
        isEdit(){//判断当前表单是否为新建模式
            if(this.context
                &&this.context.isEdit){
                return true;
            }
            return false;
        },
        getMetaField(){
            let metaEntity=this.context.metaEntity;
            let metaField=null;
            if(metaEntity){
                metaField=metaEntity.findField(this.formItem.dataField);
            }
            return metaField;
        },
        isExprValue(){//是否是动态计算字段(计算字段)
            let metaField=this.getMetaField();
            return metaField && (metaField.defaultExpr||metaField.valueExpr);
        },
        shouldInitDefault(){//判断新建模式，并且需要设置默认值
            return this.isCreate()
                && (this.initWhenCreate || this.isExprValue());
        },
        //begin 用户组织默认值相关的基础方法
        /**
         * 设置默认值，需要根据默认值初始化引用数据
         * @param id  必须传入
         * @param title  必须传入
         */
        initDefaultForUserOrg(id,title){
            let _selectedItem=null;
            if(id){
                let idField=this.getIdField();
                let titleField=this.getTitleField();
                _selectedItem={};
                _selectedItem[idField]=id;
                _selectedItem[titleField]=title;
                //内置选择控件属性
                if(this.dataItems){
                    let has=_.find(this.dataItems, function(o) { return o[id] ===id; });
                    if(!has){//如果当前值不在缓存中，则附加到缓存数据后边
                        let _dataItems=_.cloneDeep(this.dataItems);
                        _dataItems.push(_selectedItem);
                        this.dataItems=_dataItems;
                    }
                }
                this.selectedItem=_selectedItem;
                //pclink选择控件属性
                this.innerValue=id;
                this.onSelect(_selectedItem);
            }
        },
        setCurrentUserIfCreate(userId){
            var _this=this;
            this.entityResource&&this.entityResource.get({id:userId}).then(({data})=>{
                _this.initDefaultForUserOrg(data.userId,data.name);
            });
        },
        setCurrentOrgIfCreate(orgId){
            var _this=this;
            this.entityResource&&this.entityResource.get({id:orgId}).then(({data})=>{
                _this.initDefaultForUserOrg(data.id,data.name);
            });
        },//end 用户组织默认值相关的基础方法
        /**
         * 根据表单数据从后台计算某个字段的值：默认值或者计算属性
         * @param {*} _model
         */
        calc(_model){
            return this.context.metaEntity.fillDefault(_model);
        },
        getMode(){
            return this.mode||(this.context&&this.context.mode);
        },
        isReadonly(){//字段是否只读
            //设计模式返回
            if(this.design){
                return true;
            }
            //来自部件字段权限的控制
            let mode= this.getMode();
            if(widgetMode.readonly===mode){
                return true;
            }
            var metaEntity=this.context.metaEntity;
            if(metaEntity){
                let metaField=metaEntity.findField(this.formItem.dataField);
                if (metaField) {
                    //创建模式，如果字段creatable为false，字段不可编辑
                    if(this.isCreate()&&(!metaField.creatable)){
                        return true;
                    }
                    //编辑模式，如果字段updatable为false，字段不可编辑
                    if(this.isEdit()&&(!metaField.updatable)){
                        return true;
                    }
                    return metaField.readonly;
                } else {
                    this.formItem.hidden = true;
                    return true;
                }
            }
            return false;
        },
        //根据字段的数据类型转换已经计算的字段值
        convertCalcValue(evalVal){
            let componentType=this.formItem.componentType;
            //非数字控件，并且算出来的值是数字，转成字符串
            if(_.isNumber(evalVal)&&!numberType.accept(componentType)){
                return new Number(evalVal).toString();
            }
            return evalVal;
        },
        calcField(){//调用后端的api计算含有表达式的默认值或者固定字段
            let metaForm=this.getParentForm();
            if(metaForm&metaForm.calc===false){
                return Promise.resolve(null);
            }
            let _this=this;
            let _model={};
            let name=this.formItem.dataField;
            //如果是计算字段，则需要传入依赖字段
            let dependOn=this.parseDependOn();
            //前端计算
            let evalVal=null;
            if(dependOn.justModelFields){
                try{
                    let context={};
                    _.forIn(dependOn.dependOn,(value,dep)=>{
                        context[dep]=_this.model[dep]||'';
                    });
                    evalVal=expr.compile(dependOn.valueExpr)(context);
                    evalVal=this.convertCalcValue(evalVal);
                }catch (e) {
                    if(e.name=="TypeError"){
                        console.warn( `expression ${dependOn.valueExpr} eval has typeError:${e}`);
                    }else{
                        console.error( `expression ${dependOn.valueExpr} eval error:${e}`);
                    }
                }
                return Promise.resolve(evalVal);
            }else{
                if(!_.isEmpty(dependOn.dependOn)){
                    _.forIn(dependOn.dependOn,function(value,dep){
                        _model[dep]=_this.model[dep];
                    });
                }
                _model[name]=null;
                return this.calc(_model,null).then((data)=>{
                    return data[name];
                });
            }
        },
        extractIdentifier(ast,dependOn,metaEntity){
            if(!ast){
                return;
            }
            //${title}这种只有一个字段的特殊处理
            if(ast.type==='Identifier' && ast.name){
                let name=ast.name;
                if((!dependOn.dependOn[name])){
                    if(metaEntity.findField(name)){
                        dependOn.dependOn[name]=true;
                    }else{
                        dependOn.justModelFields=false;
                    }
                }
            }
            _.forIn(ast,(value,key)=>{
                if(value&&value.type==='Identifier'){
                    let name=value.name;
                    if((!dependOn.dependOn[name])){
                        if(metaEntity.findField(name)){
                            dependOn.dependOn[name]=true;
                        }else{
                            dependOn.justModelFields=false;
                        }
                    }
                }
                if(key==='left'
                    ||key==='right'
                    ||( (key==='test' || key==='alternate' || key==='consequent') && value.type==='BinaryExpression')
                    ){
                    this.extractIdentifier(value,dependOn,metaEntity);
                }
            });
        },
        parseDependOn(){
            let metaEntity=this.context.metaEntity;
            let metaField=metaEntity.findField(this.formItem.dataField);
            //固定值表达式，如果字段都在前端，直接调用前端引擎计算
            let valueExpr=metaField.defaultExpr||metaField.valueExpr;
            if(!valueExpr){
                console.error(`实体${metaEntity.name}的字段${metaField.name}动态值表达式为空`);
                return {};
            }
            let tplContent=valueExpr;
            if(valueExpr.indexOf('${')===0){
                tplContent=valueExpr.substring(2,valueExpr.length-1);
            }else{
                return {};
            }
            let ast=expr.parse(tplContent);
            //justModelFields表示依赖的变量是否都是表单模型的数据，全是表单模型数据可以前端计算，不用调后端calc接口计算
            let dependOn={dependOn:{},justModelFields:true,valueExpr:tplContent};
            this.extractIdentifier(ast,dependOn,metaEntity);
            return dependOn;
        },
        initFixedField(callback){//初始化计算字段的监听逻辑，当依赖的字段变化时，重新计算
            if(this.isExprValue()){
                let _this=this;
                let dependOn=this.parseDependOn();
                _.forIn(dependOn.dependOn,function(value,dep){
                    _this.$watch(`model.${dep}`,function(){
                        _this.calcField().then((data)=>{
                            callback&&callback(data);
                        });
                    });
                })
            }
        },
        emitFixedValueIfNeeded(){
            this.initFixedField(data=>{
                this.$emit('input',data);
            });
        },
        isNotEmpty(value){//判断当前控件的值是否不为空
            if(value===false||value===true||_.isNumber(value)){
                return true;
            }
            return !_.isEmpty(value);
        }
    }
}
