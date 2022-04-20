const path = require('path')

const config = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    domains: ["assets.gathercontent.com"],
  },
  env: {
    THEME: process.env.THEME || 'light',
  },
  serverRuntimeConfig: {
      apiUsername: process.env.GATHER_CONTENT_API_USERNAME,
      apiKey: process.env.GATHER_CONTENT_API_KEY,
      projectId: process.env.GATHER_CONTENT_PROJECT_ID,
      apiHost: process.env.GATHER_CONTENT_API_HOST,
  },
  publicRuntimeConfig: {
    apiHost: process.env.GatherContent_API_HOST,
  },
}

module.exports = config
