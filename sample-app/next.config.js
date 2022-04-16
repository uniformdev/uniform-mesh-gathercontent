/** @type {import('next').NextConfig} */

const config = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    UNIFORM_CANVAS_API_HOST: process.env.UNIFORM_CLI_BASE_URL || 'https://uniform.app',
    UNIFORM_API_KEY: process.env.UNIFORM_API_KEY,
    UNIFORM_PROJECT_ID: process.env.UNIFORM_PROJECT_ID,
    GATHERCONTENT_PROJECT_ID: process.env.GATHERCONTENT_PROJECT_ID,
    GATHERCONTENT_API_USERNAME: process.env.GATHERCONTENT_API_USERNAME,
    GATHERCONTENT_API_KEY: process.env.GATHERCONTENT_API_KEY,
  },
};

module.exports = config;
