import constants from '../../js/constants';
import context from '../../../../libs/context';
function getUserIdField(){
    return context.getSettings().control.userSelect.idField;
};
function getUserTitleField(){
    return context.getSettings().control.userSelect.nameField;
};
function getUserLoginField(){
    return context.getSettings().control.userSelect.loginField;
};
function getUserExpand(){
    return context.getSettings().control.userSelect.expand;
};
function getUserOrgField(){
    return context.getSettings().control.userSelect.orgField;
};
function getOrgIdField(){
    return context.getSettings().control.orgSelect.idField;
};
function getOrgParentField(){
    return context.getSettings().control.orgSelect.parentField;
};
function getOrgTitleField(){
    return context.getSettings().control.orgSelect.nameField;
};
function getUserFilters(){
    return context.getSettings().control.userSelect.filters;
}
function getOrgFilters(){
    return context.getSettings().control.orgSelect.filters;
}
var orgResource=null;
function orgService(){
    if(!orgResource){
        let orgUrl=constants.paths().orgApiUrl;
        orgResource= context.buildResource(orgUrl);
    }
    return orgResource;
};
var userResource=null;
function userService(){
    if(!userResource){
        let userUrl=constants.paths().userApiUrl;
        userResource=context.buildResource(userUrl);
    }
    return userResource;
};
function rebuildOrgFilters(_filters){
    let orgFilters=getOrgFilters();
    if(orgFilters){
        if(_filters){
            _filters=`${_filters} and (${orgFilters})`;
        }else{
            return orgFilters;
        }
    }
    return _filters;
}
//查询根部门
function queryRootOrg(){
    let _filters=rebuildOrgFilters(`${getOrgParentField()} is null`);
    return orgService().query({filters:_filters}).then(({data})=>{
        return data;
    });
}
//查询子部门
function queryOrgByParent(parentId){
    let _filters=rebuildOrgFilters(`${getOrgParentField()} eq ${parentId}`);
    return orgService().query({filters:_filters}).then(({data})=>{
        return data;
    });
}
//关键字查询部门
function queryOrgByKeyword(keyword,orgIds){
    let _filters=rebuildOrgFilters(`${getOrgTitleField()} like '%${keyword}%'`);
    var one = orgService().query({filters:_filters});
    return new Promise((resolve,reject)=>{
        one.then(({data:dataOne})=>{
            if(!_.isEmpty(orgIds)){
                let inIds=context.buildLeapIn(orgIds);
                orgService().query({filters:`${getOrgIdField()} in ${inIds}`}).then(({data:dataTwo})=>{
                    resolve(concatIgnoreDuplicated(dataOne,dataTwo,getOrgIdField()));
                },()=>{
                    reject();
                });
            }else{
                resolve(dataOne);
            }
        },()=>{
            reject();
        });
    });
}
//查询指定ids的部门
function queryOrgByIds(orgIds){
    let inIds=context.buildLeapIn(orgIds);
    return orgService().query({filters:`${getOrgIdField()} in ${inIds}`}).then(({data})=>{
        return data;
    });
}
//合并两个数组，并根据userId去重
function concatIgnoreDuplicated(firstArray,secondArray,key){
    key=key||getUserIdField();
    firstArray=firstArray||[];
    secondArray=secondArray||[];
    var firstMap=_.keyBy(firstArray,o=>{
        return o[key];
    });
    _.each(secondArray,o=>{
        if(!firstMap[o[key]]){
            firstArray.push(o);
        }
    });
    return firstArray;
}
function rebuildUserFilters(_filters){
    let userFilters=getUserFilters();
    if(userFilters){
        if(_filters){
            _filters=`${_filters} and (${userFilters})`;
        }else{
            return userFilters;
        }
    }
    return _filters;
}
function buildUserSelectFields(){
    return `${getUserIdField()},${getUserTitleField()},${getUserLoginField()},${context.getSettings().control.userSelect.detailFields}`;
}
function rebuildUserQueryOptions(queryOptions){
    let expand=getUserExpand();
    if(expand){
        queryOptions.expand=expand;
    }
    let selectFields=buildUserSelectFields();
    queryOptions.select=selectFields;
}
//关键字查询用户,如果userIds不为空，需要附加userIds代表的用户
function queryUserByKeyword(keyword,userIds){
    let _filters=rebuildUserFilters(`${getUserTitleField()} like '%${keyword}%'`);
    let queryOptions={filters:_filters};
    rebuildUserQueryOptions(queryOptions);
    var one = userService().query(queryOptions);
    return new Promise((resolve,reject)=>{
        one.then(({data:usersOne})=>{
            if(!_.isEmpty(userIds)){
                let inIds=context.buildLeapIn(userIds);
                userService().query({filters:`${getUserIdField()} in ${inIds}`}).then(({data:usersTwo})=>{
                    //usersTwo如果包含在usersOne中，去重
                    resolve(concatIgnoreDuplicated(usersOne,usersTwo));
                },()=>{
                    reject();
                });
            }else{
                resolve(usersOne);
            }
        },()=>{
            reject();
        });
    });
}
//查询指定ids的用户
function queryUserByIds(userIds){
    let inIds=context.buildLeapIn(userIds);
    let queryOptions={filters:`${getUserIdField()} in ${inIds}`};
    rebuildUserQueryOptions(queryOptions);
    return userService().query(queryOptions).then(({data})=>{
        return data;
    });
}
//按部门分页搜索用户
function pageQueryUserByOrg(orgIds,userIds,pageParams){//{page:1,pageSize:10}
    var filters='';
    if(!_.isEmpty(orgIds)){
        let inIds=context.buildLeapIn(orgIds);
        filters=`${getUserOrgField()} in ${inIds}`;
    }
    filters=rebuildUserFilters(filters);
    let queryOptions={total:true,page:pageParams.page,page_size:pageParams.pageSize,filters:filters};
    rebuildUserQueryOptions(queryOptions);
    var one = userService().query(queryOptions);
    return new Promise((resolve,reject)=>{
        one.then(res=>{
            var total=_.toSafeInteger(res.headers['x-total-count'])||res.data.length;
            var usersOne=res.data;
            if(!_.isEmpty(userIds)){
                let inIds=context.buildLeapIn(userIds);
                let _queryOptions={filters:`${getUserIdField()} in ${inIds}`};
                rebuildUserQueryOptions(_queryOptions);
                userService().query(_queryOptions).then(({data:usersTwo})=>{
                    //usersTwo如果包含在usersOne中，去重
                    resolve({
                        data:concatIgnoreDuplicated(usersOne,usersTwo),
                        total:total
                    });
                },()=>{
                    reject();
                });
            }else{
                resolve({
                    data:usersOne,
                    total:total
                });
            }
        },()=>{
            reject();
        });
    });
}
//关键字分页搜索用户
function pageQueryUserByKeyword(queryKeyword,userIds,pageParams){//{page:1,pageSize:10}
    var filters=`${getUserTitleField()} like '%${queryKeyword}%'`;
    filters=rebuildUserFilters(filters);
    let queryOptions={total:true,page:pageParams.page,page_size:pageParams.pageSize,filters:filters};
    rebuildUserQueryOptions(queryOptions);
    var one = userService().query(queryOptions);
    return new Promise((resolve,reject)=>{
        one.then(res=>{
            var total=_.toSafeInteger(res.headers['x-total-count'])||res.data.length;
            var usersOne=res.data;
            if(!_.isEmpty(userIds)){
                let inIds=context.buildLeapIn(userIds);
                let _queryOptions={filters:`${getUserIdField()} in ${inIds}`};
                rebuildUserQueryOptions(_queryOptions);
                userService().query(_queryOptions).then(({data:usersTwo})=>{
                    //usersTwo如果包含在usersOne中，去重
                    resolve({
                        data:concatIgnoreDuplicated(usersOne,usersTwo),
                        total:total
                    });
                },()=>{
                    reject();
                });
            }else{
                resolve({
                    data:usersOne,
                    total:total
                });
            }
        },()=>{
            reject();
        });
    });
}
export default{
    queryRootOrg,
    queryOrgByParent,
    queryOrgByKeyword,
    queryOrgByIds,
    queryUserByKeyword,
    queryUserByIds,
    pageQueryUserByOrg,
    pageQueryUserByKeyword
}