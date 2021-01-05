<template>
  <Form ref="advanceSearchForm" @submit.native.prevent
      :model="model" 
      label-position="right" 
      :label-width="120">
      <Row v-if="connectKeyword">
          <i-col span="24">
              <FormItem label="关键字" v-if="quicksearch&&quicksearch.fields">
                  <Input v-model="innerQuicksearchKeyword" :placeholder="quicksearch.placeholder"></Input>
              </FormItem>
          </i-col>
      </Row>
      <m-layout :layout="layout"></m-layout>
      <slot name="footer"></slot>
  </Form>
</template>
<script>
import controlTypeService from '../../form/js/control_type_service';
import optionsUtils from '../../../libs/metadata/options-utils';
import baseProps from './base-props';
export default {
  mixins:[baseProps],
  watch:{
    quicksearchKeyword:function(){
      this.innerQuicksearchKeyword=this.quicksearchKeyword;
    }
  },
  data(){
    var metaEntity=this.$metaBase.findMetaEntity(this.entityName);
    var _model={};
    let defaultJoins=this.getGridDefaultJoins();
    let allSearchFields=[];
    let joinMapping={};
    let layout=this.preprocess(this.advanceSearchFields,joinMapping,_model,allSearchFields,defaultJoins);
    //如果外部传入了vuex存入的初始查询model或者默认查询条件，替换之
    if(this.initModel){
      _.forIn(this.initModel,(value,key)=>{
        if(_model.hasOwnProperty(key)){
          _model[key]=value;
        }
      });
    }
    return {
        model:_model,
        metaEntity:metaEntity,
        innerQuicksearchKeyword:this.quicksearchKeyword,
        joinMapping:joinMapping,
        defaultJoins:defaultJoins,
        allSearchFields:allSearchFields,
        layout:layout
    }
  },
  mounted(){
    if(this.searchWhenMounted){
      this.doSearch();
    }
  },
  methods:{
    inputType(key,metaEntity){
        let mapping={};
        //日期时间都转成时间范围查询
        mapping[controlTypeService.componentTypes.DateTime.id]=controlTypeService.componentTypes.DateTimeRange.id;
        mapping[controlTypeService.componentTypes.Date.id]=controlTypeService.componentTypes.DateRange.id;
        mapping[controlTypeService.componentTypes.Time.id]=controlTypeService.componentTypes.TimeRange.id;
        //单选框都变成多选框，用in查询
        let multiSelectId=controlTypeService.componentTypes.MultiSelect.id;
        mapping[controlTypeService.componentTypes.RadioButton.id]=multiSelectId;
        mapping[controlTypeService.componentTypes.SingleSelect.id]=multiSelectId;
        //数字都变成可选比较运算符的组件
        let advNumberId=controlTypeService.componentTypes.AdvNumber.id;
        mapping[controlTypeService.componentTypes.Number.id]=advNumberId;
        mapping[controlTypeService.componentTypes.NumberInput.id]=advNumberId;

        var metaField=metaEntity.findField(key);
        //开启了其他选项的，切换成checkbox
        let showOthers=metaField.inputTypeParams&&metaField.inputTypeParams.showOthers;
        if(mapping[metaField.inputType]){
            if(showOthers){
                return controlTypeService.componentTypes.CheckboxGroup.id;
            }
            return mapping[metaField.inputType];
        }
        return metaField.inputType;
    },
    doReset(){
        _.each(this.allSearchFields,f=>{
            this.model[f]=null;
        });
        this.innerQuicksearchKeyword="";
        this.doSearch();
    },
    addFilters(key,value,inputType,advanceSearchFilters,metaField){
        //文本类型查询条件用like
        let textMapping={};
        textMapping[controlTypeService.componentTypes.MultiLineText.id]=true;
        textMapping[controlTypeService.componentTypes.SingleLineText.id]=true;
        //日期时间类型查询条件用范围
        let dateMapping={};
        dateMapping[controlTypeService.componentTypes.DateTime.id]=true;
        dateMapping[controlTypeService.componentTypes.Date.id]=true;
        dateMapping[controlTypeService.componentTypes.Time.id]=true;
        //单选项类型查询条件用in
        let singleSelectMapping={};
        singleSelectMapping[controlTypeService.componentTypes.RadioButton.id]=true;
        singleSelectMapping[controlTypeService.componentTypes.SingleSelect.id]=true;
        //数组类型引用数据查询用or like
        let arrayRefMapping={};
        arrayRefMapping[controlTypeService.componentTypes.MultiUserSelect.id]=true;
        arrayRefMapping[controlTypeService.componentTypes.MultiOrgSelect.id]=true;
        arrayRefMapping[controlTypeService.componentTypes.MultiRefEntity.id]=true;
        arrayRefMapping[controlTypeService.componentTypes.MultiSelect.id]=true;

        if(textMapping[inputType]){
            advanceSearchFilters.push({
                key:key,
                op:"like",
                value:`%${value}%`
            });
        }else if(dateMapping[inputType]){
            //对于日期自动转成范围查询
            advanceSearchFilters.push({
                key:key+'1',
                mappingKey:key,
                op:"ge",
                value:value[0]
            });
            advanceSearchFilters.push({
                key:key+'2',
                mappingKey:key,
                op:"le",
                value:value[1]
            });
        }else if(singleSelectMapping[inputType]){
            if(!_.isEmpty(value)){
                //开启了其他选项的，查询用like
                let showOthers=metaField.inputTypeParams&&metaField.inputTypeParams.showOthers;
                if(showOthers){
                    let _value=[];
                    _.forEach(value,v=>{
                        if(_.startsWith(v,optionsUtils.othersTag)){
                            let _v=v.substring(optionsUtils.othersTag.length);
                            _value.push(`%${optionsUtils.othersTag}%${_v}%`);
                        }else{
                            _value.push(`%${v}%`);
                        }
                    })
                    advanceSearchFilters.push({
                        key:key,
                        op:"like",
                        value:_value
                    });
                }else{
                    advanceSearchFilters.push({
                        key:key,
                        op:"in",
                        value:value
                    });
                }
            }
        }else if(arrayRefMapping[inputType]){
            if(!_.isEmpty(value)){
                advanceSearchFilters.push({
                    key:key,
                    op:"co",
                    value:value
                });
            }
        }else if(_.isPlainObject(value)
            && value.hasOwnProperty('op')
            && value.hasOwnProperty('value')){//数字转范围查询
            if(value.op==='range'){
              let valueArray=_.split(value.value,/[\s|,]/);
              if(valueArray){
                    let geValue=_.toNumber(valueArray[0]);
                    if(_.isNaN(geValue)){
                        return false;
                    }
                    if(valueArray.length>1){
                        let leValue=_.toNumber(valueArray[1]);
                        if(_.isNaN(leValue)){
                            return false;
                        }
                        advanceSearchFilters.push({
                            key:key+'1',
                            mappingKey:key,
                            op:'ge',
                            value:geValue
                        });
                        advanceSearchFilters.push({
                            key:key+'2',
                            mappingKey:key,
                            op:'le',
                            value:leValue
                        });
                    }else if(valueArray.length===1){
                        advanceSearchFilters.push({
                            key:key,
                            op:'ge',
                            value:geValue
                        });
                    }
                }
            }else{
                let _value=_.toNumber(value.value);
                if(_.isNaN(_value)){
                    return false;
                }
                advanceSearchFilters.push({
                    key:key,
                    op:value.op,
                    value:_value
                });
            }
        }else{
            advanceSearchFilters.push({
                key:key,
                op:"eq",
                value:value
            });
        }
        return true;
    },
    getGridDefaultJoins(){
        if(this.queryOptions&&this.queryOptions.joins){
            let defaultJoins=this.queryOptions.joins;
            let defaultJoinsArray=defaultJoins.split(',');
            let defaultJoinsMap={};
            _.forEach(defaultJoinsArray,dj=>{
                let djArray=dj.split(' ');
                let key=djArray[0],value=djArray[1];
                defaultJoinsMap[key]=value;
            });
            return defaultJoinsMap;
        }
        return {};
    },
    doSearch(){
        var advanceSearchFilters=[];
        let _joins={};
        let isValid=true;
        _.forIn(this.model,(value,key)=>{
          let hasValue=false;
          if(_.isArray(value)){
            hasValue=!_.isEmpty(value);
          }else{
            hasValue=!_.isNil(value)&&value!=='';
          }
          if(this.joinMapping[key]){//关系字段join
            let joinMapping=this.joinMapping[key];
            if(hasValue){
                _joins[joinMapping.relationName]=joinMapping;
                let metaField=joinMapping.metaEntity.findField(joinMapping.fieldName);
                let inputType=metaField.inputType;
                let res=this.addFilters(`${joinMapping.alias}.${joinMapping.fieldName}`,value,inputType,advanceSearchFilters,metaField);
                if(!res){
                    isValid=false;
                    return false;
                }
            }
          }else if(hasValue){//当前实体字段构成的查询条件
            let metaField=this.metaEntity.findField(key);
            let inputType=metaField.inputType;
            let res=this.addFilters(key,value,inputType,advanceSearchFilters,metaField);
            if(!res){
                isValid=false;
                return false;
            }
          }
        });
        if(!isValid){
            return;
        }
        let joinsArray=[],joins=null;
        if(!_.isEmpty(_joins)){
            _.forIn(_joins,(v,k)=>{
                //如果grid的queryOptions定义了同样的join这里不再添加
                if(!this.defaultJoins[k]){
                    joinsArray.push(`${k} ${k}`);
                }
            });
            if(!_.isEmpty(joinsArray)){
                joins=joinsArray.join(',');
            }
        }
        this.$emit("on-advance-search",advanceSearchFilters,this.innerQuicksearchKeyword,joins,this.connectKeyword);
    },
    preprocess(_layout,_joinMapping,_model,allSearchFields,defaultJoins){
        var processedSettings=[];
        _.forEach(_layout,(rowItem)=>{
            if(!_.isArray(rowItem)){
                var component=this.processItem(rowItem,_joinMapping,_model,allSearchFields,defaultJoins);
                processedSettings.push(component);
                return;
            }
            var row=[];
            processedSettings.push(row);
            _.forEach(rowItem,(colItem)=>{
                if(_.isArray(colItem)){
                    row.push(this.preprocess(colItem,_joinMapping,_model,allSearchFields,defaultJoins));
                    return ;
                }
                var component=this.processItem(colItem,_joinMapping,_model,allSearchFields,defaultJoins);
                row.push(component);
            });
        });
        return processedSettings;
    },
    processItem:function(item,_joinMapping,_model,allSearchFields,defaultJoins){
        //处理["name","title"]写法的字段布局
        let _item=null;
        if(_.isString(item)){
            _item = {
                name:item
            }
        }else{
            if(_.has(item,"value")){
                item["name"]=item["value"];
                delete item["value"];
            }
            _item=item;
        }
        _item.ctype='m-field';
        let asf=_item.name;
        var metaEntity=this.$metaBase.findMetaEntity(this.entityName);
        //关系字段用join
        if(asf.indexOf('.')>0){
            let names=asf.split('.');
            let expandField=names[0], refField=names[1];
            let metaField=metaEntity.findField(expandField);
            let relation=null;
            if(!metaField){
                let relations=metaEntity.relations;
                relation=relations[expandField];
            }else{
                relation=metaField.manyToOneRelation;
            }
            if(relation){
                let targeMetaEntity=this.$metaBase.findMetaEntity(relation.targetEntity);
                let _key=asf.replace('.','-');
                _model[_key]=null;
                //解析出来的字段加入到allSearchFields中
                allSearchFields.push(_key);
                let refMetaField=targeMetaEntity.findField(refField);
                _item=_.extend({
                    title:`[${targeMetaEntity.title}]${refMetaField.title}`,
                    inputType:this.inputType(refField,targeMetaEntity)
                },_item,{
                    key:_key,
                    entityName:relation.targetEntity,
                    name:refField
                });
                _joinMapping[_key]={
                    relationName:relation.name,
                    alias:defaultJoins[relation.name]||relation.name,
                    metaEntity:targeMetaEntity,
                    fieldName:refField
                }
            }
        }else{//当前实体字段拼filters条件
            let mField=metaEntity.findField(asf);
            if(mField){
                _model[asf]=null;
                //解析出来的字段加入到allSearchFields中
                allSearchFields.push(asf);
                _item=_.extend({
                    inputType:this.inputType(asf,metaEntity)
                },_item,{
                    key:asf,
                    entityName:this.entityName,
                    name:asf
                });
            }
        }
        //忽略字段的自动readonly等mode设置
        _item.ignoreAutoMode=true;
        //忽略字段描述
        _item.ignoreDescription=true;
        _item.propName=_item.key;
        _item.model=_model;
        delete _item.key;
        return _item;
    }
  }
}
</script>

