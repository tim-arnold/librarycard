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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
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