<template>
    <m-field v-if="editRow" :name="metaField.name"></m-field>
    <div v-else class="img-title-con">
        <span class="fl imgBox">
            <i>
                <img v-if="params.iconField && item[params.iconField]" :src="contextPath + item[params.iconField]" @error="nofind($event)" alt="">
                <em>{{params.titleField?item[params.titleField].slice(0,1):(item.title?item.title.slice(0,1):'')}}</em>
            </i>
        </span>
        <div class="detailBox" >
            <h5>
                <b>
                    <a class="colorgray" @click = "handleClick" v-html="params.titleField?item[params.titleField]:item.title"></a>
                </b>
            </h5>
            <p v-wordlimit="{length:params.wordlimit,text:params.descField?item[params.descField]:item.description}"></p>
        </div>
    </div>
</template>
<script>
import context from "../../../libs/context";
import batchEditorSupport from './batch-editor-support';
export default {
    mixins:[batchEditorSupport],
    props:{
        params:{
            type:Object,
            required:true
        }
    },
    data: function(){
        return {
            contextPath :context.getConfig().getGatewayUrl()
        }
    },
    methods:{
        //图片出错处理
        nofind: function ($event) {
            $($event.target).hide();
        },
        handleClick(){
            this.$emit("click");
        }
    }
}
</script>


