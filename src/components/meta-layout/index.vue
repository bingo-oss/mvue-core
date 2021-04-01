<template>
<div class="meta-layout-con">
    <Row v-for="(rowItems,index) in innerSettings" v-bind="boundAttrs" :key="index">
        <template v-if="isArray(rowItems)">
            <i-col v-for="(rowItem,itemIndex) in rowItems" :key="itemIndex" :span="rowItemSpan(rowItems,rowItem)">
                <!--子元素还是个布局，用布局组件渲染-->
                <template v-if="isArray(rowItem)">
                    <meta-layout :flex="flex" @popup-close="handleOnPopupClose" :layout="rowItem" :itemProcessor="itemProcessor"></meta-layout>
                </template>
                <template v-else>
                    <m-component @popup-close="handleOnPopupClose"  :settings="componentProps(rowItem)"></m-component>
                </template>
            </i-col>
        </template>
        <!--直接放组件，组件内部实现列排版-->
        <template v-else>
            <i-col :span="24">
                <m-component @popup-close="handleOnPopupClose"  :settings="componentProps(rowItems)"></m-component>
            </i-col>
        </template>
    </Row>
</div>
</template>
<script>
    var minimist=require("minimist");
export default {
    meta:{
      title:"布局组件",
      init(){

      }  
    },
    name:"meta-layout",
    props:{
        layout:{//settings的length代表行，每个元素的length代表列，和二维数组对应
            type:[Array],
            required:true,
            meta:{
                title:"",
                from:"que"
            }
        },
        itemProcessor:{ //内容组件处理器
            type:Function
        },
        flex:{//是否使用flex布局，默认不使用：当表单开启边框时需要使用flex布局
            type:Boolean,
            default:false
        }
    },
    data(){
        var processed=this.preprocess(this.layout);
        let boundAttrs={};
        //如果开启了flex布局，增加type=flex属性
        if(this.flex){
            boundAttrs.type='flex';
        }
        return {
            boundAttrs:boundAttrs,
            innerSettings:processed,
            isLayout:true
        };
    },
    methods:{
        preprocess(st) {
            var processedSettings=[];
            _.forEach(st,(rowItem)=>{
                if(!_.isArray(rowItem)){
                    var component=this.processItem(rowItem);
                    processedSettings.push(component);
                    return;
                }
                var row=[];
                processedSettings.push(row);
                _.forEach(rowItem,(colItem)=>{
                    if(_.isArray(colItem)){
                        row.push(colItem);
                        return ;
                    }
                    var component=this.processItem(colItem);
                    row.push(component);
                });
            });
            return processedSettings;
        },
        //判断每个元素是否是数组
        isArray(rowItems){
            return _.isArray(rowItems);
        },
        //计算每个元素跨多少列，这里使用的iview的24列布局
        rowItemSpan(rowItems,rowItem){
            var curRowSpan=this.resolveSpan(rowItem);
            if(curRowSpan.isFix){
                return curRowSpan.span;
            }

            var amount=24;
            var allSpan=0;
            _.each(rowItems,item=>{
                var rowSpan=this.resolveSpan(item);
                if(rowSpan.isFix){
                    amount=amount-rowSpan.span;
                    return;
                }
                allSpan=allSpan+rowSpan.span;
            });
            //这里需要配置编写者自行保证总和为24列，暂不做特殊处理
            var spanSize=Math.floor((amount*curRowSpan.span)/allSpan);
            return spanSize;
        },
        resolveSpan(rowItem){
            var span={
              isFix:false,
              span:1
            };
            var rowSpan=rowItem.span;
            if(_.isNil(rowSpan)){
                return span;
            }
            if(_.isString(rowSpan)){
                if(rowSpan.indexOf("c")){
                    span.isFix=true;
                    rowSpan=rowSpan.replace("c","");
                }
                rowSpan=_.toSafeInteger(rowSpan);
            }
            span.span=rowSpan;
            return span;
        },
        //附加到组件的参数过滤掉ctype等内置属性
        processItem(rowItem){
             var component=this.cmdProcess(rowItem);
            if(this.itemProcessor!=null){
                component=this.itemProcessor(component);
            }
            return component;
        },
        componentProps(rowItem){
            var _props={};
            _.forIn(rowItem,(value,key)=>{
                _props[key]=value;
            });
            //layout组件，附加flex属性
            if(!rowItem.ctype){
                _props.flex=this.flex;
            }
            return _props;
        },
        handleOnPopupClose(){
            this.$emit("popup-close");
        },
        cmdProcess(item){
            if( !_.isString(item)){
                return item;
            }
            if(_.isEmpty(item)){
                return {
                    ctype:"m-text",
                    value:""
                };
            }
            if(item.indexOf("@")!=0){
                return item;
            }
            //先匹配出含空格的字符串参数:--arg1='ss 55'
            var strArgPattrn = /--\w+='[\w\s]+'/g;
            var strArgs = item.match(strArgPattrn);
            //如果有含空格的字符串参数，先去掉，后续添加进来
            if(strArgs){
                item=item.replace(strArgPattrn,'');
            }
            var args=_.split(item," ");
            //如果有含空格的字符串参数附加进来
            if(strArgs){
                strArgs=strArgs.map(s=>{
                    return s.replace(/'/g,'');
                });
                args=args.concat(strArgs);
            }
            var componentName=_.kebabCase(args[0].replace("@",""));
            var component={
                ctype:componentName
            }
            if(args.length>1){
                var spliced=args.splice(1);
                var params=minimist(spliced);
                _.forIn(params,(val,key)=>{
                    //将字符串true和false转换成boolean
                    if(val==='false'){
                        val=false;
                    }
                    if(val==='true'){
                        val=true;
                    }
                    if(key=="_"){
                        _.forEach(val,(sKey,index)=>{
                            if(index==0){
                                component["value"]=sKey;
                            }else if(sKey!==''){
                                component[sKey]=true;
                            }
                        });
                    }else {
                        if(key=="s"){
                            component["span"]=val;
                        }else if(key=="i"){
                            component["icon"]=val;
                        }else if(key=="t"){
                            component["title"]=val;
                        }else if(key=="n"){
                            component["name"]=val;
                        }else if(key=="v"){
                            component["value"]=val;
                        }else if(key=="c"){
                            component["class"]=val;
                        }else if(key!==''){
                            if(!_.isEmpty(val)
                                && val.charAt(0)=="[" && val.charAt(val.length-1)=="]"){
                                val=JSON.parse(val);
                            }
                            component[key]=val;
                        }
                    }
                });
            }

            return component;
        }
    }
}
</script>

