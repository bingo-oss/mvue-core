<template>
    <div>
        <template v-if="viewMode||disabled">
            <div v-if="isNotEmpty(defaultList)" class="upload-form-item-view">
                <div class="demo-upload-list" v-for="item in defaultList" :key="item.id||item.url">
                    <div>
                        <ufs-image :item='item' :paths='paths'></ufs-image>
                        <div class="demo-upload-list-cover">
                            <i class="ivu-icon ivu-icon-ios-eye-outline" @click="handleView(item)"></i>
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
                <div class="demo-upload-list" v-for="item in fileList()" :key="item.id||item.url">
                    <div v-if="item.status === 'finished'">
                        <ufs-image :item='item' :paths='paths'></ufs-image>
                        <div class="demo-upload-list-cover">
                            <i class="ivu-icon ivu-icon-ios-eye-outline" @click="handleView(item)"></i>
                            <i class="ivu-icon ivu-icon-ios-trash-outline" @click="handleRemove(item)"></i>
                        </div>
                    </div>
                    <div v-else>
                        <Progress v-if="item.showProgress" :percent="item.percentage" hide-info></Progress>
                    </div>
                </div>
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
                    style="display: inline-block;width:58px;">
                    <div style="width: 58px;height:58px;line-height: 58px;">
                        <Icon type="ios-camera-outline" size="20"/>
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
import multiUpload from '../js/multi-upload';
export default {
    mixins: [controlBase,multiUpload,uploadBase],
    data:function(){
        return {
            previewItem:null,
            visible:false,
            multiple:true
        };
    }
}
</script>


