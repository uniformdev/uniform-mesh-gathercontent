import React from 'react'
import Image from 'next/image'
import { HeroProps } from '../HeroProps'

const HeroFullWidth = ({ hero }: HeroProps) => {
  const renderHeros = () =>
    hero.map(({ data }) => {
      const { title, text, image } = data || {}

      return (
        <div key={`title-${title}`} className="md:h-96 h-max md:-mt-8 md:mb-28 bg-rose_bud md:bg-transparent">
          <div className="md:block hidden absolute bg-rose_bud w-full h-96 left-0" />
          <div className="relative md:w-full md:h-full md:m-auto flex flex-col-reverse md:flex-row h-full">
            <div className="md:pt-24 md:w-2/5 m-5">
              <h1
                className="dark:text-white font-overpass not-italic text-black_secondary font-extrabold text-4xl md:text-6xl"
                dangerouslySetInnerHTML={{ __html: title }}
              />
              {!!text && (
                <h3
                  className="dark:text-white font-overpass not-italic text-black_secondary font-extrabold text-md md:mt-4"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              )}
            </div>
            <div className="relative md:absolute md:right-0 md:top-16 md:w-1/2 md:h-96 h-44 w-50">
              <Image src={image?.[0]?.url} layout="fill" objectFit="cover" objectPosition="center" />
            </div>
          </div>
        </div>
      )
    })

  return <>{renderHeros()}</>
}

export default HeroFullWidth
