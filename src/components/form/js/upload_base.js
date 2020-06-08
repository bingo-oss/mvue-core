import uploadType from './upload_type';
import contextHelper from "../../../libs/context";
import ufs from "../../../libs/ufs";
import files from "../../../components/form/control_tmpl/upload/files";

var filesize = require('file-size');
export default {
    data:function(){
        return {
            previewModalWidth:800,
            multiple:false,
            uploadAction:"",
            defaultList:[],
            uploaded:false,//表示用户是否操作过上传组件
            currentUploadFileSum:0,//当前正在上传的文件个数
            oldFileList:[]//如果文件格式或者大小校验不合法，需要还原之前的文件
        };
    },
    computed:{
        allowedFormats:function(){
            var isPicture=this.isPicture();
            if(isPicture){
                let fileTypes=[];
                _.each(uploadType.uploadFilters.pictures,function(picItem){
                    fileTypes=fileTypes.concat(picItem.value);
                });
                return fileTypes;
            }
            if(this.formItem.componentParams.allowedFormats){
                return this.formItem.componentParams.allowedFormats;
            }
            return [];
        },
        maxSize:function(){
            var max=0;
            if(uploadType.isPictureUpload(this.formItem.componentType)){
                max=uploadType.maxSize.picture;
            }else{
                max=uploadType.maxSize.file;
            }
            if(this.formItem.componentParams.maxSize<max){
                    max=this.formItem.componentParams.maxSize;
            }
            return max;
        }
    },
    methods:{
        humanFileSize:function(fileSize){
            fileSize=fileSize||0;
            return filesize(fileSize).human('jedec');//si,jedec
        },
        isPicture:function(){
            return uploadType.isPictureUpload(this.formItem.componentType);
        },
        formatInfo:function(){
            var isPicture=this.isPicture();
            var formatInfo="";
            if(this.allowedFormats&&this.allowedFormats.length){
                formatInfo+="支持"+this.allowedFormats.join(",")+"等";
            }
            if(formatInfo){
                if(isPicture){
                    formatInfo+="图片格式"
                }else{
                    formatInfo+="文件格式"
                }
            }
            return formatInfo;
        },
        sizeInfo:function(){
            var sizeInfo="最大"+this.maxSize+"M";
            return sizeInfo;
        },
        fileDescription:function(){
            var formatInfo=this.formatInfo();
            var sizeInfo=this.sizeInfo();
            return formatInfo?`${formatInfo},${sizeInfo}`:sizeInfo;
        },
        fileList:function(){
            if(this.$refs.upload){
                return this.$refs.upload.fileList;
            }else{
                return [];
            }
        },
        emitValue:function(){
            this.uploaded=true;
            let _uploadList=[];
            _.each(this.$refs.upload.fileList,function(uploadFile){
                let _file={
                    name:uploadFile.name,
                    id:uploadFile.id,
                    size:uploadFile.size
                };
                //如果是ufs地址永不过期，保存url地址
                if(uploadFile.url){
                    _file.url=uploadFile.url;
                }
                _uploadList.push(_file);
            });
            //分别调用single-upload或者multi-upload的emitByType
            this.emitByType(_uploadList);
            this.dispatch('FormItem', 'on-form-blur', _uploadList);
        },
        minusCurrentFileSum:function(){
            //多文件上传，上传完后，当前待上传的总数减一
            if(this.multiple){
                this.currentUploadFileSum=this.currentUploadFileSum-1;
            }
        },
        getUfsEndpoint(){
            return contextHelper.getMvueToolkit().config.getConfigVal('service.ufs.endpoint');
        },
        handleSuccess (res, file) {
            file.id =  res.id;
            //如果配置了ufs上传的文件永不过期，直接获取绝对地址
            let filePromise=Promise.resolve(file);
            if(this.formItem.componentParams.ufsNeverExpires){
                filePromise=new Promise((resolve,reject)=>{
                    //加上这里，会两次调用sign，因为ufs-image会异步渲染
                    //expires:-1，表示ufs地址永不过期，取一次就可以了
                    let fileName=encodeURIComponent(file.name);
                    ufs.getDownloadUrl(file.id,fileName,{expires:-1}).then(res=>{
                        file.url=res.url;
                        resolve(file);
                    },(err)=>{
                        console.error(err);
                        reject(file);
                    });
                })
            }
            filePromise.then(file=>{
                //单文件上传，直接覆盖旧的文件
                if(!this.multiple){
                    //TODO 这一行好像去掉也可以，有待验证
                    this.$refs.upload.fileList=[file];
                }
                this.minusCurrentFileSum();
                this.emitValue();
            });
        },
        handleExceededSize:function(file,fileList){
            this.$refs.upload.fileList=_.cloneDeep(this.oldFileList);
            this.minusCurrentFileSum();
            var sizeInfo=this.sizeInfo();
            contextHelper.info(`大小超过限制,${sizeInfo}`);
        },
        handleFormatError:function(file,fileList){
            this.$refs.upload.fileList=_.cloneDeep(this.oldFileList);
            this.minusCurrentFileSum();
            var formatInfo=this.formatInfo();
            contextHelper.info(`格式错误,${formatInfo}`);
        },
        handleError:function(error,file){
            console.log(error);
            console.log(file);
            this.minusCurrentFileSum();
            contextHelper.info("上传失败，请联系管理员");
        },
        handleBeforeUpload (file) {
            this.currentUploadFileSum=this.currentUploadFileSum+1;
            var _this=this;
            //这里故意写死为ufs，iview upload组件action必填，所以附一个值但是不用，我们自定义ufs上传
            this.uploadAction='ufs';
            var ok=true;
            this.oldFileList=_.cloneDeep(this.$refs.upload.fileList);
            //单文件上传，直接覆盖旧的图片
            if(!this.multiple){
                this.$refs.upload.fileList=[];
            }else{
                //多文件上传，校验图片个数
                let _max=this.formItem.componentParams.uploadMax;
                if(this.multiple&&_max){
                    let check = (this.$refs.upload.fileList.length+this.currentUploadFileSum) <= _max;
                    if (!check) {
                        this.minusCurrentFileSum();
                        let isPicture=this.isPicture();
                        contextHelper.info(`最多只能上传 ${_max} ${isPicture?'张图片':'个文件'}。`);
                    }
                    ok=check;
                }
            }
            if(ok){
                this.overridePost(file);
            }
            return false;
        },
        //间接重写iview上传控件upload.vue的post
        overridePost (file) {
            let uploadRef=this.$refs.upload;
            // check format
            if (uploadRef.format.length) {
                const _file_format = file.name.split('.').pop().toLocaleLowerCase();
                const checked = uploadRef.format.some(item => item.toLocaleLowerCase() === _file_format);
                if (!checked) {
                    uploadRef.onFormatError(file, uploadRef.fileList);
                    return false;
                }
            }

            // check maxSize
            if (uploadRef.maxSize) {
                if (file.size > uploadRef.maxSize * 1024) {
                    uploadRef.onExceededSize(file, uploadRef.fileList);
                    return false;
                }
            }
            uploadRef.handleStart(file);
            ufs.upload(file).then((res)=>{
                uploadRef.handleSuccess(res, file);
            },(err)=>{
                uploadRef.handleError(err, null, file);
            });
        },
        handleRemove (file) {
            //TODO 真实的删除
            // 从 upload 实例删除数据
            let fileList = this.$refs.upload.fileList;
            this.$refs.upload.fileList.splice(fileList.indexOf(file), 1);
            this.emitValue();
        },
        //图片类型预览
        handleView (item) {
            this.previewItem = item;
            this.visible = true;
        },
        //文件类型预览就是下载
        handlePreview(file){
            files.download(file,this.paths.uploadUrl);
        },
        hasFile(){
            return this.fileList()&&this.fileList().length>0;
        }
    },
    components:{
        ufsImage:require('../control_tmpl/upload/ufs-image').default
    }
}