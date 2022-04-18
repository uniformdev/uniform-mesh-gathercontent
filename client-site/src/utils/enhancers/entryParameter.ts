import { ComponentParameter } from '@uniformdev/canvas'
import { STRAPI_CANVAS_PARAMETER_TYPES } from '../constants'
import { StrapiCmsValueParams } from '../../types'

export function parameterIsEntry(
  parameter: ComponentParameter<StrapiCmsValueParams>
): parameter is ComponentParameter<StrapiCmsValueParams> {
  const param = parameter as ComponentParameter<StrapiCmsValueParams>
  return Boolean(param.type === STRAPI_CANVAS_PARAMETER_TYPES[0] && param.value?.entries)
}

export function isParameterValueDefined(value: StrapiCmsValueParams) {
  return Boolean(value?.entries)
}
