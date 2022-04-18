import { ComponentProps } from '@uniformdev/canvas-react'
import { StrapiImage } from '../../types'

export type HeroProps = ComponentProps<{
  hero: {
    attributes: {
      title: string
      text: string
      image: StrapiImage
    }
  }[]
}>
