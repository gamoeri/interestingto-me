// components/NewNavPanel.jsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

// Logo SVG
const LogoSVG = () => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 40 40" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M20 5C11.716 5 5 11.716 5 20C5 28.284 11.716 35 20 35C28.284 35 35 28.284 35 20C35 11.716 28.284 5 20 5ZM20 7C27.18 7 33 12.82 33 20C33 27.18 27.18 33 20 33C12.82 33 7 27.18 7 20C7 12.82 12.82 7 20 7Z" 
      fill="#4F46E5" 
    />
    <path 
      d="M28 20C28 15.582 24.418 12 20 12C15.582 12 12 15.582 12 20C12 24.418 15.582 28 20 28C24.418 28 28 24.418 28 20ZM20 14C23.314 14 26 16.686 26 20C26 23.314 23.314 26 20 26C16.686 26 14 23.314 14 20C14 16.686 16.686 14 20 14Z" 
      fill="#4F46E5" 
      opacity="0.6" 
    />
    <path 
      d="M30 10L10 30M10 10L30 30" 
      stroke="#4F46E5" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </svg>
)

// Icons
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

const ExploreIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ marginRight: '8px' }}
  >
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

const BookmarkIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ marginRight: '8px' }}
  >
    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
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

const SettingsIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
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
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
)

const NotificationIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
  </svg>
)

export default function NewNavPanel({ currentPath }) {
  // Get data from contexts
  const { 
    userProfile, 
    user,
    logout,
    loading: authLoading 
  } = useAuth()
  
  const { 
    topics = [], 
    loading: topicsLoading 
  } = useTopics()
  
  // State for topics dropdown (default open)
  const [topicsOpen, setTopicsOpen] = useState(true)
  
  // Added state for notification count
  const [unreadCount, setUnreadCount] = useState(0)

  // Handle toggle topics with useCallback to optimize performance
  const handleToggleTopics = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setTopicsOpen(prev => !prev);
  }, []);
  
  // Added effect to fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const unreadQuery = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          where('read', '==', false),
          where('expiresAt', '>', Timestamp.now())
        );
        
        const snapshot = await getDocs(unreadQuery);
        setUnreadCount(snapshot.docs.length);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Set up a refresh interval (every minute)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Combine loading states
  const isLoading = authLoading || topicsLoading

  // Simple loading state
  if (isLoading || !userProfile) {
    return (
      <div className="nav-panel">
        <div className="nav-container">
          <div className="text-placeholder" style={{width: '80%', height: '1.5rem'}}></div>
          <div className="text-placeholder" style={{width: '70%', height: '1.5rem'}}></div>
          <div className="text-placeholder" style={{width: '60%', height: '1.5rem'}}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="nav-panel">
      {/* Logo Placeholder */}
      <div className="logo-placeholder">
        <div className="logo-content">
          <LogoSVG />
        </div>
      </div>
      
      <div className="nav-scroll-area">
        {/* Main Navigation */}
        <div className="nav-container">
          <div className="nav-list">
            {/* Home */}
            <div className={`nav-item ${currentPath === '/home' ? 'nav-item-active' : ''}`}>
              <Link href="/home" className="nav-item-content">
                <HomeIcon />
                <span>HOME</span>
              </Link>
            </div>

            {/* Bookmarks */}
            <div className={`nav-item ${currentPath === '/bookmarks' ? 'nav-item-active' : ''}`}>
              <Link href="/bookmarks" className="nav-item-content">
                <BookmarkIcon />
                <span>BOOKMARKS</span>
              </Link>
            </div>

            {/* Explore (coming soon) - properly disabled */}
            <div className="nav-item disabled">
                <div className="nav-item-content">
                  <ExploreIcon />
                  <span>EXPLORE</span>
                  <span className="coming-soon-badge">Coming Soon</span>
                </div>
            </div>

            {/* Personal Notes */}
            <div className={`nav-item ${currentPath === '/notes' ? 'nav-item-active' : ''}`}>
              <Link href="/notes" className="nav-item-content">
                <NotesIcon />
                <span>PERSONAL NOTES</span>
              </Link>
            </div>
            
            {/* Topics dropdown section */}
            <div className="nav-item">
               <div 
                 className="nav-item-content topic-dropdown"
                onClick={handleToggleTopics}
               >
                  <span className="dropdown-icon" style={{ display: 'inline-block', width: '10px', textAlign: 'center' }}>
                    {topicsOpen ? '▼' : '►'}
                  </span>
                  <span>Topics</span>
                </div>
              </div>
            
            {/* Topics List - shown only when dropdown is open */}
            {topicsOpen && topics.length > 0 && (
              <div className="nav-list topic-subitems">
                {topics.map(topic => (
                  <div 
                    key={topic.id} 
                    className={`nav-item ${currentPath === `/topics/${topic.id}` ? 'nav-item-active' : ''}`}
                  >
                    <Link 
                      href={`/topics/${topic.id}`}
                      className="nav-item-content"
                    >
                      {topic.name}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Card at bottom */}
      <div className="profile-card-fixed-container">
        <div className="nav-divider"></div>
        <Link href="/home" className="profile-card">
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
        
        {/* Action buttons - ICONS ONLY */}
        <div className="action-buttons-container">
          <Link 
            href="/profile" 
            className={`action-button-icon ${currentPath === '/profile' ? 'active' : ''}`}
            title="Settings"
          >
            <SettingsIcon />
          </Link>
          <Link 
            href="/notifications" 
            className={`action-button-icon ${currentPath === '/notifications' ? 'active' : ''}`}
            title="Notifications"
          >
            <NotificationIcon />
            {unreadCount > 0 && (
              <div className="notification-badge notification-badge-small">{unreadCount}</div>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}