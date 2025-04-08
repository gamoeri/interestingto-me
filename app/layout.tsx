'use client'

import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't need auth
  const publicRoutes = ['/', '/signin', '/signup', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <html lang="en">
      <body>
          <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
