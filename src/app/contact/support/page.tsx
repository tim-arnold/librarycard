import React from 'react'
import type { Metadata } from 'next'
import SupportPageClient from './SupportPageClient'

export const metadata: Metadata = {
  title: 'Technical Support - LibraryCard',
  description: 'Get help with technical issues, account problems, or general questions about LibraryCard. Our support team is here to help.',
}

export default function SupportPage() {
  return <SupportPageClient />
}