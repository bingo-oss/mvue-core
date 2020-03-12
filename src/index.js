import tabs from './components/tabs/index';
import section from './components/section/index';
import text from './components/text/index';

import gridRenderHtml from './components/grid/column-render/render_html';
import gridOperationBtn from './components/grid/column-render/operation_btn';
import gridImgTitle from './components/grid/column-render/img_title';
import gridOptsTitle from './components/grid/column-render/opts_title';
import gridLinkTitle from './components/grid/column-render/link_title';
import gridPictures from './components/grid/column-render/pictures';
import gridFiles from './components/grid/column-render/files';
import gridPassword from './components/grid/column-render/password';
import gridRelationField from './components/grid/column-render/relation-field';
import gridRowStatus from './components/grid/column-render/row-status';
import gridImportData from './components/grid/import_data.vue';
import gridBatchEditor from './components/grid/batch-editor';
import batchEditorFillData from './components/batch-editor/fill-data';
import gridAssociate from './components/grid/associate';

import operation from './components/meta_operation/operation';

import grid from './components/grid/iview_grid.vue';
import gridExpand from './components/grid/expand.vue';
import entityTree from './components/entity-tree/index';
import treeGrid from './components/meta-tree-grid/index';
import layout from './components/meta-layout/index';
import page from './components/meta-page/index';
import pageTmpl from './components/meta-page/tmpl/index';
import mfield from './components/form/metafield';
import mform from './components/form/metaform';
import detailView from "./components/detail-view/index";
import batchEditor from "./components/batch-editor/index";
import simpleBatchEditor from "./components/batch-editor/simple";
import mIcon from "./components/m-icon/index";

import SingleLineText from './components/form/control_tmpl/single_line_text';
import MultiLineText from './components/form/control_tmpl/multi_line_text';
import JsonText from './components/form/control_tmpl/json-text';
import RadioButton from './components/form/control_tmpl/radio_button';
import CheckboxGroup from './components/form/control_tmpl/checkbox_group';
import SingleSelect from './components/form/control_tmpl/single_select';
import MultiSelect from './components/form/control_tmpl/multi-select';
import Date from './components/form/control_tmpl/date';
import Time from './components/form/control_tmpl/time';
import DateTime from './components/form/control_tmpl/datetime';

import DateRange from './components/form/control_tmpl/daterange';
import TimeRange from './components/form/control_tmpl/timerange';
import DateTimeRange from './components/form/control_tmpl/datetimerange';

import NumberInput from './components/form/control_tmpl/number_input';
import FileUpload from './components/form/control_tmpl/file_upload';
import PictureUpload from './components/form/control_tmpl/picture_upload';
import Portrait from './components/form/control_tmpl/portrait';
import SingleFileUpload from './components/form/control_tmpl/single-file-upload';
import SingleImageUpload from './components/form/control_tmpl/single-image-upload';
import SingleUserSelect from './components/form/control_tmpl/single_user_select';
import SingleOrgSelect from './components/form/control_tmpl/single_org_select';
import MultiUserSelect from './components/form/control_tmpl/multi_user_select';
import MultiOrgSelect from './components/form/control_tmpl/multi_org_select';
import CascadeSelect from './components/form/control_tmpl/cascade_select';

import RefEntity from './components/form/control_tmpl/ref_entity';
import MultiRefEntity from './components/form/control_tmpl/multi_ref_entity';
import OrderedMultiRefEntity from './components/form/control_tmpl/ordered/multi-ref-entity';
import ParentSelect from './components/form/control_tmpl/parent-select/index';

import Boolean from './components/form/control_tmpl/boolean';
import IssuedNumber from './components/form/control_tmpl/issued_number';
import BitCode from './components/form/control_tmpl/bit-code';
import Password from './components/form/control_tmpl/password';
import Tag from './components/form/control_tmpl/tag';
import AdvNumber from './components/form/control_tmpl/advance-search/number';
import mExpand from './components/form/control_tmpl/expand/index';
import mConfirm from './components/form/control_tmpl/confirm/index';
import mRelation from './components/form/control_tmpl/relation/index';

import mComponent from './components/meta-component/index';

//link特殊打开的组件
import PclinkSingleUserSelect from './components/form/pclink/single_user_select';
import PclinkSingleOrgSelect from './components/form/pclink/single_org_select';
import PclinkMultiUserSelect from './components/form/pclink/multi_user_select';
import PclinkMultiOrgSelect from './components/form/pclink/multi_org_select';
import simpleTree from './components/simple-tree/tree';

//通用控件
import UserSelector from "./components/form/control_tmpl/user-select/select-user"
import OrgSelector from "./components/form/control_tmpl/org-select/select-org"
import EntitySelect from './components/entity-select/index'

import ObjectEditor from './components/form/control_tmpl/object-editor/index';
import MultiObjectEditor from './components/form/control_tmpl/object-editor-multi/index';

const formComponents={
    SingleLineText,
    MultiLineText,
    JsonText,
    RadioButton,
    CheckboxGroup,
    SingleSelect,
    MultiSelect,
    Date,
    Time,
    DateTime,

    DateRange,
    TimeRange,
    DateTimeRange,

    NumberInput,
    Number:NumberInput,
    AdvNumber,

    FileUpload,
    MultiFileUpload:FileUpload,
    SingleFileUpload,

    PictureUpload,
    MultiImageUpload:PictureUpload,
    SingleImageUpload,

    Portrait,
    Avatar:Portrait,

    SingleUserSelect,
    SingleOrgSelect,
    MultiUserSelect,
    MultiOrgSelect,
    CascadeSelect,
    RefEntity,
    MultiRefEntity,
    OrderedMultiRefEntity,
    ParentSelect,
    Boolean,
    IssuedNumber,
    BitCode,
    Password,
    Tag,

    PclinkSingleUserSelect,
    PclinkSingleOrgSelect,
    PclinkMultiUserSelect,
    PclinkMultiOrgSelect,

    UserSelector,
    OrgSelector,

    ObjectEditor,
    MultiObjectEditor
};
const gridInnerComponents={
    'm-grid-render-html':gridRenderHtml,
    'm-grid-operation-btn':gridOperationBtn,
    'm-grid-img-title':gridImgTitle,
    'm-grid-opts-title':gridOptsTitle,
    'm-grid-link-title':gridLinkTitle,
    'm-grid-pictures':gridPictures,
    'm-grid-files':gridFiles,
    'm-grid-password':gridPassword,
    'm-grid-relation-field':gridRelationField,
    'm-grid-row-status':gridRowStatus,
    'm-grid-import-data':gridImportData,
    'm-grid-batch-editor':gridBatchEditor,
    'm-batch-editor-fill-data':batchEditorFillData,
    'm-grid-associate':gridAssociate,
    'meta-operation':operation,
    'm-operation':operation,
    'm-component':mComponent
};
//旧的组件定义，文档中会废除
const oldFasionComponents={
    'b-tabs':tabs,
    'b-section':section,
    'b-text':text,
    'meta-field':mfield,
    'meta-form':mform,
    'meta-grid':grid,
    'meta-entity-tree':entityTree,
    'meta-tree-grid':treeGrid,
    'meta-layout':layout,
    'meta-page':page,
};
//新对外暴露的组件，文档会以这里的组件为准
const mComponents={
    'm-tabs':tabs,
    'm-section':section,
    'm-text':text,
    'm-field':mfield,
    'm-form':mform,
    'm-grid':grid,
    'm-grid-expand':gridExpand,
    'm-entity-tree':entityTree,
    'm-tree-grid':treeGrid,
    'm-layout':layout,
    'm-page':page,
    'm-page-tmpl':pageTmpl,
    'm-simple-tree':simpleTree,
    'm-expand':mExpand,
    'm-confirm':mConfirm,
    'm-detail-view':detailView,
    'm-relation':mRelation,
    'm-batch-editor':batchEditor,
    'm-simple-batch-editor':simpleBatchEditor,
    'm-entity-select':EntitySelect,
    'm-icon':mIcon
};
const allComponents=_.extend({},gridInnerComponents,oldFasionComponents,mComponents);
//全局组件样式在这里引入，避免在内部重复引用
require('./components/components.less');
import metabase from './libs/metadata/metabase';

import propParser from './services/tool/prop_parser';
import linkplugin from './services/link/linkplugin';
import metaservice from './services/meta/metaservice';
import toolService from './services/tool/tool_service';
import treeService from './services/tool/tree-service';
import metaLayoutConvertor from './components/meta-layout/layout-convertor';


import formConstants from './components/form/js/constants';
import formValidationPattern from './components/form/js/validation_pattern';
import controlTypeService from './components/form/js/control_type_service';
import commonOperation from './components/meta_operation/js/common_operation';

import  context from "./libs/context";
import permissionService from "./libs/security/permission";
import getParent from './components/mixins/get-parent';
import TransferDom from './components/form/js/transfer_dom';
import operationManager from "./libs/operation/operations";
import formControlManager from './components/form/control-manager';
import topEntityService from "./services/store/top-entity";
import interceptorManager from "./libs/interceptor/interceptors";
import ufs from "./libs/ufs";
import locale from './locale/index';
import entityResource from "./libs/metadata/entity-resource";

//关闭浏览器tab时，标记当前会话sid对应的localStorage数据可能过期
window.onbeforeunload = function clearAfterWindowClose(){
    topEntityService.setMayExpired();
}
let MvueCore={
    install:install,
    metaBase:metabase,
    metaService:metaservice,
    propParser:propParser,
    linkplugin,
    formConstants,
    formValidationPattern,
    controlTypeService,
    operationManager:operationManager,
    context,
    metaLayoutConvertor,
    getParent,
    TransferDom,
    treeService,
    formControlManager,
    ufs,
    locale,
    topEntityService,
    permissionService,
    entityResource,
    initAfterAppCtxCreated:(appCtx)=>{
        context.initAfterAppCtxCreated(appCtx);
    },
    initAfterAppStarted:(appCtx)=>{
        context.initAfterAppStarted(appCtx);
    },
    addRouterInterceptor:(router,{appCtx})=>{
        interceptorManager.register(router,appCtx);
    }
};

//Vue插件安装入口函数
function install(Vue, opts = {}) {
    if (install.installed) return;
    context.init(Vue,opts);

    //注册组件到vue
    Object.keys(allComponents).forEach(key => {
        Vue.component(key, allComponents[key]);
    });
    //注册表单字段组件到vue
    Object.keys(formComponents).forEach(key => {
        let name=`m-${_.kebabCase(key)}`;
        Vue.component(name,formComponents[key]);
    });
    Vue.prototype.$metaBase=metabase;
    Vue.prototype.$metaService=metaservice();
    Vue.prototype.$toolService=toolService();
    Vue.prototype.$http=context.getMvueToolkit().http;
    Vue.prototype.$resource=context.getMvueToolkit().resource;
    Vue.prototype.$session=context.getMvueToolkit().session;


    MvueCore["session"]=context.getMvueToolkit().session;
    MvueCore["ssoclient"]=context.getMvueToolkit().ssoclient;
    MvueCore["router"]=context.getMvueToolkit().router;
    MvueCore["config"]=context.getMvueToolkit().config;
    MvueCore["http"]=context.getMvueToolkit().http;
    MvueCore["resource"]=context.getMvueToolkit().resource;
};

export default MvueCore;
