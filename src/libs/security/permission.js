import context from "../context";
import metabase from "../metadata/metabase";

var ops={
    "$op":"",
    "entities":{
        "$entity":{
            "$op":""
        }
    }
};

function getSecurityEndpoint() {
    var baseUrl=context.getMvueToolkit().config.getApiBaseUrl();
    return baseUrl+"/_ops.json";
}

function init() {
    var url=getSecurityEndpoint();
    return Promise.resolve().then(()=>{
        if(context.getMvueToolkit().session.isLogin()){
            return context.getMvueToolkit().http.get(url).then(({data})=>{
                ops=data;
                return ops;
            });
        }
        return null;
    });
}

/**
 * entityOp格式：entityName:operationName
 * @param entityOp
 */
function resolveOpInfo(entityOp) {
    let indexOfSplit=entityOp.indexOf(":");
    if(indexOfSplit<=0){
        return {metaEntity:null,op:entityOp};
    }
    let entityName=entityOp.substring(0,indexOfSplit);
    let op=entityOp.substring(indexOfSplit+1);
    let metaEntity=metabase.findMetaEntity(entityName);
    if(metaEntity==null){
        return {metaEntity:null,op:op};
    }
    return {metaEntity:metaEntity,op:op}
}

function hasPerm(op,metaEntityName) {
    if (_.isEmpty(op)) {
        return true;
    }
    let metaEntity = metabase.findMetaEntity(metaEntityName);
    let opInfo = resolveOpInfo(op);
    if (metaEntity == null) {
        metaEntity = opInfo.metaEntity;
    }
    if (metaEntity == null) {
        return _.has(ops, opInfo.op);
    }

    let entityOps = ops["entities"] && ops["entities"][metaEntity.name];
    if (entityOps == null) {
        return false;
    }
    if (_.has(entityOps, "*")) {
        return true;
    }
    return _.has(entityOps, opInfo.op);
}

/**
 * entityOp格式：entityName:operationName
 */
function resolveNeedRowPerm(entityOp) {
    let opInfo=resolveOpInfo(entityOp);
    let needPerm=[opInfo.op];
    if(opInfo.metaEntity==null){
        return needPerm;
    }

    let entityOps=ops["entities"] && ops["entities"][opInfo.metaEntity.name];
    if(entityOps==null || !_.has(entityOps,"__row_ops__")){
        return needPerm;
    }
    //获取行级权限定义
    let rowOpsDefine=entityOps["__row_ops__"];
    if(!_.has(rowOpsDefine,opInfo.op)){
        return needPerm;
    }
    return rowOpsDefine[opInfo.op];
}


export  default {
    init:function () {
       return init();
    },
    //判断实体是否有read权限
    hasReadPerm:function(entityName){
        let has=hasPerm('find',entityName);
        if(!has){
            return false;
        }
        has=hasPerm('query',entityName);
        if(!has){
            return false;
        }
        return true;
    },
    //实体操作权限判断
    hasPerm:function (op,metaEntity) {
        if(!_.isArray(op)){
            return hasPerm(op,metaEntity);
        }
        var result=true;
        _.forEach(op,p1=>{
            var r=hasPerm(p1,metaEntity);
            if(!r){
                result=false;
                return false;
            }
        });
        return result;
    },
    /**
     * @param perms 单个权限entity:operationName 或 多个权限[entity:operationName,entity:operationName]
     */
    hasPerms(perms){
      if(perms){
        let hasPerm=false;
        if(_.isArray(perms)){
          _.forEach(perms,sec=>{
            hasPerm=this.hasPerm(sec);
            if(!hasPerm){
              return false;
            }
          });
        }else{
          hasPerm=this.hasPerm(perms);
        }
        return hasPerm;
      }else{
        return true;
      }
    },
    /** 行级数据权限判断
     *  @param entityData 实体的一条数据记录
     *  @param ops 需要判断操作名称，如：'edit' 或者 ['edit','create']
     */
    hasRowPerm(entityData,ops){
        let hasPermission=false;
        //
        if(!_.isArray(ops)){
            ops=[ops];
        }
        let permsArray=[];
        _.forEach(ops,op=>{
            let opNeedPerms=resolveNeedRowPerm(op);
            permsArray=permsArray.concat(opNeedPerms);
        });

        if(entityData && entityData["__ops__"]){
            //进行行级数据权限判断
            var itemPermOps=entityData["__ops__"];
            var matched=true;
            _.forEach(permsArray,(needPerm)=>{
                let opMatch=false;
                _.forEach(itemPermOps,(permOp)=>{
                    if(permOp=="*" ||needPerm.toLowerCase()==permOp.toLowerCase()){
                        opMatch=true;
                        return false;
                    }
                });
                if(!opMatch){
                    matched=false;
                    return false;
                }
            });
            hasPermission=matched;
        }else{//没有权限数据，默认为有权限
            hasPermission=true;
        }
        return hasPermission;
    }
}

