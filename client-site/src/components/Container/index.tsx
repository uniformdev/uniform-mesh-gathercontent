import React from 'react'
import { Composition, Slot } from '@uniformdev/canvas-react'
import { ComponentInstance } from '@uniformdev/canvas'
import { componentResolver } from '../componentResolver'
import Header from '../Navigation/Header'
import Footer from '../Navigation/Footer'

const CommonContainer = ({ composition }: { composition: ComponentInstance }) => (
  <>
    <Header />
    {composition ? (
      <Composition data={composition}>
        <div className="body_container">
          <Slot name="content" resolveRenderer={componentResolver} />
        </div>
      </Composition>
    ) : null}
    <Footer />
  </>
)

export default CommonContainer
