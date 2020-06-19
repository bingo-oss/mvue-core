import {StorageClient} from 'ufs-client-js';
import context from './context';
function getUfsEndpoint(){
    return context.getMvueToolkit().config.getConfigVal('service.ufs.endpoint');
}
function getApiBaseUrl(){
    return context.getMvueToolkit().config.getApiBaseUrl();
}
function getStorageClient(){
    let ufsEndpoint=getUfsEndpoint();
    let accessToken=context.getMvueToolkit().session.getToken();
    let storageClient = new StorageClient(ufsEndpoint, {
        accessToken: accessToken
    });
    return storageClient;
}
function upload(file,options,requestOptions){
    let storageClient=getStorageClient();
    let apiBaseUrl=getUfsEndpoint();
    options=_.assign({baseUrl:apiBaseUrl},options);
    requestOptions=requestOptions||{};
    return new Promise((resolve,reject)=>{
        //执行上传
        storageClient.upload({
            file: file,
            ...requestOptions
        },options).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        });
    });
}
function getDownloadUrl(fileId,fileName,options){
    let storageClient=getStorageClient();
    let params=_.assign({fileId: fileId},options);
    if(fileName){
        params.responseHeaderOverrides={'Content-Disposition':`attachment; filename=${fileName}`};
    }
    return new Promise((resolve,reject)=>{
        storageClient.urlFor(params).then(urlInfo => {
            resolve(urlInfo);
        },(err)=>{
            reject(err);
        });
    });
}
export default {
    upload,
    getDownloadUrl
}