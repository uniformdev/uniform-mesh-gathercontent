import React from 'react'
import MultiCarousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import Dot from './Dot'
import { CAROUSEL_CONFIGURATION } from '../../utils/constants'

type CarouselProps = {
  children: JSX.Element[]
}

const Carousel = ({ children }: CarouselProps) => (
  <MultiCarousel
    ssr
    className="h-[36rem]"
    showDots
    customDot={<Dot />}
    responsive={CAROUSEL_CONFIGURATION}
    arrows={false}
  >
    {children}
  </MultiCarousel>
)

export default Carousel
