'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, TextField, Typography } from '@mui/material'

interface TOTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  label?: string
}

export default function TOTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  helperText,
  label = "Authentication Code"
}: TOTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Update digits when value prop changes
  useEffect(() => {
    const newDigits = value.padEnd(6, '').split('').slice(0, 6)
    setDigits(newDigits)
  }, [value])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [disabled])

  const handleDigitChange = (index: number, digit: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(digit)) return

    const newDigits = [...digits]
    newDigits[index] = digit.slice(-1) // Only take the last character

    setDigits(newDigits)
    
    const newValue = newDigits.join('').replace(/\s/g, '')
    onChange(newValue)

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (newValue.length === 6 && onComplete) {
      onComplete(newValue)
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current input is empty, focus previous input
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current input
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
        onChange(newDigits.join('').replace(/\s/g, ''))
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const paste = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (paste.length > 0) {
      const newDigits = paste.padEnd(6, '').split('').slice(0, 6)
      setDigits(newDigits)
      onChange(paste)
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newDigits.findIndex(d => !d)
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
      inputRefs.current[focusIndex]?.focus()

      if (paste.length === 6 && onComplete) {
        onComplete(paste)
      }
    }
  }

  return (
    <Box>
      {label && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          justifyContent: 'center',
          mb: helperText ? 1 : 0
        }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <TextField
            key={index}
            inputRef={(el) => { inputRefs.current[index] = el }}
            value={digits[index] || ''}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            error={error}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }
            }}
            sx={{
              width: 48,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: error ? 'error.main' : 'grey.300',
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: error ? 'error.main' : 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: error ? 'error.main' : 'primary.main',
                  borderWidth: 2
                }
              }
            }}
          />
        ))}
      </Box>
      {helperText && (
        <Typography 
          variant="caption" 
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  )
}