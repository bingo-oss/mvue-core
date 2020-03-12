<template>
    <div>
        <template v-if="viewMode">
            <div class="form-item-view" v-text="valueObj||emptyText" :title="valueObj||emptyText"></div>
        </template>
        <template v-else>
                <TimePicker transfer
                v-model="valueObj"
                type="timerange"
                @on-change="handleChange"
                 :readonly="disabled" :disabled="disabled" :format="timeFormat" :placeholder="formItem.componentParams.placeholder"></TimePicker>
        </template>
    </div>
</template>
<script>
var dayjs = require("dayjs");
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
        timeFormat:function(){
            let timePrecision=this.formItem.componentParams.timePrecision;
            if(this.controlTypeService.timePrecision.minute===timePrecision){
                return "HH:mm";
            }else{
                return "HH:mm:ss";
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
            let timePrecision=this.formItem.componentParams.timePrecision;
            if(this.value&&this.value.length==2){
                if(!this.value[0]||!this.value[1]){
                    return null;
                }
                let _valueValidPartLeft=dateType.formatTime(this.value[0],timePrecision);
                let _valueValidPartRight=dateType.formatTime(this.value[1],timePrecision);
                return [_valueValidPartLeft,_valueValidPartRight];
            }
            return null;
        },
        handleChange:function(newDate){//最终都转成完整的时间格式
            if(!newDate[0]||!newDate[1]){
                this.$emit("input",null);
                return;
            }
            let timePrecision=this.formItem.componentParams.timePrecision;
            var nowDs=dayjs().format('YYYY-MM-DD');
            let _dleft=`${nowDs} ${newDate[0]}`;
            let _dright=`${nowDs} ${newDate[1]}`;
            _dleft=dayjs(_dleft);
            _dright=dayjs(_dright);
            this.$emit("input",[_dleft.format('HH:mm:ss'),_dright.format('HH:mm:ss')]);
        }
    }
}
</script>