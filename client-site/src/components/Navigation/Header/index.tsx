import React from 'react'
import HeaderLogo from '../components/Logo'

const Navbar = () => (
  <header className="relative border-b dark:border-neutral-200/[.20]">
    <div
      className="header_footer_container hidden lg:flex lg:flex-row lg:items-center lg:place-content-between lg:py-4"
      role="navigation"
      aria-label="main-navigation"
    >
      <div className="flex">
        <HeaderLogo />
      </div>
    </div>
  </header>
)

export default Navbar
