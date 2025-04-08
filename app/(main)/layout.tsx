'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth} from '@/context/AuthContext' // Import AuthProvider too
import { TopicsProvider } from '@/context/TopicsContext' // Import the provider
import NavPanel from '@/components/NavPanel'

// Keep all your original CSS imports
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

function useBackgroundColor(color = '#f8f8f8') {
  useEffect(() => {
    document.body.style.backgroundColor = color
    return () => { document.body.style.backgroundColor = '' }
  }, [color])
}

export default function MainLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Auth state
  const { user, userProfile, loading: authLoading, logout } = useAuth()
  
  // UI state
  const [showRightPanel, setShowRightPanel] = useState(false)
  
  // Set background color
  useBackgroundColor(userProfile?.backgroundColor)

  // Route protection
  const publicRoutes = ['/', '/signin', '/signup', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Handle auth redirects
  useEffect(() => {
    if (authLoading) return
    
    if (!user && !isPublicRoute) {
      router.replace('/signin')
      return
    }
    
    if (user && ['/signin', '/signup'].includes(pathname)) {
      router.replace('/notes')
    }
  }, [user, authLoading, isPublicRoute, pathname, router])

  // Loading states
  if (authLoading || (!user && !isPublicRoute)) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Public routes (no layout)
  if (isPublicRoute) return children

  return (
    <TopicsProvider>
      <div className="profile-container">
        <div className="three-column-layout">
          {/* Left column - NavPanel */}
          <div className="left-column">
            <NavPanel currentPath={pathname} />
          </div>
          
          {/* Middle column - Content */}
          <div className="middle-column">
            {children}
          </div>
          
          {/* Right column - Optional */}
          <div className={`right-column ${showRightPanel ? 'show-mobile' : 'hide-mobile'}`}>
            <div className="empty-panel-placeholder" />
          </div>
        </div>
      </div>
    </TopicsProvider>
  )
}