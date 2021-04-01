<template>
    <div>
        <template v-if="viewMode||disabled">
            <div v-if="isNotEmpty(defaultList)" class="upload-form-item-view">
                <ul class="ivu-upload-list" >
                    <li class="ivu-upload-list-file ivu-upload-list-file-finish" style="padding-left:0px;" v-for="item in defaultList" :key="item.id||item.url">
                        <span @click="handlePreview(item)"><Icon type="ios-document-outline" /> {{item.name}}</span>
                        <span>{{humanFileSize(item.size)}}</span>
                    </li>
                </ul>
            </div>
            <div class="form-item-view" v-else>无文件</div>
        </template>
        <template v-else>
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
                    name="file"
                    :action="uploadAction">
                    <Button  icon="ios-cloud-upload-outline" style="font-size:13px;">上传</Button>
                </Upload>
                <ul class="ivu-upload-list">
                    <li class="ivu-upload-list-file ivu-upload-list-file-finish" v-for="item in fileList()" :key="item.id||item.url">
                        <span @click="handlePreview(item)"><Icon type="ios-document-outline" /> {{item.name}}</span>
                        <span>{{humanFileSize(item.size)}}</span>
                        <Icon class="del-btn" type="ios-close-circle-outline"  @click="handleRemove(item)"/>
                    </li>
                </ul>
        </template>
    </div>
</template>
<script>
import controlBase from '../js/control_base';
import uploadBase from '../js/upload_base';
import multiUpload from '../js/multi-upload';
export default {
    mixins: [controlBase,multiUpload,uploadBase],
    data(){
        return {
            multiple:true
        }
    }
}
</script>


