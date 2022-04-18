export interface StrapiParams {
  identifier?: string
  password?: string
  apiHost?: string
}

export interface StrapiCmsValueParams {
  entries: {
    id: string
    contentType: string
  }[]
}

export interface IVType<T> {
  iv: T
}

export interface ProductData {
  description: IVType<string>
  id: IVType<number>
  image: IVType<string[]>
  title: IVType<string>
}

export interface StrapiProduct {
  id: string
  attributes: ProductData
}

export interface StrapiImage {
  data: {
    attributes: {
      url: string
    }
  }
}
