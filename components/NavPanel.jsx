// components/NavPanel.jsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'

export default function NavPanel({ currentPath }) {
  // Get data from contexts
  const { 
    userProfile, 
    logout,
    loading: authLoading 
  } = useAuth()
  
  const { 
    activeTopics, 
    archivedTopics, 
    loading: topicsLoading 
  } = useTopics()

  // Add debugging logs
  console.log('[NavPanel] Auth Loading:', authLoading)
  console.log('[NavPanel] Topics Loading:', topicsLoading)
  
  if (userProfile) {
    console.log('[NavPanel] UserProfile Details:', {
      id: userProfile.id,
      displayName: userProfile.displayName,
      hasProfilePic: !!userProfile.profilePic,
      keys: Object.keys(userProfile),
      fullObject: JSON.stringify(userProfile)
    })
  } else {
    console.log('[NavPanel] UserProfile not loaded yet')
  }
  
  console.log('[NavPanel] Active Topics:', activeTopics.length, 
    activeTopics.map(t => ({ id: t.id, title: t.title })))
  console.log('[NavPanel] Archived Topics:', archivedTopics.length, 
    archivedTopics.map(t => ({ id: t.id, title: t.title })))

  // Combine loading states
  const isLoading = authLoading || (topicsLoading && !userProfile)

  // Simple loading state
  if (isLoading || !userProfile) {
    console.log('[NavPanel] Rendering loading state', {
      reasonAuthLoading: authLoading,
      reasonTopicsLoading: topicsLoading,
      reasonNoUserProfile: !userProfile
    })
    return (
      <div className="nav-panel">
        <div className="profile-section">
          <div className="profile-image-placeholder"></div>
          <div className="text-placeholder" style={{width: '80%', height: '1.5rem'}}></div>
        </div>
        <div className="topics-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-placeholder" style={{width: '100%', height: '1rem', margin: '0.5rem 0'}}></div>
          ))}
        </div>
      </div>
    )
  }

  console.log('[NavPanel] Rendering complete nav panel')
  return (
    <div className="nav-panel">
      {/* Profile Card at top */}
      <Link href="/profile" className="profile-card">
        <div className="profile-pic-wrapper">
          {userProfile.profilePic ? (
            <img 
              src={userProfile.profilePic} 
              alt="Profile"
              className="profile-pic"
            />
          ) : (
            <div className="profile-pic-placeholder">
              {userProfile.displayName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name">{userProfile.displayName || 'User'}</div>
          <div className="profile-bio-preview">{userProfile.bio || 'Enter your bio'}</div>
        </div>
      </Link>
      
      {/* Navigation Links */}
      <div className="nav-container">
        <div className="nav-title">Main Navigation</div>
        <div className="nav-list">
          <div className={`nav-item ${currentPath === '/notes' ? 'nav-item-active' : ''}`}>
            <Link href="/notes" className="nav-item-content">
              <span>Notes</span>
            </Link>
          </div>
          <div className={`nav-item ${currentPath === '/home' ? 'nav-item-active' : ''}`}>
            <Link href="/home" className="nav-item-content">
              <span>Home</span>
            </Link>
          </div>
          <div className={`nav-item ${currentPath === '/bookmarks' ? 'nav-item-active' : ''}`}>
            <Link href="/bookmarks" className="nav-item-content">
              <span>Bookmarks</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Topics Section */}
      <div className="nav-container">
        <div className="nav-title">Your Topics</div>
        <div className="nav-list">
          {activeTopics.length > 0 ? (
            activeTopics.map(topic => {
              console.log(`[NavPanel] Rendering active topic: ${topic.id} - ${topic.title}`)
              return (
                <div key={topic.id} className={`nav-item ${currentPath === `/topics/${topic.id}` ? 'nav-item-active' : ''}`}>
                  <Link 
                    href={`/topics/${topic.id}`}
                    className="nav-item-content"
                  >
                    {topic.title}
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="nav-item-empty">No topics yet</div>
          )}
        </div>
      </div>
    </div>
  )
}