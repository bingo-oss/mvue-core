<template>
    <Tabs>
        <TabPane v-for="(pane,index) in panes" :key="index" :label="pane.title">
            <meta-layout :layout="paneLayout(pane)" class="b-tabs-pane-content"></meta-layout>
        </TabPane>
    </Tabs>
</template>

<script>
    import  layoutConvertor from "../meta-layout/layout-convertor";
    export default {
        props: {
            "panes": {
                type: Array,
                required: true,
            }
        },
        data(){
            return {
            }
        },
        methods:{
            paneLayout:function (setting) {
                var pageSetting=layoutConvertor.convert(setting,this);
                return pageSetting.layout;
            }
        }
    }
</script>

