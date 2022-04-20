import getConfig from 'next/config'
import { createGatherContentEnhancer } from './createEnhancer'
import GatherContentClient from '../GatherContentClient'

const { serverRuntimeConfig } = getConfig()
const { apiUsername, apiKey, projectId, apiHost } = serverRuntimeConfig

const gatherContentEnhancer = () => {
  if (!apiUsername) {
    throw new Error('GATHER_CONTENT_API_USERNAME env not set.')
  }
  if (!apiKey) {
    throw new Error('GATHER_CONTENT_API_KEY env not set.')
  }
  if (!projectId) {
    throw new Error('GATHER_CONTENT_PROJECT_ID env not set.')
  }
  if (!apiHost) {
    throw new Error('GATHER_CONTENT_API_HOST env not set.')
  }

  const client = new GatherContentClient({ apiUsername, apiKey, projectId, apiHost })
  return createGatherContentEnhancer({
    clients: client,
  })
}

export default gatherContentEnhancer
