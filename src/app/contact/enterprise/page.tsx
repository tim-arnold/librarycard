import React from 'react'
import type { Metadata } from 'next'
import EnterprisePageClient from './EnterprisePageClient'

export const metadata: Metadata = {
  title: 'Enterprise Sales - LibraryCard',
  description: 'Discuss custom solutions, enterprise features, and pricing for large organizations. Get white-labeling, SSO, and dedicated support.',
}

export default function EnterprisePage() {
  return <EnterprisePageClient />
}