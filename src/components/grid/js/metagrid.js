/**
 * 提供元数据与grid整合的功能
 */
import controlTypeService from '../../form/js/control_type_service';
import renderManager from './metagrid_render';
import operationManager from './metagrid_operation';

/**
 *  将metaField转成ivue需要的col对象
 * @param metaField
 */
function metaFieldToCol(context,metaField) {
  var col = {
    title: metaField.title,
    key: metaField.name,
    sortable: metaField.sortable,
    _metaField: metaField,
    fixed:metaField.fixed,
    align:metaField.align,
  };
  if(metaField.width){
    col.width=metaField.width;
  }
  //优先根据前端设置的type字段，设置列的渲染方式
  if (metaField.type == "operation") {
    col.render = renderManager.renderForOperation(context,metaField);
  }else if (context.grid.operationsWithTitleColumn&&(metaField.isTitleField||metaField.type == "optsTitle")) {
    col.render = renderManager.renderForOptsTitle(context,metaField);
    col.width=col.width||350;
  } else if (metaField.type == "imgTitle") {
    col.render = renderManager.renderForImgTitle(context,metaField);
  } else {
    if (controlTypeService.isPictureUpload(metaField.inputType)) {
      col.render = renderManager.renderForPictureUpload(context,metaField);
    } else if (controlTypeService.isFileUpload(metaField.inputType)) {
      col.render = renderManager.renderForFileUpload(context,metaField);
    } else {
      col.render = renderManager.renderForCommon(context,metaField);
    }
  }
  return col;
}

/**
 * 根据元数据信息初始化Grid
 * @param grid
 */
function initGridByMetabase(grid) {
  initGridProperties(grid);

  initToolBar(grid);

  initColumns(grid);
}


/**
 * 实始化grid的基本属性
 * @param grid
 */
function initGridProperties(grid) {
  var metaEntityObj=null;
  if(!_.isEmpty(grid.metaEntity)){
    metaEntityObj=grid.metaEntity;
    let updatedAtField=metaEntityObj.firstSemanticsField("updatedAt");
    if(updatedAtField&&!grid.queryOptions){//实体有更新时间字段，并且queryOptions没写，则按照更新时间降序排列
      grid.innerQueryOptions={orderby:`${updatedAtField.name} desc`};
    }
  }
  if(metaEntityObj==null){
    return;
  }
  if(_.isEmpty(grid.queryResource)&&_.isEmpty(grid.queryUrl)){
    grid.innerQueryResource=metaEntityObj.dataResource();
  }
}
function buildInnerColumns(columns,metaEntityObj,context){
  var _cols=[];
  _.each(columns,function(col){
    var metaParams=col.metaParams ||{};
    var _col=_.omit(col,["metaParams"]);
    var metaField={name:_col.key};
    if(metaEntityObj!=null){
      metaField=metaEntityObj.findField(_col.key) || {};
    }
    metaField=_.extend(metaField,metaParams);
    var defaultCol=metaFieldToCol(context,metaField);
    _col=_.extend(defaultCol,_col);
    _cols.push(_col);
  });
  return _cols;
}
/**
 * 根据元数据信息初始化列，所以没有元数据信息不做初始化
 */
function  initColumns(grid) {
  var metaEntityObj=null;
  if(!_.isEmpty(grid.metaEntity)){
    metaEntityObj=grid.metaEntity;
  }
  var context={
    grid:grid,
    metaEntity:metaEntityObj
  };
  let _cols=[];
  //如果没有传入任何columns，并且元数据信息存在，构造默认列
  if(!grid.innerColumns&&metaEntityObj){
    let defaultFormFields=metaEntityObj.getDefaultViewFields();
    _.each(defaultFormFields,function(fieldName){
      _cols.push({key:fieldName});
    });
  }else{
    _cols=grid.innerColumns;
  }
  var __cols=[];
  //多选列放在序号列前面
  if(grid.innerToolbar.batchBtns&&grid.innerToolbar.batchBtns.length>0){
    __cols.push({type: 'selection',width:58,align:"center"});
  }
  if(grid.showIndex){
    __cols.push({
      render:(h, params) => {
        var pageIndex=grid.pageIndex-1;
        var pageSize=grid.pageSize;
        var _index=params.index;
        var index=pageIndex*pageSize+_index+1;
        return h("div",index);
      },
      width:58,
      align:"center"
    });
  }
  _cols=__cols.concat(_cols);
  //如果操作列不和标题列合并，并且定义了单行操作，默认最后一列为操作列
  if(!grid.operationsWithTitleColumn&&!_.isEmpty(grid.innerToolbar.singleBtns)){
    _cols.push({
      title:"具体操作",
      width:220,
      align:"center",
      metaParams:{
        type:"operation"
      }
    });
  }
  //如果元数据信息存在，用metaField初始化列，操作列也要转化成render列
  _cols=buildInnerColumns(_cols,metaEntityObj,context);
  grid.innerColumns=_cols;
}

function  initToolBar(grid) {

  var btns=[],batchBtns=[],singleBtns=[];
  var metaEntityObj=null;
  let titleField=null;
  if(!_.isEmpty(grid.metaEntity)){
    metaEntityObj=grid.metaEntity;
    titleField=metaEntityObj.firstSemanticsField("title");
  }
  var context={
    grid:grid,
    metaEntity:metaEntityObj
  };
  /*if(!grid.toolbar){//外部没有定义toolbar，根据实体构造
    let _toolbar={
      btns:["create","import"],//普通操作
      singleBtns:["edit","view","del"],//基于单条数据的操作
      batchBtns:[]//基于多条数据的操作
    };
    let quickSearchPlacehoder="请输入关键字搜索";
    if(titleField){
      _toolbar.quicksearch={
        fields:[titleField.name],
        placeholder:quickSearchPlacehoder
      }
    }
    //普通操作转换，将操作key转换成具有实际操作代码的对象
    _.each(_toolbar.btns,function (btn,index) {
      var mergedBtn=operationManager.fillOperationByMb(context,btn);
      btns.push(mergedBtn);
    });
    //单条数据操作转换，将操作key转换成具有实际操作代码的对象
    _.each(_toolbar.singleBtns,function (btn,index) {
      var mergedBtn=operationManager.fillOperationByMb(context,btn);
      singleBtns.push(mergedBtn);
    });
    //批量操作转换，将操作key转换成具有实际操作代码的对象
    _.each(_toolbar.batchBtns,function (btn,index) {
      var mergedBtn=operationManager.fillOperationByMb(context,btn);
      batchBtns.push(mergedBtn);
    });
    _toolbar.btns=btns;
    _toolbar.batchBtns=batchBtns;
    _toolbar.singleBtns=singleBtns;
    //多个可切换的默认过滤条件处理
    _toolbar.multipleFilters={support:false};
    grid.innerToolbar=_toolbar;
  }else{}*/
  //debugger
    // _.each(grid.innerToolbar.btns,function (btn,index) {
    //   var mergedBtn;
    //   if(typeof btn=="string") {
    //     mergedBtn = operationManager.fillOperationByMb(context, btn);
    //     mergedBtn.operationType = "common";
    //     mergedBtn.name = btn;
    //     delete mergedBtn.onclick;
    //   }else{
    //     mergedBtn = btn
    //   }
    //   btns.push(mergedBtn);
    // });
    // //单条数据操作转换，将操作key转换成具有实际操作代码的对象
    // _.each(grid.innerToolbar.singleBtns,function (btn,index) {
    //   var mergedBtn;
    //   if(typeof btn=="string"){
    //     mergedBtn = operationManager.fillOperationByMb(context, btn);
    //     mergedBtn.title = mergedBtn.title
    //     mergedBtn.operationType = "common";
    //     mergedBtn.name = btn;
    //     delete mergedBtn.onclick;
    //   }else{
    //     mergedBtn = btn
    //   }
    //   singleBtns.push(mergedBtn);
    // });
    // _.each(grid.innerToolbar.batchBtns,function (btn,index) {
    //   var mergedBtn;
    //   if(typeof btn=="string") {
    //     mergedBtn = operationManager.fillOperationByMb(context, btn);
    //     mergedBtn.operationType = "common";
    //     mergedBtn.name = btn;
    //     delete mergedBtn.onclick;
    //   }else{
    //     mergedBtn = btn
    //   }
    //   batchBtns.push(mergedBtn);
    // });
    // //多个可切换的默认过滤条件处理
    // grid.innerToolbar.multipleFilters=grid.innerToolbar.multipleFilters||{support:false};
    // grid.innerToolbar.btns=btns;
    // grid.innerToolbar.singleBtns=singleBtns;
    // grid.innerToolbar.batchBtns=batchBtns;

}

export default{
  initGridByMetabase:initGridByMetabase,
}



