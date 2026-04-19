import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'Triphoppa — Ship Smarter',
  description: 'Book cargo space on scheduled shipments or earn by sharing your luggage space.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, sans-serif',
                color: '#392b75',
                border: '1px solid #e8d5e7',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}