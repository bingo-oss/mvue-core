<template>
    <div class="m-batch-editor">
        <m-form ref="form"
            :entity-name="entityName" 
            :record-id="currentRecordId" 
            :local-model="currentRow"
            :in-batch-editor="true"
            @on-form-entity-changed="handleOnFormEntityChanged"
            @on-ref-selected-changed="handleOnRefSelectedChanged"
            >
            <m-grid ref="grid"
                :id="id"
                :entity-name="entityName" 
                :toolbar="toolbar" 
                :columns="columns"
                :query="query"
                :query-options="queryOptions"
                pager="local"
                :page-size-opts="pageSizeOpts"
                :page-size="pageSize"
                :max-local-size="maxLocalSize"
                :show-row-status="true"
                :show-selection="false"
                :show-refresh-btn="false"
                :show-config-columns-btn="true"
                :status-column-fixed="statusColumnFixed"
                :operation-column-fixed="operationColumnFixed"
                :index-column-fixed="indexColumnFixed"
                :batch-editor-mode="true"
                :filters="filters"
                :default-sort="defaultSort"
                :external-local-pager-data="localListData&&localListData.data"
                @on-row-edit="handleOnRowEdit"
                @on-row-save="handleOnRowSave"
                @on-row-cancel-edit="handleOnRowCancelEdit"
                @on-batch-fill-data="handleOnBatchFillData"
                @on-row-click="handleOnRowClick"
                :handle-on-title-click="false"
                >
            </m-grid>
        </m-form>
        <Spin fix size="large" v-if="loading">
            <slot name="loading"></slot>
        </Spin>
    </div>
</template>
<script>
import globalContext from '../../libs/context';
import queryByBatches from '../../libs/query-by-batches';
import rowMeta from '../form/js/row-meta';
const uuidv1 = require('uuid/v1');
var dayjs = require("dayjs");
export default {
    props:{
        entityName:{//当前批量编辑的实体名称
            type:String,
            required:true
        },
        columns:{
            type:Array,
            default:function(){
                return [];
            },
            required:true
        },
        queryUrl:{//外部指定的查询地址，必须是兼容leap查询协议的
            type:String,
            required:false
        },
        queryResource:{//由外部构造的查询对象
            type:[Object,Function],
            required:false
        },
        queryOptions:{//leap的固定查询参数
            type:Object,
            required:false
        },
        maxLocalSize:{
            type:Number,
            default:1000
        },
        pageSize: {//每页条数
            type: Number,
            default: 50
        },
        pageSizeOpts: {
            type: Array,
            required: false,
            default: function () {
                return [50, 100];
            }
        },
        indexColumnFixed:{//指定索引列固定位置：left or right
            type:String,
            default:''
        },
        statusColumnFixed:{//指定编辑状态列固定位置：left or right
            type:String,
            default:''
        },
        operationColumnFixed:{//指定操作列固定位置：left or right
            type:String,
            default:''
        },
        quicksearch:{//快捷搜索配置{fields: null,placeholder: ""}
            type:Object,
            default(){
                return {fields: null,placeholder: ""};
            }
        },
        filters: {//高级查询的条件和列表头部的筛选条件设置
            type: Object
        },
        defaultSort: {//默认排序设置{key:'',order:'desc'}
            type: Object
        },
        id:{//用来唯一标志一个列表，用于存储列表的配置数据key，如配置列数据本地存储的key
            type:String
        }
    },
    data(){
        let metaEntity=this.$metaBase.findMetaEntity(this.entityName);
        let idFieldName=metaEntity.getIdField().name;
        let self=this;
        //禁用所有列排序
        this.disableSortable();
        return {
            toolbar: {
                quicksearch:this.quicksearch,
                btnSizeBeforeMore:2,
                btns:[
                    {
                        name:"saveAll",
                        title:"全部保存",
                        icon:"ios-document-outline",
                        operationType:"script",
                        btnType:"primary",
                        onclick:function(){
                            self.loading=true;
                            self.saveAll();
                        }
                    },
                    {   
                        name:"fillAll",
                        title:"批量设值",
                        icon:"md-create",
                        operationType:"common",
                        btnType:"primary",
                        renderComponent:"m-batch-editor-fill-data"
                    }
                ],
                singleBtns: ["openEdit","cancelEdit","saveRow"]
            },
            metaEntity:metaEntity,
            idFieldName:idFieldName,
            currentRecordId:'',
            currentRow:{},
            localListData:null,//{data:[],total:0}
            localDataMap:{},
            loading:false,
            reloadChangedQueue:[]
        };
    },
    methods:{
        handleOnRefSelectedChanged(refControl,selectedItem){
            let fieldName=refControl.formItem.dataField;
            if(this.currentRow){
                let data={
                    title:selectedItem&&selectedItem[refControl.getTitleField()]
                };
                rowMeta.setRowMeta(this.currentRow,fieldName,data);
                this.currentRow.__forceMeta__=true;
                rowMeta.setRowMeta(this.localDataMap[this.currentRecordId],fieldName,data);
                this.localDataMap[this.currentRecordId].__forceMeta__=true;
            }
        },
        handleOnRowClick(row,index){
            let id=row[this.idFieldName];
            let realRow=this.$refs.grid.rowMap[id];
            if(this.currentRecordId===id){
                this.$refs.grid.editRow=id;
                this.handleOnRowEdit(id,realRow);
                return;
            }
            let form=this.$refs.form;
            if(!form.isCreate){
                this.validateForm().then(()=>{
                    this.$refs.grid.editRow=id;
                    this.handleOnRowEdit(id,realRow);
                },()=>{});
            }else{
                this.$refs.grid.editRow=id;
                this.handleOnRowEdit(id,realRow);
            }
        },
        disableSortable(){
            this.columns.forEach(col => {
                col.sortable=false
            });
        },
        handleOnBatchFillData(model,clearModel,currentMeta){
            let edited=false;
            for (const key in model) {
                if (model.hasOwnProperty(key)) {
                    const value = model[key];
                    let hasValue=null!==value;
                    if(_.isArray(value)){
                        hasValue=!_.isEmpty(value);
                    }
                    if(hasValue){
                        edited=true;
                        this.localListData.data.forEach(item => {
                            item[key]=value;
                            item.__rowStatus__='unsaved';
                        });
                    }
                }
            }
            //如果设置了引用字段的值，填充冗余字段__meta__，供列表显示
            if(!_.isEmpty(currentMeta)){
                this.localListData.data.forEach(item => {
                    item.__forceMeta__=true;
                    for (const fieldName in currentMeta) {
                        rowMeta.setRowMeta(item,fieldName,currentMeta[fieldName]);
                    }
                });
            }
            for (const key in clearModel) {
                if (clearModel[key]===true) {
                    edited=true;
                    this.localListData.data.forEach(item => {
                        item[key]=null;
                        item.__rowStatus__='unsaved';
                    });
                }
            }
            if(edited){
                this.$refs.grid.editRow='';
                this.$refs.grid.reload();
            }
        },
        handleOnRowEdit(id,row){ 
            this.currentRow=row;
            this.currentRecordId=id;
        },
        validateForm(){
            let form=this.$refs.form;
            if(_.isEmpty(this.currentRow)){
                return Promise.resolve();
            }
            if(form.isCreate){
                return Promise.resolve();
            }
            let id=this.currentRow[this.idFieldName];
            return new Promise((resolve,reject)=>{
                form.$refs.formRef.validate(valid => {
                    if (valid) {
                        resolve();
                    }else{
                        if(this.currentRow.hasOwnProperty(this.idFieldName)){
                            this.currentRow.__rowStatus__='failed';
                            this.localDataMap[id]['__rowStatus__']='failed';
                        }
                        reject();
                    }
                },(ee)=>{
                    console.log(ee);
                    reject();
                });
            });
        },
        handleOnRowCancelEdit(context){
            this.validateForm().then(()=>{
                this.currentRow={};
                this.currentRecordId=null;
                //恢复到查看模式
                context.grid.editRow='';
            },()=>{});
        },
        handleOnRowSave(context){
            let form=this.$refs.form;
            let id=this.currentRow[this.idFieldName];
            this.validateForm().then(()=>{
                this.singleSave(this.localDataMap[id]).then(()=>{
                    this.currentRow.__rowStatus__='saved';
                    this.localDataMap[id]['__rowStatus__']='saved';
                },()=>{
                    this.currentRow.__rowStatus__='failed';
                    this.localDataMap[id]['__rowStatus__']='failed';
                });
            },()=>{});
        },
        formatDateTime(fieldName,oldV){
            if(oldV&&_.isString(oldV)&&oldV.indexOf('T')===10&&oldV.endsWith('Z')){
                let metaField=this.metaEntity.findField(fieldName);
                if(metaField.inputType=="DateTime"){
                    let _d=dayjs(oldV);
                    oldV=_d.format('YYYY-MM-DD HH:mm:ss');
                }
            }
            return oldV;
        },
        handleOnFormEntityChanged(entity){
            let formFields=this.buildFormFields();
            let changed=false;
            formFields.forEach(fieldName => {
                let newV=entity[fieldName];
                let oldV=this.currentRow[fieldName];
                //2019-02-21T05:46:50.000Z
                oldV=this.formatDateTime(fieldName,oldV);
                newV=this.formatDateTime(fieldName,newV);
                if(!_.isEqual(newV,oldV)){
                    changed=true;
                    return false;
                }
            });
            if(!changed){
                return;
            }
            let id=entity[this.idFieldName];
            //编辑后的form数据反映到grid
            _.forIn(entity, (value, key) => {
                this.currentRow[key] = entity[key];
                this.localDataMap[id][key]= entity[key];
            });
            this.currentRow.__rowStatus__='unsaved';
            this.localDataMap[id]['__rowStatus__']='unsaved';
        },
        filteredByQuicksearch(filtered,quicksearchKeyword,quicksearchFields){
            if(quicksearchKeyword){
                let _filtered=_.filter(filtered,item=>{
                    let ok=false;
                    _.forEach(quicksearchFields,sf => {
                        let value=item[sf];
                        let find=false;
                        if(_.isString(value)){
                            find=value.indexOf(quicksearchKeyword)>-1;
                        }else if(_.isNumber(value)){
                            value=value.toString();
                            find=value.indexOf(quicksearchKeyword)>-1;
                        }else{
                            try{
                                if(!value){
                                    return false;
                                }
                                value=JSON.stringify(value);
                                find=value.indexOf(quicksearchKeyword)>-1;
                            }catch(e){
                                return false;
                            }
                        }
                        if(find){
                            ok=true;
                            return false;
                        }
                    });
                    return ok;
                });
                return _filtered;
            }else{
                return filtered;
            }
        },
        query(ctx,queryResource){
            //分页数据只在第一次加载时获取全部，后续都在内存取值
            if(this.localListData&&(!ctx.localPagerSecondLoad)){
                let quicksearchFields=ctx.quicksearchFields;
                let quicksearchKeyword=ctx.quicksearchKeyword;
                //按照编辑状态对内存数据过滤
                let __rowStatus__=ctx.filters&&ctx.filters.rules&&ctx.filters.rules.__rowStatus__;
                let filtered=[];
                if(__rowStatus__&&__rowStatus__.value){
                    filtered=_.filter(this.localListData.data,item=>{
                        return item.__rowStatus__===__rowStatus__.value;
                    });
                    filtered=this.filteredByQuicksearch(filtered,quicksearchKeyword,quicksearchFields);
                }else{
                    filtered=this.filteredByQuicksearch(_.cloneDeep(this.localListData.data),quicksearchKeyword,quicksearchFields);
                }
                let _listData={
                    data:_.cloneDeep(filtered),
                    total:filtered.length
                };
                return Promise.resolve(_listData);
            }
            //外部指定了查询地址，由此地址构造查询resource
            let _resource=queryResource;
            if(this.queryUrl){
                _resource=globalContext.buildResource(this.queryUrl);
            }else if(this.queryResource){
                _resource=this.queryResource;
            }
            let refGrid=this.$refs.grid;
            //如果总数大于maxLocalSize设置的100，由于expand限制只能100，所以此时应该分批次获取数据合并
            if(ctx.localPagerSecondLoad){
                return new Promise((resolve,reject)=>{
                    queryByBatches.exec(refGrid,ctx,refGrid.maxLocalSize,_resource).then(listData=>{
                        this.rebuildLocalListData(listData);
                        resolve(listData);
                    },(err)=>{
                        console.err(err);
                        reject();
                    });
                });
            }else{
                //一次性获取数据回来
                return globalContext.getMvueComponents().leapQueryConvertor.exec(_resource,ctx,(params)=>{
                    refGrid.beforeQuery&&refGrid.beforeQuery(params);
                },(listData)=>{//{data:[],total:10}
                    this.rebuildLocalListData(listData);
                });
            }
        },
        rebuildLocalListData(listData){
            listData.data.forEach(item => {
                let id=item[this.idFieldName];
                //如果id不存在构造一个虚拟的id
                if(!id&&(id!==0)){
                    item[this.idFieldName]=uuidv1();
                    //标记为虚拟id数据
                    item.__virtualId__=true;
                    item.__rowStatus__="unsaved";
                }else{
                    item.__rowStatus__="saved";
                }
            });
            this.localListData=_.cloneDeep(listData);
            this.localListData.data.forEach(item => {
                this.localDataMap[item[this.idFieldName]]=item;
            });
        },
        ignoreVirtualFields(_model){
            let ignores=['__rowStatus__','__virtualId__','__id__','__forceMeta__','__meta__','__ops__']
            ignores.forEach(key => {
                if(_model.hasOwnProperty(key)){
                    delete _model[key];
                }
            });
        },
        singleSave(item){
            return new Promise((resolve,reject)=>{
                let form=this.$refs.form;
                let resource=form.dataResource;
                let id=item[this.idFieldName];
                //通过虚拟id标记后以保存的数据，后续为更新
                if(item.hasOwnProperty('__id__')){
                    id=item.__id__;
                }
                //虚拟id数据，创建
                if(item.__virtualId__){
                    let _model=this.ignoreReadonlyFields(item,true);
                    this.ignoreVirtualFields(_model);
                    resource.save(_model).then(({data})=>{
                        //创建成功后将真实id复制到__id__属性中，并删除虚拟id标志__virtualId__
                        item.__id__=data[this.idFieldName];
                        delete item.__virtualId__;
                        item.__rowStatus__='saved';
                        resolve();
                    },()=>{
                        item.__rowStatus__='failed';
                        reject();
                    });
                }else if(item.__rowStatus__=='unsaved'){//更新
                    let _model=this.ignoreReadonlyFields(item,false);
                    this.ignoreVirtualFields(_model);
                    resource.update({id:id},_model).then(()=>{
                        item.__rowStatus__='saved';
                        resolve();
                    },()=>{
                        item.__rowStatus__='failed';
                        reject();
                    });
                }else{
                    resolve();
                }
            });
        },
        needSave(item){//判断item是否需要保存
            if(item.__virtualId__||item.__rowStatus__=='unsaved'){
                return true;
            }
            return false;
        },
        reloadData(){
            this.currentRow={};
            this.currentRecordId=null;
            globalContext.getMvueToolkit().utils.smartAction(this,"reloadChangedQueue",()=>{
                this.$refs.grid.reload();
                this.$refs.grid.editRow='';
            },1000);
        },
        async doBatchSave(){
            let localListData=this.localListData;
            let savePromises=[],needReload=false;
            for(let i=0;i<localListData.data.length;++i){
                let item=localListData.data[i];
                if(this.needSave(item)){
                    needReload=true;
                    try{
                        await this.singleSave(item);
                    }catch(ee){
                        this.loading=false;
                        this.$refs.grid.editRow='';
                        this.reloadData();
                    }
                }
            }
            this.loading=false;
            if(needReload){
                this.$refs.grid.editRow='';
                this.reloadData();
            }
        },
        saveAll(){
            //批量保存前也验证一下表单
            this.validateForm().then(()=>{
                this.doBatchSave();
            },()=>{
                this.doBatchSave();
            });
        },
         //对entity数据作筛选，忽略readonly的字段，以便向后端提交数据
        ignoreReadonlyFields(_entity,isCreate) {
            let form=this.$refs.form;
            let _model = {};
            let _this = this;
            _.forIn(_entity, (v, k) => {
                if(form.ignoreKeys[k]){
                    return;
                }
                let metaField = _this.metaEntity.findField(k);
                if(!metaField){
                    _model[k] = v;
                    return;
                }
                if(metaField.readonly){
                    return;
                }
                //创建模式，如果字段creatable为false，不提交此字段
                if (isCreate && (!metaField.creatable)) {
                    return;
                }
                //编辑模式，如果字段updatable为false，不提交此字段
                if (!isCreate && (!metaField.updatable)) {
                    return;
                }
                if (_.isNil(v) && metaField && metaField.required) {
                    //未赋值的必填字段，不提交
                    return;
                }
                _model[k] = v;
            });
            return _model;
        },
        buildFormFields(){
            let fields=[];
            this.columns.forEach(col => {
                if(this.metaEntity.findField(col.key)){
                    fields.push(col.key);
                }
            });
            return fields;
        },
    }
}
</script>

