import React from 'react'
import { IconButton, Tooltip, Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

interface AccessibleIconProps {
  icon: React.ReactElement
  ariaLabel: string
  tooltip?: string
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  children?: React.ReactNode
  sx?: SxProps<Theme>
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
}

/**
 * Accessible icon component that provides proper ARIA labeling and optional tooltips
 * for screen readers while maintaining a clean visual interface.
 */
export default function AccessibleIcon({
  icon,
  ariaLabel,
  tooltip,
  onClick,
  children,
  sx,
  color = 'inherit',
  size = 'medium',
  disabled = false,
  className,
}: AccessibleIconProps) {
  // If it's clickable, wrap in IconButton
  if (onClick) {
    const iconButton = (
      <IconButton
        onClick={onClick}
        aria-label={ariaLabel}
        color={color}
        size={size}
        disabled={disabled}
        sx={sx}
        className={className}
      >
        {icon}
        {children}
      </IconButton>
    )

    // Add tooltip if provided
    if (tooltip) {
      return (
        <Tooltip title={tooltip} arrow>
          {iconButton}
        </Tooltip>
      )
    }

    return iconButton
  }

  // For non-interactive icons, just apply ARIA label
  const iconWithLabel = React.cloneElement(icon, {
    'aria-label': ariaLabel,
    role: 'img',
    sx: sx || icon.props.sx,
    className: className || icon.props.className,
  })

  // Add tooltip if provided for non-interactive icons
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          {iconWithLabel}
          {children}
        </Box>
      </Tooltip>
    )
  }

  return (
    <>
      {iconWithLabel}
      {children}
    </>
  )
}

// Helper component for screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Box>
  )
}