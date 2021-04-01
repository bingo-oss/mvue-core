<template>
    <m-field v-if="editRow" :name="metaField.name"></m-field>
    <div v-else class="grid-col-pictures">
        <ufs-image v-for="f in files()" :key="f.id||f.url" @click="handleView(f)" :item='f' :paths='params'></ufs-image>
        <Modal title="查看图片" v-model="visible">
            <div style="overflow:auto;">
                <ufs-image class="preview-img" v-if="visible" :item='previewItem' :paths='params'></ufs-image>
            </div>
        </Modal>
    </div>
</template>
<script>
import batchEditorSupport from './batch-editor-support';
export default {
    mixins:[batchEditorSupport],
    components:{
        ufsImage:require('../../form/control_tmpl/upload/ufs-image').default
    },
    props:{
        uploadUrl:{
            type:String
        }
    },
    data:function(){
        return {
            params:{
                uploadUrl:this.uploadUrl
            },
            visible:false,
            previewItem:null
        };
    },
    methods:{
        files(){
            var files=this.item[this.metaField.name];
            if(_.isPlainObject(files)){
                return [files];
            }
            return files;
        },
        handleView (item) {
            if(this.context.grid.batchEditorMode){
                return;
            }
            this.previewItem = item;
            this.visible = true;
        }
    }
}
</script>

