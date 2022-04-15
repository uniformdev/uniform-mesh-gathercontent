import { EnhancerBuilder } from '@uniformdev/canvas';
import getConfig from 'next/config';
import {
  createGatherContentEnhancer,
  CANVAS_GATHERCONTENT_PARAMETER_TYPES,
} from './createGatherContentEnhancer';
import { GatherContentClient } from './GatherContentClient';
import { GatherContentClientList } from './GatherContentClientList';

const { serverRuntimeConfig } = getConfig();
const { GATHERCONTENT_PROJECT_ID, GATHERCONTENT_API_USERNAME, GATHERCONTENT_API_KEY } = serverRuntimeConfig;

export function gatherContentEnhancer() {
  if (!GATHERCONTENT_PROJECT_ID) {
    throw new Error('GATHERCONTENT_PROJECT_ID not set');
  }

  if (!GATHERCONTENT_API_KEY) {
    throw new Error('GATHERCONTENT_API_KEY not set');
  }

  if (!GATHERCONTENT_API_USERNAME) {
    throw new Error('GATHERCONTENT_API_USERNAME not set');
  }

  const defaultClient = new GatherContentClient({
    apiKey: GATHERCONTENT_API_KEY,
    apiUsername: GATHERCONTENT_API_USERNAME,
    projectId: GATHERCONTENT_PROJECT_ID,
  });

  const clients = new GatherContentClientList([{ client: defaultClient }]);

  return createGatherContentEnhancer({ clients });
}

export const enhancers = new EnhancerBuilder().parameterType(
  CANVAS_GATHERCONTENT_PARAMETER_TYPES,
  gatherContentEnhancer()
);
