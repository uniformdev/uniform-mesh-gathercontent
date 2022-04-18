import React from 'react'
import type { GetStaticProps, NextPage } from 'next'
import { ComponentInstance } from '@uniformdev/canvas'
import { getCompositionBySlug } from '../utils/canvasClient'
import Container from '../components/Container'

interface ContainerProps {
  composition: ComponentInstance
}

const Home: NextPage<ContainerProps> = ({ composition }) => <Container composition={composition} />

export const getStaticProps: GetStaticProps<ContainerProps> = async context => ({
  props: {
    composition: await getCompositionBySlug('/strapi', context),
  },
})

export default Home
