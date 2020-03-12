var types={
    ObjectEditor:{
        id: "ObjectEditor",
        title: "内嵌JSON",
        icon:"md-list-box",
        validateMethod:true,
        hidden:true,
        class:"has-form-item"//附加到form-item的class样式，has-form-item会对form-item内嵌form-item的标红样式作修正，避免所有控件标红
    },
    MultiObjectEditor:{
        id: "MultiObjectEditor",
        title: "内嵌JSON",
        icon:"md-list-box",
        validateMethod:true,
        hidden:true,
        class:"has-form-item"//附加到form-item的class样式，has-form-item会对form-item内嵌form-item的标红样式作修正，避免所有控件标红
    }
};

var componentParams={
    ObjectEditor:{
        entityName:'',
        layout:[],
        inline:false,
        labelPosition:'right',
        labelWidth:null,
        showMessage:true
    },
    MultiObjectEditor:{
        entityName:'',
        columns:[],
        inline:false,
        labelPosition:'right',
        labelWidth:null,
        showMessage:true
    },
};
function accept(componentType){
    return !!types[componentType];
}
function formatDataForExport(componentType,item,metaField){
    return formatData(componentType,item,metaField);
}
function formatData(componentType,item,metaField){
    let fieldName=metaField.name;
    let origin=item[fieldName];
    if(_.isNil(origin)){
        return "";
    }
    let jsonStr="";
    try{
        jsonStr=JSON.stringify(origin);
    }catch(err){
        console.error(err);
    }
    return jsonStr;
}
export default{
    types:types,
    componentParams:componentParams,
    accept:accept,
    formatData:formatData,
    formatDataForExport:formatDataForExport
}
