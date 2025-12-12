import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Synapse Compass',
  description: 'A lightweight exploratory interface for Synapse.org',
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

