'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function NavPanel({
  userProfile,
  topics = [],
  bookmarkedTopics = [],
  archivedTopics = [], 
  topicsLoading,
  onSignOut,
  onAddTopic,
  onDeleteTopic,
  onArchiveTopic = () => {}, 
  onUnarchiveTopic = () => {},
  currentPath
}) {
  const [newTopic, setNewTopic] = useState('')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [topicsEditMode, setTopicsEditMode] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const kebabButtonRef = useRef(null)

  const handleAddTopic = (e) => {
    e.preventDefault()
    if (newTopic.trim()) {
      onAddTopic(newTopic)
      setNewTopic('')
      setShowAddTopic(false)
    }
  }

  const handleKebabClick = (e) => {
    e.stopPropagation()
    
    // If opening the menu, calculate position
    if (!showProfileMenu) {
      const rect = kebabButtonRef.current.getBoundingClientRect()
      // Position above the button
      const menuHeight = 80 // Approximate height for 2 menu items
      setMenuPosition({
        top: rect.top - menuHeight, // Position above the button
        right: window.innerWidth - rect.right
      })
    }
    
    setShowProfileMenu(!showProfileMenu)
  }

  // Hide profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileMenu && 
          !kebabButtonRef.current.contains(e.target) && 
          !e.target.closest('.profile-dropdown-menu-portal')) {
        setShowProfileMenu(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileMenu])

  // Check if a path is active
  const isActive = (path) => {
    return currentPath === path
  }

  return (
    <>
      <div className="nav-panel">
        <div className="nav-scroll-area">
          {/* Main Navigation Pages - At the top */}
          <div className="nav-container">
            <ul className="nav-list">
              <li className={`nav-item ${isActive('/notes') ? 'nav-item-active' : ''}`}>
                <Link href="/notes" className="nav-item-content">
                  <div className="nav-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </div>
                  <span>Notes</span>
                </Link>
              </li>
              <li className={`nav-item ${isActive('/home') ? 'nav-item-active' : ''}`}>
                <Link href="/home" className="nav-item-content">
                  <div className="nav-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span>Home</span>
                </Link>
              </li>
              <li className={`nav-item ${isActive('/bookmarks') ? 'nav-item-active' : ''}`}>
                <Link href="/bookmarks" className="nav-item-content">
                  <div className="nav-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span>Bookmarks</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Divider */}
          <div className="nav-divider"></div>
          
          {/* Topics Section */}
          <div className="nav-title">
            Topics
            <button 
              className="edit-topics-button"
              onClick={() => setTopicsEditMode(!topicsEditMode)}
            >
              {topicsEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className={`nav-container ${topicsEditMode ? 'topic-edit-mode' : ''}`}>
            {topicsLoading ? (
              <p className="loading-text">Loading topics...</p>
            ) : (
              <>
                <ul className="nav-list">
                  {topics.map((topic) => (
                    <li 
                      key={topic.id}
                      className={`nav-item ${isActive(`/topics/${topic.id}`) ? 'nav-item-active' : ''}`}
                    >
                      {!topicsEditMode ? (
                        <Link href={`/topics/${topic.id}`} className="nav-item-content">
                          <span>{topic.name}</span>
                        </Link>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{topic.name}</span>
                          <div className="topic-actions">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Archive "${topic.name}" topic?`)) {
                                  onArchiveTopic(topic.id);
                                }
                              }}
                              className="archive-topic-button"
                              title="Archive topic"
                            >
                              📁
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${topic.name}" topic?`)) {
                                  onDeleteTopic(topic.id);
                                }
                              }}
                              className="delete-topic-button"
                              title="Delete topic"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                
                {!topicsEditMode && (
                  <>
                    {showAddTopic ? (
                      <form onSubmit={handleAddTopic} className="add-topic-form">
                        <input
                          type="text"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          placeholder="New topic name"
                          className="text-input"
                          autoFocus
                        />
                        <div className="button-row">
                          <button type="submit" className="primary-button">
                            Add
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowAddTopic(false)} 
                            className="secondary-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setShowAddTopic(true)} 
                        className="add-topic-button"
                      >
                        + Add Topic
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Archive Section */}
          {archivedTopics && archivedTopics.length > 0 && (
            <div className="nav-container">
              <h2 className="nav-title">Archive</h2>
              <ul className="nav-list">
                {archivedTopics.map((topic) => (
                  <li 
                    key={topic.id}
                    className={`nav-item ${isActive(`/topics/${topic.id}`) ? 'nav-item-active' : ''}`}
                  >
                    <Link href={`/topics/${topic.id}`} className="archived-topic">
                      <span>{topic.name}</span>
                      {topicsEditMode && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchiveTopic(topic.id);
                          }}
                          className="unarchive-topic-button"
                          title="Restore topic"
                        >
                          🔄
                        </button>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Fixed Profile Card */}
        <div className="profile-card-fixed-container">
          <div className="nav-divider"></div>
          <Link href="/profile" className={`profile-card ${isActive('/profile') ? 'profile-card-active' : ''}`}>
            <div className="profile-pic-wrapper">
              {userProfile?.profilePic ? (
                <img 
                  src={userProfile.profilePic} 
                  alt="Profile" 
                  className="profile-pic"
                />
              ) : (
                <div className="profile-pic-placeholder">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{userProfile?.displayName || 'User'}</h3>
              <p className="profile-bio-preview">{userProfile?.bio?.substring(0, 60) || 'No bio yet'}</p>
            </div>
            
            {/* Kebab Menu Button */}
            <button 
              ref={kebabButtonRef}
              className="kebab-menu-button"
              onClick={handleKebabClick}
              aria-label="Profile options"
            >
              ⋮
            </button>
          </Link>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      {showProfileMenu && (
        <div 
          className="profile-dropdown-menu-portal"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            minWidth: '150px',
            padding: '4px 0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link 
            href="/profile/edit"
            className="menu-item"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
            onClick={() => setShowProfileMenu(false)}
          >
            Account Settings
          </Link>
          <button
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              onSignOut();
              setShowProfileMenu(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              fontSize: '0.875rem'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </>
  )
}