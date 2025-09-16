import React from 'react'

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export default function Container({
  children,
  size = 'lg',
  className = ''
}: ContainerProps) {
  const classes = [
    'marketing-container',
    `marketing-container-${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

interface SectionProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  background?: 'white' | 'gray-50' | 'gray-100' | 'primary' | 'secondary'
  className?: string
  style?: React.CSSProperties
  role?: string
  'aria-label'?: string
}

export function Section({
  children,
  size = 'md',
  background = 'white',
  className = '',
  style,
  role,
  'aria-label': ariaLabel
}: SectionProps) {
  const classes = [
    'marketing-section',
    size !== 'md' && `marketing-section-${size}`,
    `marketing-bg-${background}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <section
      className={classes}
      style={style}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  )
}

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  mdCols?: 1 | 2 | 3 | 4
  lgCols?: 1 | 2 | 3 | 4
  gap?: 2 | 4 | 6 | 8
  className?: string
}

export function Grid({
  children,
  cols = 1,
  mdCols,
  lgCols,
  gap = 6,
  className = ''
}: GridProps) {
  const classes = [
    'marketing-grid',
    `marketing-grid-cols-${cols}`,
    mdCols && `marketing-grid-md-cols-${mdCols}`,
    lgCols && `marketing-grid-lg-cols-${lgCols}`,
    `marketing-gap-${gap}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
  gap?: 2 | 4 | 6 | 8
  className?: string
}

export function Flex({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 4,
  className = ''
}: FlexProps) {
  const classes = [
    'marketing-flex',
    direction === 'col' && 'marketing-flex-col',
    `marketing-items-${align}`,
    `marketing-justify-${justify}`,
    wrap && 'marketing-flex-wrap',
    `marketing-gap-${gap}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}