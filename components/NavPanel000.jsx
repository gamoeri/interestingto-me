// components/NavPanel.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'

const HomeIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ marginRight: '8px' }}
  >
    <path d="M12 2L0 12H3V22H9V16H15V22H21V12H24L12 2Z"/>
  </svg>
)

const NotesIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ marginRight: '8px' }}
  >
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z"/>
  </svg>
)

const TopicIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ marginRight: '8px' }}
  >
    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
  </svg>
)

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
  
  // State for topics dropdown (default open)
  const [topicsOpen, setTopicsOpen] = useState(true)

  // Combine loading states
  const isLoading = authLoading || (topicsLoading && !userProfile)

  // Simple loading state
  if (isLoading || !userProfile) {
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

  return (
    <div className="nav-panel">
      {/* Main Navigation */}
      <div className="nav-container">
        <div className="nav-list">
          <div className={`nav-item ${currentPath === '/home' ? 'nav-item-active' : ''}`}>
            <Link href="/home" className="nav-item-content">
              <HomeIcon />
              <span>Home</span>
            </Link>
          </div>
          <div className={`nav-item ${currentPath === '/notes' ? 'nav-item-active' : ''}`}>
            <Link href="/notes" className="nav-item-content">
              <NotesIcon />
              <span>My Notes</span>
            </Link>
          </div>
          
          {/* Topics dropdown section */}
          <div className="nav-item">
            <div 
              className="nav-item-content"
              onClick={() => setTopicsOpen(!topicsOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="dropdown-icon" style={{ fontSize: '0.8rem' }}>
                {topicsOpen ? '⇣' : '↪'}
              </span>
              <span>Topics</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Topics List - shown only when dropdown is open */}
      {topicsOpen && (
        <div className="nav-container" style={{ paddingTop: 0 }}>
          <div className="nav-list" style={{ paddingLeft: '16px' }}>
            {activeTopics.length > 0 ? (
              activeTopics.map(topic => {
                console.log(`[NavPanel] Rendering active topic: ${topic.id} - ${topic.name}`)
                return (
                  <div 
                    key={topic.id} 
                    className={`nav-item ${currentPath === `/topics/${topic.id}` ? 'nav-item-active' : ''}`}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <Link 
                      href={`/topics/${topic.id}`}
                      className="nav-item-content"
                    >
                      {topic.name}
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="nav-item-empty">No topics yet</div>
            )}
          </div>
        </div>
      )}
      
      {/* Spacer to push profile to bottom */}
      <div style={{ flex: 1 }}></div>
      
      {/* Profile Card at bottom */}
      <div className="nav-container" style={{ borderTop: '1px solid #e5e7eb', marginTop: 'auto' }}>
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
      </div>
    </div>
  )
}