<template>
    <div class="grid-import-data-con">
        <div @click="showImport" class="btn-con" style="width:100%;">
            <slot>
                <Button v-if="operation.toolbarType=='compact'" type="text"  :icon="operation.icon">{{operation.title}}</Button>
                <Button v-else type="primary"  :icon="operation.icon">{{operation.title}}</Button>
            </slot>
        </div>
        <Drawer
            :title="operation.title+metaEntity.title+'数据'"
            v-model="showDrawer"
            :width="100"
            :mask-closable="false"
            :styles="styles"
            class="grid-drawer-con"
        >
            <div id="import-data-scroll-con" style="height: calc(100% - 55px);overflow:auto;padding:4px;">
                <Steps :current="current" size="small" style="margin-bottom:20px;">
                    <Step title="上传Excel"></Step>
                    <Step title="映射关系"></Step>
                    <Step title="导入数据"></Step>
                </Steps>
                <div v-show="current===0">
                    <div class="upload-con margin-top42">
                        <Row>
                            <i-col span="24">
                                <input ref="fileInput" 
                                    type="file" 
                                    :multiple="false"
                                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    @change="handleFileChange"/>

                            </i-col>
                            <i-col span="24" v-if="importTemplateUrl">
                                <div style="margin-top:5px;">
                                    <a :href="importTemplateUrl" target="_blank">下载模板</a>
                                </div>
                            </i-col>
                        </Row>
                    </div>
                    <div class="col-md-10 col-md-offset-1 font12 tips-color" style="margin-top:59px;">
                        <div>注意事项</div>
                        <div>
                            1.数据文件只支持Excel类型文件(.xlsx或.xls)，Excel文件的第一行为标题行。
                        </div>
                        <div>
                            2.覆盖导入：导入过程中如发现同名，且对该数据有更新权限，则更新这条数据。
                        </div>
                    </div>
                </div>
                <div v-show="current===1">
                    <table class="table field-mapping-con" v-if="columnMappings&&columnMappings.length">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>Excel列名</th>
                                <th></th>
                                <th>实体</th>
                                <th>实体属性名</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(mapping,index) in columnMappings" :key="index">
                                <th scope="row">{{index}}</th>
                                <td>{{mapping.title}}</td>
                                <td>&#x2192;</td>
                                <td>
                                    <select v-model="mapping.key" @change="handleMappingKeyChanged(mapping)">
                                        <option v-for="item in associatedMetaEntities" :value="item.key" :key="item.key" :data-title="item.key">{{item.title}}</option>
                                    </select>
                                </td>
                                <td>
                                    <select v-model="mapping.fieldName">
                                        <option v-for="field in mapping.mappingFields" :value="field.name" :key="field.name">{{field.title}}</option>
                                    </select>
                                    <span v-if="isUnique(mapping)" style="border:1px dashed #ccc;">唯一键</span>
                                </td>
                                <td>
                                    <a class="mapping-btn-item" href="javascript:void(0)" @click="ignoreOrAdd(mapping)" :class="{'ivu-btn-warning':mapping.optTitle==='忽略'}">{{mapping.optTitle}}</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    候选唯一校验字段组合：
                    <Select v-model="uniqueFieldsGroup" multiple style="width:260px">
                        <Option v-for="item in availableUniqueFields" :value="item.value" :key="item.value">{{ item.label }}</Option>
                    </Select>
                    可选择多个字段，共同唯一标记本条数据，不包括唯一键和只读字段，因为唯一键字段后端一定会校验，而只读字段不可插入
                </div>
                <div v-show="current===2">
                    <div class="progress-con margin-top42" v-if="editorProps.preprocessed&&!allImported">
                        <Row>
                            <i-col span="24">
                                <m-simple-batch-editor v-if="editorProps.preprocessed" ref="simpleBatchEditor"
                                    :column-mappings="validColumnMapping"
                                    :unique-fields-group="uniqueFieldsGroup"
                                    :import-id="importId"
                                    :items="editorProps.items"
                                    :ignore-columns="ignoreColumns"
                                    :entity-name="metaEntity.name" 
                                    @on-all-succeessed="handleOnAllSuccessed">
                                </m-simple-batch-editor>
                            </i-col>
                        </Row>
                    </div>
                    <div v-if="allImported">数据已全部导入成功，可重新导入其它数据</div>
                </div>
            </div>
            <div class="drawer-footer">
                <Button @click="cancel"><span>关闭</span></button>
                <Button @click="reImport"><span>重置</span></button>
                <Button type="primary" v-if="current===0" @click="doMapping"><span>配置映射关系</span></button>
                <Button v-if="current===1||(current===2&&!allImported)" @click="previous"><span>上一步</span></button>
                <Button type="primary" v-if="current===1" @click="prepareBatchEditor"><span>下一步</span></button>
                <Button type="primary" v-if="current===2" @click="doImport"><span>导入</span></button>
            </div>
        </Drawer>
    </div>
</template>
<script>
import importService from "../../services/tool/import-service";
import globalConsts from "../../libs/consts";

import context from "../../libs/context";
export default {
    props:{
        operation:{
            type:Object,
            required:true
        },
        widgetContext:{
            type:Object,
            required:true
        }
    },
    data:function(){
        let grid=this.widgetContext.grid;
        let metaEntity=grid.metaEntity;
        let entityName=metaEntity.name;
        let mainItem={
            metaEntity:metaEntity,
            title:metaEntity.title,
            key:metaEntity.name
        };
        let importTemplateUrl=false;
        if(grid.importTemplateUrl){
            importTemplateUrl=grid.importTemplateUrl.replace(':entityName',metaEntity.name);
            importTemplateUrl=context.getMvueToolkit().utils.appendParam(importTemplateUrl,'entityName',metaEntity.name);
        }
        let {availableUniqueFields,uniqueFieldsGroup}=this.buildAvailableUniqueFields(metaEntity);
        return {
            grid:grid,
            metaEntity:metaEntity,
            showDrawer:false,
            styles:{
                height: 'calc(100% - 55px)',
                overflow: 'hidden'
            },
            model:{
                file:null
            },
            columnMappings:[],
            current:0,//表示进度条的位置
            associatedMetaEntities:[mainItem],//所有与主实体相关联的实体
            associatedMetaEntitiesMap:{},
            level:3,//实体关系解析的层数，默认最多三层关系
            levelMap:{0:[mainItem]},//每层关系的实体
            editorProps:{
                preprocessed:false,
                items:[]
            },
            allImported:false,//数据是否都导入完毕
            importId:null,//当前导入的id
            validColumnMapping:null,//后端api调用的映射关系数据
            ignoreColumns:{},//忽略映射的列
            importTemplateUrl:importTemplateUrl,
            uniqueFieldsGroup:uniqueFieldsGroup,
            availableUniqueFields:availableUniqueFields
        }
    },
    watch:{
        showDrawer:function(){
            if(!this.showDrawer){
                this.widgetContext.grid.reload();
            };
        }
    },
    mounted:function(){
        for (let i = 1; i <= this.level; i++) {
            this.levelMap[i]=[];
            let _parentItems=this.levelMap[i-1];
            _parentItems.forEach(parent => {
                this.buildAssociatedMetaEntities(parent,i);
            });
        }
        this.associatedMetaEntitiesMap=_.keyBy(this.associatedMetaEntities,(o)=>{
            return o.key;
        });
    },
    methods:{
        //第一步：excel文件上传完后，生成映射关系
        handleFileChange (e) {
            const files = e.target.files;
            if (!files) {
                this.$Message.info('请先上传文件')
                return;
            }
            let file=files[0];
            let contentType=file.type;
            importService().prepareImport2({entityName:this.metaEntity.name},files[0],{headers:{"Content-Type":contentType}}).then(({data})=>{
                this.resetColumnMappings(data.columns);
                this.model.file=file;
                this.importId=data.id;
                this.editorProps.items=data.rows;
            },()=>{
                this.clearFileInput();
            });
        },
        //第二步：设置映射关系
        doMapping(){//下一步，设置映射关系
            var _this=this;
            this.doValidation(function(r){
                _this.current=_this.current+1;
            });
        },
        //第三步：配置好映射关系后，打开批量编辑器
        prepareBatchEditor(){
            this.doValidation(()=>{
                let _columnMappings=this.buildColumnMappingForImport();
                if(_columnMappings){
                    this.validColumnMapping=_columnMappings;
                    this.current=this.current+1;
                    this.editorProps.preprocessed=true;
                }
            });
        },
        //最后：调用批量编辑组件的导入功能，开始分批次导入数据
        doImport(){
            if(this.allImported){
                this.$Message.info('数据已全部导入成功，可重新导入其它数据');
            }else if(this.$refs.simpleBatchEditor){
                this.$refs.simpleBatchEditor.doImport();
            }
        },
        //每次上传文件后，重新计算映射关系
        resetColumnMappings(columns){
            let _mappings=[];
            _.each(columns,col=>{
                let _m={
                    index:col.index,
                    entityName:this.metaEntity.name,
                    key:this.metaEntity.name,
                    fieldName: null,
                    title:col.title,
                    relations:null,
                    optTitle:'忽略'
                };
                _.each(this.associatedMetaEntities,item=>{
                    if(item.title==_m.title||(item.joinField&&item.joinField.title==_m.title)){
                        _m.key=item.key;
                        _m.entityName=item.metaEntity.name;
                        return false;
                    } 
                })
                this.handleMappingKeyChanged(_m);
                _mappings.push(_m);
            });
            this.columnMappings=_mappings;
        },
        //所有数据上传完毕，关闭批量编辑器，并标记完成
        handleOnAllSuccessed(){
            //重置批量编辑器
            this.editorProps.preprocessed=false;
            this.allImported=true;
        },
        //计算每一列的映射对应的可选字段
        handleMappingKeyChanged(mapping){
            let key=mapping.key;
            if(!key){
                mapping.mappingFields=[];
                return;
            }
            let item=this.associatedMetaEntitiesMap[key];
            let mEntity=item.metaEntity;
            let _mappingFields=[],_fieldName=null;
            for (const key in mEntity.fields) {
                if (mEntity.fields.hasOwnProperty(key)) {
                    const metaField = mEntity.fields[key];
                    if(!(metaField.readonly
                            ||metaField.semantics=="createdBy"
                            ||metaField.semantics=="updatedBy")){
                        _mappingFields.push(metaField);
                        if(metaField.title==mapping.title){
                            _fieldName=metaField.name;
                        }
                    }
                }
            }
            if(!mapping.fieldName&&item.joinField){
                let tField=item.metaEntity.firstTitleField();
                _fieldName=tField&&tField.name;
            }
            mapping.mappingFields=_mappingFields;
            mapping.fieldName=_fieldName;
        },
        //校验文件是否上传
        doValidation:function(callback){
            var _this=this;
            if(this.current===0){
                if(!this.model.file){
                    this.$Message.info('请先上传文件')
                    return;
                }
            }
            callback&&callback();
        },
        //关闭弹出的导入框
        cancel(){
            this.showDrawer=false;
        },
        //显示导入框
        showImport(){
            this.showDrawer=true;
        },
        //构造后端导入接口所需的真实映射关系
        buildColumnMappingForImport(){
            let realMappings=[];
            let validateFailed=false;
            _.each(this.columnMappings,cm => {
                if((!cm.fieldName||!cm.key)&&(!this.ignoreColumns[cm.index])){
                    validateFailed=true;
                    this.$Message.info({content:"实体和实体属性名不能为空"});
                    return false;
                }
                let key=cm.key;
                let item=this.associatedMetaEntitiesMap[key];
                let rcm={
                    index:cm.index,
                    fieldName: cm.fieldName,
                    title:cm.title,
                    relations:null
                };
                //关系列只需要指定关系
                if(!_.isEmpty(item.relations)){
                    rcm.relations=[].concat(item.relations);
                }
                realMappings.push(rcm);
            });
            if(validateFailed){
                return false;
            }
            return realMappings;
        },
        previous(){//上一步
            this.current=this.current-1;
        },
        clearFileInput(){
            if(this.$refs.fileInput){
                this.$refs.fileInput.value = null;
            }
        },
        //重新上传导入，将清理所有数据
        reImport(){
            this.editorProps.preprocessed=false;
            this.columnMappings=[];
            this.validColumnMapping=[];
            this.ignoreColumns={};
            this.current=0;
            this.clearFileInput();
            this.model.file=null;
            this.allImported=false;
        },
        buildAssociatedMetaEntities(_parent,_level){
            if(_parent.stop){
                return;
            }
            let parentMetaEntity=_parent.metaEntity;
            let parentTitle=_parent.title;
            let parentRelations=_parent.relations;
            let relations=parentMetaEntity.relations||[];
            _.forIn(relations, (metaRelation, key) => {
                let rType=metaRelation.type;
                let targetEntity=metaRelation.targetEntity;
                let targetMetaEntity=this.$metaBase.findMetaEntity(targetEntity);
                let item={
                    metaEntity:targetMetaEntity,
                    parent:_parent
                };
                //多对一关系字段是只读的，不支持展开，也不加入选择
                if(rType==globalConsts.manyToOne){
                    let joinFieldName=metaRelation.joinFields[0];
                    let metaField=parentMetaEntity.findField(joinFieldName);
                    item.joinField=metaField;
                    if(metaField.readonly||metaField.semantics=="createdBy"||metaField.semantics=="updatedBy"){
                        item.stopLevel=true;
                        item.stop=true;
                    }
                }
                //多对多关系和一对多关系，只支持第一层的加入，其他层不支持展开和加入选择
                if(_level>1&&(rType!=globalConsts.manyToOne)){
                    item.stopLevel=true;
                    item.stop=true;
                }else if(_level==1&&(rType!=globalConsts.manyToOne)){//第一层不支持展开，可选
                    item.stopLevel=true;
                }
                //如果父和关系对应的实体是同一个，自引用关系，则此关系不能再继续展开
                if(parentMetaEntity.name==targetMetaEntity.name){
                    item.stopLevel=true;
                }
                //如果父的父和关系对应的实体是同一个，循环引用，则此关系实体不需要加入选择
                if(_parent.parent&&_parent.parent.metaEntity.name==targetMetaEntity.name){
                    item.stopLevel=true;
                    item.stop=true;
                }
                if(!item.stopLevel||!item.stop){
                    if(_.isEmpty(parentRelations)){
                        item.relations=[metaRelation.name];
                        item.title=`${metaRelation.title}`;
                    }else{
                        item.relations=[].concat(parentRelations,[metaRelation.name]);
                        item.title=`${parentTitle}的${metaRelation.title}`;
                    }
                    item.key=`${_parent.key}-${metaRelation.name}`;
                }
                if(!item.stopLevel){
                    this.levelMap[_level].push(item);
                }
                if(!item.stop){
                    this.associatedMetaEntities.push(item);
                }
            });
        },
        //忽略映射列
        ignoreOrAdd(mapping){
            let index=mapping.index;
            this.ignoreColumns[index]=!this.ignoreColumns[index];
            mapping.optTitle= this.ignoreColumns[index]?'添加':'忽略';
        },
        isUnique(mapping){
            let fields=mapping.mappingFields;
            let name=mapping.fieldName;
            if(!fields || !name){
                return false;
            }
            let fieldsMap=_.keyBy(fields,f=>{
                return f.name;
            });
            let mField=fieldsMap[name];
            return !!mField.unique;
        },
        buildAvailableUniqueFields(metaEntity){
            let availableUniqueFields=[],uniqueFieldsGroup=[];
            _.forIn(metaEntity.fields,f=>{
                if(!f.unique && !f.readonly){
                    availableUniqueFields.push(
                        {
                            value:f.name,
                            label:f.title
                        }
                    );
                    if(f.semantics==='title'){
                        uniqueFieldsGroup.push(f.name);
                    }
                }
            });
            return {availableUniqueFields,uniqueFieldsGroup};
        }
    }
}
</script>


