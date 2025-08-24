import type { Metadata } from 'next'
import './globals.css'
import '@/styles/marketing/marketing.css'
import { Providers } from './providers'
import CookieNotice from '@/components/layout/CookieNotice'
import ConditionalAppLayout from '@/components/layout/ConditionalAppLayout'

export const metadata: Metadata = {
  title: 'LibraryCard - Community Library Management',
  description: 'Community-first library management platform. Bridge the gap between personal tools and institutional software. Perfect for apartments, retirement communities, and book clubs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <Providers>
          <ConditionalAppLayout>
            {children}
          </ConditionalAppLayout>
          <CookieNotice />
        </Providers>
      </body>
    </html>
  )
}