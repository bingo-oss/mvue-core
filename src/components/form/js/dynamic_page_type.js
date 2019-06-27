import constants from './constants'
import metabase from '../../../libs/metadata/metabase'

var types = {
  DynamicPage: {
    id: 'DynamicPage',
    title: '动态数据选择',
    icon: 'ivu-icon ivu-icon-pound'
  }
}
var componentParams = {
  DynamicPage: {
    entityId: '',//必填
    idField: '',//必填
    titleField: '',//必填
    orderbyField: '',//排序字段
    orderbyType: 'asc',//排序规则
    entityResourceUrl: ''//后端自动生成
  }
}

function accept (componentType) {
  return !!types[componentType]
}

//componentType对应的可切换的组件集合
function switchableComponents (componentType) {
  return false
}

function formatData (componentType, item, metaField) {
  let fieldName = metaField.name
  let origin = item[fieldName]
  if (_.isNil(origin) || origin === '') {
    return ''
  }
  let rkey = constants.entityModelRedundantKey
  let titleKey = constants.entityModelTitleKey
  var $data = (item[rkey] && item[rkey][fieldName]) || {}
  var result = $data[origin] && $data[origin][titleKey]
  result = result || origin
  return result
}

function fillComponentParams (formItem, metaField) {
  var relation = metaField.manyToOneRelation
  if (relation) {
    let targetEntity = metabase.findMetaEntity(relation.targetEntity)
    if (targetEntity) {
      let idField = targetEntity.getIdField()
      let titleField = targetEntity.firstTitleField()
      formItem.componentParams.entityId = relation.targetEntity
      formItem.componentParams.idField = idField.name
      formItem.componentParams.titleField = titleField ? titleField.name : idField.name
      formItem.componentParams.entityResourceUrl = targetEntity.dataResourceUrl()
    } else {
      console.log(`关系字段${metaField.name}的引用实体${targetEntity}不存在`)
    }
  }
}

export default {
  types: types,
  accept: accept,
  componentParams: componentParams,
  switchableComponents: switchableComponents,
  formatData: formatData,
  fillComponentParams: fillComponentParams
}