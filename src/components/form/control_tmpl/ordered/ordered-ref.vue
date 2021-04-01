<template>
  <div>
    <template v-for="(item,index) in items">
      <Row :key="index" class="orgdered-ref-item">
        <i-col :span="disabled?24:18">
          <ref-input 
            :form-item="formItem"
            :context="context"
            :mode="mode"
            v-model="item.value">
          </ref-input>
        </i-col> 
        <i-col span="4" offset="1" v-if="!disabled">
          <ButtonGroup size="small">
            <Button @click="handleRemove(index)" v-if="index>0" icon="md-trash" title="删除"></Button>
            <Button @click="handleUp(index)" v-if="index>0" icon="md-arrow-round-up" title="上移"></Button>
            <Button @click="handleDown(index)" v-if="index<items.length-1" icon="md-arrow-round-down" title="下移"></Button>
          </ButtonGroup>
        </i-col> 
      </Row>
    </template>
    <Button v-if="!disabled" type="dashed" long @click="handleAdd" icon="md-add">添加</Button>
  </div>
</template>
<script>
const firstNullItem={
  value:null
};
export default {
  components:{
    refInput:require('./ref-input').default
  },
  props:{
    value:{
      type:Array
    },
    formItem:{
      type:Object,
      required:true
    },
    context:{//与上下文相关的对象，{metaEntity:"元数据实体对象",isCreate:true}
      type:Object
    },
    mode:{
      type:String
    },
    disabled:{
      type:Boolean,
      default:false
    }
  },
  data(){
    let items=this.convertedValue();
    return {
      items:items
    };
  },
  watch:{
    value:{
      handler(){
        let items=this.convertedValue();
        if(!_.isEqual(items,this.items)){
          this.items=items;
        }
      },
      deep:true
    },
    items:{
      handler(){
        let value=this.convertedItems();
        if(!_.isEqual(value,this.value)){
          this.$emit('input',value);
        }
      },
      deep:true
    }
  },
  methods:{
    convertedValue(){
      if(!_.isEmpty(this.value)){
        let _items=[];
        _.forEach(this.value,v=>{
          _items.push({
            value:v
          });
        });
        return _items;
      }else{
        return [_.cloneDeep(firstNullItem)];
      }
    },
    convertedItems(){
      let value=[];
      _.forEach(this.items,item=>{
        if(item.value){
          value.push(item.value);
        }
      });
      return value;
    },
    handleAdd(){
      let newItem=_.cloneDeep(firstNullItem);
      this.items.push(newItem);
    },
    handleRemove(index){
      this.items.splice(index,1);
    },
    handleUp(index){
      let temp=this.items[index];
      this.$set(this.items,index,this.items[index-1]);
      this.$set(this.items,index-1,temp);
    },
    handleDown(index){
      let temp=this.items[index];
      this.$set(this.items,index,this.items[index+1]);
      this.$set(this.items,index+1,temp);
    }
  }
}
</script>
