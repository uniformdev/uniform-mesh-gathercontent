const path = require('path')

const config = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    domains: [process.env.STRAPI_API_HOST?.replace('https://', '')],
  },
  env: {
    THEME: process.env.THEME || 'light',
  },
  serverRuntimeConfig: {
    identifier: process.env.STRAPI_IDENTIFIER,
    password: process.env.STRAPI_PASSWORD,
    apiHost: process.env.STRAPI_API_HOST,
  },
  publicRuntimeConfig: {
    apiHost: process.env.STRAPI_API_HOST,
  },
}

module.exports = config
