/**
 * 元数据管理
 * Created by fulsh on 2017/12/12.
 */
import controlTypeService from '../../components/form/js/control_type_service';
import context from "../context";
import consts from "../consts";
import MetaEntityCls from "./metaentity";
import metaservice from '../../services/meta/metaservice';

var store=require("store2");


//当前项目的id
var currentProjectId=null;
//当前项目的engine地址
var currentEngineUrl=null;
//所有项目对应的元数据，以项目mbCacheKey存储
var metabases={};

/**
 * 根据项目id构建项目元数据访问的key
 * @param {*} projectId
 */
function mbCacheKey(projectId){
  return projectId?`${projectId}/_mb_`:`_mb_`;
}
/**
 * 根据传入的项目id获取项目元数据
 * @param {*} projectId
 */
function getMetabase(projectId){
  var cacheKey=mbCacheKey(projectId);
  //先从内存获取
  if(metabases[cacheKey]){
    return metabases[cacheKey];
  }
  //再从本地存储获取
  if(store.has(cacheKey)){
    return store.get(cacheKey);
  }
  return null;
}
/**
 * 获取当前项目的swagger地址
 */
function currentSwagger(projectId){
  if(!projectId){
    var swaggerBaseUrl=context.getConfig().getApiBaseUrl();
    currentEngineUrl=context.getConfig().getApiBaseUrl();
    if(!swaggerBaseUrl){
      console.log("提示：apiBaseUrl未配置，暂时无法使用元数据相关功能");
      return Promise.resolve();
    }
    return new Promise(function(reslove,reject){
      var swagger= swaggerBaseUrl+"/swagger.json";
      reslove(swagger);
    });
  }
  var metaserviceUrl=context.getConfig().getMetaserviceUrl();
  if(!metaserviceUrl){
    console.log("提示：service.metabase.endpoint未配置，暂时无法使用元数据相关功能");
    return Promise.resolve();
  }
  return metaservice().getProject({id:projectId}).then(({data})=>{
    if(!data.engine||!data.engine.externalUrl){
      console.log(`项目id为${projectId}的项目engine地址不存在`);
      return null;
    }
    currentEngineUrl=data.engine.externalUrl;
    var swagger=`${data.engine.externalUrl}/swagger.json`;
    return swagger;
  });
}
/**
 * 根据项目id从远程加载项目的元数据信息
 * @param {*} projectId
 * @param {*} forceReload 为true表示强制从远程更新元数据信息
 */
function  initMetabase(projectId,forceReload) {
    currentProjectId = projectId;
    var _metabase = getMetabase(projectId);
    if (_metabase && !forceReload) {//已经在缓存里边存在，不加载
        return Promise.resolve();
    }
    //先通过项目id，查询项目的swagger服务地址，在通过swagger地址获取元数据信息
    return currentSwagger(projectId).then((swagger) => {
        if (!swagger) {
            return;
        }
        return context.getMvueToolkit().http.get(swagger).then(function ({data}) {
            loadMetabase(data, projectId);
            console.log("load metabase from " + swagger);
        }).catch(function (error) {
            if (error.response && error.response.status == 404) {
                alert("加载元数据定义失败，请确认以下配置是否正确：" + swagger);
            } else {
                alert('加载元数据定义失败,' + error.message);
            }
            console.log(error.config);
        });
    });
}

/**
 * 将swagger 转为Metabase
 * @param swagger
 */
function loadMetabase(swagger,projectId){
  var context={
    swagger:swagger
  };
  let xOptionSets=firstNotNaN(swagger["x-option-sets"],{});
  let optionSets={};
  _.forIn(xOptionSets,(optionSet,key)=>{
    optionSets[key.toLowerCase()]=optionSet;
  });
  var options=loadMetaOptions(context,optionSets);
  context["options"]=options;

  var entities={};
  _.forIn(swagger.definitions,function(val,key){
    var isEntity=firstNotNaN(val["x-entity"],true);
    if(!isEntity){
      return;
    }
    var metaEntity=loadMetaEntityFromMode(context,key,val);
    entities[key.toLowerCase()]=metaEntity;
  });
  var metabase={};
  metabase.entities=entities;
  //这里存储原生的options,只是key转成了全小写模式，为了optionSets维护(旧模式存储的是转换后的options，title等丢失了)
  metabase.options=optionSets;
  var cachedKey=mbCacheKey(projectId);
  metabases[cachedKey]=metabase;
  store.set(cachedKey,metabase);
  buildMessages(entities);
}

function loadMetaOptions(context,optionsModel) {
    var options={};
    _.forIn(optionsModel,function(opItem,key){
      var option= optionsConvert(opItem.items,{});
      options[key.toLowerCase()]=option;
    });
    return options;
}
//计算实体是否开启行级权限
function rowSecurityEnabled(model){
  let rs=firstNotNaN(model["x-row-securities"]);
  if(rs){
    return rs.enabled;
  }
  return false;
}
/**
 * 将swagger的model转为MetaEntity
 * @param context
 * @param model
 */
function loadMetaEntityFromMode(context,modelName,model){
  let opt= {
      name: modelName,
      title: model.title,
      rowSecurityEnabled:rowSecurityEnabled(model),
      entityPath: _.trim(firstNotNaN(model["x-entity-path"], ("/"+_.snakeCase(modelName)))),
      ui: (firstNotNaN(model["x-entity-ui"], false)?"conf":"none"),
      remote:firstNotNaN(model["x-remote"], false),
      description: model.description,
      _model: model,
      engineUrl: _.trim(currentEngineUrl, '/'),
      projectId: currentProjectId
  }

  let metaEntity=MetaEntityCls(opt);
    let propertyContext=_.extend({
    metaEntity:metaEntity,
    model:model
  },context);
    let index=0;
    let relations=[];
  _.forIn(model.properties,function (val,key) {
    var isRelation=firstNotNaN(val["x-relation"],false);
    if(isRelation){
      var metaRelation=loadMetaRelationFromProperty(propertyContext,key,val);
      relations.push(metaRelation);
      return;
    }
      let metaField=loadMetaFieldFromProperty(propertyContext,key,val);
    metaField["displayOrder"]=index;
    metaEntity.fields[key]=metaField;
    index++;
  });

  _.forEach(relations,function (metaRelation,i) {
    _.forEach(metaRelation.joinFields,function(joinField,index){
      var relationField=null;
      if(_.isString(joinField)){
        relationField=metaEntity.fields[joinField];
      }
      if(relationField==null && _.isPlainObject(joinField) && !_.isEmpty(joinField["local"])){
        relationField=metaEntity.fields[joinField["local"]];
      }
      if(relationField!=null){
        relationField.isRelationField=true;
        relationField.relations.push(metaRelation);
        if(metaRelation.type==consts.manyToOne){
               relationField.manyToOneRelation=metaRelation;
          relationField.title=_.isUndefined(metaRelation["title"])?relationField.title:metaRelation["title"];
          relationField.description=relationField.title;
          //多对一关系的字段修正为引用实体控件类型
          if(((!relationField.inputType)||
            (relationField.inputType==controlTypeService.componentTypes.RefEntity.id)||
            (relationField.inputType==controlTypeService.componentTypes.SingleLineText.id))){
            relationField.inputType=controlTypeService.componentTypes.RefEntity.id;
          }
        }else if(metaRelation.type==consts.manyToMany && metaRelation.embedded){
            relationField.embeddedRelation=metaRelation;
        }
      }
    });
    metaEntity.relations[metaRelation.name]=metaRelation;
  });
  //初始化实体模型数据
  metaEntity.defaultModel=metaEntity.getDefaultModel();
  return metaEntity;
}

/**
 * 将Property构造成metafield对象
 * @param context
 * @param propertyName
 * @param property
 */
function loadMetaFieldFromProperty(context,propertyName,property){
  var metaField= {
      name: propertyName,
      title: firstNotNaN(property["title"], property["description"], propertyName),
      entityName: context.metaEntity.name,
      published: true,
      summary: property["description"],
      description: property["description"],
      default: property["default"],
      value: property["value"],
      defaultExpr:property["x-default-expr"],
      valueExpr:property["x-value-expr"],
      hasDefault: firstNotNaN(property["x-has-default"], false),
      isSystem: true,
      isDisplay: true,
      displayOrder: 0,
      identity: firstNotNaN(property["x-identity"], false),
      readonly: !!property["readOnly"],
      autoIncrement: false,
      unique: firstNotNaN(property["x-unique"], property["uniqueItems"], false),
      required: firstNotNaN(property["x-required"], false),
      creatable: firstNotNaN(property["x-creatable"], true),
      updatable: firstNotNaN(property["x-updatable"], property["readOnly"], true),
      sortable: firstNotNaN(property["x-sortable"], false),
      filterable: firstNotNaN(property["x-filterable"], false),
      selectable: firstNotNaN(property["x-selectable"], true),
      inputType: property["x-input"],
      inputTypeParams: firstNotNaN(property["x-input-params"], {}),
      semantics: property["x-meaning"],
      isTitleField: "title" === property["x-meaning"],
      maxLength: property["maxLength"],
      minLength: property["minLength"],
      pattern: property["pattern"],
      maximum: property["maximum"],
      minimum: property["minimum"],
      enum: property["enum"],
      type: firstNotNaN(property["type"],getRefTypeName(property["$ref"])),
      itemsType:(property["type"]==="array"?getRefTypeName(property["items"]["$ref"]):null),
      format: property["format"],
      isRelationField: false,
      relations: [],
      _property: property,
      xAttrs: property["x-attrs"] || {}//扩展属性
  };
  //设置inputTypeParams
  fillInputTypeParams(context,metaField,property);
  return metaField;
}
//转换选项集
function optionsConvert(options,metaField){
  let _options=[];
  _.each(options,function (item,index) {
    let _opt={
      id:item.value,
      text:item.title,
      checked:false
    };
    //子选项转换
    if(item.children||item.items){
      _opt.children=optionsConvert(item.children||item.items,metaField);
    }
    _options.push(_opt);
  });
  return _options;
}
/**
 * 设置metaField的inputTypeParams参数
 * @param metaField
 * @param property
 */
function fillInputTypeParams(context,metaField,property) {
  //如果metaField的inputType为空，设置默认
  if(!metaField.inputType){
    let inputType=controlTypeService.getMetaFieldComponentType(metaField);
    metaField.inputType=inputType;
  }
  if(!_.isNaN(property["maxLength"])){
    metaField.inputTypeParams["maxLength"]=property["maxLength"];
    if(metaField.inputType==controlTypeService.componentTypes.SingleLineText.id
        || metaField.inputType==controlTypeService.componentTypes.MultiLineText.id){
        if(property["maxLength"]>50){
            metaField.inputTypeParams["maxLength"]=property["maxLength"]/2;
        }else{
            metaField.inputTypeParams["maxLength"]=property["maxLength"];
        }
    }
  }
  if(!_.isNaN(property["minLength"])){
    metaField.inputTypeParams["minLength"]=property["minLength"];
  }
  if(!_.isNaN(property["pattern"])){
    metaField.inputTypeParams["pattern"]=property["pattern"];
  }
  if(!_.isNaN(property["maximum"])){
    metaField.inputTypeParams["max"]=property["maximum"];
  }
  if(!_.isNaN(property["minimum"])){
    metaField.inputTypeParams["min"]=property["minimum"];
  }
  if(!_.isNaN(property["enum"])){
    metaField.inputTypeParams["enums"]=property["enum"];
  }
  if(!_.isNaN(property["format"])){
    metaField.inputTypeParams["format"]=property["format"];
  }
  if(property["type"]=="array"){
      metaField.inputTypeParams["itemsType"]=getRefTypeName(property["items"]["$ref"]);
  }
  let xOptions=property["x-options"];
  if(xOptions){
    let fieldOption=null;
    if(_.isString(xOptions)){
      let optionSetKey=xOptions.toLowerCase();
      let _fieldOption=context.options[optionSetKey];
      fieldOption=_.cloneDeep(_fieldOption);
      metaField.options=optionSetKey;
    }else{
        if(xOptions.items){
            fieldOption=optionsConvert(xOptions.items);
        }
    }
    if(fieldOption){
        if(metaField.default===fieldOption.value){
            fieldOption.checked=true;
        }
        metaField.inputTypeParams["options"]=fieldOption;
    }
  }
}
/**
 * 根据关系属性构造关系
 * @param context
 * @param propertyName
 * @param property
 */
function loadMetaRelationFromProperty(context,propertyName,property){
  var metaRelation= {
      name: propertyName,
      title: property["title"],
      type: firstNotNaN(property["x-relation-type"], consts.manyToOne),
      sourceEntity: context.metaEntity.name,
      targetEntity: property["x-target-entity"],
      joinEntity: property["x-join-entity"],
      joinFields: property["x-join-fields"],     //[{"local":"updatedBy","target":"userId"}]
      expandable: firstNotNaN(property["x-expandable"], false),
      embedded: firstNotNaN(property["x-embedded"], false),
      _property: property
  };
  if(metaRelation.embedded){
      metaRelation.joinFields=[property["x-embedded-field"]];
  }
  return metaRelation;
}

function buildMessages(entities){
    let messages=context.getConfig("messages");
    if(messages==null){
        messages={};
        context.getConfig()["messages"]=messages;
    }
   _.forIn(entities,entity=>{
       let entityTitleKey=`entity.${entity.name}.title`;
       if(_.has(messages,entityTitleKey)){
           return;
       }
       messages[entityTitleKey]=entity.title;
   });
}


/**
 * 获取第一个非undefined的参数
 */
function firstNotNaN(){
  var reval;
  _.forEach(arguments,function (item,index) {
    if(!_.isUndefined(item)){
      reval=item;
      return false;
    }
  });
  return reval;
}

function getRefTypeName(typeRef) {
    if(typeRef==null || _.isUndefined(typeRef)){
        return null;
    }
    return typeRef.replace("#/definitions/","");
}

export default {
    getMetaBase:function(){
      let metabase = getMetabase(currentProjectId);
      return metabase;
    },
    /**
     * 根据实体名，查询实体
     * @param metaEntityName
     * @returns {*}
     */
    findMetaEntity: function (metaEntityName) {
        if (!metaEntityName) {
            return null;
        }
        var metabase = getMetabase(currentProjectId);
        var metaEntity = metabase.entities[metaEntityName.toLowerCase()];
        if (_.isEmpty(metaEntity)) {
            return null;
        }
        var metaEntityCloned = MetaEntityCls(metaEntity);
        metaEntityCloned.getMetabase = function () {
            return metabase;
        };
        metaEntityCloned.getRaw = function () {
            return metaEntity;
        };
        return metaEntityCloned;
    },
    /**
     * 找到所有对metaEntityName有引用的实体
     * @param metaEntityName
     */
    findSourceEntities: function (target) {
        var metabase = getMetabase(currentProjectId);
        var sourceEntities = [];
        _.forIn(metabase.entities, (metaEntity,key) => {
            var existedRelations = metaEntity.existRelation(target, [consts.manyToOne]);
            if (existedRelations.length == 0) {
                return;
            }
            var metaEntityCloned = MetaEntityCls(metaEntity);
            metaEntityCloned.getMetabase = function () {
                return metabase;
            };
            metaEntityCloned.getRaw = function () {
                return metaEntity;
            };
            sourceEntities.push(metaEntityCloned);
        });
        return sourceEntities;
    },
    /**
     * 获取所有实体
     * @returns {null}
     */
    entities: function () {
        var metabase = getMetabase(currentProjectId);
        return metabase.entities;
    },
    initMetabase: initMetabase,
    currentSwagger: currentSwagger,
    routeForEntityList(entityName, params) {
        var router = {name: 'defaultEntityList', params: {entityName: entityName}};
        if (!_.isEmpty(params)) {
            router.params = _.extend(router.params, params);
        }
        return router;
    },
    routeForEntityCreateForm(entityName, params) {
        var router = {name: 'defaultCreateForm', params: {entityName: entityName}};
        if (!_.isEmpty(params)) {
            router.params = _.extend(router.params, params);
        }
        return router;
    },
    routeForEntityUpdateForm(entityName, id, params) {
        var router = {name: 'defaultEditForm', params: {entityName: entityName, id: id}};
        if (!_.isEmpty(params)) {
            router.params = _.extend(router.params, params);
        }
        return router;
    },
    setEntityNameForRoute(router, entityName) {
        if (_.isEmpty(router)) {
            return;
        }
        router.params["entityName"] = entityName;
    },
    findOptions(name){
        if (!name) {
            return null;
        }
        let metabase = getMetabase(currentProjectId);
        let optionSet = metabase.options[name.toLowerCase()];
        if (_.isEmpty(optionSet)) {
            return null;
        }
        let options= optionsConvert(optionSet.items,{});
        return options;
    }
}
