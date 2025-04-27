'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  orderBy,
  arrayUnion,
  arrayRemove,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

// Import our section components
import Section from './Section'
import AddSection from './AddSection'

export default function TopicContent({ topicId, userId, onTopicDeleted }) {
  const router = useRouter()
  const [topic, setTopic] = useState(null)
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [topicOwner, setTopicOwner] = useState(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [viewStyle, setViewStyle] = useState('timeline') // 'timeline' or 'compact'
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'
  
  // Check if current user is the owner of this topic
  const isOwner = userId === topic?.userId
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
  }
  
  // Fetch topic data
  const fetchTopicData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const topicDoc = await getDoc(doc(db, 'topics', topicId))
      if (topicDoc.exists()) {
        const topicData = topicDoc.data()
        setTopic(topicData)
        setTopicName(topicData.name || '')
        setIsArchived(topicData.archived || false)
        
        // Fetch topic owner info
        if (topicData.userId) {
          const ownerDoc = await getDoc(doc(db, 'users', topicData.userId))
          if (ownerDoc.exists()) {
            const userData = ownerDoc.data()
            setTopicOwner(userData)
          }
        }

        // Check if current user has bookmarked this topic
        const currentUser = auth.currentUser
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setIsBookmarked(userData.bookmarkedTopics?.includes(topicId) || false)
          }
        }
        
        // Count how many users have bookmarked this topic
        const usersSnapshot = await getDocs(collection(db, 'users'))
        let count = 0
        usersSnapshot.forEach(doc => {
          const userData = doc.data()
          if (userData.bookmarkedTopics && userData.bookmarkedTopics.includes(topicId)) {
            count++
          }
        })
        setBookmarkCount(count)
        
        // Fetch sections
        await fetchSections()
      } else {
        setError('Topic not found')
      }
    } catch (error) {
      console.error('Error fetching topic data:', error)
      setError('Failed to load topic data')
    } finally {
      setIsLoading(false)
    }
  }, [topicId])
  
  // Fetch sections
  const fetchSections = useCallback(async () => {
    try {
      // Query sections collection for this topic
      const sectionsQuery = query(
        collection(db, 'topics', topicId, 'sections'),
        where('deleted', '==', false),
        orderBy('createdAt', sortOrder === 'newest' ? 'desc' : 'asc')
      )
      
      const sectionsSnapshot = await getDocs(sectionsQuery)
      
      // Process sections
      const sectionsData = []
      
      for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionData = sectionDoc.data()
        
        // Add section with its ID
        sectionsData.push({
          id: sectionDoc.id,
          ...sectionData,
          // Convert timestamps to strings for easier handling
          createdAt: sectionData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: sectionData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })
      }
      
      setSections(sectionsData)
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }, [topicId, sortOrder])
  
  // Toggle bookmark
  const toggleBookmark = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return
      
      const userDocRef = doc(db, 'users', currentUser.uid)
      
      if (isBookmarked) {
        // Remove bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayRemove(topicId)
        })
        setBookmarkCount(prev => prev - 1)
      } else {
        // Add bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayUnion(topicId)
        })
        setBookmarkCount(prev => prev + 1)
      }
      
      // Update local state
      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      alert('Failed to update bookmark. Please try again.')
    }
  }
  
  // Add section handler
  const handleAddSection = (newSection) => {
    setSections(prev => [newSection, ...prev])
  }
  
  // Delete section handler
  const handleDeleteSection = (sectionId) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
  }
  
  // Handle save settings
  const handleSaveSettings = async () => {
    if (!isOwner) return
    
    try {
      // Validate
      if (!topicName.trim()) {
        alert('Topic name cannot be empty')
        return
      }
      
      // Update topic name and archived status directly on the topic document
      await updateDoc(doc(db, 'topics', topicId), {
        name: topicName.trim(),
        archived: isArchived,
        updatedAt: serverTimestamp()
      })
      
      setIsSettingsOpen(false)
      
      // Update local state
      setTopic(prev => ({
        ...prev,
        name: topicName.trim(),
        archived: isArchived,
        updatedAt: new Date().toISOString()
      }))
      
      console.log(`Topic ${topicId} name updated to: ${topicName} and archived status updated to: ${isArchived}`)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    }
  }
  
  // Handle delete topic
  const handleDeleteTopic = async () => {
    if (!isOwner) return
    
    try {
      // Call the parent component's delete function
      if (typeof onTopicDeleted === 'function') {
        onTopicDeleted(topicId)
      } else {
        console.error('No delete callback provided')
        alert('Could not delete topic. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic. Please try again.')
    }
  }
  
  // Initial data fetch
  useEffect(() => {
    fetchTopicData()
  }, [fetchTopicData])
  
  // Refetch sections when sort order changes
  useEffect(() => {
    if (!isLoading) {
      fetchSections()
    }
  }, [fetchSections, sortOrder])
  
  // Settings Panel Component
  const SettingsPanel = () => {
    return (
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Topic Settings</h2>
          <button 
            className="close-settings-button"
            onClick={() => {
              setTopicName(topic?.name || '')
              setIsArchived(topic?.archived || false)
              setIsSettingsOpen(false)
              setShowDeleteConfirm(false)
            }}
          >
            ×
          </button>
        </div>
        
        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="topic-name">Topic Name</label>
            <input
              id="topic-name"
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="settings-input"
              placeholder="Enter topic name"
            />
          </div>
          
          <div className="form-group archive-toggle">
            <label htmlFor="archive-toggle">Archive Status</label>
            <div className="toggle-container">
              <input
                id="archive-toggle"
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-label">
                {isArchived ? 'Archived' : 'Active'}
              </span>
            </div>
          </div>
          
          <div className="archive-info">
            {isArchived ? 
              'Archived topics are only visible to you and won\'t appear in other users\' feeds.' : 
              'Active topics are visible to all users and appear in their feeds.'}
          </div>
          
          {/* Delete Topic Section */}
          <div className="delete-topic-section">
            <h3>Danger Zone</h3>
            
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <p>Are you sure you want to delete this topic? This action cannot be undone.</p>
                <div className="delete-confirm-buttons">
                  <button 
                    onClick={handleDeleteTopic}
                    className="confirm-delete-button"
                    type="button"
                  >
                    Yes, Delete Topic
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="cancel-delete-button"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="delete-topic-button"
                type="button"
              >
                Delete Topic
              </button>
            )}
          </div>
          
          <div className="settings-actions">
            <button 
              onClick={handleSaveSettings}
              className="save-settings-button"
              disabled={!topicName.trim()}
            >
              Save Changes
            </button>
            <button 
              onClick={() => {
                setTopicName(topic?.name || '')
                setIsArchived(topic?.archived || false)
                setIsSettingsOpen(false)
                setShowDeleteConfirm(false)
              }}
              className="cancel-settings-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading topic content...</p>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          className="retry-button" 
          onClick={fetchTopicData}
        >
          Retry
        </button>
      </div>
    )
  }
  
  return (
    <div className="topic-content-wrapper">
      {/* Header */}
      <div className="topic-header-container">
        <div className="topic-header-content">
          <div className="topic-title-row">
            <h1 className="topic-title">{topic?.name || 'Unknown Topic'}</h1>
            <div className="topic-actions">
              {isOwner && (
                <button 
                  className="settings-link"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  Settings
                </button>
              )}
              <button 
                className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={toggleBookmark}
              >
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>
          
          <div className="topic-metadata">
            <div className="topic-info">
              {topicOwner && (
                <span className="topic-creator">
                  Created by: <strong>{topicOwner.displayName}</strong>
                </span>
              )}
              <span className="topic-created-date">
                {formatDate(topic?.createdAt)}
              </span>
              {topic?.updatedAt && topic.updatedAt !== topic.createdAt && (
                <span className="topic-updated-date">
                  Updated: {formatDate(topic.updatedAt)}
                </span>
              )}
              <span className="bookmark-count">
                {bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="topic-content">
        {isSettingsOpen ? (
          <SettingsPanel />
        ) : (
          <>
            {/* Add Section Control - simplified */}
            {isOwner && (
              <div className="add-section-compact">
                <AddSection 
                  topicId={topicId}
                  userId={userId}
                  onSectionAdded={handleAddSection}
                />
              </div>
            )}
            
            {/* View Controls */}
            <div className="view-controls">
              <div className="view-style-toggle">
                <span>View:</span>
                <button 
                  className={`view-toggle-btn ${viewStyle === 'timeline' ? 'active' : ''}`}
                  onClick={() => setViewStyle('timeline')}
                >
                  Timeline
                </button>
                <button 
                  className={`view-toggle-btn ${viewStyle === 'compact' ? 'active' : ''}`}
                  onClick={() => setViewStyle('compact')}
                >
                  Compact
                </button>
              </div>
              
              <div className="sort-order-toggle">
                <span>Sort:</span>
                <button 
                  className={`sort-toggle-btn ${sortOrder === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortOrder('newest')}
                >
                  Newest
                </button>
                <button 
                  className={`sort-toggle-btn ${sortOrder === 'oldest' ? 'active' : ''}`}
                  onClick={() => setSortOrder('oldest')}
                >
                  Oldest
                </button>
              </div>
            </div>
            
            {/* Sections List */}
            <div className={`sections-list ${viewStyle}`}>
              {sections.length > 0 ? (
                sections.map(section => (
                  <Section
                    key={section.id}
                    section={section}
                    topicId={topicId}
                    isOwner={isOwner}
                    currentUser={auth.currentUser || {}}
                    onDelete={handleDeleteSection}
                    viewStyle={viewStyle}
                  />
                ))
              ) : (
                <div className="empty-sections-message">
                  <p>This topic doesn't have any sections yet.</p>
                  {isOwner && (
                    <p>Use the section form above to add content to this topic.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}