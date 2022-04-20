import React from 'react'
import ProductItem from '../ProductItem'
import Carousel from '../Carousel'
import { GatherContentProduct } from '../../types'

export type ProductsCarouselProps = {
  title: string
  spacing: boolean
  products: GatherContentProduct[]
}

const ProductsCarousel = ({ title, products = [], spacing }: ProductsCarouselProps) => (
  <div className={`px-4 ${spacing && 'mb-14'}`}>
    <p className="dark:text-white font-overpass font-extrabold text-black lg:text-4xl text-2xl text-center">{title}</p>
    <Carousel>
      {products?.map?.(item => (
        <div key={`featured-product-${item.id}`} className="px-1">
          <ProductItem product={item?.data} />
        </div>
      ))}
    </Carousel>
  </div>
)

export default ProductsCarousel
