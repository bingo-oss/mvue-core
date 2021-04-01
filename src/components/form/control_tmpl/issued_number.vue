<template>
    <div class="issued-number-con">
        <template v-if="viewMode">
            <div v-text="issuedObject.fullText||emptyText"></div>
        </template>
        <template v-else>
            <div>
                <div class="issued_align">
                    <div class="col-md-3 _p0">
                        <Select align="left" v-if="agencyNeedSelect" v-model="issuedObject.code" :disabled="disabled" @on-change="updateValue">
                            <Option v-for="item in formItem.componentParams.agencyOptions" :key="item" :value="item">{{item}}</Option>
                        </Select>
                        <input class="issued-input" v-else v-model="issuedObject.code" :disabled="disabled" type="text"  @input="updateValue">
                    </div>
                    <div class="col-md-1 issued_align">[</div>
                    <div class="col-md-3" align="left">
                        <input class="issued-input" v-model="issuedObject.year" :disabled="disabled" type="text"  @input="updateValue">
                    </div>
                    <div class="col-md-1 issued_align">]</div>
                    <div class="col-md-3">
                        <input class="issued-input" v-model="issuedObject.number" :disabled="disabled" type="text"  @input="updateValue">
                    </div>
                    <div class="col-md-1 issued_align">号</div>
                </div>
            </div>
            
        </template>
    </div>
</template>
<script>
    import controlBase from '../js/control_base';
    export default {
        mixins: [controlBase],
        props: {
            "value":Object
        },
        data(){
            let issuedObject=this.convertedValue();
            return {
                issuedObject:issuedObject
            };
        },
        computed:{
            agencyNeedSelect(){
                return !_.isEmpty(this.formItem.componentParams.agencyOptions);
            }
        },
        watch:{
            "value":function(newV,oldV){
                if(!_.isEmpty(this.value,this.issuedObject)){
                    this.issuedObject=this.cloneDeep(this.value);
                }
            }
        },
        methods: {
            convertedValue(){
                let issuedObject={
                    fullText:"",
                    code:"",
                    year:"",
                    number:""
                };
                if(this.value){
                    issuedObject=Object.assign(issuedObject,this.value);
                }
                return issuedObject;
            },
            updateValue: function () {
                this.issuedObject.fullText = _.values(this.issuedObject).join("");
                this.$emit('input',_.cloneDeep(this.issuedObject));
            }
        }
    }
</script>


