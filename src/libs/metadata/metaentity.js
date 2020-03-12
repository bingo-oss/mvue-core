import context from "../context";
import operationManager from "../operation/operations";

export default function (options) {
    var metaEntity = _.extend({
        name: "",
        title: "",
        entityPath: "",
        description: "",
        remote: false,
        tableDroppable: false,
        tableFieldAddable: false,
        fields: {},
        relations: {},
        engineUrl: "",
        ui: null,
        relationUI:{},
        creatable: true,
        editable: true,
        deletable: true,
        listable: true,
        _model: null
    }, options);

    /**
     * 获取Id字段
     * @returns {Array}
     */
    metaEntity.getIdField = function () {
        var idField = null;
        _.forIn(this.fields, function (metaField, key) {
            if (metaField.identity) {
                idField = metaField;
            }
        });
        return idField;
    };

    metaEntity.findField = function (fieldName) {
        var field;
        if (_.isEmpty(fieldName)) {
            return null;
        }
        _.forIn(this.fields, function (metaField, key) {
            if (fieldName.toLowerCase() == key.toLowerCase()) {
                field = metaField;
                return false;
            }
        });
        return field;
    }

    /**
     * 第一个语义为的title字段
     */
    metaEntity.firstTitleField = function () {
        return this.firstSemanticsField("title");
    };

    /**
     * 获取每一个语义为semantics的字段
     * @param semantics 语义，语义有：title | summary | description | createdAt | updatedAt | createdBy | updatedBy
     * @returns {*}
     */
    metaEntity.firstSemanticsField = function (semantics) {
        var field = null;
        _.forIn(this.fields, function (metaField, key) {
            if (metaField.semantics === semantics
                || (_.isArray(metaField.semantics) && _.includes(metaField.semantics, semantics))) {
                field = metaField;
                return false;
            }
        });
        return field;
    };

    /**
     * 根据源字段，及目标实体（可为空）查询关系字段
     * @param sourceField
     * @param targetEntity
     */
    metaEntity.findRelation = function (sourceField, targetEntity) {
        var relation = null;
        var self = this;
        _.forIn(self.relations, function (metaRelation, key) {
            var eqTargetEntity = true;
            if (!_.isEmpty(targetEntity)) {
                eqTargetEntity = (metaRelation.targetEntity.toLowerCase() == targetEntity.toLowerCase());
            }
            if (!eqTargetEntity) {
                return;
            }
            var eqField = false;
            _.forEach(metaRelation.joinFields, function (joinField, index) {
                if (eqField) {
                    return false;
                }
                if (_.isString(joinField)) {
                    eqField = (sourceField.toLowerCase() == joinField.toLowerCase());
                    return;
                }
                if (_.isPlainObject(joinField) && !_.isEmpty(joinField["local"])) {
                    eqField = (sourceField.toLowerCase() == joinField["local"].toLowerCase());
                    return;
                }
            });
            if (eqField) {
                relation = metaRelation;
                return false;
            }
        });
        return relation;
    }
    /**
     * 与targetEntity是否存在指定类型的关系
     * @param targetEntity
     * @param relationTypes
     * @returns {Array}
     */
    metaEntity.existRelation = function (targetEntity, relationTypes) {
        var relations = [];
        _.forIn(this.relations, (metaRelation, key) => {
            if (metaRelation.targetEntity.toLowerCase() == targetEntity.toLowerCase()) {
                var matched = false;
                if (_.isArray(relationTypes)) {
                    _.each(relationTypes, (val) => {
                        if (val == metaRelation.type) {
                            matched = true;
                            return false;
                        }
                    });
                } else {
                    if (relationTypes == metaRelation.type) {
                        matched = true;
                    }
                }
                if (matched) {
                    relations.push(metaRelation);
                }
            }
        });
        return relations;
    }


    /**
     * 构造实体数据操作的基本数据模型，会包含需要提交到后台的所有字段
     */
    metaEntity.getDefaultModel = function () {
        var model = {};
        _.forIn(this.fields, function (metaField, key) {
            /*model[key] = metaField.default;*/
            model[key]=null;
        });
        return model;
    }
    /**
     * 根据传入的model，从后台填充所有属性定义的默认值
     */
    metaEntity.fillDefault = function (model,calc) {
        if(calc===false){
            return Promise.resolve(model);
        }
        var ds = this.dataResource();
        return ds.calc(model).then(function ({data}) {
            return data;
        });
    }
    //获取所有的关系字段组成的expand（除去几个特殊的默认字段），供leap的query使用
    metaEntity.getExpand = function (_fields) {
        var expand = [];
        //外部指定字段名数组
        if (_fields) {
            _.each(_fields, f => {
                var metaField = this.findField(f);
                if (metaField && metaField.manyToOneRelation) {
                    expand.push(metaField.manyToOneRelation.name);
                } else if (metaField && metaField.embeddedRelation) {
                    expand.push(metaField.embeddedRelation.name);
                }
            });
        } else {//默认所有普通字段
            _.forIn(this.fields, function (metaField, key) {
                if (metaField.manyToOneRelation) {
                    expand.push(metaField.manyToOneRelation.name);
                } else if (metaField.embeddedRelation) {
                    expand.push(metaField.embeddedRelation.name);
                }
            });
        }
        return expand.join(",");
    }
    /**
     * 构造实体默认表单显示的所有字段
     */
    metaEntity.getDefaultFormFields = function () {
        var fields = [];
        _.forIn(this.fields, function (metaField, key) {
            //标题字段排在最前面
            if (metaField.semantics == "title") {
                fields.splice(0, 0, key);
            } else {
                if (!metaField.readonly || (metaField.identity && metaField.name!="id") ) {
                    fields.push(key);
                }
            }
        });
        return fields;
    }
    metaEntity.getDefaultFormFieldsWithIds = function () {
        var fields = [];
        _.forIn(this.fields, function (metaField, key) {
            //标题字段排在最前面
            if (metaField.semantics == "title") {
                fields.splice(0, 0, key);
            } else {
                if(metaField.identity){
                    fields.push(key);
                }else if (!metaField.readonly) {
                    fields.push(key);
                }
            }
        });
        return fields;
    }
    /**
     * 构造实体默认视图显示的所有字段
     */
    metaEntity.getDefaultViewFields = function () {
        var fields = [];
        _.forIn(this.fields, function (metaField, key) {
            //标题字段排在最前面
            if (metaField.semantics == "title") {
                fields.splice(0, 0, key);
            } else {
                if (!metaField.identity && !_.includes(["redundant"], metaField.semantics)) {
                    fields.push(key);
                }
            }
        });
        return fields;
    }
    metaEntity.dataResourceUrl = function () {
        var resourceName = `${this.entityPath}{/id}`;
        return resourceName;
    }
    /**
     * 构造实体数据crud操作的vue-resource对象,
     */
    metaEntity.dataResource = function () {
        var resourceName = `${this.entityPath}{/id}`;
        var customActions = {
            calc: {method: 'POST', url: `${this.entityPath}/calc`},
            ui: {method: 'GET', url: `${this.entityPath}/_ui.json`},
            relationUI:{method: 'GET', url: `${this.entityPath}/$relations/:relation/_ui.json`}
        };
        //一对多关系接口附加
        _.forIn(this.relations, (metaRelation, key) => {
            var type = metaRelation.type, name = metaRelation.name;
            var pathName = name;
            if (type == 'one-to-many') {
                customActions[name] = {method: 'GET', url: `${this.entityPath}{/parentEntityId}/${pathName}`}
            }
        });
        var dataResource = context.buildResource(resourceName, customActions, {root: this.engineUrl});
        return dataResource;
    }
    metaEntity.isUIEnable = function () {
        if (this.ui == "none") {
            return false;
        }
        return true;
    }

    metaEntity.getUISettings = function () {
        if (this.ui == "none") {
            throw Error(`ui for entity(${this.name}) is disabled`);
        }
        if (_.isString(this.ui)) {
            var resource = this.dataResource();
            return resource.ui().then(({data}) => {
                configUI(data, this);
                var defaultSetting = defaultUI(this);
                var formSt=data["form"];
                if(formSt && "form"==typeMapping(formSt.ctype)){
                    defaultSetting["form"]=mergeUISettings(defaultSetting["form"],formSt);
                }
                visitSettings(data,(widget,p,indexOrKey)=>{
                    var entityName=widget["entityName"];
                    var mapping=typeMapping(widget.ctype);
                    if(_.isEmpty(entityName)
                        ||!_.has(defaultSetting,mapping)
                        ||entityName.toLowerCase()!=this.name.toLowerCase()){
                        return;
                    }
                    var mergedVal=mergeUISettings(_.cloneDeep(defaultSetting[mapping]),widget);
                    p[indexOrKey]=mergedVal;
                });
                this.ui = data;
                this.getRaw().ui = this.ui;
                //注册操作
                registerEntityOps(data.operations);
                return this.ui;
            })
        }
        return Promise.resolve(this.ui);
    }

    metaEntity.getFormSettings = function (formType) {
        return this.getUISettings().then(ui => {
            if (ui == null
                || (formType == "create" && !this.creatable)
                || (formType == "edit" && !this.editable)) {
                return null;
            }
            var st = {};
            if (_.has(ui, formType)) {
                st = ui[formType];
            }
            if (formType != "form") {
                var formSt = ui["form"] || {};
                if(st==null){
                    st=formSt;
                }else if(formSt.ctype== st&&st.ctype){
                    st = mergeUISettings(_.cloneDeep(formSt), st);
                }
            }
            return st;
        });
    }

    metaEntity.getPage = async function (pageKey) {
        var ui = await this.getUISettings();
        var page = null;
        if (ui.pages != null) {
            page = ui.pages[pageKey];
        }
        return _.cloneDeep(page);
    }

    metaEntity.getRelationUI = async function (relationName) {
        var ui=this.relationUI[relationName.toLowerCase()];
        if(ui){
            return ui;
        }
        var resource = this.dataResource();
        var resp=await resource.relationUI({relation:relationName});
        ui=resp.data;
        registerEntityOps(ui.operations);
        this.relationUI[relationName.toLowerCase()]=ui;
        return ui;
    }

    metaEntity.getRelationPage = async function (relationName,pageKey) {
        var relationUI=await this.getRelationUI(relationName);
        if(relationUI){
            var page= null;
            if(relationUI.pages){
                page=relationUI.pages[pageKey];
            }
            return _.cloneDeep(page);
        }
        return null;
    }


    /**
     * 构造默认的创建表单Path
     */
    metaEntity.formPathForCreate = function (isRelative) {
        if(isRelative){
            return "./create";
        }
        var path = this.projectId ? `/${this.projectId}/entities/${this.name}/create` : `/entities/${this.name}/create`;
        return path;
    }

    /**
     * 默认的修改表单Path
     * id 是要编辑的数据的id值
     * @returns {string}
     */
    metaEntity.formPathForEdit = function (id,isRelative) {
        if(isRelative){
            return `./${id}/edit`;
        }
        var path = this.projectId ? `/${this.projectId}/entities/${this.name}/${id}/edit` : `/entities/${this.name}/${id}/edit`;
        return path;
    }
    /**
     * 实体数据列表的路径地址
     */
    metaEntity.viewPath = function (isRelative) {
        if(isRelative){
            return "./list";
        }
        var path = this.projectId ? `/${this.projectId}/entities/${this.name}/list` : `/entities/${this.name}/list`;
        return path;
    }

    metaEntity.extendUISettings = function (to, from) {
        return mergeUISettings(to, from);
    }

    function mergeUISettings(to, from) {
        var childMerge = ["toolbar"];
        if (!to) {
            to = {};
        }
        _.forIn(from, (val, key) => {
            if (_.includes(childMerge, key)) {
                var merged = _.extend({}, to[key] || {}, val);
                to[key] = merged;
                return;
            }
            to[key] = val;
        });
        return to;
    }

    function registerEntityOps(ops) {
        if(_.isEmpty(ops)){
            return;
        }
        _.forIn(ops,(opt,key)=>{
            if(_.isEmpty(opt)){
                return ;
            }
            opt.name=key;
            operationManager.registerByTpl(opt);
        });
    }

    function typeMapping(ctype) {
        var mapping={
            "m-form":"form",
            "m-grid":"list",
            "m-tree-grid":"list"
        }
        return mapping[ctype];
    }

    function configUI(data, mEntity) {
        if ((!_.has(data, "list")) || _.isNull(data.list)) {
            mEntity.listable = false;
        }
        if ((!_.has(data, "create")) || _.isNull(data.create)) {
            mEntity.creatable = false;
        }
        if ((!_.has(data, "edit")) || _.isNull(data.edit)) {
            mEntity.editable = false;
        }
        if ((!_.has(data, "delete")) || _.isNull(data.delete)) {
            mEntity.deletable = false;
        }
    }

    function defaultUI(mEntity) {
        var titleField = mEntity.firstTitleField();
        var list = null;
        if (mEntity.listable) {
            list = {
                ctype:"m-grid",
                entityName: mEntity.name,
                toolbar: {
                    btns: [],
                    singleBtns: [],
                    quicksearch: {
                        fields: [(titleField && titleField.name)],
                        placeholder: `根据${titleField && titleField.title}搜索`
                    }
                }
            };
            if (mEntity.creatable) {
                list.toolbar.btns.push("create");
            }
            if (mEntity.editable) {
                list.toolbar.singleBtns.push("edit");
            }
            if (mEntity.deletable) {
                list.toolbar.singleBtns.push("del");
            }
        }

        var form = {
            ctype:"m-form",
            entityName: mEntity.name,
            layout: mEntity.getDefaultFormFields(),
            labelWidth: 120,
            toolbar: {
                "editBtns": ["cancel"]
            }
        };
        if (mEntity.editable) {
            form.toolbar.editBtns.push("save");
        }
        return {
            list: list,
            form: form
        };
    }

    function visitSettings(st,process,parent,indexOrKey) {
        if(_.isArray(st)){
            _.forEach(st,(widget,index)=>{
                if(_.isPlainObject(widget) || _.isArray(widget)){
                    visitSettings(widget,process,st,index);
                }
            });
        }
        if(_.isPlainObject(st)){
            if(_.has(st,"ctype")){
                process(st,parent,indexOrKey);
            }
            _.forIn(st,(widget,key)=>{
                if(_.isPlainObject(widget) || _.isArray(widget)){
                    visitSettings(widget,process,st,key);
                }
            });
        }
    }

    return metaEntity;
}

