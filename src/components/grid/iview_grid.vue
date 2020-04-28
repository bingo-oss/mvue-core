<template>
    <b-list  v-if="canRender()" ref="listInst"
             :wrapper-class="wrapperClass"
             :columns="innerColumns"
             :query="innerQuery"
             :toolbar="innerToolbar"
             :filters="filters"
             :default-sort="innerSort"
             :cur-page="curPage"
             :pager="pager"
             :max-local-size="maxLocalSize"
             :page-size="pageSize"
             :page-size-opts="pageSizeOpts"
             :stripe="stripe"
             :border="border"
             :show-header="showHeader"
             :width="width"
             :height="height"
             :disabled-hover="disabledHover"
             :highlight-row="highlightRow"
             :row-class-name="rowClassName"
             :size="size"
             :no-data-text="noDataText"
             :no-filtered-data-text="noFilteredDataText"
             :id="id"
             :load-data-when-mount="innerLoadDataWhenMount"
             :show-refresh-btn="showRefreshBtn"
             :show-config-columns-btn="showConfigColumnsBtn"
             :operation-column-fixed="operationColumnFixed"
             :hide-pager-if-one-page="hidePagerIfOnePage"
             :external-local-pager-data="externalLocalPagerData"
             @on-current-change="handleOnCurrentChange"
             @on-select="handleOnSelect"
             @on-select-cancel="handleOnSelectCancel"
             @on-select-all="handleOnSelectAll"
             @on-select-all-cancel="handleOnSelectAllCancel"
             @on-selection-change="handleOnSelectionChange"
             @on-sort-change="handleSortChange"
             @on-filter-change="handleOnFilterChange"
             @on-row-click="handleOnRowClick"
             @on-row-dblclick="handleOnRowDblclick"
             @on-columns-modified="handleOnColumnsModified"
             @on-expand="handleOnExpand">
             <template slot="top">
                <slot name="top">
                    <!-- 高级搜索区 -->
                    <!--嵌入式高级搜索-->
                    <div class="adv-from-embedded">
                        <adv-form ref="advFormRef"
                            v-if="innerToolbar.advanceSearchFields
                                && innerToolbar.advanceSearchFields.length>0
                                && !innerToolbar.advFormPopup"
                            v-show="showAdvForm"
                            :query-options="queryOptions"
                            :quicksearch-keyword="quicksearchKeyword"
                            :quicksearch="toolbar.quicksearch"
                            :init-model="advanceSearchInitModel"
                            :entity-name="entityName"
                            :advance-search-fields="innerToolbar.advanceSearchFields"
                            :search-when-mounted="hasAdvFormDefault()"
                            @on-advance-search="doAdvanceSearch">
                            <Row slot="footer" class='footer-bar'>
                                <i-col span="8">&nbsp;</i-col>
                                <i-col span="8">
                                    <Button @click="handleAdvFormSearch" size="small" type="primary">
                                        {{t('m.grid.search')}}
                                    </Button>
                                    <Button @click="handleAdvFormReset" size="small" type="default">
                                        {{t('m.grid.reset')}}
                                    </Button>
                                </i-col>
                                <i-col span="8">&nbsp;</i-col>
                            </Row>
                        </adv-form>
                    </div>
                </slot>
             </template>
             <template slot="header-left">
                <slot name="header-left">
                </slot>
             </template>
             <template slot="header-operations" v-if="innerToolbar.btns">
                 <template v-for="(btn,index) in innerToolbar.btns">
                    <meta-operation  v-if="index<btnSizeBeforeMore" :key="index"
                            :operation="btn"  :widget-context="getWidgetContext()" class="grid-primary-btn">
                        <Button slot-scope="{operation}" class="normal-btn"
                                :disabled="btnIsDisabled(operation)"
                                :type="operation.btnType||'primary'">
                            <m-icon :type="operation.icon"></m-icon>
                            {{operation.title}}
                        </Button>
                    </meta-operation>
                 </template>
                <Dropdown v-if="innerToolbar.btns.length>btnSizeBeforeMore" >
                    <Button>
                        更多操作
                        <Icon type="md-arrow-dropdown" />
                    </Button>
                    <DropdownMenu slot="list">
                        <template v-for="(btn,index) in innerToolbar.btns">
                            <DropdownItem v-if="index>=btnSizeBeforeMore"
                                :disabled="btnIsDisabled(btn)"
                                :divided="btn.divided" :name="index" :key="index">
                                <meta-operation  :operation="btn" :widget-context="getWidgetContext()">
                                    <div  slot-scope="{operation}" style="display: block">{{operation.title}}</div>
                                </meta-operation>
                            </DropdownItem>
                        </template>
                    </DropdownMenu>
                </Dropdown>
            </template>
            <template slot="header-middle">
                <slot name="header-middle">
                </slot>
             </template>
            <template slot="header-quicksearch">
                <slot name="header-quicksearch">
                    <Input class="quicksearch-input" search  v-if="toolbar.quicksearch&&toolbar.quicksearch.fields"
                           v-model="quicksearchKeyword" @on-search="reload"
                           :placeholder="toolbar.quicksearch.placeholder"  clearable/>
                    <Button v-if="innerToolbar.advanceSearchFields
                            && innerToolbar.advanceSearchFields.length>0
                            && !innerToolbar.advFormPopup"
                        @click="showAdvForm=!showAdvForm" type="default">
                        {{getAdvanceSearchTitle()}}
                    </Button>
                    <!--弹出式高级搜索-->
                    <advance-search ref="advanceSearchRef"
                            v-if="innerToolbar.advanceSearchFields
                            && innerToolbar.advanceSearchFields.length>0
                            && innerToolbar.advFormPopup"
                            :query-options="queryOptions"
                            :quicksearch-keyword="quicksearchKeyword"
                            :quicksearch="toolbar.quicksearch"
                            :init-model="advanceSearchInitModel"
                            :entity-name="entityName"
                            :advance-search-fields="innerToolbar.advanceSearchFields"
                            :search-when-mounted="hasAdvFormDefault()"
                            :connect-keyword="true"
                            @on-advance-search="doAdvanceSearch"></advance-search>
                </slot>
             </template>
            <template slot="header-right">
                <slot name="header-right">
                </slot>
                <top-entity-select v-if="topEntitySelect&&topEntitySelect.entityName"
                    v-bind="topEntitySelect" @on-top-entity-change="handleTopEntityChange">
                </top-entity-select>
            </template>
    </b-list>
</template>
<script>
import metabase from '../../libs/metadata/metabase';
import initByMetadata from './js/init-by-metadata';
import mGridProps from './js/m-grid-props';
import gridBase from './js/grid-base';
import gridEvents from './js/grid-events';
import getParent from '../mixins/get-parent';
export default {
    mixins: [mGridProps, gridBase, gridEvents, getParent],
    props:{
        createParams:{//grid创建操作可使用的外部指定的查询参数，由m-tree-grid传入，create操作使用
            type:Object,
            required:false
        },
        loadDataWhenMount:{
            type:Boolean,
            default:true
        }
    },
    components:{
        topEntitySelect:require('./top-entity-select').default,
        advForm:require('./adv-search/form').default
    },
    data:function(){
        this.setAccessModeIfNecessary();
        var metaEntity = metabase.findMetaEntity(this.entityName);
        var qr=this.ifOneToManyGrid()?this.buildOneToManyGridQueryResource():metaEntity.dataResource();
        var saveStatusKey=this.id||`${this.$route.matched[this.$route.matched.length-1].path}-${this.entityName}`;
        var ctx=this.$store.getters['core/gridStatus'][saveStatusKey]||{};
        return {
            metaEntity:metaEntity,
            queryResource:qr,
            innerSort:ctx.sort||_.cloneDeep(this.defaultSort),
            innerColumns:_.cloneDeep(this.columns),
            curPage:ctx.currentPage||1,
            quicksearchKeyword:ctx.quicksearchKeyword||'',
            saveStatusKey:saveStatusKey,
            advanceSearchInitModel:ctx.advModel||(this.toolbar&&this.toolbar.advFormDefault)||null,
            advanceSearchFilters:ctx.advanceSearchFilters||[],
            editRow:'',//当前行是否开启了编辑模式
            rowMap:{},//m-batch-editor模式，用来存储所有行的引用数据
            showAdvForm:false//嵌入式高级查询框，默认隐藏
        };
    },
    //保存一下当前grid的状态到vuex，页码、快捷查询条件、排序等
    beforeDestroy(){
        var currentQueryCtx=_.cloneDeep(this.currentQueryCtx);
        //弹出式高级查询
        if(this.$refs.advanceSearchRef){
            currentQueryCtx.advModel=this.$refs.advanceSearchRef.$refs.advFormRef.model;
            currentQueryCtx.advanceSearchFilters=this.advanceSearchFilters;
        }else if(this.$refs.advFormRef){//内联式高级查询
            currentQueryCtx.advModel=this.$refs.advFormRef.model;
            currentQueryCtx.advanceSearchFilters=this.advanceSearchFilters;
        }
        this.$store.commit('core/keepGridStatus',{key:this.saveStatusKey,ctx:currentQueryCtx});
    },
    mounted:function(){
        this.initByMetadata();
    },
    methods:{
        setAccessModeIfNecessary(){
            if(this.accessMode){
                this.$store.commit('core/setAccessMode',this.accessMode);
            }
        },
        buildOneToManyGridQueryResource(){
            let sourceMetaEntity=this.$metaBase.findMetaEntity(this.fromRelation.entityName);
            //这里返回的是以关系命名的方法对象，而不是原始的查询对象
            return sourceMetaEntity.dataResource()[this.fromRelation.name];
        },
        ifOneToManyGrid(){//是否一对多关系列表
            let relationInfo=this.resolveRelationInfo();
            if(relationInfo){
                return true;
            }
            return false;
        },
        //利用元数据信息填充grid相关属性
        initByMetadata(){
            //如果外部没有指定默认排序，则使用实体更新时间字段作为默认排序
            if(!this.innerSort){
                this.innerSort=initByMetadata.buildDefaultOrderby(this);
            }
            //如果有来自查询条件的默认过滤器初始化
            var filtersFromQuery={};
            //弹出框不读取query参数
            if(!this.getParentPopup()){
                filtersFromQuery=initByMetadata.buildFiltersFromQuery(this);
            }
            this.filtersFromQuery=filtersFromQuery;
            //如果外部没有定义快捷查询字段，利用title语义字段构造
            if(this.innerToolbar&&
                this.innerToolbar.quicksearch&&
                (!this.innerToolbar.quicksearch.fields)){
                let _quicksearch=initByMetadata.buildDefaultQuickSearch(this);
                if(_quicksearch){
                    this.innerToolbar.quicksearch=_.extend(this.innerToolbar.quicksearch,_quicksearch);
                }
            }
            //根据实体元数据初始化grid的列
            initByMetadata.initColumns(this);
            //批量编辑模式禁用非状态列type == "rowStatus"的filterable
            if(this.batchEditorMode){
                this.innerColumns.forEach(col => {
                    if(col.key!=='__rowStatus__'&&col.hasOwnProperty('filterRemote')){
                        delete col.filterRemote;
                        delete col.filters;
                    }
                });
            }
            //预处理完毕，b-list可以渲染了
            this.preprocessed = true;
        },
        //执行查询之前，附加leap query的固定查询参数
        beforeQuery(params){
            if(this.queryOptions){
                if(this.queryOptions.filters){
                    params.filters=params.filters?`(${params.filters}) and ${this.queryOptions.filters}`:`${this.queryOptions.filters}`
                }
                for(const key in this.queryOptions) {
                    //如果params中没有的key，用queryOptions的覆盖，否则以params的为准
                    if(key!="filters"&&this.queryOptions.hasOwnProperty(key)&&(!params.hasOwnProperty(key))) {
                        params[key]=this.queryOptions[key];
                    }
                }
            }
            //将需要expand的字段添加到查询参数中
            let _fields=[];
            _.each(this.innerColumns,c=>{
                if(c.key){
                    _fields.push(c.key);
                }
            });
            let _expand=this.metaEntity.getExpand(_fields);
            if(_expand){
                params.expand=_expand;
            }
            this.fillParamsWithRelation(params);
        },
        //对于多对一关系和多对多关系，自动添加相关查询参数
        fillParamsWithRelation(params){
            if(this.ifOneToManyGrid() || this.refField){
                let relationFilters=this.buildRelationFilters();
                if(relationFilters){
                    params.filters=params.filters?`(${params.filters}) and ${relationFilters}`:`${relationFilters}`
                }
                params['parentEntityId']=this.refEntityId();
            }
        },
        //暂时只处理多对一关系
        buildRelationFilters(){
            var _filters='';
            if(this.refEntityId()){
                _filters=`${this.getRefField()} eq ${this.refEntityId()}`;
            }
            return _filters;
        },

        canRender(){
            //如果是关系列表，必须等待关联实体的数据写入core模块的store后才算初始化完成
            if(this.fromRelation||this.refField){
                return this.refEntityId()&&this.preprocessed;
            }else{
                return this.preprocessed;
            }
        },
        handleTopEntityChange(){
            this.reload();
        }
    }
}
</script>

