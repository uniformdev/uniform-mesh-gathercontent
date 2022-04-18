import getConfig from 'next/config'
import { StrapiImage } from '../types'

const { publicRuntimeConfig } = getConfig()
const { apiHost } = publicRuntimeConfig

export const prepareImageUrl = ({ data }: StrapiImage) => {
  const { attributes } = data
  const { url } = attributes

  return `${apiHost}${url}`
}
