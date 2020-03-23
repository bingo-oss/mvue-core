import context from '../../../libs/context';
import rowMeta from '../js/row-meta';
import entityType from '../js/entity_type';
import topEntityService from "../../../services/store/top-entity";

export default{
    props:{
        defaultFilters:{//可以在表单设计器动态设置的属性，用来运行时覆盖默认的queryOptions.filters
            type:String
        }
    },
    data(){
        return {
            isLoading:false,
            dataItems:[],//远程获取的数据项
            selectedItem:null,//已经选择的项
            queryFields:null,
            queryLimit:10,
            historyItems:[],//选中过的历史选项
            cachedDataItems:null,//默认提示的可选数据
            viewModeValue:"",
            preselectFirst:false,
            searchChangedQueue:[],
            rowMetaFakeKey:rowMeta.rowMetaFakeKey,
            hideDeleted:context.getSettings().control.refEntity.hideDeleted
        };
    },
    computed:{
        dataItemsMap:function(){
            var idField=this.getIdField();
            return _.keyBy(this.dataItems,function(item){return item[idField];});
        },
        multiple(){
            return _.isArray(this.selectedItem);
        },
        innerQueryOptions(){
            let _queryOpts=this.formItem && this.formItem.componentParams && this.formItem.componentParams.queryOptions;
            if(this.defaultFilters){
                _queryOpts=_queryOpts||{};
                _queryOpts.filters=this.defaultFilters;
            }
            return _queryOpts;
        }
    },
    watch:{
        value(newV,oldV){
            if(_.isEmpty(newV)){
                if(_.isArray(oldV)){
                    this.selectedItem=[];
                }else{
                    this.selectedItem=null;
                    this.commitRefData({});
                }
            }
            if(!_.isEqual(newV,oldV)){
                context.getMvueToolkit().utils.smartAction(this,"searchChangedQueue",()=>{
                    this.firstInit();
                });
            }
        },
        defaultFilters(){
            if(this.defaultFilters){
                this.cachedDataItems=null;
                this.doSearchForCache((items) => {
                    this.ensureHistoryItems(items);
                });
            }
        }
    },
    mounted:function(){
        context.getMvueToolkit().utils.smartAction(this,"searchChangedQueue",()=>{
            this.firstInit();
        });
    },
    methods:{
        commitRefData(newSelectedItem){
            //向metaForm的refEntities写入引用数据
            var metaForm=this.getParentForm&&this.getParentForm();
            if(metaForm&&this.formItem){
                this.$store.commit("core/setFormRefEntities",{
                    formId:metaForm.id,
                    name:this.formItem.dataField,
                    refEntity:newSelectedItem
                });
                let metaField=metaForm.metaEntity.findField(this.formItem.dataField);
                if(metaField && metaField.manyToOneRelation){
                    let metaRelation=metaField.manyToOneRelation;
                    //告诉form提交时，过滤掉这个关系数据
                    metaForm.ignoreKeys[metaRelation.name]=true;
                    this.$set(metaForm.entity,metaRelation.name,newSelectedItem);
                }
            }
        },
        notifySelectedItemChanged(selectedOption){
            let newSelectedItem=selectedOption;
            this.selectedItem=newSelectedItem;
            this.addHistoryItems(newSelectedItem);
            this.dispatch&&this.dispatch("mForm","on-ref-selected-changed",[this,newSelectedItem]);
            if(_.isArray(newSelectedItem)){
                this.notifyMultipleSelect(newSelectedItem);
            }else{
                this.commitRefData(newSelectedItem);
                this.notifySingleSelect(newSelectedItem);
            }
        },
        handleOnSelectChange(selectedOption, id){
            this.notifySelectedItemChanged(selectedOption);
        },
        firstInit(){
            let needInit=true;
            //查看模式，如果有冗余数据不用初始化引用组件，所以相关请求不需要，引用数据通过冗余数据设置
            if(this.viewMode){
                let metaEntity=this.context.metaEntity;
                if(metaEntity){
                    let metaField=metaEntity.findField(this.formItem.dataField);
                    if(metaField.manyToOneRelation){
                        //多对一关系
                        let relationName=metaField.manyToOneRelation.name;
                        let refData=this.model[relationName];
                        if(refData){
                            //多对一关系由于要给m-span组件使用引用数据
                            if(!_.isArray(refData)){
                                this.commitRefData(refData);
                            }
                            this.selectedItem=refData;
                            needInit=false;
                        }
                    }else if(metaField.embeddedRelation){
                        //嵌入关系
                        let relationName=metaField.embeddedRelation.name;
                        let refData=this.model[relationName];
                        if(refData){
                            this.selectedItem=refData;
                            needInit=false;
                        }
                    }
                }
                if(needInit){
                    let iv= this.getInitialValue();
                    if(_.isNil(iv)||_.isEmpty(iv)){
                        needInit=false;
                    }
                }
            }
            if(needInit){
                this.firstSearch();
                this.doSearchForCache((items) => {
                    //如果组件定义了initOnFirstLoaded方法，执行它
                    if(_.isFunction(this.initOnFirstLoaded)){
                        this.initOnFirstLoaded(items);
                    }
                    this.ensureHistoryItems(items);
                    //如果需要默认选中某个值，先使用接口中有_default_selected_标记的那条，否则使用第一条，作为选中值
                    if(this.selectedItem==null && this.preselectFirst
                        && items && items.length>0){
                        let defaultSelected=null;
                        _.forEach(items,item=>{
                            if(item._default_selected_){
                                defaultSelected=item;
                                return false;;
                            }
                        });
                        if(!defaultSelected){
                            defaultSelected=items[0];
                        }
                        this.selectedItem=defaultSelected;
                        this.commitRefData(this.selectedItem);
                    }
                    if(this.onEntitySelectInited){
                        this.onEntitySelectInited(this.selectedItem);
                    }
                });
            }
            if(this.viewMode||this.hasReadPerm===false){
                this.getViewModeValue();
            }
        },
        //第一次进入页面时执行初始化
        firstSearch(){
            let _this=this;
            var initValue=this.getInitialValue();
            if(!_.isNil(initValue)){
                _this.initSelectedItemByFirstValue(initValue);
                return;
            }

             //默认值填充
            if(this.shouldInitDefault&&this.shouldInitDefault()){
                this.calcField().then((data)=>{
                    if(!data){
                        return;
                    }
                    _this.initSelectedItemByFirstValue(data);
                });
            }
        },
        getInitialValue(){
            //如果外部传入了value值，用外部的值
            var initValue=this.value;
            if(!_.isNil(initValue)){
                return initValue;
            }
            //如果当前引用实体，与topEntity设置的一致，则自动设置为topEntity的值
            if(this.formItem && this.isCreate()
                && this.formItem.componentParams
                && this.formItem.componentParams.entityId){
                let topEntity=topEntityService.get(this.formItem.componentParams.entityId);
                if(topEntity){
                    initValue=topEntity.value;
                }
            }
            if(!_.isNil(initValue)){
                return initValue;
            }
            //top-entity-select和树列表控件，设置了默认的选中值
            if(this.entitySelectInitialValue){
                initValue=this.entitySelectInitialValue();
            }
            return initValue;
        },
        //单选
        notifySingleSelect:function(selectedOption){
            var idField=this.getIdField();
            var sid=null;
            let newSelectedItem=selectedOption;
            if(newSelectedItem){
                sid=newSelectedItem[idField];
            }
            this.$emit('input',sid);
            this.$emit("on-change",newSelectedItem);
            this.dispatch&&this.dispatch('FormItem', 'on-form-change', sid);
        },
        //多选
        notifyMultipleSelect(selectedOption){
            var idField=this.getIdField();
            var sIds=[];
            let newSelectedItem=selectedOption;
            _.each(newSelectedItem,(sitem)=>{
                var sid=sitem[idField];
                sIds.push(sid);
            });
            this.$emit('input',sIds);
            this.$emit("on-change",newSelectedItem);
            this.dispatch&&this.dispatch('FormItem', 'on-form-change', sIds);
        },
        //查询指定ids的数据并初始化选中值
        initSelectedItemByFirstValue:function (val) {
            if(_.isEmpty(val)&&(!_.isNumber(val))){
                return;
            }
            var _this=this;
            //如果val指定的查询在后端不存在，一种情况就是已经被删除，另一种情况是使用外部数据(存储在__meta__中)
            let valLen=1;
            if(_.isArray(val)){
                valLen=val.length;
            }
            this.searchByIds(val,(items) =>{
                let hasFake=false;
                //后端数据不完整
                if(items.length<valLen){
                    //构造已删除的
                    //构造__meta__中的
                    let itemsMap=_.keyBy(items,item=>{
                        return item[this.getIdField()];
                    });
                    let fakeVals=[];
                    if(_.isArray(val)){
                        val.forEach(ele => {
                            if(!itemsMap.hasOwnProperty(ele)){
                                fakeVals.push(ele);
                            }
                        });
                    }else{
                        fakeVals.push(val);
                    }
                    //需要从form构造
                    let form=this.getParentForm();
                    if(form){
                        let rowData=form.firstEntityData;
                        let fakeItems=rowMeta.rebuildRefData(fakeVals,rowData,this.formItem.dataField,this.getIdField(),this.getTitleField());
                        let _fakeItems=[];
                        _.each(fakeItems,fi=>{
                            //如果全局设置了，不显示已删除的数据，隐藏
                            if(this.hideDeleted&&fi[this.rowMetaFakeKey]){
                                hasFake=true;
                            }else{
                                _fakeItems.push(fi);
                            }
                        });

                        items=items.concat(_fakeItems);
                    }
                }
                if(items.length>0){
                    let multiple=_.isArray(val);
                    if(multiple){
                        _this.selectedItem=items;
                    }else{
                        _this.selectedItem=items[0];
                        _this.commitRefData(_this.selectedItem);
                    }

                }
                if(hasFake){
                    this.handleOnSelectChange(_this.selectedItem,null);
                }
            });
        },
        //确保被选过的数据在下拉列表中
        addHistoryItems:function () {
            if(!_.isEmpty(this.selectedItem)){
                let sItems=this.selectedItem;
                if(!_.isArray(this.selectedItem)){
                    sItems=[this.selectedItem];
                }
                let idField=this.getIdField();
                let histMap=_.keyBy(this.historyItems,item=>{
                    return item[idField];
                });
                _.each(sItems,item=>{
                    if(!histMap[item[idField]]){
                        this.historyItems.splice(0,0,item);
                    }
                });
                //this.ensureHistoryItems(sItems);
            }
        },
        //保证历史选项合并到新的items选项中
        ensureHistoryItems(items){
            var itemsMap=_.keyBy(items,item=>{
                return item[this.getIdField()];
            });
            _.each(this.historyItems,item=>{
                if(!itemsMap[item[this.getIdField()]]){
                    items.splice(0, 0, item);
                }
            });
            this.dataItems=items;
        },
        //必须由具体选择组件重写
        buildQueryOptions(params,keyword){

        },
        //根据已选ids查询数据
        searchByIds(ids,callback){
            let idField=this.getIdField();
            let queryOptions={
                filters:null
            }
            if(_.isArray(ids)){
                let inIds=context.buildLeapIn(ids);
                queryOptions.filters=`${idField} in ${inIds}`;
            }else{
                queryOptions.id=ids;
            }
            if(!this.multiple){
                //queryOptions.expand=this.buildQueryExpand();
                let _queryOpts=this.innerQueryOptions;
                //如果自定义了expand，用自定义的
                if(_queryOpts && _.has(_queryOpts,'expand')){
                    queryOptions.expand = _queryOpts.expand;
                }
            }
            if(this.entityResource){
                this.entityResource.query(queryOptions).then(({data})=>{
                    if(!_.isArray(data)){
                        data=[data];
                    }
                    callback&&callback(data);
                });
            }
        },
        //刚进入界面时，先查询一部分数据作为下拉可选的数据
        doSearchForCache:function(callback){
            if(this.cachedDataItems){
                callback&&callback(this.cachedDataItems);
                return;
            }
            var _this=this;
            var params={select:_this.queryFields};
            /*if(!this.multiple){
                params.expand=this.buildQueryExpand();
            }*/
            let limit=this.getQueryLimit();
            params.limit=limit+1;
            //如果是关键字查询，附加查询条件查询
            this.buildQueryOptions(params,"");
            this.mergeQueryOptions(params);
            if(this.entityResource){
                context.getMvueToolkit().utils.smartSearch(_this,function(){
                    _this.entityResource.query(params)
                    .then(function({data}){
                        var valData=data;
                        if(valData.length>limit){
                            var lastItem=valData[valData.length-1];
                            _.forIn(lastItem,(val,key)=>{
                                lastItem[key]="...";
                            });
                            lastItem["$isDisabled"]=true;
                        }
                        _this.cachedDataItems=data;
                        callback&&callback(data);
                    });
                });
            }
        },
        getQueryLimit(){
            let limit=this.queryLimit;
            if(this.innerQueryOptions && _.has(this.innerQueryOptions,"limit")){
                limit=this.innerQueryOptions.limit;
            }
            return limit;
        },
        mergeQueryOptions(params){
            let _queryOpts=this.innerQueryOptions;
            if(_.isEmpty(_queryOpts)){
                return;
            }
            _.forIn(_queryOpts,(val,key)=>{
                if(!_.has(params,key)){
                    params[key]=val;
                    return;
                }
                switch (key) {
                    case "filters":
                        if(val){
                            params.filters=`(${params.filters}) and (${val})`;
                        }
                        break;
                    case "orderby":
                    case "select":
                        params[key]=val;
                        break;
                }
            });
        },
        //当输入关键字搜索时会执行此查询
        doSearch:function(keyword,callback){
            var _this=this;
            var params={select:_this.queryFields};
            /*if(!this.multiple){
                params.expand=this.buildQueryExpand();
            }*/
            //这里如果keyword为空不远程查询，会导致下拉框无数据，最后一次非空的查询条件可能会覆盖缓存的数据
            /*if(!keyword){
                _this.doSearchForCache(items=>{
                    this.ensureHistoryItems(items);
                    callback&&callback(data);
                });
                return;
            }else{
                //如果是关键字查询，附加查询条件查询
                this.buildQueryOptions(params,keyword);
                this.mergeQueryOptions(params);
            }*/
            this.buildQueryOptions(params,keyword);
            this.mergeQueryOptions(params);
            if(this.entityResource){
                context.getMvueToolkit().utils.smartSearch(_this,function(){
                    _this.entityResource.query(params)
                    .then(function({data}){
                        _this.ensureHistoryItems(data);
                        callback&&callback(data);
                    });
                },"changedQueue");
            }
        },
        //获取查看模式的显示数据
        getViewModeValue(){
            if(!this.getEntityExData){
                return;
            }
            if(_.isArray(this.value)){
                let textsPromise=this.getEntityExData(this.value);
                textsPromise.then(texts=>{
                    this.viewModeValue=texts.join(",");
                });
            }else{
                this.getEntityExData(this.value).then(text=>{
                    this.viewModeValue=text;
                });
            }
        },
        searchChange:function(keyword){
            this.doSearch(keyword);
        },
        buildQueryExpand(){//构建查询时，所有引用字段展开条件，m-expand表单控件需要使用
            let entityName=this.formItem&&this.formItem.componentParams.entityId;
            //特殊处理单选用户和单选部门组件
            if(!entityName){
                entityName=this.getEntityName&&this.getEntityName();
            }
            if(entityName){
                let metaEntity =this.$metaBase.findMetaEntity(entityName);
                let _fields=metaEntity.getDefaultViewFields();
                let _expand=metaEntity.getExpand(_fields);
                return _expand;
            }
            return '';
        },
        buildDefaultOrderBy(){
            let entityName=this.formItem.componentParams.entityId;
            if(!entityName){
                return null;
            }
            let metaEntity=this.$metaBase.findMetaEntity(entityName);
            let updatedAtField = metaEntity.firstSemanticsField("updatedAt");
            let orderby = null;
            if (updatedAtField && updatedAtField.sortable) {//实体有更新时间字段，则按照更新时间降序排列
                orderby =`${updatedAtField.name} desc`;
            }
            return orderby;
        },
        isRefDeleted(){
            let value=this.viewModeValue;
            return value&&value.indexOf&&value.indexOf(entityType.deletedFlag)>-1;
        },
        realViewModeValue(){
            if(this.isRefDeleted()){
                let reg=new RegExp(entityType.deletedFlag,'g');
                return this.viewModeValue.replace(reg,'');
            }
            return this.viewModeValue;
        },
        multiRefDeletedValue(){
            if(this.isRefDeleted()){
                let t=[];
                let titles=this.viewModeValue.split(',');
                let reg=new RegExp(entityType.deletedFlag,'g');
                _.forEach(titles,title=>{
                    if(_.startsWith(title,entityType.deletedFlag)){
                        t.push({
                            deleted:true,
                            text:title.replace(reg,'')
                        });
                    }else{
                        t.push({
                            text:title
                        });
                    }
                });
                return t;
            }
            return [
                {
                    text:this.viewModeValue||this.emptyText
                }
            ];
        },
        buildOptionTitle(item,params){
            params=params||{};
            let titleField=params.titleField;
            let titleFormatter=params.titleFormatter;
            if(titleFormatter){
                try{
                    let compiled=_.template(titleFormatter);
                    let formattedValue=compiled(item||{});
                    return formattedValue;
                }catch(err){
                    console.log(err);
                    return item&&item[titleField];
                }
            }else{
                return item&&item[titleField];
            }
        }
    }
}
