import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'flat' | 'bordered' | 'primary' | 'secondary' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  className?: string
}

export default function Card({
  children,
  variant = 'default',
  size = 'md',
  hover = true,
  className = ''
}: CardProps) {
  const classes = [
    'marketing-card',
    variant !== 'default' && `marketing-card-${variant}`,
    `marketing-card-${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

interface PricingCardProps {
  title: string
  subtitle?: string
  price: {
    amount: number | string
    period?: string
    currency?: string
  }
  features: Array<{
    text: string
    included?: boolean
  }>
  ctaText: string
  ctaHref: string
  featured?: boolean
  className?: string
}

export function PricingCard({
  title,
  subtitle,
  price,
  features,
  ctaText,
  ctaHref,
  featured = false,
  className = ''
}: PricingCardProps) {
  const classes = [
    'marketing-pricing-card',
    featured && 'marketing-pricing-card-featured',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="marketing-pricing-header">
        <h3 className="marketing-pricing-title">{title}</h3>
        {subtitle && (
          <p className="marketing-pricing-subtitle">{subtitle}</p>
        )}
        <div className="marketing-pricing-price">
          {price.currency && (
            <span className="marketing-pricing-currency">{price.currency}</span>
          )}
          <span className="marketing-pricing-amount">{price.amount}</span>
          {price.period && (
            <span className="marketing-pricing-period">/{price.period}</span>
          )}
        </div>
      </div>
      
      <ul className="marketing-pricing-features">
        {features.map((feature, index) => (
          <li
            key={index}
            className={`marketing-pricing-feature ${
              feature.included === false ? 'marketing-pricing-feature-unavailable' : ''
            }`}
          >
            {feature.text}
          </li>
        ))}
      </ul>
      
      <a
        href={ctaHref}
        className="marketing-button marketing-button-primary marketing-button-md marketing-button-full"
      >
        {ctaText}
      </a>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  className = ''
}: FeatureCardProps) {
  const classes = [
    'marketing-feature-card',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="marketing-feature-icon">
        {icon}
      </div>
      <h3 className="marketing-feature-title">{title}</h3>
      <p className="marketing-feature-description">{description}</p>
    </div>
  )
}

interface TestimonialCardProps {
  content: string
  author: {
    name: string
    title: string
    avatar?: string
    initials?: string
  }
  className?: string
}

export function TestimonialCard({
  content,
  author,
  className = ''
}: TestimonialCardProps) {
  const classes = [
    'marketing-testimonial-card',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <p className="marketing-testimonial-content">{content}</p>
      <div className="marketing-testimonial-author">
        <div className="marketing-testimonial-avatar">
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} />
          ) : (
            author.initials || author.name.charAt(0)
          )}
        </div>
        <div className="marketing-testimonial-details">
          <h4>{author.name}</h4>
          <p>{author.title}</p>
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  number: string | number
  label: string
  className?: string
}

export function StatsCard({
  number,
  label,
  className = ''
}: StatsCardProps) {
  const classes = [
    'marketing-stats-card',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className="marketing-stats-number">{number}</span>
      <span className="marketing-stats-label">{label}</span>
    </div>
  )
}