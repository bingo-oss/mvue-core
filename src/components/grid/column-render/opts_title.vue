<template>
    <m-field v-if="editRow" :name="metaField.name"></m-field>
    <div v-else class="opts-title-con" :class="{'opts-title-con-showopts':dropdownVisible}">
        <div class="title-con-box table-column-center" @click="handleTitleClick">
            <div v-wordlimit="{length:params.wordlimit,text:item[metaField.name]}"></div>
        </div>
        <div class="opts-con-box table-column-center">
            <div v-if="permedBtns()" class="opts-con">
                <meta-operation v-for="(btn,index) in permedBtns()" :key="index" :operation="btn" v-if="index<2 || permedBtns().length==3" :widget-context="getWidgetContext()">
                    <a href="javascript:void(0)" class="btn opt-btn" :title="operation.title" slot-scope="{operation}">
                        <m-icon :type="operation.icon"></m-icon>
                    </a>
                </meta-operation>
                <Dropdown v-if="permedBtns().length>3" transfer @on-click="handleDropdownMenuClick" @on-visible-change="handleOnVisibleChange" class="opts-dropdown">
                    <a href="javascript:void(0)">
                        <Icon type="more"></Icon>
                    </a>
                    <DropdownMenu slot="list">
                        <DropdownItem v-for="(btn,index) in permedBtns()" v-if="index>=2" :name="index" :key="index">
                            <meta-operation :operation="btn" :widget-context="getWidgetContext()">
                                <m-icon :type="btn.icon"></m-icon>
                                {{btn.title}}
                            </meta-operation>
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    </div>
</template>
<script>
import context from '../../../libs/context';
import batchEditorSupport from './batch-editor-support';
import sc from '../../../libs/security/permission';
export default {
    mixins:[batchEditorSupport],
    props:{
        params:{
            type:Object,
            required:true
        },
        btns:{
            type:Array
        },
        grid:{
            type:Object
        }
    },
    data: function(){
        return {
            dropdownVisible:false
        }
    },
    methods:{
        handleBtnClick(btn) {
            this.$emit('btnClick', btn);
        },
        handleOnVisibleChange(visible){
            this.dropdownVisible=visible;
        },
        handleDropdownMenuClick(itemName){
            var btn=this.btns[itemName];
            this.handleBtnClick(btn);
        },
        handleTitleClick(){
            if(this.grid&&this.grid.viewOnSingleClickRow){
                return;
            }
            //这里btns必须包含view操作
            var btn=_.find(this.btns, function(o) { 
                return o.id ==='view'; 
            });
            if(btn&&sc.hasRowPerm(this.item,btn.security)){
                this.handleBtnClick(btn);
            }
        },
        permedBtns(){
            //判断是否是旧的grid操作，新的操作来源都是通过部件的操作配置，没有权限字段
            var isOldOperation=this.btns&&this.btns[0]&&this.btns[0][context.getMvueToolkit().utils.dataPermField];
            if(!isOldOperation){
                return this.btns;
            }
            var _this=this;
            let _btns= _.filter(this.btns, function(o) { 
                //过滤掉查看操作，因为查看操作会在title列或者点击一行触发，有重复
                if(o.id ==='view'){
                    return false;
                }
                let has=sc.hasRowPerm(_this.item,o.security);
                return has;
            });
            return _btns;
        },
        getWidgetContext(){
            let _self = this.grid,context;
            if(this.grid.context){
                //是否-传入了上下文内容
                context = this.grid.context
            }else {
                var metaEntity=_self&&_self.metaEntity;
                var idFieldName="id";
                if(metaEntity){
                    idFieldName=metaEntity.getIdField().name;
                }
                context = {
                    grid: _self,
                    metaEntity: metaEntity,
                    selectedId: this.item[idFieldName],
                    selectedItem: this.item
                };
            }
            return context
        }
    }
}
</script>
<style lang="less">
.opts-title-con{
    display:table;
    width:100%;
    .table-column-center{
        display:table-cell;
        vertical-align: middle;
    }
    .title-con-box{
        width:67%;
        &:hover{
            text-decoration: underline;
            cursor: pointer;
        }
    }
    .opts-con-box{
        width:33%;
    }
    .opts-con{
        display:none;
        .opt-btn{
            color:#949494;
            padding:0px;
            border:0px;
            margin-right:8px;
            float:left;
        }
        .opts-dropdown{
            float:left;
            a{
                color:#949494;
            }
        }
    }
}
.ivu-table-row .opts-title-con.opts-title-con-showopts .opts-con{
    display: block;
}
.ivu-table-row.ivu-table-row-hover .opts-title-con .opts-con{
    display: block;
}
</style>


