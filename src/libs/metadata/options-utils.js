const optionTitleKey='text';
const othersTag='__others__#';
const othersText='其他';
/**
 * @param metaField 元数据字段
 * @param optionId 选项id值，也可以为数组，返回数据类型和optionId相同，如果为数组返回数组对应个optionId的text
 */
function getOptionText(metaField,optionId,cascade){
    if(!metaField.inputTypeParams.options){
        console.log(`选项类型字段${metaField.name}:inputTypeParams.options参数未设置`);
        return _.isArray(optionId)?[]:'';
    }
    var initOptions=metaField.inputTypeParams.options;
    var options=_.keyBy(initOptions,opt=>{return opt.id});
    //是否开启了用户自填其他选项
    let showOthers=metaField.inputTypeParams.showOthers;
    let _othersText=metaField.inputTypeParams.othersText||othersText;
    if(_.isNil(optionId)){
        return '';
    }
    if(_.isArray(optionId)){
        let i=0,titles=[],pOptions=options;
        //级联选项，依据optionId的length从children中读取
        if(cascade){
            while(i<optionId.length){
                let _optionId=optionId[i];
                let _title='';
                _title=pOptions[_optionId]&&pOptions[_optionId][optionTitleKey];
                titles.push(_title||'');
                if(pOptions[_optionId].children){
                    let children=pOptions[_optionId].children;
                    pOptions=_.keyBy(children,opt=>{return opt.id});
                }
                ++i;
            }
        }else{//其他多选只有一层，都在第一级读取
            _.each(optionId,id=>{
                var _title='';
                //自定义其他选项特殊处理
                if(showOthers&&_.startsWith(id,othersTag)){
                    _title=id.substring(othersTag.length)||_othersText;
                }else{
                    _title=pOptions[id][optionTitleKey];
                } 
                titles.push(_title||'');
            });
        }
        return titles;
    }else{
        //自定义其他选项特殊处理
        if(showOthers&&_.startsWith(optionId,othersTag)){
            return optionId.substring(othersTag.length)||_othersText;
        }
        return (options[optionId]&&options[optionId][optionTitleKey])||'';
    }
}
export default {getOptionText,othersTag,othersText};