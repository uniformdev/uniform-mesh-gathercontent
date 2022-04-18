import React from 'react'
import Image from 'next/image'
import { prepareImageUrl } from '../../utils/prepareImageUrl'

const ProductItem = ({ product }) => {
  const { image, title, description } = product || {}
  return (
    <div
      className={`group flex flex-1 flex-col w-full md:w-[235px] mb-16 mx-auto mb-auto mt-0 border border-demo_border lg:border-0 mt-[30px]
        lg:mt-[10px] lg:mb-[58px] lg:border-transparent lg:hover:outline-1  lg:hover:outline-solid
        lg:hover:outline-demo_border dark:lg:hover:outline-0 lg:hover:z-[999] lg:hover:dark:border-neutral-200/[.20] hover:outline-none`}
    >
      <div className="relative flex flex-col items-center dark:lg-mt-0 dark:pt-8 lg:px-0 px-[30px] pb-8">
        <div>
          <div className="flex flex-col cursor-pointer items-center w-full">
            <div className="relative p-[10px] lg:-m-[2px] lg:outline-1 lg:outline outline-demo_border bg-white lg:group-hover:outline-transparent dark:lg:group-hover:outline-white">
              <Image width={226} height={237} src={prepareImageUrl(image)} />
            </div>
            <span className="mt-6 font-bold text-xl h-[58px] max-w-[205px] overflow-hidden text-ellipsis text-center">
              {title}
            </span>
            <span className="text-sm h-[58px] max-w-[205px] overflow-hidden text-ellipsis text-center">
              {description}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductItem
