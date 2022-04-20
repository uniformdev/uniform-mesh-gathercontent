import { ComponentParameter } from '@uniformdev/canvas'
import { GATHER_CONTENT_CANVAS_PARAMETER_TYPES } from '../constants'
import { GatherContentCmsValueParams } from '../../types'

export function parameterIsEntry(
  parameter: ComponentParameter<GatherContentCmsValueParams>
): parameter is ComponentParameter<GatherContentCmsValueParams> {
  const param = parameter as ComponentParameter<GatherContentCmsValueParams>
  return Boolean(param.type === GATHER_CONTENT_CANVAS_PARAMETER_TYPES[0] && param.value?.entries)
}

export function isParameterValueDefined(value: GatherContentCmsValueParams) {
  return Boolean(value?.entries)
}
