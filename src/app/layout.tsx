import type { Metadata } from 'next'
import './globals.css'
import '@/styles/marketing/marketing.css'
import { Providers } from './providers'
import ConditionalAppLayout from '@/components/layout/ConditionalAppLayout'

export const metadata: Metadata = {
  title: 'LibraryCard - Community Library Management',
  description: 'Community-first library management platform. Bridge the gap between personal tools and institutional software. Perfect for apartments, retirement communities, and book clubs.',
  openGraph: {
    title: 'LibraryCard - Community Library Management',
    description: 'Community-first library management platform. Bridge the gap between personal tools and institutional software. Perfect for apartments, retirement communities, and book clubs.',
    url: 'https://librarycard.tim52.io',
    siteName: 'LibraryCard',
    images: [
      {
        url: 'https://librarycard.tim52.io/images/hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'LibraryCard - Community Library Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LibraryCard - Community Library Management',
    description: 'Community-first library management platform. Bridge the gap between personal tools and institutional software. Perfect for apartments, retirement communities, and book clubs.',
    images: ['https://librarycard.tim52.io/images/hero-bg.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: `
          html { max-width: 100vw; overflow-x: hidden; }
          body { margin: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .hero-background-section { position: relative; min-height: 80vh; background-color: var(--marketing-primary, #6d4c2e); }
          @media (max-width: 768px) { .hero-background-section { min-height: 60vh; } }
          .marketing-text-center { text-align: center; }
          .marketing-heading-display { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; line-height: 1.1; margin: 0; color: white; }
          .marketing-text-lead { font-size: clamp(1.125rem, 2vw, 1.5rem); line-height: 1.6; }
          .marketing-flex { display: flex; }
          .marketing-flex-col { flex-direction: column; }
          .marketing-items-center { align-items: center; }
          .marketing-justify-center { justify-content: center; }
          .marketing-justify-between { justify-content: space-between; }
          .marketing-gap-2 { gap: 0.5rem; }
          .marketing-gap-4 { gap: 1rem; }
          .marketing-gap-8 { gap: 2rem; }
          .marketing-hidden-mobile { display: none; }
          .marketing-hidden-desktop { display: block; }
          .header-desktop-only { display: none !important; }
          .header-mobile-only { display: flex !important; }
          @media (min-width: 768px) {
            .marketing-hidden-mobile { display: flex; }
            .marketing-hidden-desktop { display: none; }
            .marketing-flex-md-row { flex-direction: row !important; }
          }
          @media (min-width: 1160px) {
            .header-desktop-only { display: flex !important; }
            .header-mobile-only { display: none !important; }
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
        </Providers>
      </body>
    </html>
  )
}