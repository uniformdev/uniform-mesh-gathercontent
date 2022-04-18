export const STRAPI_CANVAS_PARAMETER_TYPES = Object.freeze(['strapi'])

export enum Themes {
  dark = 'dark',
  light = 'light',
}

export const CAROUSEL_CONFIGURATION = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 3000 },
    items: 5,
  },
  desktop: {
    breakpoint: { max: 3000, min: 1080 },
    items: 3,
  },
  tablet: {
    breakpoint: { max: 1080, min: 568 },
    items: 3,
  },
  mobile: {
    breakpoint: { max: 568, min: 0 },
    items: 1,
  },
}
