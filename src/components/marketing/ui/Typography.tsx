import React from 'react'

interface HeadingProps {
  children: React.ReactNode
  level?: 'display' | '1' | '2' | '3' | '4' | '5' | '6'
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span'
  style?: React.CSSProperties
}

export function Heading({
  children,
  level = '1',
  className = '',
  as,
  style
}: HeadingProps) {
  const classes = [
    `marketing-heading-${level}`,
    className
  ].filter(Boolean).join(' ')
  
  // Determine the HTML element to use
  const Element = as || (level === 'display' ? 'h1' : `h${level}`) as keyof JSX.IntrinsicElements
  
  return React.createElement(Element, { className: classes, style }, children)
}

interface TextProps {
  children: React.ReactNode
  variant?: 'lead' | 'body' | 'body-large' | 'small' | 'xs'
  className?: string
  as?: 'p' | 'span' | 'div'
  color?: 'default' | 'muted' | 'primary' | 'secondary'
  style?: React.CSSProperties
}

export function Text({
  children,
  variant = 'body',
  className = '',
  as = 'p',
  color = 'default',
  style
}: TextProps) {
  const colorMap = {
    default: '',
    muted: 'marketing-text-gray-600',
    primary: 'marketing-text-primary',
    secondary: 'marketing-text-secondary'
  }
  
  const classes = [
    `marketing-text-${variant}`,
    colorMap[color],
    className
  ].filter(Boolean).join(' ')
  
  return React.createElement(as, { className: classes, style }, children)
}

interface LinkProps {
  children: React.ReactNode
  href: string
  className?: string
  target?: '_blank' | '_self'
  external?: boolean
}

export function Link({
  children,
  href,
  className = '',
  target = '_self',
  external = false
}: LinkProps) {
  const classes = [
    'marketing-link',
    className
  ].filter(Boolean).join(' ')
  
  if (external || href.startsWith('http') || target === '_blank') {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={classes}
      >
        {children}
      </a>
    )
  }
  
  return (
    <a href={href} className={classes}>
      {children}
    </a>
  )
}

interface ListProps {
  children: React.ReactNode
  variant?: 'bullet' | 'check'
  className?: string
}

export function List({ children, variant = 'bullet', className = '' }: ListProps) {
  const classes = [
    'marketing-list',
    className
  ].filter(Boolean).join(' ')
  
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === ListItem) {
        return React.cloneElement(child as React.ReactElement, { 
          variant,
          key: index 
        })
      }
      return child
    })
  }
  
  return (
    <ul className={classes}>
      {processChildren(children)}
    </ul>
  )
}

interface ListItemProps {
  children: React.ReactNode
  variant?: 'bullet' | 'check'
  className?: string
  unavailable?: boolean
}

export function ListItem({ 
  children, 
  variant = 'bullet', 
  className = '',
  unavailable = false 
}: ListItemProps) {
  const classes = [
    'marketing-list-item',
    unavailable && 'marketing-list-item-unavailable',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <li className={classes}>
      {variant === 'check' ? (
        <span className="marketing-list-check" />
      ) : (
        <span className="marketing-list-bullet" />
      )}
      <span>{children}</span>
    </li>
  )
}

interface HighlightProps {
  children: React.ReactNode
  variant?: 'gradient' | 'emphasis'
  className?: string
}

export function Highlight({ 
  children, 
  variant = 'gradient',
  className = '' 
}: HighlightProps) {
  const classes = [
    variant === 'gradient' ? 'marketing-text-highlight' : 'marketing-text-emphasis',
    className
  ].filter(Boolean).join(' ')
  
  return <span className={classes}>{children}</span>
}