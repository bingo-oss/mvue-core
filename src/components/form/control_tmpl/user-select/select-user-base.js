import context from '../../../../libs/context';
import queryMethods from './query-methods';
export default{
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
        //当前用户所在部门
        let curUserOrgId=this.$session.getCurrentUser().org_id;
        return {
            queryMethods:queryMethods,
            curUserOrgId:curUserOrgId
        }
    },
    methods:{
        buildUserDesc(userItem){
            return userItem.email||userItem.userName||userItem.loginId;
        },
        renderFormat(item){
            var titleField=this.getTitleField();
            let desc=this.buildUserDesc(item);
            return `${item[titleField]}${desc?'-'+desc:''}`;
        },
        orgValueKey:function(){
            return context.getSettings().control.orgSelect.idField;
        },
        orgLabelKey:function(){
            return context.getSettings().control.orgSelect.nameField;
        } 
    }
}