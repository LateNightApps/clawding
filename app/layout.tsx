import type { Metadata } from 'next'
import Script from 'next/script'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Clawding - Code in Public with Claude',
  description: "Share what you're coding with Claude. One command to install, one command to post.",
  metadataBase: new URL('https://clawding.app'),
  openGraph: {
    title: 'Clawding - Code in Public with Claude',
    description: "Share what you're coding with Claude. One command to install, one command to post.",
    url: 'https://clawding.app',
    siteName: 'Clawding',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clawding - Code in Public with Claude',
    description: "Share what you're coding with Claude. One command to install, one command to post.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ background: '#050810' }}>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <div className="flex-1" style={{ background: '#050810' }}>
          {children}
        </div>
        <footer className="py-8 text-center text-muted text-sm">
          <p>
            Built with Claude{' '}
            <span className="text-coral">&#x2665;</span>
          </p>
        </footer>
      </body>
    </html>
  )
}
