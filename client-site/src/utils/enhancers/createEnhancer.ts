import { ComponentParameterEnhancer } from '@uniformdev/canvas'
import { isParameterValueDefined, parameterIsEntry } from './entryParameter'
import { GatherContentCmsValueParams } from '../../types'
import GatherContentClient from '../GatherContentClient'

export type createGatherContentEnhancerOptions = {
  clients: GatherContentClient
}

export function createGatherContentEnhancer({
  clients,
}: createGatherContentEnhancerOptions): ComponentParameterEnhancer<GatherContentCmsValueParams> {
  if (!clients) {
    throw new Error('No GatherContent clients were provided to the enhancer')
  }

  return {
    enhanceOne: async function GatherContentEnhancer({ parameter }) {
      if (parameterIsEntry(parameter)) {
        if (!isParameterValueDefined(parameter.value)) {
          return null
        }
        const client = clients as GatherContentClient
        const { entries = [] } = parameter.value || {}

        return client.getContentEntries({ entries })
      }
    },
  }
}
