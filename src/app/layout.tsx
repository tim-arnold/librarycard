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
          :root {
            --marketing-primary: #3b82f6;
            --marketing-secondary: #8b5cf6;
            --marketing-white: #ffffff;
            --marketing-spacing-2: 0.5rem;
            --marketing-spacing-4: 1rem;
            --marketing-spacing-6: 1.5rem;
            --marketing-spacing-8: 2rem;
            --marketing-spacing-12: 3rem;
            --marketing-radius-full: 9999px;
            --marketing-text-sm: 0.875rem;
            --marketing-text-lg: 1.125rem;
            --marketing-font-medium: 500;
          }
          html { max-width: 100vw; overflow-x: hidden; }
          body { margin: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .hero-background-section { position: relative; background-size: cover; background-position: center; background-repeat: no-repeat; min-height: 80vh; }
          .marketing-text-center { text-align: center; }
          .marketing-heading-display { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; line-height: 1.1; margin: 0; color: white; }
          .marketing-text-lead { font-size: clamp(1.125rem, 2vw, 1.5rem); line-height: 1.6; }
          .marketing-flex { display: flex; }
          .marketing-items-center { align-items: center; }
          .marketing-justify-center { justify-content: center; }
          .marketing-gap-4 { gap: var(--marketing-spacing-4); }
          .marketing-gap-8 { gap: var(--marketing-spacing-8); }
          .marketing-button { display: inline-flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-weight: 500; border-radius: 0.5rem; text-decoration: none; transition: all 0.15s; cursor: pointer; border: none; }
          .marketing-button-lg { font-size: var(--marketing-text-lg); padding: var(--marketing-spacing-4) var(--marketing-spacing-8); height: 52px; }
          .marketing-button-primary { background: linear-gradient(135deg, var(--marketing-primary) 0%, #2563eb 100%); color: var(--marketing-white); }
          .marketing-button-secondary { background: var(--marketing-white); color: var(--marketing-primary); border: 2px solid var(--marketing-primary); }
          .marketing-text-small { font-size: 0.875rem; line-height: 1.5; }
          .marketing-hidden-mobile { display: none; }
          @media (min-width: 768px) {
            .marketing-flex-md-row { flex-direction: row !important; }
            .marketing-hidden-mobile { display: block; }
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