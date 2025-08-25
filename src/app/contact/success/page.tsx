import React from 'react'
import type { Metadata } from 'next'
import SuccessPageClient from './SuccessPageClient'

export const metadata: Metadata = {
  title: 'Customer Success - LibraryCard',
  description: 'Get help setting up your community library and onboarding users. Our customer success team will guide you through every step.',
}

export default function SuccessPage() {
  return <SuccessPageClient />
}