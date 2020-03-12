<template>
  <div>
    <Row>
      <Col span="4" v-for="(metaField,index) in metaFields" :key="'title_'+index"><center>{{metaField.title}}</center></Col>
      <Col span="2"></Col>
    </Row>
    <Row v-for="(entity,rowIndex) in value" :key="'entity'+iterKey+'_'+rowIndex">
    <m-form
            class="m-embedded-json-array"
          :localModel="entity"
            :entityName="metaEntity.name"
            :calc="false"
          :force-view="forceView"
          :inline="formItem.componentParams.inline||false"
          :label-position="'top'"
          :label-width="0"
          :show-message="formItem.componentParams.showMessage||true"
          :autocomplete="formItem.componentParams.autocomplete||'off'">
        <Col span="4" v-for="(metaField,colIndex) in metaFields " :key="'field_'+rowIndex+'_'+colIndex"><center>
          <m-field :name="metaField.name" :showLabel="false"></m-field>
        </center></Col>
        <Col span="2">
          <Button style="margin-left: 5px" type="dashed" icon="md-remove"  @click="handleRemove(rowIndex)" ></Button>
        </Col>
    </m-form>
    </Row>
    <Row>
      <Col>
        <Button long  type="dashed" icon="md-add"  @click="handleAdd" ></Button>
      </Col>
    </Row>
  </div>
</template>
<script>
import controlBase from '../../js/control_base';
import formLayout from '../../mixins/form-layout';
import MForm from "../../metaform";
export default {
  components: {MForm},
  mixins: [controlBase,formLayout],
  props:{
    value:{
      type:Array,
      default:function () {
        return []
      }
    }
  },
  data(){
    let entityName=this.formItem.componentParams.entityName||this.formItem.componentParams.itemsType ;
    let metaEntity=this.$metaBase.findMetaEntity(entityName);
    let columns=this.formItem.componentParams.columns||[];
    if(_.isEmpty(columns)){
      _.forEach(metaEntity.getDefaultFormFields(),(metaFieldName)=>{
        columns.push(metaFieldName);
      });
    }
    let metaFields=this.initMetaFields(columns,metaEntity);
    return {
      isMetaForm:true,
      entityName:entityName,
      metaEntity:metaEntity,
      columns:columns,
      metaFields:metaFields,
      forceView:false,
      innerVal:[],
      iterKey:_.uniqueId()
    };
  },
  watch:{
    "value":function(newV,oldV){
      if(newV==null){
        this.innerVal=[];
        this.onChange();
      }else{
        this.innerVal=newV;
      }
    }
  },
  mounted(){
    if(this.value!=null){
      this.innerVal=this.value;
    }else{
      this.onChange();
    }
  },
  methods:{
    validate(rule, value, callback){
      if(!value){
        callback();
        return;
      }
      if(this.$refs.formRef){
        this.$refs.formRef.validate(valid => {
          if (valid) {
            callback();
          }else{
            callback(new Error(' '));
          }
        });
      }else{
        callback();
      }
    },
    initMetaFields(columns,metaEntity) {
      let fields=[];
      _.forEach(columns,(column)=>{
        let metaField=metaEntity.findField(column);
        fields.push(metaField);
      });
      return fields;
    },
    handleRemove (index) {
      this.innerVal.splice(index, 1); //删除
      this.iterKey=_.uniqueId();
    },
    handleAdd () {
      this.innerVal.push(this.metaEntity.getDefaultModel());
    },
    onChange(){
      this.$emit("input",this.innerVal);
    }
  }
}
</script>
