import '../styles/global.css';
import type { AppProps } from 'next/app';
import {
  Callout,
  UniformMeshSdkContextProvider,
  useInitializeUniformMeshSdk,
} from '@uniformdev/mesh-sdk-react';
import React from 'react';

function App({ Component, pageProps }: AppProps) {
  const { initializing, error } = useInitializeUniformMeshSdk();

  if (error) {
    return <Callout type="error">{error.message}</Callout>;
  }

  return initializing ? null : (
    <UniformMeshSdkContextProvider>
      <Component {...pageProps} />
    </UniformMeshSdkContextProvider>
  );
}

export default App;
