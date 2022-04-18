import getConfig from 'next/config'
import { createStrapiEnhancer } from './createEnhancer'
import StrapiClient from '../StrapiClient'

const { serverRuntimeConfig } = getConfig()
const { identifier, password, apiHost } = serverRuntimeConfig

const strapiEnhancer = () => {
  if (!identifier) {
    throw new Error('STRAPI_IDENTIFIER env not set.')
  }
  if (!password) {
    throw new Error('STRAPI_PASSWORD env not set.')
  }
  if (!apiHost) {
    throw new Error('STRAPI_API_HOST env not set.')
  }

  const client = new StrapiClient({ identifier, password, apiHost })
  return createStrapiEnhancer({
    clients: client,
  })
}

export default strapiEnhancer
