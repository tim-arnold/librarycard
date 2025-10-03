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
        <link rel="preload" href="/images/hero-bg.jpg" as="image" fetchPriority="high" />
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: `
          html { max-width: 100vw; overflow-x: hidden; }
          body { margin: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .hero-background-section {
            position: relative;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            min-height: 80vh;
          }
          .marketing-text-center { text-align: center; }
          .marketing-heading-display {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 700;
            line-height: 1.1;
            margin: 0;
          }
          .marketing-text-lead {
            font-size: clamp(1.125rem, 2vw, 1.5rem);
            line-height: 1.6;
          }
        `}} />
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: optional;
            src: url('/fonts/inter-400.woff2') format('woff2');
            size-adjust: 107%;
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            font-display: optional;
            src: url('/fonts/inter-500.woff2') format('woff2');
            size-adjust: 107%;
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 600;
            font-display: optional;
            src: url('/fonts/inter-600.woff2') format('woff2');
            size-adjust: 107%;
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 700;
            font-display: optional;
            src: url('/fonts/inter-700.woff2') format('woff2');
            size-adjust: 107%;
          }
          @font-face {
            font-family: 'Nunito';
            font-style: normal;
            font-weight: 400;
            font-display: optional;
            src: url('/fonts/nunito-400.woff2') format('woff2');
            size-adjust: 100%;
          }
          @font-face {
            font-family: 'Nunito';
            font-style: normal;
            font-weight: 500;
            font-display: optional;
            src: url('/fonts/nunito-500.woff2') format('woff2');
            size-adjust: 100%;
          }
          @font-face {
            font-family: 'Nunito';
            font-style: normal;
            font-weight: 600;
            font-display: optional;
            src: url('/fonts/nunito-600.woff2') format('woff2');
            size-adjust: 100%;
          }
          @font-face {
            font-family: 'Nunito';
            font-style: normal;
            font-weight: 700;
            font-display: optional;
            src: url('/fonts/nunito-700.woff2') format('woff2');
            size-adjust: 100%;
          }
        `}} />
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