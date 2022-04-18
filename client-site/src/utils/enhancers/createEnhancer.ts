import { ComponentParameterEnhancer } from '@uniformdev/canvas'
import { isParameterValueDefined, parameterIsEntry } from './entryParameter'
import { StrapiCmsValueParams } from '../../types'
import StrapiClient from '../StrapiClient'

export type createStrapiEnhancerOptions = {
  clients: StrapiClient
}

export function createStrapiEnhancer({
  clients,
}: createStrapiEnhancerOptions): ComponentParameterEnhancer<StrapiCmsValueParams> {
  if (!clients) {
    throw new Error('No Strapi clients were provided to the enhancer')
  }

  return {
    enhanceOne: async function StrapiEnhancer({ parameter }) {
      if (parameterIsEntry(parameter)) {
        if (!isParameterValueDefined(parameter.value)) {
          return null
        }
        const client = clients as StrapiClient
        const { entries = [] } = parameter.value || {}

        return client.getContentEntries({ entries })
      }
    },
  }
}
