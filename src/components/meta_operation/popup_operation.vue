<template>
<div>
    <div @click.stop="toggleModal">
        <slot>
            <Button :type="operation.btnType||'primary'" size="small" 
                :title="operation.title" >
                <m-icon :type="operation.icon"></m-icon>
                {{operation.title}}
            </Button>
        </slot>
    </div>
    <Modal class="popup-widget-con" v-model="popupWidgetModal"
            :width="innerModalWidth"
            :title="modalTitle"
            :scrollable="true"
            :mask-closable="false"
            @on-visible-change="handleOnVisibleChange"
            >
            <div class="modal-inner-widget" v-if="popupWidgetModal" :style="{height:innerModalHeight+'px',overflow:'auto'}">
                <component v-if="!isLayout" @popup-close="close" :widget-context="widgetContext" :operation="operation" :is="operation.widget">
                </component>
                <meta-layout v-if="isLayout&&layoutSettings" :layout="layoutSettings" @popup-close="close">
                </meta-layout>
            </div>
            <div slot="footer" :id="footerDomId"></div>
    </Modal>
</div>
</template>
<script>
import metaLayoutConvertor from '../meta-layout/layout-convertor';
import context from '../../libs/context';
const uuidv1 = require('uuid/v1');
export default {
    props:{
        widgetContext:{//由使用操作的部件传入的部件上下文
            type:Object,
            required:true
        },
        operation:{//操作的定义，必传参数
            type:Object,
            required:true
        },
        modalWidth:{
            type:Number,
            default:80
        },
        modalHeight:{
            type:Number
        }
    },
    data(){
        let footerDomId='footerid-'+uuidv1();
        let isLayout=this.isMetaLayout();
        return {
            innerModalWidth:this.operation.modalWidth||this.modalWidth,
            innerModalHeight:this.operation.modalHeight||this.modalHeight,
            modalTitle:this.operation.modalTitle||this.operation.title,
            popupWidgetModal:false,
            footerDomId:footerDomId,
            isPopup:true,
            isLayout:isLayout,
            layoutSettings:null
        };
    },
    watch:{
        popupWidgetModal(){
            if(this.popupWidgetModal){
                this.innerModalHeight=this.operation.modalHeight||context.modalHeight(30);
            }
        }
    },
    mounted(){
        //只有layout渲染才需要初始化layoutSettings
        if(this.isMetaLayout()){
            this.getLayoutSettings();
        }
    },
    methods:{
        toggleModal(){
            this.popupWidgetModal=!this.popupWidgetModal;
            this.$emit("triggered","popup");
        },
        close(){//关闭对话框
            this.popupWidgetModal=false;
            if(this.widgetContext.grid){
                this.widgetContext.grid.reload();
            }
        },
        isMetaLayout(){
            var widget=this.operation.widget;
            let url=this.operation.url;
            if(_.startsWith(widget,"/pages/")){
                return true;
            }
            //jmms实体配置的key，如view
            if(url){
                return true;
            }
            return false;
        },
        async getLayoutSettings(){
            let settings=null;
            let widget=this.operation.widget;
            let url=this.operation.url;
            if(widget){
                let autoPageConfs=this.$store.getters['core/autoPageConfs'];
                settings=_.cloneDeep(autoPageConfs[widget]);
                if(_.isEmpty(settings)){
                    context.error({
                        title:'配置错误',
                        content:`key为${widget}的页面部件不存在`
                    });
                }
            }else if(url){
                let metaEntity=this.widgetContext.metaEntity;
                if(url.startsWith('./')){
                    url=url.substring(url.indexOf('./')+2);
                }
                settings=await metaEntity.getPage(url);
                //用view页面配置的title覆盖
                if(settings.title){
                    this.modalTitle=settings.title;
                }
                //查看模式表单，弹出引用实体数据查看表单，按钮区自动修正
                if(url=='view'&&settings.ctype=="m-form"){
                    settings.toolbar=settings.toolbar||{};
                    settings.toolbar.viewBtns=['cancel'];
                }
                if(_.isEmpty(settings)){
                    context.error({
                        title:'配置错误',
                        content:`实体${metaEntity.name},key为${url}的页面部件不存在`
                    });
                };
            }
            if(!_.isEmpty(settings)){
                settings= metaLayoutConvertor.convert(settings,this,{isPopup:true});
                this.layoutSettings=settings.layout;
            }
        },
        handleOnVisibleChange(visible){
            this.$emit('on-visible-change',visible);
        }
    }
}
</script>


