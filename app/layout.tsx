'use client'

import { Archivo } from 'next/font/google'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'

// Initialize the Archivo font
const archivo = Archivo({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
})

// Import your global styles
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/navpanel.css'
import '@/styles/notes.css'
import '@/styles/topics.css'
import '@/styles/bookmarks.css'
import '@/styles/profile.css'
import '@/styles/ui.css'
import '@/styles/note-sendtotopic.css' 
import '@/styles/note-topicchange.css' 
import '@/styles/home.css' 
import '@/styles/profileedit.css' 
//import '@/styles/notifications.css'
import '@/styles/topic-sections.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't need auth
  const publicRoutes = ['/', '/signin', '/signup', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <html lang="en" className={archivo.variable}>
      <body className="font-archivo">
          <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}