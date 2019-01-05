import context from "../context";
import sc from "./permission";

function init() {
    //注册登录成功后的事件
    addSignInEvent();
    //通过session校验是否已登录
    return checkBySession();
}

function addSignInEvent() {
    if(context.getMvueToolkit().session.isLogin()){
        initUserPerm();
    }else{
        context.getMvueToolkit().session.onSignIn(session => {
            initUserPerm();
        });
    }
}

function initUserPerm() {
    sc.init().then((ops) => {
        var currentUser = context.getMvueToolkit().session.getCurrentUser();
        currentUser["hasPerm"] = function (op, metaEntity) {
            return sc.hasPerm(op, metaEntity);
        }
    });
}


function getUserInfoUrl() {
    var url="/me";
    return context.getMvueToolkit().config.getApiBaseUrl()+url;
}

function checkBySession() {
    return Promise.resolve().then(()=>{
        if(context.getMvueToolkit().session.isLogin()){
            return context.getMvueToolkit().session.getCurrentUser();
        }
        return context.getMvueToolkit().http.get(getUserInfoUrl()).then(({data})=>{
            if(data.id!="anonymous"){
                context.getMvueToolkit().session.doSignIn({user:data});
            }
            return data;
        });
    });
}


export default {
    install:function () {
        return init();
    }
}