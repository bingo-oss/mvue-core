import _types from './_types';
//定义所有辅助组件类型，如文本、分隔线等
const auxiliaryTypes={
    Section:{
        id: "Section", 
        designerId:'m-section',
        title: "分割线", 
        icon:"ios-card",
        props:[
            {
                id:'value',
                inputType:_types.inputType.MultiLineText,
                default:'',
                store:_types.store.Layout,
                title:'文字说明'
            },
            {
                id:'icon',
                inputType:_types.inputType.SingleLineText,
                default:'',
                store:_types.store.Layout,
                title:'图标'
            },
            _types.span
        ]
    },
    Text:{
        id: "Text", 
        designerId:'m-text',
        title: "纯文本", 
        icon:"ios-text",
        props:[
            {
                id:'value',
                inputType:_types.inputType.MultiLineText,
                default:'',
                store:_types.store.Layout,
                title:'文本内容'
            },
            {
                id:'style',
                inputType:_types.inputType.SingleLineText,
                default:'',
                store:_types.store.Layout,
                title:'css样式'
            },
            _types.span
        ]
    }
};
export default auxiliaryTypes