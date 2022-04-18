import { CanvasClient, CANVAS_PUBLISHED_STATE, CANVAS_DRAFT_STATE, enhance, EnhancerBuilder } from '@uniformdev/canvas'
import { GetStaticPropsContext, PreviewData } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { STRAPI_CANVAS_PARAMETER_TYPES } from './constants'
import strapiEnhancer from './enhancers'

export const canvasClient = new CanvasClient({
  apiHost: process.env.UNIFORM_CLI_BASE_URL || 'https://canary.uniform.app',
  apiKey: process.env.UNIFORM_API_KEY,
  projectId: process.env.UNIFORM_PROJECT_ID,
})

export const getState = (preview: boolean | undefined) =>
  process.env.NODE_ENV === 'development' || preview ? CANVAS_DRAFT_STATE : CANVAS_PUBLISHED_STATE

export async function getCompositionBySlug(slug: string, context: GetStaticPropsContext<ParsedUrlQuery, PreviewData>) {
  const { preview } = context || {}

  const { composition } = await canvasClient.getCompositionBySlug({
    slug,
    state: getState(preview),
  })

  await enhance({
    composition,
    context,
    enhancers: new EnhancerBuilder().parameterType(STRAPI_CANVAS_PARAMETER_TYPES, strapiEnhancer()),
  })

  return composition
}

export const getCompositionPaths = async () => {
  const pages = await canvasClient.getCompositionList({
    skipEnhance: true,
    state: getState(undefined),
  })

  return pages.compositions
    .filter(c => c.composition._slug && c.composition._slug !== '/')
    .map(c => (c.composition._slug?.startsWith('/') ? `${c.composition._slug}` : `/${c.composition._slug}`))
}
