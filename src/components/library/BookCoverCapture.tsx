'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material'
import { CameraAlt, Crop, Check, Refresh, Close } from '@mui/icons-material'
import Cropper from 'react-easy-crop'

const BOOK_ASPECT_RATIO = 2 / 3 // Width to height ratio (110x165 = 2:3 ratio)

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface BookCoverCaptureProps {
  title: string
  author: string
  onCoverCapture: (imageDataUrl: string) => void
  onCancel: () => void
}

export default function BookCoverCapture({
  title,
  author,
  onCoverCapture,
  onCancel
}: BookCoverCaptureProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    setError('')
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      streamRef.current = stream

      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)

    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please ensure camera permissions are granted.')
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const captureImage = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Try WebP first, fallback to JPEG if not supported
    let imageDataUrl = canvas.toDataURL('image/webp', 0.8)
    console.log('WebP code version: 2025-01-16-v2')
    // Check if WebP is actually supported (some browsers return PNG as fallback)
    if (!imageDataUrl.startsWith('data:image/webp')) {
      imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    }
    setCapturedImage(imageDataUrl)
    stopCamera()
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedImage = useCallback(async () => {
    if (!capturedImage || !croppedAreaPixels) return

    setIsProcessing(true)

    try {
      const image = new Image()
      image.src = capturedImage

      await new Promise((resolve) => {
        image.onload = resolve
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Could not get canvas context')

      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )

      // Try WebP first, fallback to JPEG if not supported
      let croppedImageDataUrl = canvas.toDataURL('image/webp', 0.8)
      if (!croppedImageDataUrl.startsWith('data:image/webp')) {
        croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      }
      onCoverCapture(croppedImageDataUrl)

    } catch (err) {
      console.error('Error creating cropped image:', err)
      setError('Failed to process image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, croppedAreaPixels, onCoverCapture])

  const retakePhoto = () => {
    setCapturedImage(null)
    setCroppedAreaPixels(null)
    startCamera()
  }

  if (capturedImage) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 2, pt: 1, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Adjust the crop area to frame the book cover
          </Typography>
        </Box>

        <Box sx={{ flex: 1, position: 'relative', minHeight: 280, maxHeight: 320 }}>
          <Cropper
            image={capturedImage}
            crop={crop}
            zoom={zoom}
            aspect={BOOK_ASPECT_RATIO}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{
              containerStyle: {
                background: '#000'
              }
            }}
          />
        </Box>

        <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={retakePhoto}
            startIcon={<Refresh />}
            disabled={isProcessing}
          >
            Retake
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={createCroppedImage}
              disabled={!croppedAreaPixels || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={16} /> : <Check />}
            >
              {isProcessing ? 'Processing...' : 'Use Cover'}
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 1, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Take a photo of "{title}" by {author}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!isScanning ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
              <CameraAlt sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Take a Photo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Position the book cover within your camera frame. The image will be automatically cropped to book proportions.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={startCamera}
                startIcon={<CameraAlt />}
                sx={{ mb: 2 }}
              >
                Start Camera
              </Button>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '500px',
                height: '280px',
                objectFit: 'cover',
                borderRadius: 8
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={stopCamera}
                startIcon={<Close />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={captureImage}
                startIcon={<Crop />}
              >
                Capture
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}