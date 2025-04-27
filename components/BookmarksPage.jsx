'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import Link from 'next/link'

export default function BookmarksPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeTopics, bookmarkedTopics, toggleBookmark, refreshBookmarks } = useTopics()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRemoving, setIsRemoving] = useState(false)

  // Log when bookmarkedTopics changes
  useEffect(() => {
    console.log('BookmarksPage: bookmarkedTopics updated', bookmarkedTopics?.length)
    if (user && bookmarkedTopics) {
      setLoading(false)
    }
  }, [user, bookmarkedTopics])

  // Handle topic selection
  const handleSelectTopic = useCallback((topicId) => {
    router.push(`/topics/${topicId}`)
  }, [router])
  
  // Handle bookmark toggling with improved error handling
  const handleBookmarkToggle = useCallback(async (topicId, e) => {
    try {
      e.preventDefault()
      e.stopPropagation()
      
      // Visual feedback that removing is in progress
      setIsRemoving(true)
      
      console.log('Attempting to toggle bookmark for:', topicId)
      await toggleBookmark(topicId)
      
      // Force refresh of bookmarks
      await refreshBookmarks?.()
      
      console.log('Bookmark toggle completed for:', topicId)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsRemoving(false)
    }
  }, [toggleBookmark, refreshBookmarks])

  // Clear search query
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Filter topics based on search query
  const filteredTopics = searchQuery 
    ? bookmarkedTopics?.filter(topic => 
        topic.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarkedTopics

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookmarks...</p>
      </div>
    )
  }

  return (
    <div className="content-panel">
      <div className="bookmarks-page">
        {/* Page Header */}
        <div className="page-header">
          <h1>Your Bookmarks</h1>
          <p className="bookmark-count">{bookmarkedTopics?.length || 0} saved topics</p>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search your bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-button"
              onClick={handleClearSearch}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        
        {/* Bookmarks Grid */}
        {filteredTopics?.length > 0 ? (
          <div className="bookmarks-grid">
            {filteredTopics.map(topic => (
              <div key={topic.id} className="bookmark-card" onClick={() => handleSelectTopic(topic.id)}>
                <div className="bookmark-card-content">
                  <h3 className="bookmark-title">{topic.title || topic.name}</h3>
                  {topic.description && (
                    <p className="bookmark-description">{topic.description}</p>
                  )}
                  <div className="bookmark-meta">
                    <div className="bookmark-info">
                      <span className="bookmark-author">
                        By {topic.ownerName || 'Unknown'}
                      </span>
                      <span className="bookmark-notes">
                        {topic.notesCount || 0} notes
                      </span>
                    </div>
                    <button 
                      className="bookmark-remove-button"
                      onClick={(e) => handleBookmarkToggle(topic.id, e)}
                      aria-label="Remove bookmark"
                      disabled={isRemoving}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h3>No results found</h3>
                <p>No bookmarks match your search for "{searchQuery}"</p>
                <button 
                  className="primary-button" 
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3>No bookmarks yet</h3>
                <p>You haven't bookmarked any topics yet</p>
                <Link href="/explore" className="primary-button">
                  Explore topics
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}