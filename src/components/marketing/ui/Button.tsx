import React from 'react'
import Link from 'next/link'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  target?: '_blank' | '_self'
  style?: React.CSSProperties
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button',
  target = '_self',
  style
}: ButtonProps) {
  const baseClasses = [
    'marketing-button',
    `marketing-button-${variant}`,
    `marketing-button-${size}`,
    loading && 'marketing-button-loading',
    fullWidth && 'marketing-button-full',
    className
  ].filter(Boolean).join(' ')

  const buttonContent = (
    <>
      {children}
    </>
  )

  if (href) {
    if (href.startsWith('http') || target === '_blank') {
      return (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className={baseClasses}
          style={style}
          aria-disabled={disabled || loading}
        >
          {buttonContent}
        </a>
      )
    }

    return (
      <Link href={href} className={baseClasses} style={style}>
        {buttonContent}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
      style={style}
      aria-disabled={disabled || loading}
    >
      {buttonContent}
    </button>
  )
}