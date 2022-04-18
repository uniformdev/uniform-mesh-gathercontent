import '../styles/global.css'
import React from 'react'
import type { AppProps } from 'next/app'
import { UniformMeshSdkContextProvider, useInitializeUniformMeshSdk } from '@uniformdev/mesh-sdk-react'

const App = ({ Component, pageProps }: AppProps) => {
  const { initializing, error } = useInitializeUniformMeshSdk()

  if (error) {
    throw error
  }

  return initializing ? null : (
    <UniformMeshSdkContextProvider>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </UniformMeshSdkContextProvider>
  )
}

export default App
