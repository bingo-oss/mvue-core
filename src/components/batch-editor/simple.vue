<template>
    <div class="m-simple-batch-editor" :style="{width: editorWidth+'px'}">
        <div class="toolbar" v-if="beginImport">
            <!-- <Button type="primary" size="small" icon="ios-document-outline" @click="doImport">保存</Button> -->
            <div>总记录数{{items.length}}条,已导入{{items.length-total-ignoredItems.length}}条;本次导入{{currentImported}}条,大约耗时{{ellapsedTime()}}</div>
        </div>
        <div class="header">
            <div class="header-item">错误信息</div>
            <template v-for="cm in columnMappings">
                <div  v-if="!ignoreColumns[cm.index]" :key="cm.index" v-text="cm.title" class="header-item"></div>
            </template>
        </div>
        <div class="body">
            <div v-for="ci in currentItems" :key="ci.index" class="body-item">
                <div class="body-item-input">
                    <Tooltip placement="bottom-start" theme="light" v-if="ci.item[ci.item.length-1].e">
                        <a href="javascript:void(0)"  class="ignore-btn">忽略</a>
                        <div slot="content">
                            <a title="忽略后本行数据将不再显示，并且不作导入，当导入都完成后可选择进入已忽略的数据列表" href="javascript:void(0)"  class="ignore-btn" @click="ignoreItem(ci)">确定忽略</a>
                        </div>
                    </Tooltip>
                    <div class="error" v-text="ci.item[ci.item.length-1].e" :title="ci.item[ci.item.length-1].e"></div>
                </div>
                <template v-for="(p,idx) in ci.item">
                    <div :key="idx" class="body-item-input" v-if="idx<ci.item.length-1 && (!ignoreColumns[idx+1])">
                        <input v-model="ci.item[idx]" type="text" class="control">
                    </div>
                </template>
            </div>
        </div>
        <div class="footer">
            <Page ref="pageRef" transfer
                :total="total"
                :current.sync="currentPage"
                :page-size="pageSize"
                :page-size-opts="pageSizeOpts"
                @on-change="handleCurrentPageChange"
                @on-page-size-change="handlePageSizeChange"
                size="small"
                show-elevator show-sizer show-total></Page>
        </div>
    </div>
</template>
<script>
import importService from "../../services/tool/import-service";
import context from '../../libs/context';
export default {
    props:{
        importId:{
            type:String,
            required:true
        },
        entityName:{//当前批量编辑的实体名称
            type:String,
            required:true
        },
        columnMappings:{//每一列的映射关系[{index:0,title:'姓名',entityName:'user',fieldName:'name'}]
            type:Array,
            required:true
        },
        items:{
            type:Array,//[['lijing','架构部',{error}]]
            required:true
        },
        pageSize: {//每页条数
            type: Number,
            default: 50
        },
        pageSizeOpts: {
            type: Array,
            required: false,
            default: function () {
                return [50,100];
            }
        },
        ignoreColumns:{
            type:Object,
            default(){
                return {};
            }
        },
        uniqueFieldsGroup:{//属于当前实体的一组候选唯一键组合
            type:Array
        }
    },
    data(){
        return {
            otherInnerItems:this.items,//未处理的总数据
            innerItemsSuccessFlag:{},//每批次成功处理的记录
            innerItemsIgnoredFlag:{},//被忽略的记录标记
            ignoredItems:[],//被忽略的数据
            currentPage:1,
            currentItems:[],//[{index:0,item:['lijing','架构部',{error}]}]
            eachBatchSize:10,
            total:0,
            beginImport:false,
            startTime:null,
            endTime:null,
            currentImported:0,
            importing:false//表示是否已经在导入了，避免重复点击
        };
    },
    computed:{
        editorWidth(){
            return (this.columnMappings.length+1)*150;
        }
    },
    mounted(){
        this.doReload();
    },
    methods:{
        rebuildModelIgnoreColumns(_model){
            let _cols=[];
            _model.columns.forEach(col => {
                if(!this.ignoreColumns[col.index]){
                    _cols.push(col);
                }
            });
            _model.columns=_cols;
        },
        //按批次导入已修正的数据，一个批次出错后续不再导入
        async doImport(){
            if(this.currentItems.length==0){
                this.$Message.info('数据已全部导入成功，可重新导入其它数据');
                return;
            }
            if(this.importing){
                return;
            }
            this.importing=true;
            this.startComputeEllapsedTime();
            let _otherInnerItems=this.otherInnerItems;
            let batches=Math.ceil(_otherInnerItems.length/this.eachBatchSize);
            this.currentImported=0;
            //每次导入要清空成功数据索引
            this.innerItemsSuccessFlag={};
            for(let i=0;i<batches;++i){
                var start=i*this.eachBatchSize;
                var end=start+this.eachBatchSize;
                if(end>_otherInnerItems.length){
                    end=_otherInnerItems.length;
                }
                let rows=_.cloneDeep(_otherInnerItems.slice(start,end));
                //去掉每个row的最后一列：错误信息列
                for(let j=0;j<rows.length;++j){
                    rows[j]=rows[j].slice(0,rows[j].length-1);
                }
                let _model={
                    id:this.importId,
                    columns:this.columnMappings,
                    rows:rows
                };
                if(!_.isEmpty(this.uniqueFieldsGroup)){
                    _model.keys=this.uniqueFieldsGroup;
                }
                this.rebuildModelIgnoreColumns(_model);
                this.beginImport=true;
                let success=await importService().executeImportRows2({entityName:this.entityName},_model).then(({data})=>{
                    //有失败的数据
                    if(data.failedRows>0){
                        let successIdx=[];
                        for(let k=0;k<rows.length;++k){
                            let realIndex=start+k;
                            let err=data.errors[k];
                            if(err){
                                //如果有错修改错误信息
                                let oldRow=_otherInnerItems[realIndex];
                                oldRow[oldRow.length-1].e=err.e;
                            }else{
                                //如果已导入，标记已成功导入
                                this.innerItemsSuccessFlag[realIndex]=true;
                                this.currentImported++;
                            }
                        }
                        return false;
                    }else{//本批次都成功
                        for(let kk=start;kk<end;++kk){
                            //如果已导入，标记已成功导入
                            this.innerItemsSuccessFlag[kk]=true;
                            this.currentImported++;
                        }
                        return true;
                    }
                },(err)=>{
                    console.error(err);
                    return false;
                });
                this.endComputeEllapsedTime();
                //每批次导入后根据成功或者错误情况，重新渲染列表
                this.doReload(_otherInnerItems);
                //如果本批次提交失败，终止整个提交流程
                if(!success){
                    break;
                }
            }
            //所有批次导入完成后，清理标记数据
            this.innerItemsSuccessFlag={};
            this.importing=false;
        },
        //分页页码切换
        handleCurrentPageChange(currentPage){
            this.doReload();
        },
        //每页条数切换
        handlePageSizeChange(pageSize){
            //切换条数后，页码变为第一页，如果当前页不是第一页会激发分页页码变化，所以这里阻止一下，不重复reload
            if(this.currentPage>1){
                return;
            }
            this.doReload();
        },
        computeCurrentItems(_otherInnerItems){
            var currentPageSize=this.pageSize;
            if(this.$refs.pageRef){
                currentPageSize=this.$refs.pageRef.currentPageSize;
            }
            var currentPage=this.currentPage||1;
            var start=(currentPage-1)*currentPageSize;
            var end=start+currentPageSize;

            let otherInnerItems=_.filter(_otherInnerItems||this.otherInnerItems,(item,index)=>{
                return !this.innerItemsSuccessFlag[index] && !this.innerItemsIgnoredFlag[index];
            })
            if(end>otherInnerItems.length){
                end=otherInnerItems.length;
            }
            let _citems=[];
            for(let i=start;i<end;++i){
                //这里如果数据本身不包含错误列，补充错误列
                if(otherInnerItems[i].length==this.columnMappings.length){
                    otherInnerItems[i].push({e:''});
                }
                _citems.push({
                    index:i,
                    item:otherInnerItems[i]
                });
            }
            //设置未完成导入的剩余总数
            this.otherInnerItems=otherInnerItems;
            this.total=otherInnerItems.length;
            return _citems;
        },
        reset(_citems){
            this.currentItems= _citems;
            this.innerItemsIgnoredFlag={};
        },
        doReload(_otherInnerItems){
            let _citems=this.computeCurrentItems(_otherInnerItems);
            //当只有一条数据，并且被忽略需要特殊处理
            if(_citems.length==0){
                if(this.ignoredItems.length==0){
                    this.$emit('on-all-succeessed');
                    this.reset(_citems);
                }else{
                    context.confirm({
                        okText:'显示忽略数据',
                        cancelText:'完成导入',
                        title: '提示',
                        content: '导入已完成，是否显示所有已忽略的数据?',
                        onOk: () => {
                            this.currentPage=1;
                            this.innerItemsSuccessFlag={};
                            this.innerItemsIgnoredFlag={};
                            _citems=this.computeCurrentItems(this.ignoredItems,true);
                            this.ignoredItems=[];
                            this.reset(_citems);
                        },
                        onCancel:()=>{
                            this.$emit('on-all-succeessed');
                            this.reset(_citems);
                        }
                    });
                }
            }else{
                this.reset(_citems);
            }
        },
        startComputeEllapsedTime(){
            this.startTime=new Date();
        },
        endComputeEllapsedTime(){
            this.endTime=new Date();
        },
        ellapsedTime(){
            if(this.endTime&&this.startTime){
                if(this.endTime<this.startTime){
                    this.endTime=new Date();
                }
                let duration = this.endTime-this.startTime;
                if(duration<1000){
                    return `${duration}毫秒`;
                }else if(duration>=1000&&duration<60000){
                    let s= new Number(duration/1000).toFixed(2);
                    return `${s}秒`;
                }else{
                    let m= new Number(duration/(1000*60)).toFixed(2);
                    return `${m}分钟`;
                }
            }
        },
        ignoreItem({item,index}){
            this.innerItemsIgnoredFlag[index]=true;
            this.ignoredItems.push(item);
            this.doReload();
            // context.confirm({
            //     title: '提示',
            //     content: '忽略后本行数据将不再显示，并且不作导入，当导入都完成后可选择进入已忽略的数据列表，确定忽略吗?',
            //     onOk: () => {
                    
            //     }
            // });
        }
    }
}
</script>
