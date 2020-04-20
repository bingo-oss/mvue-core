import context from '../../../../libs/context';
export default {
    props:{
        treeExpandLevel:{//部门树默认展开到第几级
            type:Number,
            default:1
        },
        treeLeafKey:{//部门数据标志为叶子节点的字段属性
            type:String,
            default:''
        }
    },
    data(){
        return {
            orgTreeData:[],
            changedQueue:[]
        }
    },
    methods:{
        toTreeData(items,level=0){
            var _data=[];
            _.each(items,item=>{
                var treeItem=_.assign({},item,{
                    id:item[this.orgValueKey||this.valueKey],
                    title:item[this.orgLabelKey||this.labelKey],
                    children: []
                });
                //如果指定展开到treeExpandLevel层，并且部门数据有children数据，则默认展开
                if(level<this.treeExpandLevel&&item.children){
                    treeItem.expand=true;
                }
                //如果部门数据有children数据，则不用远程loading
                if(item.children){
                    let _level=level+1;
                    treeItem.children=this.toTreeData(item.children,_level);
                }else{
                    //如果部门数据有叶子标志并且非叶子节点，则需要远程loading
                    if(this.treeLeafKey&&(!item[this.treeLeafKey])){
                        treeItem.loading=false;
                    }
                    //没有任何叶子标志，默认需要远程loading
                    if(!this.treeLeafKey){
                        treeItem.loading=false;
                    }
                }
                _data.push(treeItem);
            });
            return _data;
        },
        buildRootOrg(){
            //加载根部门
            //仅查询本部门作为根
            if(this.onlySelectCurrentUserOrg){
                this.queryMethods.queryOrgByIds([this.curUserOrgId]).then(items=>{
                    this.orgTreeData=this.toTreeData(items);
                });
            }else{
                this.queryMethods.queryRootOrg().then(items=>{
                    this.orgTreeData=this.toTreeData(items);
                });
            }
        },
        buildRootOrgByKeyword(){
            context.getMvueToolkit().utils.smartSearch(this,()=>{
                if(!this.queryKeyword){
                    this.buildRootOrg();
                }else{
                    this.queryMethods.queryOrgByKeyword(this.queryKeyword).then(items=>{
                        this.orgTreeData=this.toTreeData(items);
                    });
                }
            },"changedQueue");
        },
        queryOrgByParent (item, callback) {
            this.queryMethods.queryOrgByParent(item.id).then(items=>{
                //如果无子部门，则去掉可展开图标，变为叶子节点
                if(items.length==0){
                    item.expand=false;
                    item.loading=false;
                    delete item.loading;
                    return;
                }
                var _data=this.toTreeData(items);
                callback(_data);
            });
        }
    }
}