<template>
    <div :style="{width:formItem.componentParams.width+'%'}">
        <div v-if="formItem.componentParams.layout===controlTypeService.componentLayout.vertical" class="form-group" :class="{'ivu-form-item-required':formItem.componentParams.required}">
            <label class="ivu-form-item-label" v-text="formItem.componentParams.title"></label>
            <DatePicker transfer
            v-model="valueObj" 
            @on-change="handleChange"
             style="width:100%;display:block;" :disabled="disabled" type="datetimerange" :format="dateTimeFormat" :placeholder="formItem.componentParams.placeholder"></DatePicker>
            <span class="colorRed" v-show="validator&&validator.errorBag&&validator.errorBag.has(formItem.dataField)">{{ validator&&validator.errorBag&&validator.errorBag.first(formItem.dataField) }}</span>
            <p class="colorGrey" v-show="formItem.componentParams.description" v-text="formItem.componentParams.description"></p>
        </div>
        <div v-if="formItem.componentParams.layout===controlTypeService.componentLayout.horizontal" class="form-horizontal">
            <div class="form-group" :class="{'ivu-form-item-required':formItem.componentParams.required}">
                <label v-text="formItem.componentParams.title" class="ivu-form-item-label control-label col-md-2" :style="{width:labelWidth}"></label>
                <div class="col-md-10" :style="{width:controlWidth}">
                    <DatePicker transfer
                    v-model="valueObj" 
                    @on-change="handleChange"
                    style="width:100%;display:block;" :disabled="disabled" type="datetimerange" :format="dateTimeFormat" :placeholder="formItem.componentParams.placeholder"></DatePicker>
                    <span class="colorRed" v-show="validator&&validator.errorBag&&validator.errorBag.has(formItem.dataField)">{{ validator&&validator.errorBag&&validator.errorBag.first(formItem.dataField) }}</span>
                    <p class="colorGrey" v-show="formItem.componentParams.description" v-text="formItem.componentParams.description"></p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
var moment = require('moment'); 
import controlBase from '../js/control_base';
import dateType from '../js/date_type';
export default {
    mixins: [controlBase],
    props: {
        "value":{type:Array,default:null}
    },
    data: function(){
        return {
            valueObj:null
        };
    },
    computed:{
        dateTimeFormat:function(){
            let timePrecision=this.formItem.componentParams.timePrecision;
            if(this.controlTypeService.timePrecision.minute===timePrecision){
                return "yyyy-MM-dd HH:mm";
            }else{
                return "yyyy-MM-dd HH:mm:ss";//moment YYYY-MM-DD HH:mm:ss
            }
        }
    },
    watch:{
        "value":function(newV,oldV){
            var _valueValidPart=this.getValidPart();
            if(!_.isEqual(_valueValidPart,this.valueObj)){
                this.valueObj=_valueValidPart;
                this.$emit("input",_valueValidPart);
            }
        }
    },
    mounted:function(){
        var _valueValidPart=this.getValidPart();
        this.valueObj=_valueValidPart;
    },
    methods:{
        getValidPart:function(){//将传进来的值value转成特定的格式
            //moment format YYYY-MM-DD HH:mm:ss
            let timePrecision=this.formItem.componentParams.timePrecision;
            if(this.value&&this.value.length==2){
                if(!this.value[0]||!this.value[1]){
                    return null;
                }
                let _valueValidPartLeft=dateType.formatDateTime(this.value[0],timePrecision);
                let _valueValidPartRight=dateType.formatDateTime(this.value[1],timePrecision);
                return [_valueValidPartLeft,_valueValidPartRight];
            }
            return null;
        },
        handleChange:function(newDate){//最终都转成完整的日期时间格式
            if(!newDate[0]||!newDate[1]){
                this.$emit("input",null);
                return;
            }
            let timePrecision=this.formItem.componentParams.timePrecision;
            let _dleft=null,_dright=null;
            if(this.controlTypeService.timePrecision.minute===timePrecision){
                _dleft=moment(newDate[0],'YYYY-MM-DD HH:mm');
                _dright=moment(newDate[1],'YYYY-MM-DD HH:mm');
            }else{
                _dleft=moment(newDate[0],'YYYY-MM-DD HH:mm:ss');
                _dright=moment(newDate[1],'YYYY-MM-DD HH:mm:ss');
            }
            this.$emit("input",[_dleft.format('YYYY-MM-DD HH:mm:ss'),_dright.format('YYYY-MM-DD HH:mm:ss')]);
        }
    }
}
</script>
<style lang="scss" scoped>

</style>


