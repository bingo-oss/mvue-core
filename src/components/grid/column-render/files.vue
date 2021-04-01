<template>
    <m-field v-if="editRow" :name="metaField.name"></m-field>
    <div v-else class="grid-col-pictures">
        <div v-for="f in files()" :key="f.id||f.url"  @click="handlePreview(f)"><a><i class="ivu-icon ivu-icon-document"></i> {{f.name}}</a></div>
    </div>
</template>
<script>
import fileUtils from '../../form/control_tmpl/upload/files';
import batchEditorSupport from './batch-editor-support';
export default {
    mixins:[batchEditorSupport],
    props:{
        uploadUrl:{
            type:String
        }
    },
    methods:{
        files(){
            var files=this.item[this.metaField.name];
            if(_.isPlainObject(files)){
                return [files];
            }
            return files;
        },
        handlePreview(file){
            if(this.context.grid.batchEditorMode){
                return;
            }
            fileUtils.download(file,this.uploadUrl);
        }
    }
}
</script>

