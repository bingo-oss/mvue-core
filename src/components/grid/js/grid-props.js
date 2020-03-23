export default{
    props: {
        queryUrl:{//外部指定的查询地址，必须是兼容leap查询协议的
            type:String,
            required:false
        },
        query:{//数据加载方法，可以由外边重写掉
            type:Function,
            required:false
        },
        "filters": {//高级查询的条件和列表头部的筛选条件设置
            type: Object
        },
        "toolbar": {
            type: Object,
            default() {
                return {};
            }
        },
        "operationsWithTitleColumn": {//是否操作列合并到标题列
            type: Boolean,
            required: false,
            default: false
        },
        "context": {
            type: Object,
            required: false
        },
        "pageSizeOpts": {
            type: Array,
            required: false,
            default: function () {
                return [10, 20, 50, 100];
            }
        },
        pager: {//是否启用分页
            type: [Boolean, String],
            default: true
        },
        "pageSize": {//每页条数
            type: Number,
            default: 10
        },
        "pageSizeKey": {
            type: String,
            default: "page_size"
        },
        "pageKey": {
            type: String,
            default: "page"
        },
        "highlightRow": {//iview table属性，用来单选选中高亮
            type: Boolean,
            default: false
        },
        "showIndex": {//是否显示序号列
            type: Boolean,
            default: true
        },
        "showSelection": {//是否显示多选列
            type: Boolean,
            default: true
        },
        "selectionBeforeIndex": {//是否多选列在序号列之前
            type: Boolean,
            default: false
        },
        "showRowStatus": {//是否显示行编辑状态列
            type: Boolean,
            default: false
        },
        "showRefreshBtn": {//是否显示刷新按钮
            type: Boolean,
            default: true
        },
        "showConfigColumnsBtn": {//是否显示配置按钮
            type: Boolean,
            default: true
        },
        indexColumnFixed:{//指定索引列固定位置：left or right
            type:String,
        },
        selectionColumnFixed:{//指定选择列固定位置：left or right
            type:String,
        },
        operationColumnFixed:{//指定操作列固定位置：left or right
            type:String,
        },
        statusColumnFixed:{//指定编辑状态列固定位置：left or right
            type:String,
        },
        wrapperClass: {
            type: [String, Object, Array],
            default: "default-list-wrapper"
        },
        stripe: {
            type: Boolean,
            default: false
        },
        border: {
            type: Boolean,
            default: false
        },
        showHeader: {
            type: Boolean,
            default: true
        },
        width: {
            type: [Number, String]
        },
        height: {
            type: [Number, String]
        },
        disabledHover: {
            type: Boolean,
            default: false
        },
        rowClassName: {
            type: Function,
            default() {
                return '';
            }
        },
        size: {
            type: String
        },
        noDataText: {
            type: String
        },
        noFilteredDataText: {
            type: String
        },
        id:{//用来唯一标志一个列表，用于存储列表的配置数据key，如配置列数据本地存储的key
            type:String
        },
        accessMode:{//当前页面执行权限模式，此属性可改变
            type:String
        },
        topEntity:{//是否在选中操作后，后续查询自动附加x-top-entity-row头
            type:Boolean,
            default:false
        },
        topEntitySelect:{//{entityName:'',searchFields:[],queryOptions:{}}，topEntity查询框配置
            type:Object,
            validator(value){
                if(!value){
                    return true;
                }
                return value&&value.entityName;
            }
        },
        hidePagerIfOnePage:{//如果只有一页数据，是否隐藏分页页脚
            type:Boolean,
            default:false
        },
        maxLocalSize:{//这里用来限制leap expand 1000条数据的限制，一次性查询至多1000条数据
            type:Number,
            default:1000
        },
        batchEditorMode:{//是否批量编辑模式
            type:Boolean,
            default:false
        },
        externalLocalPagerData:{//本地分页的外部数据
            type:Array
        },
        importTemplateUrl:{//导入模板地址，如果指定了导入模板地址，导入时会提供模板下载按钮
            type:String
        },
        refField:{//多对一关系列表自动过滤的字段
            type:String,
            required:false
        },
        fromRelation:{//关联列表会提供关系配置，如{entityName:'organization',name:"users"}，多对多关系：{entityName:'organization',name:"users"}
            type:Object,
            required:false
        },
        expand:{//控制grid是否将多余的列通过展开的方式显示
            type:[Object,Boolean]
        }
    }
}
