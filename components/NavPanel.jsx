'use client'

import { useState, useEffect, useRef } from 'react'

export default function NavPanel({
  userProfile,
  topics = [],
  bookmarkedTopics = [],
  archivedTopics = [], 
  topicsLoading,
  activeSection,
  onSelectSection,
  onAddTopic,
  onDeleteTopic,
  onSignOut,
  onArchiveTopic = () => {}, 
  onUnarchiveTopic = () => {},
  isViewingOtherUser = false,
  viewedUserName = ''
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

  return (
    <>
      <div className="nav-panel">
        {/* Scrollable content area */}
        <div className="nav-scroll-area">
          {/* Main Navigation Pages - At the top */}
          <div className="nav-container">
            <ul className="nav-list">
              <li 
                className={`nav-item ${activeSection === 'user' ? 'nav-item-active' : ''}`}
                onClick={() => onSelectSection('user')}
              >
                <div className="nav-item-content">
                  <div className="nav-icon-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                      </svg>
                  </div>
                  <span>Notes</span>
                </div>
              </li>
              <li 
                className={`nav-item ${activeSection === 'home' ? 'nav-item-active' : ''}`}
                onClick={() => onSelectSection('home')}
              >
                <div className="nav-item-content">
                  <div className="nav-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span>Home</span>
                </div>
              </li>
              <li 
                className={`nav-item ${activeSection === 'search' ? 'nav-item-active' : ''}`}
                onClick={() => onSelectSection('search')}
              >
                <div className="nav-item-content">
                  <div className="nav-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <span>Search</span>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Divider */}
          <div className="nav-divider"></div>
          
          {/* When viewing another user's profile, show back button */}
          {isViewingOtherUser && (
            <div className="nav-container">
              <button 
                className="back-to-my-notes-button"
                onClick={() => onSelectSection('user')}
              >
                ← Back to my notes
              </button>
              
              <div className="viewed-user-info">
                <h3>Viewing: {viewedUserName || 'User'}</h3>
              </div>
            </div>
          )}
          
          {/* Topics Section */}
          <div className="nav-title">
            Topics
            {!isViewingOtherUser && (
              <button 
                className="edit-topics-button"
                onClick={() => setTopicsEditMode(!topicsEditMode)}
              >
                {topicsEditMode ? 'Done' : 'Edit'}
              </button>
            )}
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
                      className={`nav-item ${activeSection === `topic-${topic.id}` ? 'nav-item-active' : ''}`}
                    >
                      <div 
                        onClick={() => !topicsEditMode && onSelectSection(`topic-${topic.id}`)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>{topic.name}</span>
                        {topicsEditMode && !isViewingOtherUser && (
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
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                
                {!topicsEditMode && !isViewingOtherUser && (
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
          
          {/* Archive Section - Only show for the user's own profile */}
          {!isViewingOtherUser && archivedTopics && archivedTopics.length > 0 && (
            <div className="nav-container">
              <h2 className="nav-title">Archive</h2>
              <ul className="nav-list">
                {archivedTopics.map((topic) => (
                  <li 
                    key={topic.id}
                    className={`nav-item ${activeSection === `topic-${topic.id}` ? 'nav-item-active' : ''}`}
                    onClick={() => onSelectSection(`topic-${topic.id}`)}
                  >
                    <div className="archived-topic">
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
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Bookmarked Topics Section - Only show for the user's own profile */}
          {!isViewingOtherUser && bookmarkedTopics && bookmarkedTopics.length > 0 && (
            <div className="nav-container">
              <h2 className="nav-title">Bookmarked Topics</h2>
              <ul className="nav-list">
                {bookmarkedTopics.map((topic) => (
                  <li 
                    key={topic.id}
                    className={`nav-item ${activeSection === `topic-${topic.id}` ? 'nav-item-active' : ''}`}
                    onClick={() => onSelectSection(`topic-${topic.id}`)}
                  >
                    <div className="bookmarked-topic">
                      <span>{topic.name}</span>
                      <small className="topic-owner-label">by {topic.ownerName || 'Unknown'}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Fixed Profile Card - At the bottom, outside of scroll area */}
        {!isViewingOtherUser && (
          <div className="profile-card-fixed-container">
            <div className="nav-divider"></div>
            <div 
              className={`profile-card ${activeSection === 'user' ? 'profile-card-active' : ''}`}
              onClick={() => onSelectSection('user')}
            >
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
              
              {/* Kebab Menu Button - Just the button */}
              <button 
                ref={kebabButtonRef}
                className="kebab-menu-button"
                onClick={handleKebabClick}
                aria-label="Profile options"
              >
                ⋮
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Dropdown Menu - Rendered at the root level */}
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
          <button
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection('edit-profile');
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
            Account Settings
          </button>
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