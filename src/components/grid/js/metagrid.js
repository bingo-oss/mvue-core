/**
 * 提供元数据与grid整合的功能
 */
import controlTypeService from '../../form/js/control_type_service';
import renderManager from './metagrid_render';
import metabase from '../../../libs/metadata/metabase';
import optionsUtils from '../../../libs/metadata/options-utils';
/**
 *  将metaField转成ivue需要的col对象
 * @param metaField
 */
function metaFieldToCol(context,metaField,initialCol) {
  var col = {
    title: metaField.title,
    key: metaField.name,
    sortable: metaField.sortable,
    _metaField: metaField,
    fixed:metaField.fixed,
    align:metaField.align,
    hidden:!!metaField.hidden
  };
  if(metaField.width){
    col.width=metaField.width;
  }
  //优先根据前端设置的type字段，设置列的渲染方式
  if(initialCol.type === 'expand'){
    col.render = renderManager.renderForExpand(context,metaField,initialCol);
  }else if (metaField.type === "operation") {
    col.render = renderManager.renderForOperation(context,metaField);
  }else if (metaField.isTitleField||metaField.type == "optsTitle") {
    if(context.grid.batchEditorMode){
      col.render = renderManager.renderForCommon(context,metaField,initialCol);
      return col;
    }
    if(context.grid.operationsWithTitleColumn){
        col.render = renderManager.renderForOptsTitle(context,metaField);
        col.width=col.width||350;
    }else {
        col.render=renderManager.renderForLinkTitle(context,metaField,context.metaEntity.getIdField().name,initialCol);
    }
  } else if (metaField.type === "imgTitle") {
    if(context.grid.batchEditorMode){
      col.render = renderManager.renderForCommon(context,metaField,initialCol);
      return col;
    }
    col.render = renderManager.renderForImgTitle(context,metaField);
  } else if(metaField.type === "rowStatus"){//编辑状态显示列
    col.filterMultiple=false;
    col.filterRemote=(selectedValues)=>{//远程过滤
                        //修改过滤条件
                        var _filter=null;
                        _filter={
                          op:'eq',
                          value:selectedValues[0]
                        };
                        context.grid.filtersFromColumnHeader[col.key]=_filter;
                        //重新加载数据
                        context.grid.$refs.listInst.doReload(true);
                    };
    let options=[{id:'unsaved',text:'未保存'},{id:'failed',text:'出错'},{id:'saved',text:'已保存|未编辑'}];
    let _filters=[]; 
    _.each(options,opt=>{
      _filters.push({
        label:opt.text,
        value:opt.id
      });
    })
    col.filters=_filters;
    col.render = renderManager.renderForRowStatus(context,metaField,options);
  }else if(metaField.autoFilterable&&
    controlTypeService.isOptions(metaField.inputType)){//如果是选项列，自动添加列头过滤相关功能
    col.filterMultiple=false;
    //let isSingleOption=controlTypeService.isSingleOption(metaField.inputType);
    let showOthers=metaField.inputTypeParams&&metaField.inputTypeParams.showOthers;
    col.filterRemote=(selectedValues)=>{//远程过滤
                        //修改过滤条件
                        var _filter=null;
                        if(initialCol.filterMultiple){
                          if(showOthers&&_.includes(selectedValues,optionsUtils.othersTag)){
                            let _selectedValues=[]; 
                            _.forEach(selectedValues,sv=>{
                              _selectedValues.push(`%${sv}%`);
                            });
                            _filter={
                              op:'like',
                              value:_selectedValues
                            };
                          }else{
                            if(_.isEmpty(selectedValues)){
                              _filter={
                                op:'eq',
                                value:''
                              };
                            }else{
                              _filter={
                                op:'in',
                                value:selectedValues
                              };
                            }
                          }
                        }else{
                          if(showOthers&&selectedValues[0]==optionsUtils.othersTag){
                            _filter={
                              op:'like',
                              value:`%${selectedValues[0]}%`
                            };
                          }else{
                            _filter={
                              op:'eq',
                              value:selectedValues[0]
                            };
                          }
                        }
                        context.grid.filtersFromColumnHeader[col.key]=_filter;
                        //重新加载数据
                        context.grid.$refs.listInst.doReload(true);
                    };
    let options=metaField.inputTypeParams&&metaField.inputTypeParams["options"],_filters=[]; 
    _.each(options,opt=>{
      _filters.push({
        label:opt.text,
        value:opt.id
      });
    });
    if(showOthers){
      let othersText=metaField.inputTypeParams&&metaField.inputTypeParams.othersText;
      _filters.push({
        label:othersText||optionsUtils.othersText,
        value:optionsUtils.othersTag
      });
    }
    col.filters=_filters;
    col.render = renderManager.renderForCommon(context,metaField);
  } else {
    if (controlTypeService.isPictureUpload(metaField.inputType)) {
      col.render = renderManager.renderForPictureUpload(context,metaField);
    } else if (controlTypeService.isFileUpload(metaField.inputType)) {
      col.render = renderManager.renderForFileUpload(context,metaField);
    } else if(controlTypeService.isPassword(metaField.inputType)) {
      col.render = renderManager.renderForPassword(context,metaField);
    } else if (metaField.name&&metaField.name.indexOf('.')>0) {
      let targetField=setRelationFieldColumnTitle(context,col);
      col.render = renderManager.renderForRelationField(context,metaField,col,targetField);
    } else {
      col.render = renderManager.renderForCommon(context,metaField,initialCol);
    }
  }
  return col;
}
function setRelationFieldColumnTitle(context,column){
  if(column.title){
      return;
  }
  let names=column.key.split('.');
  let relationName=names[0];
  let targetEntityField=names[1];
  let metaEntity=context.grid&&context.grid.metaEntity;
  let r=metaEntity&&metaEntity.relations[relationName];
  if(r&&r.targetEntity){
      let targetEntity=metabase.findMetaEntity(r.targetEntity);
      let targetField=targetEntity&&targetEntity.findField(targetEntityField);
      column.title=targetField&&targetField.title;
      return targetField;
  }
  return null;
}

function buildInnerColumns(columns,metaEntityObj,context){
  var _cols=[];
  _.each(columns,function(col){
    if(_.isString(col)){
      col={key:col};
    }
    var metaParams=col.metaParams ||{};
    var _col=_.omit(col,["metaParams"]);
    var metaField={name:_col.key};
    if(metaEntityObj!=null){
      //这里如果字段不存在，还是附加name属性，以处理relation.fieldName列渲染
      metaField=metaEntityObj.findField(_col.key) || {name:_col.key};
    }
    metaField=_.extend(metaField,metaParams);
    var defaultCol=metaFieldToCol(context,metaField,_col);
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
    //这里注意一下，如果指定了只显示maxColumnsSize个列，其他列将忽略
    if(grid.maxColumnsSize>0&&defaultFormFields.length>=grid.maxColumnsSize){
      defaultFormFields=defaultFormFields.slice(0,grid.maxColumnsSize);
    }
    _.each(defaultFormFields,function(fieldName){
      _cols.push({key:fieldName});
    });
  }else{
    _cols=grid.innerColumns;
  }
  var __cols=[];
  var defaultAlign='center';
  //开启了列展开功能
  if(grid.expand){
    let expandCol={
      type: 'expand',
      key:'__expand__',
      width: 30,
      align: defaultAlign
    };
    __cols.push(expandCol);
  }
  let indexCol=null,selectionCol=null;
  //序号列
  if(grid.showIndex) {
    indexCol={
      type: 'index',
      key:'__index__',
      width: 50,
      align: defaultAlign
    };
    if(grid.indexColumnFixed){
      indexCol.fixed=grid.indexColumnFixed;
    }
  }
  //多选框列
  if(grid.showSelection){
    selectionCol={type: 'selection',key:'__selection__',width:50,align:defaultAlign};
    if(grid.selectionColumnFixed){
      selectionCol.fixed=grid.selectionColumnFixed;
    }
  }
  //多选列在序号列之前
  if(grid.selectionBeforeIndex){
    if(selectionCol){
      __cols.push(selectionCol);
    }
    if(indexCol){
      __cols.push(indexCol);
    }
  }else{//多选列在序号列之后
    if(indexCol){
      __cols.push(indexCol);
    }
    if(selectionCol){
      __cols.push(selectionCol);
    }
  }
  //行编辑状态显示列显示
  if(grid.showRowStatus){
    let statusCol={metaParams:{type: 'rowStatus'},key:'__rowStatus__',title:'编辑状态',width:90,align:defaultAlign};
    if(grid.statusColumnFixed){
      statusCol.fixed=grid.statusColumnFixed;
    }
    __cols.push(statusCol);
  }

  _cols=__cols.concat(_cols);
  //如果操作列不和标题列合并，并且定义了单行操作，默认最后一列为操作列
  if(!grid.operationsWithTitleColumn&&!_.isEmpty(grid.innerToolbar.singleBtns)){
    var colWidth=Math.max(grid.innerToolbar.singleBtns.length*45,95);
    let operationCol={
      title:"操作",
      key:"__operation_column__",
      width:colWidth,
      align:defaultAlign,
      metaParams:{
        type:"operation"
      }
    };
    if(grid.operationColumnFixed){
      operationCol.fixed=grid.operationColumnFixed;
    }
    _cols.push(operationCol);
  }
  //如果元数据信息存在，用metaField初始化列，操作列也要转化成render列
  _cols=buildInnerColumns(_cols,metaEntityObj,context);
  grid.innerColumns=_cols;
}
export default{
  initColumns:initColumns,
}



