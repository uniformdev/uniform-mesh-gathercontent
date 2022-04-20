export interface Params {
  apiUsername?: string
  apiKey?: string
  projectId?: string
  apiHost?: string
  cmsHost?: string
}

export interface GatherContentCmsValueParams {
  entries: {
    id: string
    contentType: string
  }[]
}

export interface ProductData {
  description: string
  id: string
  image: {
    url: string
  }
  title: string
}

export interface GatherContentProduct {
  id: string
  data: ProductData
}

export interface GatherContentImage {
  data: {
    attributes: {
      url: string
    }
  }
}
