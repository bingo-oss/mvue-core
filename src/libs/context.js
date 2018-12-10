/**
 * 运行的vue上下文参数
 */
import coreStore from '../store/core';
import mvueCore from '../index';
var cachedContext={
  mvueComponents:null,  
  currentVue:null,
  Vue:null,
  eventBus:null,
  router:null,
  mvueToolkit:null,
  webContext:{
    contextPath:"/",
    pagePath:"",
    inSamePage:function (location) {
      var page=location;
      if(location.indexOf("#")>0){
        page=location.substring(0,location.indexOf("#"));
      }
      if(this.pagePath==page){
        return true;
      }
      return false;
    },
    store:null
  },
  consts:{
      user:{
          idField:"id",
          nameField:"name",
          loginField:"userName",
          detailFields:"mobile,email",
          orgField:"orgId"
      },
      org:{
          idField:"id",
          nameField:"name",
          parentField:"parentId"
      }
  }
}

function initWebContext(location) {
  var href=location.href;
  var pathname=location.pathname;
  if(pathname!="/"){
    cachedContext.webContext.contextPath=pathname.substring(0,pathname.lastIndexOf("/")+1);
  }
  cachedContext.webContext.pagePath=href.replace(location.hash,"");
}

export default {
    init: function (Vue, opts) {
        cachedContext.Vue = Vue;
        cachedContext.eventBus = new Vue();
        if(opts && opts.mvueToolkit){
            cachedContext.mvueToolkit = opts && opts.mvueToolkit;
        }
        initWebContext(window.location);
    },
    setRouter(router) {
        //每次进到路由时先清空当前路由的状态数据
        router.beforeEach(function(to, from, next) {
            if(cachedContext.store){
                cachedContext.store.commit('core/clearCurrentRouteData');
            }
            next();
        });
        cachedContext.router = router;
    },
    setVue(vue){
        cachedContext.Vue=vue;
    },
    getRouter() {
        return cachedContext.router;
    },
    getContext: function () {
        return cachedContext;
    },
    getWebContext: function () {
        return cachedContext.webContext;
    },
    setCurrentVue: function (currentVue) {
        cachedContext.currentVue=currentVue;
    },
    getCurrentVue: function () {
        return cachedContext.currentVue;
    },
    getMvueToolkit: function () {
        return cachedContext.mvueToolkit;
    },
    buildResource: function (url, actions, _options) {
        const mvueToolkit = this.getMvueToolkit();
        if (mvueToolkit == null) {
            return null;
        }
        return mvueToolkit.resource(url, actions, _options);
    },
    getSession: function () {
        const mvueToolkit = this.getMvueToolkit();
        if (mvueToolkit == null) {
            return null;
        }
        return mvueToolkit.session;
    },
    getSSOClient: function () {
        const mvueToolkit = this.getMvueToolkit();
        if (mvueToolkit == null) {
            return null;
        }
        return mvueToolkit.ssoclient;
    },
    getConfig: function (configKey) {
        const mvueToolkit = this.getMvueToolkit();
        if (mvueToolkit == null) {
            return null;
        }
        if (_.isEmpty(configKey)) {
            return mvueToolkit.config;
        }
        return mvueToolkit.config.getConfigVal(configKey);
    },
    getEventBus() {
        return cachedContext.eventBus;
    },
    info: function (opts) {
        var vue = this.getCurrentVue();
        if (vue.$Message) {
            if (opts && opts.noTimeout) {
                vue.$Message.info(opts);
            } else {
                setTimeout(function () {
                    vue.$Message.info(opts);
                }, 300);
            }
        }
    },
    success: function (opts) {
        var vue = this.getCurrentVue();
        if(_.isString(opts)){
            opts={content:opts}
        }
        opts=_.extend({
            title:"操作成功"
        },opts);
        if (vue.$Message) {
            if (opts && opts.noTimeout) {
                vue.$Message.success(opts);
            } else {
                setTimeout(function () {
                    vue.$Message.success(opts);
                }, 300);
            }
        }
    },
    warning: function (opts) {
        var vue = this.getCurrentVue();
        opts=_.extend({
            title:"警告信息"
        },opts);
        if (vue.$Modal) {
            if (opts && opts.noTimeout) {
                vue.$Modal.warning(opts);
            } else {
                setTimeout(function () {
                    vue.$Modal.warning(opts);
                }, 300);
            }
        }
    },
    error: function (opts) {
        var vue = this.getCurrentVue();
        opts=_.extend({
            title:"错误信息"
        },opts);
        if (vue.$Modal) {
            if (opts && opts.noTimeout) {
                vue.$Modal.error(opts);
            } else {
                setTimeout(function () {
                    vue.$Modal.error(opts);
                }, 300);
            }
        }
    },
    confirm: function (opts) {
        var vue = this.getCurrentVue();
        opts=_.extend({
            title:"确认信息"
        },opts);
        if (vue.$Modal) {
            if (opts && opts.noTimeout) {
                vue.$Modal.confirm(opts);
            } else {
                setTimeout(function () {
                    vue.$Modal.confirm(opts);
                }, 300);
            }
        }
    },
    setConsts(cmap){
        cachedContext.consts=_.extend(cachedContext.consts,cmap);
    },
    getConsts(){
        return cachedContext.consts;
    },
    setStore(store,appCtx){
        store.registerModule('core',coreStore);
        if(appCtx&&appCtx.getAutoPageConfs){
            store.commit("core/setAutoPageConfs",appCtx.getAutoPageConfs());
        }
        cachedContext.store=store;
    },
    getStore(){
        return cachedContext.store;
    },
    setMvueComponents(mvueComponents){
        cachedContext.mvueComponents=mvueComponents;
    },
    getMvueComponents(){
        return cachedContext.mvueComponents;
    },
    initAfterAppCtxCreated(appCtx){
        if(appCtx.getMvueToolkit){
            cachedContext.mvueToolkit=appCtx.getMvueToolkit();
        }
        if(appCtx.getStore){
            this.setStore(appCtx.getStore(),appCtx);
        }
        if(appCtx.getMvueComponents){
            this.setMvueComponents(appCtx.getMvueComponents());
        }
        if(appCtx.getVue){
            let VueDef=appCtx.getVue();
            VueDef.use(mvueCore,{mvueToolkit:appCtx.getMvueToolkit()});
            this.setVue(VueDef);
        }
        if(appCtx.setMvueCore){
            appCtx.setMvueCore(mvueCore);
        }
    },
    initAfterAppStarted(appCtx){
        if(appCtx.getRouter){
            this.setRouter(appCtx.getRouter());
        }
        if(appCtx.getCurrentVue){
            this.setCurrentVue(appCtx.getCurrentVue());
        }
    }
}