import entityType from './entity_type';
import _types from './_types';

let selectCurrentUserOrgProp={
    id:'selectCurrentUserOrg',
    inputType:_types.inputType.Boolean,
    default:false,
    store:_types.store.MetaFieldInputParams,
    title:'默认查本部门用户'
};
let onlySelectCurrentUserOrgProp={
    id:'onlySelectCurrentUserOrg',
    inputType:_types.inputType.Boolean,
    default:false,
    store:_types.store.MetaFieldInputParams,
    title:'仅查本部门用户'
};
const props={
    SingleUserSelect:_types.merge(_types.placeholder,selectCurrentUserOrgProp,onlySelectCurrentUserOrgProp,_types.defaultValue),
    SingleOrgSelect:_types.merge(_types.placeholder,_types.defaultValue),
    MultiUserSelect:_types.merge(_types.placeholder,selectCurrentUserOrgProp,onlySelectCurrentUserOrgProp),
    MultiOrgSelect:_types.merge(_types.placeholder)
};
var orgUserTypes={
    SingleUserSelect:{ 
        id: "SingleUserSelect", 
        title: "用户单选", 
        icon:"md-contact"
    },
    SingleOrgSelect:{ 
        id: "SingleOrgSelect", 
        title: "部门单选", 
        icon:"ios-git-merge" 
    },
    MultiUserSelect:{ 
        id: "MultiUserSelect", 
        title: "用户多选", 
        icon:"ios-people"
    },
    MultiOrgSelect:{ 
        id: "MultiOrgSelect", 
        title: "部门多选", 
        icon:"ios-git-network"
    }
};
//设置控件属性定义，到控件基础定义上
_.forIn(orgUserTypes,(value,key)=>{
    value.props=props[key];
});

function accept(componentType){
    return !!orgUserTypes[componentType];
}
//componentType对应的可切换的组件集合
function switchableComponents(componentType){
    if(orgUserTypes.SingleUserSelect.id===componentType){
        return [
            {
                id:orgUserTypes.MultiUserSelect.id,
                title:'用户多选'
            }
        ];
    }else if(orgUserTypes.MultiUserSelect.id===componentType){
        return [
            {
                id:orgUserTypes.SingleUserSelect.id,
                title:'用户单选'
            }
        ];
    }else if(orgUserTypes.SingleOrgSelect.id===componentType){
        return [
            {
                id:orgUserTypes.MultiOrgSelect.id,
                title:'部门多选'
            }
        ];
    }else if(orgUserTypes.MultiOrgSelect.id===componentType){
        return [
            {
                id:orgUserTypes.SingleOrgSelect.id,
                title:'部门单选'
            }
        ];
    }
    return false;
}
function formatData(componentType,item,metaField){
    return entityType.formatData(componentType,item,metaField);
}
function formatDataForExport(componentType,item,metaField){
    return formatData(componentType,item,metaField);
}
export default{
    types:orgUserTypes,
    accept:accept,
    switchableComponents:switchableComponents,
    formatData:formatData,
    formatDataForExport
}