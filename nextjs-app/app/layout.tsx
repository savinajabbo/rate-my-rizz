import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rate My Rizz',
  description: 'AI-powered rizz analysis using facial expressions and voice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

