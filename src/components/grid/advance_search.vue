<template>
    <div class="grid-advance-search-con">
        <div v-if="toolbarType=='compact'" @click="advanceSearch" class="concat-toolbar-btn"><Icon type="funnel"></Icon>高级</div>
        <Button v-else @click="advanceSearch" type="ghost"><Icon type="funnel"></Icon>高级</Button>
        <div v-show="searchModal" class="ivu-poptip-popper v-transfer-dom" style="width: 400px; position: absolute; right: 215px; top: 5px; transform-origin: right center 0px;text-align:left;" x-placement="left-start">
            <div class="ivu-poptip-content">
                <div class="ivu-poptip-arrow"></div> 
                <div class="ivu-poptip-inner">
                    <div class="ivu-poptip-body">
                        <div class="ivu-poptip-body-content">
                            <div>
                                <div class="ivu-modal-content">
                                    <a href="javascript://" class="ivu-modal-close" @click="cancel"><i class="ivu-icon ivu-icon-ios-close-empty"></i></a>
                                    <div class="ivu-modal-header">
                                        <div class="ivu-modal-header-inner">高级筛选</div>
                                    </div>
                                    <div class="ivu-modal-body" style="padding-left: 0px;padding-right: 0px;">
                                        <div style="height:300px;overflow:auto;padding:0px 10px;">
                                            <div style="width: 100%;">
                                                <div class="form-group">
                                                    <label class="ivu-form-item-label">关键字</label> 
                                                    <input type="text" class="form-control" v-model="innerQuicksearchKeyword"> 
                                                </div>
                                            </div>
                                            <meta-field v-for="key in advanceSearchFields" :key="key" :name="key" v-model="model[key]" :entity-name="entityName" :input-type="inputType(key)">
                                            </meta-field>
                                        </div>
                                    </div>
                                    <div class="ivu-modal-footer">
                                        <Button type="primary" size="small" @click="doSearch">搜索</Button>
                                        <Button type="ghost" size="small" @click="doReset">重置</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!--
        <Poptip v-model="searchModal" placement="left-start" width="400" transfer>
            <div v-if="toolbarType=='compact'" @click="advanceSearch" class="concat-toolbar-btn"><Icon type="funnel"></Icon>高级</div>
            <Button v-else @click="advanceSearch" type="ghost"><Icon type="funnel"></Icon>高级</Button>
            <div slot="content">
                <div class="ivu-modal-content">
                    <div class="ivu-modal-header">
                        <div class="ivu-modal-header-inner">高级筛选</div>
                    </div>
                    <div class="ivu-modal-body" style="padding-left: 0px;padding-right: 0px;">
                        <div style="height:300px;overflow:auto;padding:0px 10px;">
                            <meta-field v-for="key in advanceSearchFields" :key="key" :name="key" v-model="model[key]" :entity-name="entityName" :input-type="inputType(key)">
                            </meta-field>
                        </div>
                    </div>
                    <div class="ivu-modal-footer">
                        <button type="button" class="ivu-btn ivu-btn-text ivu-btn-large" @click="doReset"><span>重置</span></button> 
                        <button type="button" class="ivu-btn ivu-btn-text ivu-btn-large" @click="cancel"><span>取消</span></button> 
                        <button type="button" class="ivu-btn ivu-btn-primary ivu-btn-large" @click="doSearch"><span>搜索</span></button>
                    </div>
                </div>
            </div>
        </Poptip>-->
        <!-- 
        <div v-if="toolbarType=='compact'" @click="advanceSearch" class="concat-toolbar-btn"><Icon type="funnel"></Icon>高级</div>
        <Button v-else @click="advanceSearch" type="ghost"><Icon type="funnel"></Icon>高级</Button>
        <Modal class="search-modal"
            v-model="searchModal"
            width="400"
            title="高级查询"
            :scrollable="true"
            :mask-closable="false"
            >
            <div style="height:350px;overflow:auto;padding:0px 10px;">
                <meta-field v-for="key in advanceSearchFields" :key="key" :name="key" v-model="model[key]" :entity-name="entityName" :input-type="inputType(key)">
                </meta-field>
            </div>
            <div slot="footer">
                <button type="button" class="ivu-btn ivu-btn-text ivu-btn-large" @click="doReset"><span>重置</span></button> 
                <button type="button" class="ivu-btn ivu-btn-text ivu-btn-large" @click="cancel"><span>取消</span></button> 
                <button type="button" class="ivu-btn ivu-btn-primary ivu-btn-large" @click="doSearch"><span>确定</span></button>
            </div>
        </Modal>-->
       
    </div>
</template>
<script>
import controlTypeService from '../form/js/control_type_service';
var utils= require('../../libs/utils');
export default {
    props: {
        "entityName": {
            type: String,
            required: true
        },
        "advanceSearchFields":{
            type:Array,
            require:true
        },
        quicksearchKeyword:{
            type:String
        },
        "toolbarType": {//'compact':紧凑型toolbar布局；不设置用默认toolbar布局
            type: String,
            required: false
        }
    },
    data:function(){
        var metaEntity=this.$metaBase.findMetaEntity(this.entityName);
        return {
            searchModal:false,
            model:{},
            innerAdvanceSearchFilters:_.cloneDeep(this.value),
            metaEntity:metaEntity,
            innerQuicksearchKeyword:this.quicksearchKeyword
        }
    },
    watch:{
        quicksearchKeyword:function(){
            this.innerQuicksearchKeyword=this.quicksearchKeyword;
        }
    },
    methods:{
        inputType(key){
            var metaField=this.metaEntity.findField(key);
            if(metaField.inputType===controlTypeService.componentTypes.DateTime.id){
                return controlTypeService.componentTypes.DateTimeRange.id;
            }else if(metaField.inputType===controlTypeService.componentTypes.Date.id){
                return controlTypeService.componentTypes.DateRange.id;
            }else if(metaField.inputType===controlTypeService.componentTypes.Time.id){
                return controlTypeService.componentTypes.TimeRange.id;
            }
            return null;
        },
        advanceSearch(){
            this.searchModal=!this.searchModal;
        },
        doReset(){
            this.model={};
            this.innerQuicksearchKeyword="";
        },
        cancel(){
            this.searchModal=false;
        },
        doSearch(){
            var advanceSearchFilters=[];
            var _this=this;
            _.each(this.model,function(value,key){
                if(!_.isNull(value)&&value!==""&&!_.isUndefined(value)){
                    let metaField=_this.metaEntity.findField(key);
                    if(metaField.inputType==controlTypeService.componentTypes.MultiLineText.id
                        ||metaField.inputType==controlTypeService.componentTypes.SingleLineText.id
                    ){
                        let _value=utils.leapQueryValueEncode(value);
                        advanceSearchFilters.push({
                            key:key,
                            op:"like",
                            value:`'%${_value}%'`
                        });
                    }else if(metaField.inputType==controlTypeService.componentTypes.DateTime.id
                        ||metaField.inputType==controlTypeService.componentTypes.Date.id){
                        //对于日期自动转成范围查询
                        advanceSearchFilters.push({
                            key:key,
                            op:"ge",
                            value:`'${value[0]}'`
                        });
                        advanceSearchFilters.push({
                            key:key,
                            op:"le",
                            value:`'${value[1]}'`
                        });
                    }else{
                        advanceSearchFilters.push({
                            key:key,
                            op:"eq",
                            value:value
                        });
                    }
                }
            });
            this.$emit("do-advance-search",advanceSearchFilters,this.innerQuicksearchKeyword);
            this.searchModal=false;
        }
    }
}
</script>

<style lang="less" scoped>
.grid-advance-search-con{
    display:inline-block;
}
</style>

