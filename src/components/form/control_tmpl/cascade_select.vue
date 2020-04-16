<template>
    <div >
        <template v-if="viewMode">
            <m-operation class="form-item-view" v-if="canView" :operation="refEntityViewOpt"  :widget-context="widgetContext">
                <a href="javascript:void(0)" v-text="buildViewValue()" :title="buildViewValue()"></a>
            </m-operation>
            <div class="form-item-view" v-else
            v-text="buildViewValue()" 
            :title="buildViewValue()"></div>
        </template>
        <template v-else-if="!hasReadPerm">
            <Input readonly type="text" :value="buildViewValue()"></Input>
        </template>
        <template v-else>
            <Cascader filterable
                :disabled="disabled" 
                :placeholder="formItem.componentParams.placeholder||'请选择'"
                :change-on-select="changeOnSelect"  
                :data="optionsData" 
                @on-change="handleChange" 
                v-model="valueObj"></Cascader>
        </template>
    </div>
</template>
<script>
import context from '../../../libs/context';
import sc from '../../../libs/security/permission';
import controlBase from '../js/control_base';
const PermField='__ops__';
export default {
    mixins: [controlBase],
    props: {
        "value":{
            type:[String,Number,Array]
        }
    },
    data(){
        let {metaEntity,entityResource,hasReadPerm}=this.parseMetaData();
        let valueObj=this.convertedValue(!!entityResource);
        return {
            valueObj:valueObj,
            optionsData:[],
            changeOnSelect:false,//控制每一级是否可以选中，触发on-change事件
            metaEntity:metaEntity,
            entityResource:entityResource,
            hasReadPerm:hasReadPerm,
            parentField:this.formItem.componentParams.parentField,
            queryOptions:_.extend({limit:1000},this.formItem.componentParams.queryOptions),
            parentQueryOptions:_.extend({limit:1000},this.formItem.componentParams.parentQueryOptions),
            refEntityViewOpt:{},
            widgetContext:{},
            hasViewPage:false
        };
    },
    computed:{
        canView(){
            if(!this.isRemote()){
                return false;
            }
            if(_.isEmpty(this.valueObj)||_.isEmpty(this.optionsData)){
                return false;
            }
            //对当前实体是否有read权限
            if(!this.hasReadPerm){
                return false;
            }
            //对当前行是否有find权限
            let optionsMap={};
            this.flatMapOptions(optionsMap,this.optionsData);
            let selectedItem=optionsMap[this.valueObj[this.valueObj.length-1]];
            let hasViewPerm=sc.hasRowPerm(selectedItem,'find');
            if(!hasViewPerm){
                return false;
            }
            //如果对引用的实体配置了view页面，并且有find权限，那么引用组件查看模式可以点击查看详情
            let baseOk= hasViewPerm&&this.hasViewPage;
            if(baseOk){
                this.buildRefEntityViewOpts();
            }
            return baseOk;
        }
    },
    watch:{
        "value":function(newV,oldV){
            if(!_.isEqual(newV,oldV)){
                let valueObj=this.convertedValue(this.isRemote());
                this.valueObj=valueObj;
            }
        },
        "formItem.componentParams.cascadeOptions":{
            handler:function(newOptions,oldOptions){
                this.buildDataWithOptions();
            },
            deep:true
        }
    },
    mounted:function(){
        if(this.isLocalOptions()){
            this.buildDataWithOptions();
        }else{
            this.buildDataRemote();
            if(this.viewMode){
                this.judgeViewPage();
            }
        }
    },
    methods:{
        convertedValue(isRemote){
            let valueObj=null;
            if(_.isNil(this.value)){
                valueObj=[];
                return valueObj;
            }
            if(isRemote){//引用字段
                valueObj=[this.value];
            }else{//多选项
                valueObj=_.cloneDeep(this.value);
            }
            return valueObj;
        },
        adaptOptions(options){
            if(!_.isEmpty(options)){
                _.forEach(options,opt=>{
                    opt.value=opt.id;
                    opt.label=opt.text;
                    if(!_.isEmpty(opt.children)){
                        this.adaptOptions(opt.children);
                    }
                });
            }
        },
        isLocalOptions(){
            return this.formItem.componentParams.cascadeOptions
                && !_.isEmpty(this.formItem.componentParams.cascadeOptions.options);
        },
        isRemote(){
            return !!this.entityResource;
        },
        addPermField(source,target){
            if(source.hasOwnProperty(PermField)){
                target[PermField]=source[PermField];
            }
        },
        buildDataWithOptions(){
            //选项类型
            if(this.isLocalOptions()){
                this.adaptOptions(this.formItem.componentParams.cascadeOptions.options);
                this.optionsData=this.formItem.componentParams.cascadeOptions.options;
            }
        },
        handleChange(value,selectedData){
            var emitValue=_.cloneDeep(value);
            if(this.isRemote()){
                if(_.isEmpty(emitValue)){
                    emitValue=null;
                }else{
                    emitValue=emitValue[emitValue.length-1];
                }
            }
            this.$emit('input',emitValue);
        },
        viewModeValue(){
            if(!_.isEmpty(this.valueObj)){
                if(this.isLocalOptions){
                    let texts=this.getOptionsExData(this.valueObj,true);
                    return texts.join("/");
                }
            }
            return "";
        },
        parseMetaData(){//对于引用类型的元数据获取
            var entityResource=null,metaEntity=null,hasReadPerm=true;
            if(this.formItem.componentParams&&this.formItem.componentParams.entityResourceUrl){
                entityResource= context.buildResource(this.formItem.componentParams.entityResourceUrl);
            }
            if(this.formItem.componentParams.entityId){
                metaEntity=this.$metaBase.findMetaEntity(this.formItem.componentParams.entityId);
                hasReadPerm=sc.hasReadPerm(this.formItem.componentParams.entityId);
            }
            return {metaEntity,entityResource,hasReadPerm};
        },
        getIdField(){
            return this.formItem.componentParams.idField;
        },
        getTitleField(){
            return this.formItem.componentParams.titleField;
        },
        //所有级联数据构造完毕后，如果当前数据有值，并且没有填充父级数据，填充以便级联控件正常显示
        reinitSelfRefValueObj(dataMap){
            let _v=this.valueObj;
            if((!_.isEmpty(_v))&&_v.length===1){
                let id=_v[_v.length-1];
                let item=dataMap[id];
                let parentId=item[this.parentField];
                //非顶级节点，补充父节点值
                if(!(_.isNil(parentId)||parentId===id)){
                    let parent=dataMap[parentId];
                    let pids=[];
                    while(parent){
                        pids.push(parentId);
                        let ppid=parent[this.parentField];
                        if(!(_.isNil(ppid)||parentId===ppid)){
                            parent=dataMap[ppid];
                            parentId=ppid;
                        }else{
                            parent=false;
                        }
                    }
                    if(!_.isEmpty(pids)){
                        if(pids.length>1){
                            pids=pids.reverse();
                        }
                        pids.push(id);
                        this.valueObj=pids;
                    }
                }
            }   
        },
        reinitNoneSelfRefValueObj(dataMap){
            let _v=this.valueObj;
            if((!_.isEmpty(_v))&&_v.length===1){
                let id=_v[_v.length-1];
                let item=dataMap[id];
                if(item&&item[this.parentField]){
                    this.valueObj=[item[this.parentField],id];
                }
            }
        },
        buildSelfRefData(data){
            let _data=[];
            let idField=this.getIdField();
            let titleField=this.getTitleField();
            let dataMap={};
            //将顶级节点保存，并map化所有数据，为后续计算children做准备
            _.forEach(data,d=>{
                let id=d[idField];
                let parentId=d[this.parentField];
                let _d={
                    value:id,
                    label:d[titleField]
                };
                this.addPermField(d,_d);
                _d[this.parentField]=parentId;
                //顶级节点push到_data
                if(_.isNil(parentId)||parentId===id){
                    _data.push(_d);
                }
                dataMap[id]=_d;
            });
            //再次遍历所有数据，将子节点附加到父节点的children中
            _.forIn(dataMap,(d,id)=>{
                let parentId=d[this.parentField];
                if(!(_.isNil(parentId)||parentId===id)){
                    let _parent=dataMap[parentId];
                    //如果此数据是脏数据，没有父级关系，或者parentId是错的，直接扔到第一级
                    if(!_parent){
                        _data.push(d);
                    }else{
                        _parent.children=_parent.children||[];
                        _parent.children.push(d);
                    }
                }
            });
            //自引用关系，每一个节点都可以点击选中
            this.changeOnSelect=true;
            this.optionsData=_data;
            this.reinitSelfRefValueObj(dataMap);
        },
        buildNotSelfRefData(parentData,data,parentMetaEntity){
            let _data=[];
            let dataMap={};
            let pidField=parentMetaEntity.getIdField().name;
            let ptitleField=parentMetaEntity.firstTitleField().name;
            //父级全部添加到_data中作为第一级
            _.forEach(parentData,pd=>{
                let id=pd[pidField];
                let title=pd[ptitleField];
                let _pd={
                    value:id,
                    label:title
                };
                this.addPermField(pd,_pd);
                _data.push(_pd);
                dataMap[id]=_pd;
            });
            let _dataMap={},isolatedChildren=[];
            //孩子数据中，孤立的孩子直接附加到第一级，其他附加到正确的父级上
            _.forEach(data,d=>{
                let pid=d[this.parentField];
                let parent=dataMap[pid];
                let id=d[this.getIdField()];
                _dataMap[id]=d;
                let _d={
                    value:id,
                    label:d[this.getTitleField()]
                };
                this.addPermField(d,_d);
                if(parent){
                    parent.children=parent.children||[];
                    let pchildren=parent.children;
                    pchildren.push(_d);
                }else{
                    isolatedChildren.push(_d);
                }
            });
            //没有子节点的父节点删除，防止选到父级，因为不允许选父级，只能选孩子数据，父级只是展示而已
            let __data=[];
            _.forEach(_data,_d=>{
                if(!_.isEmpty(_d.children)){
                    __data.push(_d);
                }
            });
            //孤立的孩子节点直接附加到第一级
            if(!_.isEmpty(isolatedChildren)){
                __data=__data.concat(isolatedChildren);
            }
            this.optionsData=__data;
            this.reinitNoneSelfRefValueObj(_dataMap);
        },
        buildDataWithParentField(data){
            let pMetaField=this.metaEntity.findField(this.parentField);
            if(!pMetaField){
                context.error({content:`${this.metaEntity.name}实体不存在${this.parentField}字段`});
                return;
            }
            let relation=pMetaField.manyToOneRelation;
            if(!relation){
                context.error({content:`${this.metaEntity.name}实体的${this.parentField}不是多对一关系字段`});
                return;
            }
            let targetEntityName=relation.targetEntity;
            //是同一个实体的自引用关系，如部门的上级部门
            if(targetEntityName===this.metaEntity.name){
                this.buildSelfRefData(data);
            }else{//父级是不同于自己的实体，比如某个区域下的网关
                let targetEntity=this.$metaBase.findMetaEntity(targetEntityName);
                let targetEntityResource=targetEntity.dataResource();
                targetEntityResource.query(this.parentQueryOptions).then(({data:parentData})=>{
                    this.buildNotSelfRefData(parentData,data,targetEntity);
                });
            }
        },
        buildDataWithNoParentField(data){
            let _data=[];
            let idField=this.getIdField();
            let titleField=this.getTitleField();
            _.forEach(data,d=>{
                let _d={
                    value:d[idField],
                    label:d[titleField]
                };
                this.addPermField(d,_d);
                _data.push(_d);
            });
            this.optionsData=_data;
        },
        buildDataRemote(){
            if(this.entityResource){
                this.entityResource.query(this.queryOptions).then(({data})=>{
                    //如果指定了parentField
                    if(this.parentField){
                        this.buildDataWithParentField(data);
                    }else{//未指定parentField，近似退化为下拉选择，返回一级数据
                        this.buildDataWithNoParentField(data);
                    }
                });
            }
        },
        flatMapOptions(optionsMap,optionsData){
            _.forEach(optionsData,opt=>{
                optionsMap[opt.value]=opt;
                if(!_.isEmpty(opt.children)){
                    this.flatMapOptions(optionsMap,opt.children)
                }
            });
        },
        buildViewValue(){
            if((!_.isEmpty(this.optionsData))&&(!_.isEmpty(this.valueObj))){
                let optionsMap={};
                this.flatMapOptions(optionsMap,this.optionsData);
                let labels=[];
                _.each(this.valueObj,v=>{
                    if(optionsMap[v]){
                        labels.push(optionsMap[v].label);
                    }
                });
                if(!_.isEmpty(labels)){
                    return labels.join(' / ');
                }
            }
            return this.emptyText;
        },
        buildRefEntityViewOpts(){
            this.refEntityViewOpt={
                operationType: 'popup',
                title: '详情',
                url: 'view'
            }
            this.widgetContext={
                metaEntity:this.metaEntity,
                selectedId:this.valueObj[this.valueObj.length-1]
            };
        },
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
        }
    }
}
</script>