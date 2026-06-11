import type { Metadata } from 'next'
import './globals.css'

export const viewport = {
  themeColor: '#0b0c10',
}

export const metadata: Metadata = {
  title: 'Date | Calendar & Tasks',
  description: 'A modern, beautiful calendar-driven note-taking and task app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Date',
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
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <div className="page-container">
          <main className="content-shell">{children}</main>
        </div>
      </body>
    </html>
  )
}
