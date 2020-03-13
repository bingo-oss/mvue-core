import metabase from '../../../libs/metadata/metabase';
import metaservice from '../../../services/meta/metaservice';
import metaGrid from "./metagrid";

export default {
    methods: {
        buildQueryFilters() {
            if(!this.metaEntity){
                return null;
            }
            var query = this.$route.query;
            var metaEntity = this.metaEntity;
            //如果有查询条件，并且查询key是实体的字段，则加入到默认查询条件中
            let queryOptions = {};
            if (query) {
                let _queryOptions = {};
                _.each(query, function (value, key) {
                    if (metaEntity.findField(key)) {
                        _queryOptions[key]=value;
                    }
                });
                queryOptions=_queryOptions;
            }
            return queryOptions;
        },
        buildDefaultOrderby() {
            if(!this.metaEntity){
                return null;
            }
            let updatedAtField = this.metaEntity.firstSemanticsField("updatedAt");
            let orderby = null;
            if (updatedAtField) {//实体有更新时间字段，并且queryOptions没写，则按照更新时间降序排列
                orderby = `${updatedAtField.name} desc`;
            }
            return orderby;
        },
        initUrls(metaView){
            var settings=metaView.settings;
            if(settings&&settings.viewUrl){
                this.viewPath=settings.viewUrl;
            }
            if(settings&&settings.editUrl){
                this.editPath=settings.editUrl;
            }
            if(settings&&settings.createUrl){
                this.createPath=settings.createUrl;
            }
        },
        /**
        * 如果实体存在已经定义的视图配置，则读取默认视图配置
        */
        metaViewToGrid(metaEntity,metaView){
            this.initUrls(metaView);
            var _this=this;
            let visibleFields = [];
            let dataMap = _.keyBy(metaEntity.fields, "name");
            let columnsMap = _.keyBy(metaView.viewFields/*config.columns*/, "fieldName");
            let filters = metaView.config.filters||'';
            if(_this.queryOptions&&_this.queryOptions.filters){
                if(filters){filters+=" and "}
                filters = _this.queryOptions.filters;//传入的过滤条件
            }
            let _metaFields = [], _searchFields = [], _advanceSearchFields=[],_quickSearchFields=[];
            _.each(metaView.viewFields/*metaView.config.columns*/, function (column) {
                let metaField = dataMap[column.fieldName/*name*/];
                if(metaField){
                    _metaFields.push(metaField);
                    //关键字字段
                    if (column.key) {
                        _searchFields.push(metaField.name);
                    }
                    //高级查询字段
                    if(column.searchable){
                        _advanceSearchFields.push(metaField.name);
                    }
                    //快捷查询字段
                    if(column.quicksearchable){
                        _quickSearchFields.push(metaField.name);
                    }
                    //列宽度
                    if(_.isInteger(column.width)){
                        metaField.width=column.width;
                    }
                    //列固定
                    if(column.fixed){
                        metaField.fixed=column.fixed;
                    }
                    //对齐方式
                    if(column.align){
                        metaField.align=column.align;
                    }
                }
            });
            //在外部设置好操作后，查询字段还需要附加上去
            if(this.innerToolbar){
                if(_.isArray(this.innerToolbar.advanceSearchFields)){
                    this.innerToolbar.advanceSearchFields=_advanceSearchFields;
                }else{
                    this.innerToolbar.advanceSearchFields=[]
                }
                if(_.isArray(this.innerToolbar.quickSearchFields)){
                    this.innerToolbar.quickSearchFields=_quickSearchFields;
                }else{
                    this.innerToolbar.quickSearchFields=[]
                }
                if(_.isObject(this.innerToolbar.quicksearch)){
                    let quickSearchPlacehoder="请输入关键字搜索";
                    if (_searchFields.length) {
                        this.innerToolbar.quicksearch = {
                            fields: _searchFields,
                            placeholder: quickSearchPlacehoder
                        }
                    }else{
                        let titleField=metaEntity.firstSemanticsField("title");
                        if(titleField){
                            this.innerToolbar.quicksearch = {
                                fields: [titleField.name],
                                placeholder: quickSearchPlacehoder
                            }
                        }
                    }
                }else{
                    this.innerToolbar.quicksearch = {}
                }
            }
            //end 构造工具栏
            //begin 构造查询条件
            let queryOptions = _this.buildQueryFilters()||{};
            //设置默认过滤条件
            if(queryOptions.filters){
                if(filters){
                    queryOptions.filters=`${filters} and (${queryOptions.filters})`;
                }
            }else{
                queryOptions.filters = filters;
            }
            //设置默认排序
            if (metaView.config.orderby && metaView.config.orderby.length) {
                let _orderby = [];
                _.each(metaView.config.orderby, function (orderby) {
                    _orderby.push(`${dataMap[orderby.name].name} ${orderby.type}`);
                });
                queryOptions.orderby = _orderby.join(",");
            }
            if (!_.isEmpty(_this.filterId)) {
                queryOptions.viewId = _this.filterId;
            } else {
                delete queryOptions.viewId;
            }
            _this.innerQueryOptions=queryOptions;
            //end 构造查询条件
            //begin 构造grid列
            visibleFields = _.filter(_metaFields, function (o) {
                return columnsMap[o.name].visible;
            });
            let columns=[];
            //添加所有可见列
            for (var i = 0; i < visibleFields.length; i++) {
                let metaField = visibleFields[i];
                let __col={
                    title: metaField.title,
                    key: metaField.name,
                    sortable: columnsMap && columnsMap[metaField.name].sortable ? "custom" : false,
                    align: metaField.align||"center",
                    minWidth:100
                };
                if(metaField.width){
                    //优先读取设的宽度值
                    __col.width=metaField.width;
                }else if(["Date","Time"].indexOf(metaField.inputType)!=-1){
                    //时间字段设置默认宽度,不希望换行
                    __col.width=120;
                }else if(["DateTime"].indexOf(metaField.inputType)!=-1){
                    //时间字段设置默认宽度,不希望换行
                    __col.width=180;
                }
                columns.push(__col);
            }
            _this.innerColumns = columns;
            //end 构造grid列
            metaGrid.initGridByMetabase(this);
            //完成初始化
            _this.preprocessed = true;
        },
        setDefaultQueryOptions(){
            var _this=this;
            //begin 实体没有自定义默认视图数据，检查查询参数构造默认的查询条件
            let queryOptions = _this.buildQueryFilters()||{};
            //检查实体默认的排序字段
            let orderby = _this.buildDefaultOrderby();
            if (queryOptions) {
                if (orderby) {
                    queryOptions.orderby = orderby;
                }
            } else {
                if (orderby) {
                    queryOptions = { orderby: orderby };
                }
            }
            if (!_.isEmpty(_this.filterId)) {
                queryOptions.viewId = _this.filterId;
            } else {
                delete queryOptions.viewId;
            }
            _this.innerQueryOptions = _.extend(queryOptions,_this.innerQueryOptions);
            //end
            metaGrid.initGridByMetabase(this);
            //完成初始化
            _this.preprocessed = true;
        },
        initGridByViewId() {//根据viewId获取视图配置并初始化grid的一些属性
            var viewShortId;
            if(this.viewId){
                viewShortId = this.viewId;
            }else{
                viewShortId = this.$route.query.viewShortId;
            }
            this.viewShortId=viewShortId;
            var _this = this;
            var isWin = (navigator.platform == "Win32") || (navigator.platform == "Windows");
            var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
            let pcType = "";
            if(isWin){
                pcType = 4
            }else if(isMac){
                pcType = 8
            }
            let setData = {terminalType:pcType}
            if(viewShortId){
                if(this.$route.query.entity){
                    //只存在实体id则查询默认视图
                    setData.getDefaultForm = true;
                    setData.id = this.$route.query.entity
                }else{
                    //_this.setDefaultQueryOptions();
                    //return;
                }
                //_this.setDefaultQueryOptions();
                //return;
            }
            if(viewShortId){
                metaservice.getViewByDefaultShortId(Object.assign({id: viewShortId},setData))
                    .then(({ data }) => {
                        if(setData.getDefaultForm&&data.viewFields){
                            //取的是默认视图
                            data = data.viewFields
                        }
                        //需要通过viewId--获取配置,不需要预定义
                        _this.viewDef = data;//存入视图配置
                        _this.metaEntity = metabase.findMetaEntity(data.metaEntityName);
                        if(!_this.metaEntity){
                            metabase.initMetabase(data.projectId,true).then(()=>{
                                _this.getMetaViewToGrid(data);
                            })
                        }else{
                            _this.getMetaViewToGrid(data)
                        }
                    }, (resp)=> {
                        _this.setDefaultQueryOptions();
                    });
            }else{
                _this.setDefaultQueryOptions();
            }
        },
        getMetaViewToGrid(data){
            let _this = this;
            _this.metaEntity = metabase.findMetaEntity(data.metaEntityName);
            _this.metaEntity.metaEntityId = data.metaEntityId;//存在实体id
            _this.entityName = data.metaEntityName;
            //存在自定义视图，由视图构造grid
            _this.formShortId = data.metaFormShortId
            if (/*data.config && data.config.columns*/data.viewFields) {
                _this.metaViewToGrid(_this.metaEntity, data);
            } else {//虽然存在视图，但是没有任何配置，依然用默认
                _this.setDefaultQueryOptions();
            }
        }
    }
}
