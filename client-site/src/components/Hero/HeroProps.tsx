import { ComponentProps } from '@uniformdev/canvas-react'

export type HeroProps = ComponentProps<{
  hero: {
    data: {
      title: string
      text: string
      image: { url: string }[]
    }
  }[]
}>
