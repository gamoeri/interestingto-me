'use client'

import { useState, useEffect, useRef } from 'react'
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
  arrayRemove,
  setDoc
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function TopicContent({ topicId, userId, onTopicDeleted, onBookmarkToggle }) {
  const router = useRouter()
  const [topic, setTopic] = useState(null)
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Remove the newTopicName state variable
  const topicNameInputRef = useRef(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [topicOwner, setTopicOwner] = useState(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isArchived, setIsArchived] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('notes') // State for active tab
  const [sentNotes, setSentNotes] = useState([])
  const [showSendNoteModal, setShowSendNoteModal] = useState(false)
  const [userNotes, setUserNotes] = useState([])
  const [selectedNotesToSend, setSelectedNotesToSend] = useState([])
  
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
          // We don't need to set the newTopicName state anymore
          // Use the direct archived property
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
          
          // Fetch sent notes for this topic
          await fetchSentNotes(topicId)
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
    
    // Fetch user's notes for the send note modal
    if (userId) {
      fetchUserNotes(userId)
    }
  }, [topicId, userId])

  // Fetch notes that have been sent to this topic
  const fetchSentNotes = async (topicId) => {
    try {
      // First check if the sentNotes collection exists for this topic
      const sentNotesRef = collection(db, 'topics', topicId, 'sentNotes')
      const sentNotesSnapshot = await getDocs(sentNotesRef)
      
      const sentNotesData = await Promise.all(
        sentNotesSnapshot.docs.map(async (noteDoc) => {
          const note = { id: noteDoc.id, ...noteDoc.data() }
          
          // Fetch note author info if not included
          if (note.authorId && (!note.author || !note.profilePic)) {
            try {
              const authorDoc = await getDoc(doc(db, 'users', note.authorId))
              if (authorDoc.exists()) {
                const authorData = authorDoc.data()
                note.author = authorData.displayName || 'Unknown'
                note.profilePic = authorData.profilePic || null
              }
            } catch (e) {
              console.error('Error fetching author info:', e)
            }
          }
          
          return note
        })
      )
      
      setSentNotes(sentNotesData)
    } catch (error) {
      console.error('Error fetching sent notes:', error)
    }
  }
  
  // Fetch user's notes for sending to topic
  const fetchUserNotes = async (userId) => {
    try {
      const notesQuery = query(collection(db, 'notes'), where('authorId', '==', userId))
      const notesSnapshot = await getDocs(notesQuery)
      
      const notesData = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isSelected: false // Add selection state for the modal
      }))
      
      setUserNotes(notesData)
    } catch (error) {
      console.error('Error fetching user notes:', error)
    }
  }

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
      // Get the topic name from the ref
      const updatedName = topicNameInputRef.current.value.trim()
      
      // Validate
      if (!updatedName) {
        alert('Topic name cannot be empty')
        return
      }
      
      // Update topic name and archived status directly on the topic document
      await updateDoc(doc(db, 'topics', topicId), {
        name: updatedName,
        archived: isArchived, // Using the archived property directly
        updatedAt: new Date().toISOString()
      })
      
      setIsSettingsOpen(false)
      
      // Update local state
      setTopic(prev => ({
        ...prev,
        name: updatedName,
        archived: isArchived,
        updatedAt: new Date().toISOString()
      }))
      
      console.log(`Topic ${topicId} name updated to: ${updatedName} and archived status updated to: ${isArchived}`)
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
      if (typeof onBookmarkToggle === 'function') {
        onBookmarkToggle(topicId, !isBookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    }
  };
  
  // Toggle note selection in the send note modal
  const toggleNoteSelection = (noteId) => {
    setUserNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId 
          ? { ...note, isSelected: !note.isSelected } 
          : note
      )
    )
    
    // Also update selectedNotesToSend
    const isCurrentlySelected = userNotes.find(note => note.id === noteId)?.isSelected
    
    if (isCurrentlySelected) {
      // If it was selected, remove it
      setSelectedNotesToSend(prev => prev.filter(id => id !== noteId))
    } else {
      // If it wasn't selected, add it
      setSelectedNotesToSend(prev => [...prev, noteId])
    }
  }
  
  // Send selected notes to this topic
  const handleSendNotes = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return
      
      // Get the full note objects for all selected notes
      const selectedNotes = userNotes.filter(note => note.isSelected)
      
      // For each selected note, add it to the topic's sentNotes collection
      for (const note of selectedNotes) {
        // Reference to the sentNotes collection for this topic
        const sentNoteRef = doc(db, 'topics', topicId, 'sentNotes', note.id)
        
        // Add the note data to the sentNotes collection
        await setDoc(sentNoteRef, {
          ...note,
          sentAt: new Date().toISOString(),
          sentBy: currentUser.uid,
          originalNoteId: note.id
        })
      }
      
      // Refresh the sent notes
      await fetchSentNotes(topicId)
      
      // Reset the selection and close the modal
      setUserNotes(prevNotes => 
        prevNotes.map(note => ({ ...note, isSelected: false }))
      )
      setSelectedNotesToSend([])
      setShowSendNoteModal(false)
    } catch (error) {
      console.error('Error sending notes to topic:', error)
      alert('Failed to send notes to topic. Please try again.')
    }
  }
  
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
              // No need to reset state for topic name
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
              defaultValue={topic?.name || ''}
              ref={topicNameInputRef}
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
              disabled={!topicNameInputRef.current || !topicNameInputRef.current.value.trim()}
            >
              Save Changes
            </button>
            <button 
              onClick={() => {
                // Reset the input to the current topic name
                if (topicNameInputRef.current) {
                  topicNameInputRef.current.value = topic?.name || '';
                }
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
  
  // Send Note Modal
  const SendNoteModal = () => {
    return (
      <div className="send-note-modal-overlay">
        <div className="send-note-modal">
          <div className="modal-header">
            <h2>Send Notes to Topic</h2>
            <button 
              className="close-modal-button"
              onClick={() => {
                setShowSendNoteModal(false);
                setUserNotes(prevNotes => 
                  prevNotes.map(note => ({ ...note, isSelected: false }))
                );
                setSelectedNotesToSend([]);
              }}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <p>Select notes to send to <strong>{topic?.name}</strong>:</p>
            
            <div className="notes-select-list">
              {userNotes.length > 0 ? (
                userNotes.map(note => (
                  <div 
                    key={note.id} 
                    className={`note-select-item ${note.isSelected ? 'selected' : ''}`}
                    onClick={() => toggleNoteSelection(note.id)}
                  >
                    <div className="note-select-checkbox">
                      <input 
                        type="checkbox" 
                        checked={note.isSelected}
                        onChange={() => {}} // Handled by the div click
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="note-select-content">
                      <p className="note-preview">{note.content}</p>
                      <span className="note-date">{formatDate(note.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-notes-message">You don't have any notes to send.</p>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <span className="selected-count">
              {selectedNotesToSend.length} {selectedNotesToSend.length === 1 ? 'note' : 'notes'} selected
            </span>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowSendNoteModal(false);
                  setUserNotes(prevNotes => 
                    prevNotes.map(note => ({ ...note, isSelected: false }))
                  );
                  setSelectedNotesToSend([]);
                }}
              >
                Cancel
              </button>
              <button 
                className="send-button"
                onClick={handleSendNotes}
                disabled={selectedNotesToSend.length === 0}
              >
                Send to Topic
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    if (activeTab === 'notes') {
      return (
        <div className="topic-notes-tab">
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
          
          {/* Sent Notes Section */}
          <div className="sent-notes-section">
            <div className="sent-notes-header">
              <h3>Notes in this Topic</h3>
              <button 
                className="send-note-button"
                onClick={() => setShowSendNoteModal(true)}
              >
                Send Notes to Topic
              </button>
            </div>
            
            {sentNotes.length > 0 ? (
              <div className="sent-notes-list">
                {sentNotes
                  .sort((a, b) => new Date(b.sentAt || b.timestamp) - new Date(a.sentAt || a.timestamp))
                  .map(note => (
                    <div key={note.id} className="sent-note-item">
                      <div className="sent-note-header">
                        <div className="note-author-info">
                          {note.profilePic ? (
                            <img 
                              src={note.profilePic} 
                              alt={`${note.author}'s avatar`}
                              className="author-avatar"
                            />
                          ) : (
                            <div className="author-avatar-placeholder">
                              {note.author ? note.author.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <span className="note-author-name">{note.author}</span>
                        </div>
                        <span className="sent-note-date">
                          {formatDate(note.sentAt || note.timestamp)}
                        </span>
                      </div>
                      <p className="sent-note-content">{note.content}</p>
                    </div>
                  ))
              }
              </div>
            ) : (
              <p className="empty-sent-notes">No notes have been added to this topic yet.</p>
            )}
          </div>
        </div>
      )
    } else if (activeTab === 'comments') {
      return (
        <div className="topic-comments-tab">
          <h3 className="section-title">Comments</h3>
          
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
          <div className="comments-list">
            {comments.length > 0 ? (
              <div className="comments-items">
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
      )
    }
  }

  if (isLoading) {
    return <div className="loading-container">Loading topic data...</div>
  }
  
  if (error) {
    return <div className="error-container">{error}</div>
  }

  return (
    <div className="topic-content-wrapper">
      {/* Send Note Modal */}
      {showSendNoteModal && <SendNoteModal />}
      
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
            
            {/* Tabs Navigation */}
            <div className="topic-tabs-navigation">
              <div className="topic-main-tabs">
                <button 
                  className={`topic-main-tab ${activeTab === 'notes' ? 'active-main-tab' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes
                </button>
                <button 
                  className={`topic-main-tab ${activeTab === 'comments' ? 'active-main-tab' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments ({comments.length})
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="topic-tab-content">
              {renderTabContent()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}