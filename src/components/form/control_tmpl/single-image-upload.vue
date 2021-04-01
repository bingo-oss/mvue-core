<template>
    <div>
        <template v-if="viewMode||disabled">
            <div v-if="isNotEmpty(defaultList)" class="upload-form-item-view">
                <div class="demo-upload-list" v-for="item in defaultList" :key="item.url">
                    <div>
                        <ufs-image :width='uploadIconWidth' :height='uploadIconHeight' :item='item' :paths='paths'></ufs-image>
                        <div class="demo-upload-list-cover">
                            <Icon type="ios-eye-outline" @click="handleView(item)"></Icon>
                        </div>
                    </div>
                </div>
                <Modal :width="previewModalWidth" title="查看图片" class="preview-img-modal" v-model="visible" :cancel-text="''">
                    <ufs-image class="preview-img" v-if="visible" :item='previewItem' :paths='paths'></ufs-image>
                </Modal>
            </div>
            <div class="form-item-view" v-else>无图片</div>
        </template>
        <template v-else>
            <div>
                <Upload ref="upload"
                    :show-upload-list="false"
                    :on-success="handleSuccess"
                    :on-exceeded-size="handleExceededSize"
                    :on-format-error="handleFormatError"
                    :on-error="handleError"
                    :before-upload="handleBeforeUpload"
                    :default-file-list="defaultList"
                    :format="allowedFormats"
                    :max-size="maxSize*1024"
                    :multiple="multiple"
                    type="drag"
                    name="image"
                    :action="uploadAction"
                    :class="{'has-file':hasFile(),'potrait-upload':true}"
                    style="display: inline-block;">
                    <div v-if="hasFile()" style="line-height:normal;">
                        <div class="demo-upload-list" v-for="item in fileList()" :key="item.url">
                            <div v-if="item.status === 'finished'">
                                <ufs-image :width='uploadIconWidth' :height='uploadIconHeight' :item='item' :paths='paths'></ufs-image>
                                <div class="demo-upload-list-cover">
                                    <Icon type="ios-eye-outline" @click.stop="handleView(item)" title="预览"></Icon>
                                    <Icon type="ios-trash-outline" @click.stop="handleRemove(item)" title="删除"></Icon>
                                </div>
                            </div>
                            <div v-else>
                                <Progress v-if="item.showProgress" :percent="item.percentage" hide-info></Progress>
                            </div>
                        </div>
                    </div>
                    <div v-else :style="{width:uploadIconWidth,height:uploadIconHeight,'padding-top':uploadIconPaddingTop}">
                        <Icon type="ios-image-outline" :size="uploadIconSize" color="#becbd9"/>
                    </div>
                </Upload>
                <Modal :width="previewModalWidth" title="查看图片" class="preview-img-modal" v-model="visible" :cancel-text="''">
                    <ufs-image class="preview-img" v-if="visible" :item='previewItem' :paths='paths'></ufs-image>
                </Modal>
            </div>
        </template>
    </div>
</template>
<script>
import controlBase from '../js/control_base';
import uploadBase from '../js/upload_base';
import singleUpload from '../js/single-upload';
export default {
    mixins: [controlBase,singleUpload,uploadBase],
    data:function(){
        return {
            previewItem:null,
            visible:false
        };
    },
    computed:{
        uploadIconWidth(){
            var w=(this.formItem.componentParams&&this.formItem.componentParams.width)||130;
            return `${w}px`;
        },
        uploadIconHeight(){
            var h=(this.formItem.componentParams&&this.formItem.componentParams.height)||150;
            return `${h}px`;
        },
        uploadIconPaddingTop(){
            var w=(this.formItem.componentParams&&this.formItem.componentParams.width)||130;
            var h=(this.formItem.componentParams&&this.formItem.componentParams.height)||150;
            var s=w<h?(h-w*3/4)/2:h/8;
            return `${s}px`;
        },
        uploadIconSize(){
            var w=(this.formItem.componentParams&&this.formItem.componentParams.width)||130;
            var h=(this.formItem.componentParams&&this.formItem.componentParams.height)||150;
            var s=w<h?w:h;
            return s*3/4;
        }
    }
}
</script>



