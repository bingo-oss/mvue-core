<template>
  <component v-if="operation.comImpl" :is="operation.comImpl"
    :multiple="operation.multiple"
    :query-options="operation.queryOptions"
    :grid-settings="operation.gridSettings"
    :btn-title="operation.title"
    :modal-title="operation.modalTitle"
    :btn-type="operation.btnType"
    :btn-icon="operation.btnIcon"
    :params="operation.comParams"
    @on-select-change="confirmSelect">
  </component>
  <m-entity-select v-else
    :entity-name="operation.entityName"
    :multiple="operation.multiple"
    :query-options="operation.queryOptions"
    :grid-settings="operation.gridSettings"
    :btn-title="operation.title"
    :btn-type="operation.btnType"
    :btn-icon="operation.btnIcon"
    @on-select-change="confirmSelect">
  </m-entity-select>
</template>
<script>
import context from '../../libs/context';
export default {
  props:{
    widgetContext:{//由使用操作的部件传入的部件上下文
      type:Object,
      required:true
    },
    operation:{//操作的定义，必传参数
      type:Object,
      required:true
    }
  },
  data(){
    return {
      mustStopRepeatedClick:false//阻止点击操作重复触发
    };
  },
  methods:{
    /**
      submit={
        method:'post',
        url:'',
        fields:[],//指定哪些字段被提交
        wrapperKey:'',
        wrapper:{},
        params:{},//query参数
        success:'',//成功提示
        error:''//错误提示
      }
     */
    confirmSelect(selectedItem){
      if(this.operation.submit&&this.operation.submit.url){
        let req={
          method: this.operation.submit.method||'post',
          url: this.operation.submit.url
        }
        //如果附加了url参数
        if(this.operation.submit.params){
          req.params=this.operation.submit.params;
        }
        let data=null;
        //如果指定提交的字段，提取出来
        if(!_.isEmpty(this.operation.submit.fields)){
          if(_.isArray(selectedItem)){
            data=[];
            _.each(selectedItem,item=>{
              let _d={};
              _.each(this.operation.submit.fields,field=>{
                _d[field]=item[field];
              });
              data.push(_d);
            });
          }else{
            let _d={};
            _.each(this.operation.submit.fields,field=>{
              _d[field]=selectedItem[field];
            })
            data=_d;
          }
        }
        if(!data){
          data=selectedItem;
        }
        //如果提交时需要附加自定义key
        if(this.operation.submit.wrapperKey){
          let _data={};
          _data[this.operation.submit.wrapperKey]=data;
          data=_data;
          //如果提交时需要附加额外数据，添加进来
          if(this.operation.submit.wrapper){
            _.extend(data,this.operation.submit.wrapper);
          }
        }
        req.data=data;
        this.$http(req).then(()=>{
          if(this.operation.submit.success){
            context.success({content:this.operation.submit.success});
          }
          this.widgetContext.grid&&this.widgetContext.grid.reload();
        },(err)=>{
          console.error(err);
          if(this.operation.submit.error){
            context.error({content:this.operation.submit.error});
          }
        });
      }else{
        this.execScript(selectedItem);
      }
    },
    execScript(selectedItem){
      if(!this.operation.onclick){
        return;
      }
      if(this.mustStopRepeatedClick){
        return;
      }
      if(_.isFunction(this.operation.onclick)){
        this.mustStopRepeatedClick=true;
        this.operation.onclick(this.widgetContext,this,selectedItem);
      }else{
        this.mustStopRepeatedClick=true;
        var onclick=Function('"use strict";return ' + this.operation.onclick  )();
        onclick(this.widgetContext,this,selectedItem);
      }
      this.mustStopRepeatedClick=false;
      this.$emit("triggered","script");
    }
  }
}
</script>
