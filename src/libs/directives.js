import permUtils from './security/permission';

function displayNotSecurityContent(el,value){
  let hasPerms=permUtils.hasPerms(value);
  if(!hasPerms){
    let notSecurityHtml=`<div class="ivu-alert ivu-alert-warning ivu-alert-with-icon ivu-alert-with-desc"><span class="ivu-alert-icon"><i class="ivu-icon ivu-icon-ios-alert-outline"></i></span> <span class="ivu-alert-message">
        页面错误
        </span> <span class="ivu-alert-desc">
          未授权的操作：${value}
        </span> <!----></div>`
    el.innerHTML=notSecurityHtml;
  }
}
export default function CustomDirectives(Vue) {
  Vue.directive('security', {
        inserted: function (el,binding,vnode,oldVnode) {
            var value=binding.value||{};
            displayNotSecurityContent(el,value);
        },
        componentUpdated:function (el,binding,vnode,oldVnode) {
            var value=binding.value||{};
            displayNotSecurityContent(el,value);
        }
    });
}