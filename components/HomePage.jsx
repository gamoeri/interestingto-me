// @/components/Home.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

export default function Home() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const { activeTopics, bookmarkedTopics } = useTopics()
  
  const [topicUpdates, setTopicUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  // Track expanded state for each update
  const [expandedUpdates, setExpandedUpdates] = useState({})
  // Track like loading state
  const [likingInProgress, setLikingInProgress] = useState({})

  // Fetch updates for bookmarked topics
  useEffect(() => {
    const fetchTopicUpdates = async () => {
      if (!user || !bookmarkedTopics || bookmarkedTopics.length === 0) {
        setTopicUpdates([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Get the IDs of bookmarked topics
        const bookmarkedTopicIds = bookmarkedTopics.map(topic => topic.id)
        
        // First try to fetch topic_updates collection
        try {
          const topicUpdatesQuery = query(
            collection(db, 'topic_updates'),
            where('topicId', 'in', bookmarkedTopicIds),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
          
          const updatesSnapshot = await getDocs(topicUpdatesQuery)
          
          // Process each update and add user data
          if (!updatesSnapshot.empty) {
            const updates = await Promise.all(updatesSnapshot.docs.map(async doc => {
              const updateData = {
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || []
              }
              
              // Fetch user profile for this update
              if (updateData.userId) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', updateData.userId))
                  if (userDoc.exists()) {
                    updateData.userProfile = userDoc.data()
                  }
                } catch (error) {
                  console.error('Error fetching user for update:', error)
                }
              }
              
              // Fetch topic data
              if (updateData.topicId) {
                try {
                  const topicDoc = await getDoc(doc(db, 'topics', updateData.topicId))
                  if (topicDoc.exists()) {
                    updateData.topicData = topicDoc.data()
                  }
                } catch (error) {
                  console.error('Error fetching topic for update:', error)
                }
              }
              
              return updateData
            }))
            
            setTopicUpdates(updates)
            setLoading(false)
            return
          }
        } catch (error) {
          console.log('No topic_updates collection found or error:', error)
          // Continue to fallback method
        }
        
        // Fallback: get the most recent notes from bookmarked topics
        const bookmarkedNotesQuery = query(
          collection(db, 'notes'),
          where('topicIds', 'array-contains-any', bookmarkedTopicIds),
          orderBy('timestamp', 'desc'),
          limit(20)
        )
        
        const notesSnapshot = await getDocs(bookmarkedNotesQuery)
        const notes = await Promise.all(notesSnapshot.docs.map(async noteDoc => {
          const noteData = {
            id: noteDoc.id,
            ...noteDoc.data(),
            type: 'note',
            likes: noteDoc.data().likes || []
          }
          
          // Fetch author info
          if (noteData.authorId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', noteData.authorId))
              if (userDoc.exists()) {
                noteData.userProfile = userDoc.data()
              }
            } catch (error) {
              console.error('Error fetching note author:', error)
            }
          }
          
          // Get topic info
          if (noteData.topicIds && noteData.topicIds.length > 0) {
            try {
              const topicDoc = await getDoc(doc(db, 'topics', noteData.topicIds[0]))
              if (topicDoc.exists()) {
                noteData.topicData = topicDoc.data()
                noteData.topicId = noteData.topicIds[0]
              }
            } catch (error) {
              console.error('Error fetching topic for note:', error)
            }
          }
          
          return noteData
        }))
        
        setTopicUpdates(notes)
      } catch (error) {
        console.error('Error fetching topic updates:', error)
        setTopicUpdates([])
      } finally {
        setLoading(false)
      }
    }
    
    if (bookmarkedTopics && bookmarkedTopics.length > 0) {
      fetchTopicUpdates()
    } else {
      setLoading(false)
    }
  }, [user, bookmarkedTopics])

  // Handle topic selection
  const handleSelectTopic = (topicId) => {
    router.push(`/topics/${topicId}`)
  }
  
  // Handle user profile click
  const handleUserClick = (userId) => {
    if (userId) {
      router.push(`/users/${userId}`)
    }
  }

  // Toggle expanded state for a specific update
  const toggleExpand = (updateId, e) => {
    e.stopPropagation() // Prevent clicking "See more" from navigating to topic
    setExpandedUpdates(prev => ({
      ...prev,
      [updateId]: !prev[updateId]
    }))
  }
  
  // Handle liking an update
  const handleLike = async (update, e) => {
    e.stopPropagation() // Prevent navigating to topic
    
    if (!user || likingInProgress[update.id]) return
    
    setLikingInProgress(prev => ({ ...prev, [update.id]: true }))
    
    try {
      const isLiked = update.likes?.includes(user.uid)
      const collection = update.type === 'note' ? 'notes' : 'topic_updates'
      const updateRef = doc(db, collection, update.id)
      
      if (isLiked) {
        // Unlike
        await updateDoc(updateRef, {
          likes: arrayRemove(user.uid)
        })
        
        // Update local state
        setTopicUpdates(prev => 
          prev.map(item => 
            item.id === update.id 
              ? { ...item, likes: item.likes.filter(id => id !== user.uid) } 
              : item
          )
        )
      } else {
        // Like
        await updateDoc(updateRef, {
          likes: arrayUnion(user.uid)
        })
        
        // Update local state
        setTopicUpdates(prev => 
          prev.map(item => 
            item.id === update.id 
              ? { ...item, likes: [...item.likes, user.uid] } 
              : item
          )
        )
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikingInProgress(prev => ({ ...prev, [update.id]: false }))
    }
  }

  // Format timestamp function
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="content-panel home-page-container">
      {/* Sticky header with tab and bookmarks link */}
      <div className="home-tabs-header">
        <div className="tab-header">
          <div className="tab-buttons">
            <button className="tab-button active">
              Updates
            </button>
          </div>
          <Link href="/bookmarks" className="bookmarks-link">
            Manage Bookmarks ({bookmarkedTopics.length})
          </Link>
        </div>
      </div>
      
      {/* Updates feed content */}
      <div className="updates-feed-container">
        {topicUpdates.length > 0 ? (
          <div className="updates-list">
            {topicUpdates.map(update => {
              // Determine if content should be truncated
              const contentText = update.type === 'note' 
                ? update.content 
                : update.sectionData?.content;
              
              const isLongContent = contentText && contentText.length > 500;
              const isExpanded = expandedUpdates[update.id] || false;
              
              // Format content with truncation or expansion
              const displayContent = isLongContent && !isExpanded 
                ? `${contentText.substring(0, 500)}...` 
                : contentText || 'No content';
                
              // Check if user has liked this update
              const isLiked = user && update.likes?.includes(user.uid);
              
              return (
                <div key={update.id} className="update-item">
                  <div className="update-header">
                    {/* User profile picture */}
                    <div 
                      className="user-avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(update.userProfile?.id);
                      }}
                    >
                      {update.userProfile?.profilePic ? (
                        <img 
                          src={update.userProfile.profilePic} 
                          alt={update.userProfile.displayName || 'User'}
                        />
                      ) : (
                        <div className="user-initial">
                          {update.userProfile?.displayName ? update.userProfile.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    
                    <div className="update-info">
                      {/* Activity description with clickable elements */}
                      <div className="activity-description">
                        <span 
                          className="username"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(update.userProfile?.id);
                          }}
                        >
                          {update.userProfile?.displayName || 'Unknown user'}
                        </span>
                        {update.type === 'note' && ' added a note in '}
                        {update.actionType === 'section_added' && ' added a new section to '}
                        {update.actionType === 'section_updated' && ' updated a section in '}
                        {update.actionType === 'topic_created' && ' created a new topic '}
                        <span 
                          className="item-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTopic(update.topicId);
                          }}
                        >
                          {update.topicData?.title || update.topicData?.name || 'a topic'}
                        </span>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="update-time">
                        {formatDate(update.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content preview */}
                  <div className="update-content">
                    {update.type === 'note' ? (
                      <div>
                        <div className="note-text">
                          {displayContent}
                        </div>
                        {isLongContent && (
                          <button 
                            className="expand-button"
                            onClick={(e) => toggleExpand(update.id, e)}
                          >
                            {isExpanded ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                    ) : update.sectionData && (
                      <div>
                        {update.sectionData.title && (
                          <div className="content-title">{update.sectionData.title}</div>
                        )}
                        <div className="content-text">
                          {displayContent}
                        </div>
                        {isLongContent && (
                          <button 
                            className="expand-button"
                            onClick={(e) => toggleExpand(update.id, e)}
                          >
                            {isExpanded ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Like button */}
                  <div className="update-interactions">
                    <button 
                      className={`like-button ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(update, e)}
                      disabled={likingInProgress[update.id]}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill={isLiked ? "currentColor" : "none"}
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span className="like-count">{update.likes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No updates from your bookmarked topics</p>
            <Link href="/bookmarks" className="action-button">
              Find topics to bookmark
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}