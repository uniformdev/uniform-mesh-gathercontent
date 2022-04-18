import React, { MouseEvent } from 'react'

interface CustomRightArrowProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  right: string | number
  top: string | number
}

interface CustomLeftArrowProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  left: string | number
  top: string | number
}

export const CustomRightArrow = ({ onClick, right, top }: CustomRightArrowProps) => (
  <button
    onClick={event => onClick(event)}
    style={{ right: right ?? 0, top: top ?? 'auto' }}
    aria-label="Go to previous slide"
    className="react-multiple-carousel__arrow react-multiple-carousel__arrow--right"
    type="button"
  />
)
export const CustomLeftArrow = ({ onClick, left, top }: CustomLeftArrowProps) => (
  <button
    onClick={event => onClick(event)}
    style={{ left: left ?? 0, top: top ?? 'auto' }}
    aria-label="Go to previous slide"
    className="react-multiple-carousel__arrow react-multiple-carousel__arrow--left"
    type="button"
  />
)
