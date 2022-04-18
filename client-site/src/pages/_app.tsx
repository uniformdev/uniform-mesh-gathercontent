import 'tailwindcss/tailwind.css'
import '../styles/globals.scss'
import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import dynamic from 'next/dynamic'

const App = ({ Component, pageProps }: AppProps) => (
  <ThemeProvider forcedTheme="light">
    <div className="app_container">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </div>
  </ThemeProvider>
)

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
})
