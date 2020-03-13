<template>
    <div v-html="relationRefValue()" :class="{'ivu-table-cell-ellipsis':true}" :title="relationRefValue()"></div>
</template>
<script>
import controlTypeService from '../../form/js/control_type_service';
export default {
    props:{
        item:{
            type:Object,
            required:true
        },
        column:{
            type:Object,
            required:true
        },
        targetField:{
            type:Object,
            required:true
        }
    },
    data(){
        let names=this.column.key.split('.');
        let relationName=names[0];
        return {
            relationName:relationName
        };
    },
    methods:{
        relationRefValue(){
            let expandData=this.item[this.relationName];
            let value = controlTypeService.formatData(expandData, this.targetField);
            return value;
        }
    }
}
</script>
