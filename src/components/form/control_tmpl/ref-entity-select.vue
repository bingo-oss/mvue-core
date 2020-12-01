<template>
<div>
    <div style="width:20%;position:absolute;z-index:1;right:1px;" :style="{height:modalHeight?(modalHeight+'px'):'100px',overflow:'auto'}">
        <div class="ref-entity-list-header">
            <h4>已选</h4>
        </div>
        <div class="ref-entity-list-body">
            <template v-if="multiple&&selectedItem">
                <Tag color="success" v-for="item in selectedItem" :key="item[getIdField()]" :title="title(item)" closable @on-close="handleTagClose(item)">{{shortTitle(item)}}</Tag>
            </template>
            <Tag color="success" v-if="(!multiple)&&selectedItem" :title="title(selectedItem)">{{shortTitle(selectedItem)}}</Tag>
        </div>
    </div>
    <div style="width:80%;" :style="{height:modalHeight?(modalHeight+'px'):'100px',overflow:'auto'}">
        <Row>
            <Col span="24" style="border-right:1px solid #e8e8e8;">
                <meta-grid v-if="preprocessed" ref="gridList"
                    v-bind="layoutSettings"
                    @on-select-cancel="handleOnSelectCancel"
                    @on-current-change="handleOnCurrentChange"
                    @on-selection-change="handleOnSelectionChange">
                </meta-grid>
            </Col>
        </Row>
    </div>
</div>
</template>
<script>
import refEntitySelect from '../mixins/ref-entity-select';
//import metaLayoutConvertor from '../../meta-layout/layout-convertor';
export default {
    mixins:[refEntitySelect],
    props:{
        formItem:{
            type:Object,
            required:true
        },
        value:{
            type:[Array,Object]
        },
        multiple:{
            type:Boolean,
            default:false
        },
        queryOptions: {
            type:Object
        },
        gridSettings:{//grid的配置
            type:Object
        },
        modalHeight:{
            type:Number
        }
    },
    data(){
        let layoutSettings={
            toolbar:{
                quicksearch:{}
            },
            highlightRow:!this.multiple,
            maxColumnsSize:5,
            showSelection:this.multiple,
            handleOnTitleClick:false,
            entityName:this.formItem.componentParams.entityId,
            queryOptions:this.queryOptions//queryOptions比较常用，暂时保留第一级的属性，直接覆盖
        };
        if(this.gridSettings){
            _.extend(layoutSettings,this.gridSettings);
        }
        let _queryOptions=layoutSettings.queryOptions;
        //如果queryOptions传入了select，columns由select解析构造
        if(_queryOptions){
            if(_queryOptions.select&&(!layoutSettings.columns)){
                let selectArray=_queryOptions.select.split(",");
                let columns=[];
                _.forEach(selectArray,(column)=>{
                    columns.push({key:column});
                });
                layoutSettings["columns"]=columns;
            }
        }
        return {
            layoutSettings,
            preprocessed:false
        };
    },
    watch:{
        selectedItem:function(){
            this.$emit('on-change',this.selectedItem);
        }
    },
    mounted(){
        this.preprocess();
    },
    methods:{
        async preprocess(){
            let metaEntity=this.$metaBase.findMetaEntity(this.entityName);
            //如果外部没有传入grid的配置gridSettings，从后端获取试试
            if(metaEntity.isUIEnable()&&(!this.gridSettings)){
                let settings=await metaEntity.getPage("select");
                //这里对于settings先不做metaLayoutConvertor处理
                if(!_.isEmpty(settings)){
                    // settings= metaLayoutConvertor.convert(settings,this,{isPopup:true});
                    // let _settings=_.extend(this.layoutSettings,settings.layout[0]);
                    // if(_settings.hasOwnProperty('ctype')){
                    //     delete _settings.ctype;
                    // }
                    //this.layoutSettings=_settings;
                    this.layoutSettings=_.extend(this.layoutSettings,settings);
                }
            }
            //默认只显示标题字段
            if(!this.layoutSettings.columns){
                let defaultTitleField=metaEntity.firstTitleField().name;
                this.layoutSettings.columns=[defaultTitleField];
            }
            this.preprocessed=true;
            if(this.shouldInitByIds){
                this.$nextTick(()=>{
                    this.initByIds();
                })
            }
        }
    }
}
</script>
<style lang="less">
.ref-entity-list-header{
    padding: 8px 16px;
    background: #f9fafc;
    color: rgba(0, 0, 0, 0.65);
    border-bottom: 1px solid #e8e8e8;
    overflow: hidden;
    width: 100%;
}
.ref-entity-list-body{
    padding:16px 0px 0px 16px;
}
</style>
