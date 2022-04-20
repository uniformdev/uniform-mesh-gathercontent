import { ComponentType } from 'react'
import { ComponentInstance } from '@uniformdev/canvas'
import { DefaultNotImplementedComponent, ComponentProps } from '@uniformdev/canvas-react'
import ProductsCarousel from './ProductsCarousel'
import HeroFullWidth from './Hero/HeroFullWidth'

const componentMappings = {
  gathercontentproductcarusel: ProductsCarousel,
  gathercontentHeroFullWidth: HeroFullWidth,
}

function capitalizeFirstLetter(string: string) {
  if (!string) {
    return undefined
  }
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function componentResolver(component: ComponentInstance): ComponentType<ComponentProps<any>> | null {
  const { variant } = component
  const componentName = variant ? `${component.type}${capitalizeFirstLetter(variant)}` : component.type
  const componentImpl = componentMappings[componentName]
  if (!componentImpl) {
    return DefaultNotImplementedComponent
  }
  return componentImpl
}

export default componentResolver
