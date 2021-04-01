<template>
    <div class="password-con">
        <template v-if="viewMode">
                <div class="form-item-view">
                    <Icon v-if="textShowed" type="ios-eye-off" slot="suffix" @click="hideText"/>
                    <Icon v-else type="ios-eye" slot="suffix" @click="showText"/>
                    <span v-if="textShowed" :title="valueObj">{{valueObj}}</span>
                    <span v-else>********</span>
                </div>
        </template>
        <template v-else>
            <template v-if="formItem.componentParams.showBtn">
                <div class="bvue-select-wrapper bvue-select-group bvue-select-with-append" style='line-height:30px;'>
                    <Input ref="focusInput" autocomplete="off" v-if="textShowed" v-model="valueObj" @input="updateValue"  :disabled="disabled" type="text"  :placeholder="formItem.componentParams.placeholder">
                        <Icon type="ios-eye-off" slot="suffix" @click="hideText"/>
                    </Input>
                    <Input ref="focusInput" autocomplete="off" v-if="!textShowed" v-model="valueObj" @input="updateValue"  :disabled="disabled" type="password"  :placeholder="formItem.componentParams.placeholder">
                        <Icon type="ios-eye" slot="suffix" @click="showText"/>
                    </Input>
                    <Button class="bvue-select-group-append" type="default" @click="updateSecret()">更新</Button>
                </div>
            </template>
            <template v-else>
                <Input ref="focusInput" autocomplete="off" v-if="textShowed" v-model="valueObj" @input="updateValue"  :disabled="disabled" type="text"  :placeholder="formItem.componentParams.placeholder">
                    <Icon type="ios-eye-off" slot="suffix" @click="hideText"/>
                </Input>
                <Input ref="focusInput" autocomplete="off" v-if="!textShowed" v-model="valueObj" @input="updateValue"  :disabled="disabled" type="password"  :placeholder="formItem.componentParams.placeholder">
                    <Icon type="ios-eye" slot="suffix" @click="showText"/>
                </Input>
            </template>
        </template>
    </div>
</template>
<script>
import controlBase from '../js/control_base';
import globalContext from '../../../libs/context';
export default {
    mixins: [controlBase],
    props: {
        "value":{
            type:String
        }
    },
    data: function(){
        return {
            valueObj:this.value,
            textShowed:false
        };
    },
    watch:{
      "value":function (newV,oldV) {
          this.valueObj=newV;
      }
    },
    mounted:function(){
        
    },
    methods: {
        updateValue: function ($event) {
            this.$emit('input',this.valueObj);
        },
        showText(){
            this.textShowed=true;
        },
        hideText(){
            this.textShowed=false;
        },
        updateSecret(){
            var length=(this.formItem.componentParams.limitLength&&this.formItem.componentParams.limitLength.max)||20;
            var randomStr=globalContext.getMvueToolkit().utils.randomString(length);
            this.valueObj=randomStr;
            this.updateValue();
        }
    }
}
</script>


