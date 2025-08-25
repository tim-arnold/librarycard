import React from 'react'
import type { Metadata } from 'next'
import EnterprisePageClient from './EnterprisePageClient'
<<<<<<< HEAD
=======
import { 
  Business, 
  Security, 
  Hub as Integration,
  Assessment,
  AccountBalance,
  Schedule,
  Phone
} from '@mui/icons-material'
import MarketingLayout from '@/components/marketing/layout/MarketingLayout'
import Container, { Section, Grid } from '@/components/marketing/ui/Container'
import { Heading, Text, Highlight } from '@/components/marketing/ui/Typography'
import Button from '@/components/marketing/ui/Button'
>>>>>>> LCWEB-16-library-ui-components

export const metadata: Metadata = {
  title: 'Enterprise Sales - LibraryCard',
  description: 'Discuss custom solutions, enterprise features, and pricing for large organizations. Get white-labeling, SSO, and dedicated support.',
}

export default function EnterprisePage() {
  return <EnterprisePageClient />
}