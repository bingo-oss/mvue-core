<template>
  <div class="bvue-page" v-if="!noPage">
    <b-childheader v-if="showHeader" :title="innerTitle" :subtitle="header.description||header.subtitle" :show-back="header.showBack" :back-route="header.backRoute"></b-childheader>
    <div class="bvue-page-body" v-if="userHasPerms&&renderLayout&&pageSettings.layout">
        <meta-layout v-if="!showCard" :layout="pageSettings.layout"></meta-layout>
        <Card v-else>
            <meta-layout :layout="pageSettings.layout"></meta-layout>
        </Card>
    </div>
    <div v-if="errorObj&&errorObj.has" class="bvue-page-body" >
      <Card>
        <Alert type="warning"  show-icon style="margin: 20px 200px">
          页面错误
          <template slot="desc">
            {{ errorObj.message}}
          </template>
        </Alert>
      </Card>
    </div>
  </div>
  <div v-else>
    <meta-layout class="no-page" v-if="renderLayout" :layout="pageSettings.layout"></meta-layout>
    <Alert type="warning" v-if="errorObj.has" show-icon style="margin: 20px 200px">
      页面错误
      <template slot="desc">
        {{ errorObj.message }}
      </template>
    </Alert>
  </div>
</template>
<script>
import  pageHelper from "./page-helper";
import permUtils from '../../libs/security/permission';
export default {
  props: {
    header: {
      type: Object,
      default() {
        return {};
      }
    },
    propSettings:{//前端配置的界面propSettings和events属性添加，否则将不会生效
      type: Object
    },
    events:{
      type: Object
    },
    pageSettings: {
      type: Object,
      default() {
        return {layout: []};
      }
    },
    layout: {
      type: Array,
      default() {
        return null;
      }
    },
    errorObj: {
      type: Object,
      default() {
        return {
          has: false
        }
      }
    },
    showCard: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    lazy: {//是否开启延迟加载，开启后通过preprocessed控制布局渲染
      type: Boolean,
      default: false
    },
    preprocessed: {
      type: Boolean,
      default: false
    },
    noPage: {//是否在bvue-page布局下
      type: Boolean,
      default: false
    },
    title: {//指定页面标题来自某个组件：{source:'来源组件id'}
      type: [String,Object]
    },
    security:{//页面需要的权限设置：单个权限entity:operationName 或 多个权限[entity:operationName,entity:operationName]
      type:[String,Array]
    }
  },
  computed: {
    innerTitle() {
      let _title=this.header && this.header.title;
      if(!_title){
        if(_.isString(this.title)){
          _title=this.title;
        }
      }
      if(_title){
        return _title;
      }
      //如果设置了title来源，则从上下文中获取title
      //例如在m-detail-view中，source设置来源为表单，切换到其他tab时，title不应该清空
      if(this.$store.state.core.pageTitle){
        this.currentSourceTitle = this.$store.state.core.pageTitle;
      }
      return this.currentSourceTitle;
    },
    renderLayout() {//是否开始渲染布局
      let canRender=false;
      if (!this.lazy) {//非延迟渲染模式，即时渲染
        canRender = true;
      } else {//延迟渲染模式，预处理完毕后渲染
        canRender = this.lazy && this.preprocessed;
      }
      //pageSettings完整后才做一下预备设置
      if(canRender){
        this.prepare();
      }
      return canRender;
    }
  },
  created() {
    //清空页面标题
    this.$store.commit('core/setPageTitleCoercively', null);
    if (this.noPage) {
      return;
    }
  },
  data: function () {
    let self=this;
    if (!_.isEmpty(this.layout)) {
      this.pageSettings.layout = this.layout;
    }
    if(!_.isEmpty(this.propSettings)){
      this.pageSettings.propSettings=this.propSettings;
    }
    if(!_.isEmpty(this.events)){
      this.pageSettings.events=this.events;
    }
    //定义page的运行Context
    //包括model、$user、$route
    //model是第一个表单的entity数据
    let pageContext=pageHelper.buildPageContext(self);
    return {
      userHasPerms:true,
      isPage: true,
      pageContext:pageContext,
      currentSourceTitle:''//临时存储当前来源传递的标题
    };
  },
  mounted(){
    let userHasPerms= permUtils.hasPerms(this.security);
    if(!userHasPerms){
      this.userHasPerms=false;
      this.errorObj.has=true;
      this.errorObj.message=`未授权的操作：${this.security}`;
    }
  },
  methods: {
    setTitleSource(){
      //如果定义了title是来源于某个组件，则注册这个组件id到全局
      var sourceId = this.title && this.title.source;
      //如果sourceId为空，也要清除
      this.$store.commit('core/setPageTitleSourceId', sourceId);
    },
    prepare(){
      this.setTitleSource();
      //解析组件相关的事件和相关动态属性
      //将propSettings和events配置，解析到$config属性中
      pageHelper.preparePageSettings(this.pageSettings,this.pageContext);
      this.initPageEvent();
    },
    //on-inited事件中updateModel操作会移到表单组件中再执行一次，因为page初始化时m-form还未初始化，执行updateModel会失败
    //所以等表单m-form组件初始化完毕时，会调用这里actionType='updateModel'
    initPageEvent(actionType){
      //页面初始化事件调用
      let pageSettings = pageHelper.getComConfig(this.pageSettings,"$page");
      if(pageSettings){
        let initEvent=pageSettings.events["on-inited"];
        if(initEvent){
          initEvent.apply(this,[{actionType:actionType,__initparam__:true}]);
        }
      }
    },
    getPageContext() {
      return this.pageContext;
    },
    //每个m-component组件会将自己注册到页面的上下文中，作为可响应的m-page组件的data属性
    registerComponent(id,com){
      this.pageContext.vNodes[id]=com;
      Object.defineProperty(this.pageContext,id, {
        get: function () {
          return com.componentInstance;
        },
        configurable:true,
        enumerable: true
      });
    },
    getPageSettings(){
      return this.pageSettings;
    }
  }
};
</script>

