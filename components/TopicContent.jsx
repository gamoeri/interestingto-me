'use client'

import { useState, useEffect } from 'react'
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function TopicContent({ topicId, userId, onTopicDeleted, onBookmarkToggle }) {
  const router = useRouter()
  const [topic, setTopic] = useState(null)
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [topicOwner, setTopicOwner] = useState(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isArchived, setIsArchived] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pinnedNotes, setPinnedNotes] = useState([]) // New state for pinned notes
  
  // Check if current user is the owner of this topic
  const isOwner = userId === topic?.userId

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const topicDoc = await getDoc(doc(db, 'topics', topicId))
        if (topicDoc.exists()) {
          const topicData = topicDoc.data()
          setTopic(topicData)
          setContent(topicData.content || '')
          setNewTopicName(topicData.name || '')
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
          
          // Fetch comments
          const commentsSnapshot = await getDocs(
            query(collection(db, 'comments'), where('topicId', '==', topicId))
          )
          
          const commentsData = await Promise.all(
            commentsSnapshot.docs.map(async (commentDoc) => {
              const comment = { id: commentDoc.id, ...commentDoc.data() }
              
              // Fetch comment author info
              if (comment.userId) {
                const authorDoc = await getDoc(doc(db, 'users', comment.userId))
                if (authorDoc.exists()) {
                  const authorData = authorDoc.data()
                  comment.author = authorData.displayName || 'Unknown'
                  comment.profilePic = authorData.profilePic || null
                  comment.authorId = comment.userId // Store the author ID for linking
                }
              }
              
              return comment
            })
          )
          
          setComments(commentsData)
          
          // Fetch pinned notes
          // First check if topic has pinnedNoteIds array
          const pinnedNoteIds = topicData.pinnedNoteIds || []
          
          if (pinnedNoteIds.length > 0) {
            // Fetch each note by ID
            const pinnedNotesData = await Promise.all(
              pinnedNoteIds.map(async (noteId) => {
                const noteDoc = await getDoc(doc(db, 'notes', noteId))
                if (noteDoc.exists()) {
                  const noteData = { id: noteDoc.id, ...noteDoc.data() }
                  
                  // Fetch author info if not already included
                  if (noteData.authorId && !noteData.author) {
                    const authorDoc = await getDoc(doc(db, 'users', noteData.authorId))
                    if (authorDoc.exists()) {
                      const authorData = authorDoc.data()
                      noteData.author = authorData.displayName || 'Unknown'
                      noteData.profilePic = authorData.profilePic || null
                    }
                  }
                  
                  return noteData
                }
                return null
              })
            )
            
            // Filter out any null values (notes that weren't found)
            setPinnedNotes(pinnedNotesData.filter(Boolean))
          }
        } else {
          setError('Topic not found')
        }
      } catch (error) {
        console.error('Error fetching topic data:', error)
        setError('Failed to load topic data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTopic()
  }, [topicId, userId])

  // Navigate to a user's profile
  const navigateToUserProfile = (username) => {
    if (!username) return
    router.push(`/${username}`)
  }
  
  const handleSaveContent = async () => {
    if (!isOwner) return
    
    try {
      await updateDoc(doc(db, 'topics', topicId), {
        content,
        updatedAt: new Date().toISOString()
      })
      
      setIsEditing(false)
      
      // Update local state
      setTopic(prev => ({
        ...prev,
        content,
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content. Please try again.')
    }
  }
  
  const handleSaveSettings = async () => {
    if (!isOwner) return
    
    try {
      await updateDoc(doc(db, 'topics', topicId), {
        name: newTopicName,
        archived: isArchived,
        updatedAt: new Date().toISOString()
      })
      
      setIsSettingsOpen(false)
      
      // Update local state
      setTopic(prev => ({
        ...prev,
        name: newTopicName,
        archived: isArchived,
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    }
  }
  
  const handleDeleteTopic = async () => {
    if (!isOwner) return
    
    // Call the parent component's delete function
    if (typeof onTopicDeleted === 'function') {
      onTopicDeleted(topicId)
    } else {
      console.error('No delete callback provided')
      alert('Could not delete topic. Please try again.')
    }
  }
  
  // Function to unpin a note from the topic
  const handleUnpinNote = async (noteId) => {
    if (!isOwner) return
    
    try {
      // Remove the note ID from the topic's pinnedNoteIds array
      const topicRef = doc(db, 'topics', topicId)
      await updateDoc(topicRef, {
        pinnedNoteIds: arrayRemove(noteId)
      })
      
      // Update local state by removing the note from pinnedNotes
      setPinnedNotes(prev => prev.filter(note => note.id !== noteId))
      
      // Update the note's isPinned status (if you're tracking this on the note)
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        isPinned: false
      })
    } catch (error) {
      console.error('Error unpinning note:', error)
      alert('Failed to unpin note. Please try again.')
    }
  }
  
  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return
      
      const commentData = {
        content: newComment.trim(),
        topicId,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      }
      
      const docRef = await addDoc(collection(db, 'comments'), commentData)
      
      // Fetch author info to display immediately
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      const newCommentWithAuthor = {
        id: docRef.id,
        ...commentData,
        author: userData.displayName || currentUser.email.split('@')[0],
        profilePic: userData.profilePic || null,
        authorId: currentUser.uid
      }
      
      setComments(prev => [...prev, newCommentWithAuthor])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment. Please try again.')
    }
  }
  
  const toggleBookmark = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      if (isBookmarked) {
        // Remove bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayRemove(topicId)
        });
        setBookmarkCount(prev => prev - 1);
      } else {
        // Add bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayUnion(topicId)
        });
        setBookmarkCount(prev => prev + 1);
      }
      
      // Update local state
      setIsBookmarked(!isBookmarked);
      
      // Force a refresh of the bookmarked topics in the parent component
      // We need to add this to the props from the parent component
      if (typeof onBookmarkToggle === 'function') {
        onBookmarkToggle(topicId, !isBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    }
  };
  
  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Settings Panel Component
  const SettingsPanel = () => {
    return (
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Topic Settings</h2>
          <button 
            className="close-settings-button"
            onClick={() => {
              setNewTopicName(topic?.name || '');
              setIsArchived(topic?.archived || false);
              setIsSettingsOpen(false);
              setShowDeleteConfirm(false);
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
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
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
              disabled={!newTopicName.trim()}
            >
              Save Changes
            </button>
            <button 
              onClick={() => {
                setNewTopicName(topic?.name || '');
                setIsArchived(topic?.archived || false);
                setIsSettingsOpen(false);
                setShowDeleteConfirm(false);
              }}
              className="cancel-settings-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading-container">Loading topic data...</div>
  }
  
  if (error) {
    return <div className="error-container">{error}</div>
  }

  return (
    <div className="topic-content-wrapper">
      {/* Main Topic Content with white background */}
      <div className="topic-content">
        {isSettingsOpen && isOwner ? (
          <SettingsPanel />
        ) : (
          <>
            <div className="topic-header">
              <div className="topic-title-section">
                <div className="title-bookmark-row">
                  <h2 className="topic-title">{topic?.name || 'Unknown Topic'}</h2>
                  <div className="topic-actions">
                    {isOwner && (
                      <button 
                        className="settings-button"
                        onClick={() => setIsSettingsOpen(true)}
                        title="Topic settings"
                      >
                        ⚙️
                      </button>
                    )}
                    <button 
                      className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
                      onClick={toggleBookmark}
                    >
                      {isBookmarked ? 'Bookmarked ★' : 'Bookmark ☆'}
                    </button>
                  </div>
                </div>
                
                <div className="topic-metadata">
                  {topicOwner && (
                    <div className="topic-owner">
                      Created by: {' '}
                      <span 
                        className="owner-name clickable"
                        onClick={() => navigateToUserProfile(topicOwner.displayName)}
                        style={{ 
                          cursor: 'pointer', 
                          color: '#2563eb',
                          textDecoration: 'underline',
                          fontWeight: '500'
                        }}
                      >
                        {topicOwner.displayName}
                      </span>
                    </div>
                  )}
                  
                  <div className="topic-dates">
                    <div className="created-date">
                      Created: <span>{formatDate(topic?.createdAt)}</span>
                    </div>
                    {topic?.updatedAt && topic.updatedAt !== topic.createdAt && (
                      <div className="updated-date">
                        Last updated: <span>{formatDate(topic.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bookmark-count">
                    <span>{bookmarkCount}</span> {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pinned Notes Section */}
            <div className="pinned-notes-section">
              <h3 className="section-title">Pinned Resources</h3>
              
              {pinnedNotes.length > 0 ? (
                <div className="pinned-notes-grid">
                  {pinnedNotes.map(note => (
                    <div key={note.id} className="pinned-note-card">
                      <div className="pinned-note-content">
                        <div className="pinned-note-header">
                          <div className="note-author-info">
                            {note.profilePic ? (
                              <img 
                                src={note.profilePic} 
                                alt={`${note.author}'s avatar`}
                                className="avatar-small"
                              />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {note.author ? note.author.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                            <span className="note-author-name">{note.author}</span>
                          </div>
                          
                          {isOwner && (
                            <button 
                              className="unpin-button"
                              onClick={() => handleUnpinNote(note.id)}
                              title="Unpin this note"
                            >
                              📌
                            </button>
                          )}
                        </div>
                        
                        <p className="pinned-note-text">{note.content}</p>
                        
                        <div className="pinned-note-footer">
                          <span className="pinned-date">{formatDate(note.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-pinned-notes">
                  {isOwner ? (
                    <p>No pinned resources yet. Pin notes related to this topic to keep important information easily accessible.</p>
                  ) : (
                    <p>No pinned resources for this topic yet.</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="topic-content-section">
              {isEditing ? (
                <div className="content-edit-container">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="content-textarea"
                    placeholder="Add links, notes, or any content about this topic..."
                  />
                  <div className="content-actions">
                    <button 
                      onClick={handleSaveContent}
                      className="primary-button"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setContent(topic?.content || '')
                        setIsEditing(false)
                      }}
                      className="secondary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="content-display-container">
                  {content ? (
                    <div className="content-text">
                      {content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-content">
                      {isOwner ? 'No content yet. Click Edit to add content!' : 'No content has been added to this topic yet.'}
                    </p>
                  )}
                  {isOwner && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Comments Section Wrapper */}
      <div className="comments-section-wrapper">
        <div className="comments-section">
          <h3 className="comments-title">Comments</h3>
          
          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-textarea"
              required
            />
            <button type="submit" className="comment-submit">
              Post Comment
            </button>
          </form>
          
          {/* Comments list */}
          <div className="comments-list-container">
            {comments.length > 0 ? (
              <div className="comments-list">
                {comments
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <div className="comment-author">
                          {comment.profilePic ? (
                            <img 
                              src={comment.profilePic} 
                              alt={`${comment.author}'s avatar`}
                              className="comment-avatar"
                              onClick={() => navigateToUserProfile(comment.authorId)}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <div 
                              className="comment-avatar-placeholder"
                              onClick={() => navigateToUserProfile(comment.authorId)}
                              style={{ cursor: 'pointer' }}
                            >
                              {comment.author ? comment.author.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <span 
                            className="author-name clickable"
                            onClick={() => navigateToUserProfile(comment.authorId)}
                            style={{ 
                              cursor: 'pointer', 
                              color: '#2563eb',
                              textDecoration: 'underline'
                            }}
                          >
                            {comment.author || 'Anonymous'}
                          </span>
                        </div>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))
                }
              </div>
            ) : (
              <p className="empty-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}