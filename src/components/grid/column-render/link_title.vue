<template>
    <m-field v-if="editRow" :name="metaField.name"></m-field>
    <meta-operation v-else  :operation="btn" :widget-context="getWidgetContext()" class="link-title-opt">
        <Tooltip v-if="initialCol&&initialCol.tooltip" transfer :content="titleValue()" :disabled="!showTooltip" :max-width="300" class="ivu-table-cell-tooltip">
            <a ref="content" @mouseenter="handleTooltipIn" @mouseleave="handleTooltipOut" class="ivu-table-cell-tooltip-content">{{ htmlValue() }}</a>
        </Tooltip>
        <a v-else style="display:block;" :class="{'ivu-table-cell-ellipsis':true}" :title="titleValue()"  v-html="htmlValue()"></a>
        <template slot="onDeny">
            <span style="display:block;" :class="{'ivu-table-cell-ellipsis':true}" :title="titleValue()"  v-html="htmlValue()"></span>
        </template>
    </meta-operation>
</template>
<script>
import controlTypeService from '../../form/js/control_type_service';
import batchEditorSupport from './batch-editor-support';
import constants from '../../form/js/constants';
export default {
    mixins:[batchEditorSupport],
    props:{
        btn:{
            type:Object,
            required:true
        },
        initialCol:{
            type:Object
        }
    },
    computed: {
        rawTitle: function () {
            let val = controlTypeService.formatData(this.item, this.metaField);
            return val;
        }
    },
    data(){
        return {
            showTooltip:false
        };
    },
    methods:{
        getWidgetContext(){
            var metaEntity=this.context&&this.context.grid&&this.context.grid.metaEntity;
            var idFieldName="id";
            if(metaEntity){
                idFieldName=metaEntity.getIdField().name;
            }
            return {
                grid:this.context&&this.context.grid,
                selectedId:this.item[idFieldName],
                selectedItem:this.item,
                metaEntity:this.context&&this.context.grid&&this.context.grid.metaEntity
            }
        },
        handleTooltipIn () {
            const $content = this.$refs.content;
            this.showTooltip = $content.scrollWidth > $content.offsetWidth;
        },
        handleTooltipOut () {
            this.showTooltip = false;
        },
        hasDeletedTag(){
            return this.rawTitle&&this.rawTitle.indexOf&&this.rawTitle.indexOf(controlTypeService.entityType.deletedFlag)>-1;
        },
        hasTitleSplitKey(){
            return this.rawTitle&&this.rawTitle.indexOf&&this.rawTitle.indexOf(constants.TitleSplitKey)>-1;
        },
        htmlValueForDeletedTag(){
            let reg = new RegExp(controlTypeService.entityType.deletedFlag,'g');
            let titles=this.rawTitle.split(',');
            let t=[];
            _.each(titles,title=>{
                if(title.startsWith(controlTypeService.entityType.deletedFlag)){
                    t.push(`<span class='deleted-ref'>${title.replace(reg,'')}</span>`);
                }else{
                    t.push(title);
                }
            })
            return t.join(',');
        },
        htmlValueForTitleSplitKey(){
            let index=this.rawTitle.indexOf(constants.TitleSplitKey);
            let value=this.rawTitle.substring(0,index);
            return value;
        },
        htmlValue(){
            //如果有删除标记
            if(this.hasDeletedTag()){
                return this.htmlValueForDeletedTag();
            }else if(this.hasTitleSplitKey()){//如果用title分隔符分开了显示值和标题值
                return this.htmlValueForTitleSplitKey();
            }else{
                return this.rawTitle;
            }
        },
        titleValueForDeletedTag(){
            let reg = new RegExp(controlTypeService.entityType.deletedFlag,'g');
            if(this.rawTitle.startsWith(controlTypeService.entityType.deletedFlag)&&this.rawTitle.indexOf(',')<0){
                return `引用数据${this.rawTitle.replace(reg,'')}已删除`;
            }
            return this.rawTitle.replace(reg,'');
        },
        titleValueForTitleSplitKey(){
            let index=this.rawTitle.indexOf(constants.TitleSplitKey);
            let value=this.rawTitle.substring(index+constants.TitleSplitKey.length);
            return value;
        },
        titleValue(){
            if(this.hasDeletedTag()){
                return this.titleValueForDeletedTag();
            }else if(this.hasTitleSplitKey()){
                return this.titleValueForTitleSplitKey();
            }else{
                return this.rawTitle;
            }
        },
    }
}
</script>
<style lang="less">
.ivu-table-cell .link-title-opt.div-inline-block{
    display: block;
}
</style>



