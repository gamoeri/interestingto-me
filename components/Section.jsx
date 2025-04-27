'use client'

import { useState, useEffect } from 'react'
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function Section({ section, topicId, isOwner, currentUser, onDelete, viewStyle = 'timeline' }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editedContent, setEditedContent] = useState(section.content || '')
  const [authorInfo, setAuthorInfo] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(section.likes?.count || 0)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplies, setShowReplies] = useState(false)
  
  useEffect(() => {
    // Check if the current user has liked this section
    if (currentUser?.uid) {
      const userLiked = section.likes?.userIds?.includes(currentUser.uid) || false
      setIsLiked(userLiked)
    }
    
    // Fetch author information
    const fetchAuthorInfo = async () => {
      if (section.createdBy) {
        try {
          const authorDoc = await getDoc(doc(db, 'users', section.createdBy))
          if (authorDoc.exists()) {
            setAuthorInfo(authorDoc.data())
          }
        } catch (error) {
          console.error('Error fetching author info:', error)
        }
      }
    }
    
    fetchAuthorInfo()
  }, [section, currentUser])
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const handleSaveEdit = async () => {
    try {
      const sectionRef = doc(db, 'topics', topicId, 'sections', section.id)
      
      await updateDoc(sectionRef, {
        content: editedContent,
        updatedAt: serverTimestamp()
      })
      
      // Update the local state
      section.content = editedContent
      section.updatedAt = new Date().toISOString()
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating section:', error)
      alert('Failed to update section. Please try again.')
    }
  }
  
  const handleDeleteSection = async () => {
    try {
      const sectionRef = doc(db, 'topics', topicId, 'sections', section.id)
      
      // Soft delete - just mark as deleted
      await updateDoc(sectionRef, {
        deleted: true,
        updatedAt: serverTimestamp()
      })
      
      // Call the parent's onDelete callback
      if (onDelete) {
        onDelete(section.id)
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Failed to delete section. Please try again.')
    }
  }
  
  const handleToggleLike = async () => {
    if (!currentUser?.uid) return
    
    try {
      const sectionRef = doc(db, 'topics', topicId, 'sections', section.id)
      
      if (isLiked) {
        // Remove the like
        await updateDoc(sectionRef, {
          'likes.count': likesCount - 1,
          'likes.userIds': arrayRemove(currentUser.uid)
        })
        
        setLikesCount(prev => prev - 1)
      } else {
        // Add the like
        await updateDoc(sectionRef, {
          'likes.count': likesCount + 1,
          'likes.userIds': arrayUnion(currentUser.uid)
        })
        
        setLikesCount(prev => prev + 1)
      }
      
      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }
  
  const handleAddReply = async () => {
    if (!replyContent.trim() || !currentUser?.uid) return
    
    try {
      const sectionRef = doc(db, 'topics', topicId, 'sections', section.id)
      
      const replyData = {
        content: replyContent.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        likes: {
          count: 0,
          userIds: []
        }
      }
      
      // Add reply to the section's replies array
      await updateDoc(sectionRef, {
        replies: arrayUnion(replyData)
      })
      
      // Update local state
      if (!section.replies) {
        section.replies = []
      }
      
      section.replies.push(replyData)
      
      // Reset reply form
      setReplyContent('')
      setIsReplying(false)
      setShowReplies(true)
    } catch (error) {
      console.error('Error adding reply:', error)
      alert('Failed to add reply. Please try again.')
    }
  }
  
  // Section click handler
  const handleSectionClick = () => {
    if (!isEditing && isOwner) {
      setIsEditing(true)
    }
  }
  
  // Render attachments component - reused in both views
  const renderAttachments = () => {
    if (!(section.attachments && section.attachments.length > 0)) return null;
    
    return (
      <div className="attachments">
        <div className="attachment-list">
          {section.attachments.map((attachment, index) => {
            if (attachment.type === 'link') {
              return (
                <div key={`attachment-${index}`} className="attachment-item">
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="attachment-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {attachment.url}
                  </a>
                </div>
              )
            } else if (attachment.type === 'note') {
              return (
                <div key={`attachment-${index}`} className="attachment-item">
                  <span className="attachment-file">
                    Attached Note: {attachment.id}
                  </span>
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    )
  }
  
  // Render the timeline view style (profile pic on left with content aligned to name)
  const renderTimelineView = () => (
    <div 
      className="section-container timeline-view"
      onClick={handleSectionClick}
    >
      <div className="section-content">
        <div className="section-header">
          <div className="author-info">
            {authorInfo?.profilePic ? (
              <img 
                src={authorInfo.profilePic} 
                alt={`${authorInfo.displayName}'s avatar`}
                className="author-avatar"
              />
            ) : (
              <div className="author-avatar-placeholder">
                {authorInfo?.displayName ? authorInfo.displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            
            <div className="author-details">
              <span className="author-name">{authorInfo?.displayName || 'Unknown'}</span>
              <span className="timestamp">{formatDate(section.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="content-wrapper">
          {isEditing ? (
            <div className="edit-content" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="content-edit-textarea"
                autoFocus
              />
              <div className="edit-actions">
                <button 
                  onClick={handleSaveEdit}
                  className="save-button"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setEditedContent(section.content || '')
                    setIsEditing(false)
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="section-text">
              {section.content || <span className="empty-content">No content</span>}
            </div>
          )}
          
          {/* Attachments */}
          {renderAttachments()}
        </div>
        
        <div className="section-controls" onClick={(e) => e.stopPropagation()}>
          <button 
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleToggleLike}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>{likesCount}</span>
          </button>
          
          <button 
            className="reply-button"
            onClick={() => setIsReplying(!isReplying)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{section.replies?.length || 0}</span>
          </button>
          
          {isOwner && !isEditing && (
            <button 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
          <p>Are you sure you want to delete this section?</p>
          <div className="delete-confirm-buttons">
            <button 
              onClick={handleDeleteSection}
              className="confirm-delete"
            >
              Delete
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="cancel-delete"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Replies section */}
      {(isReplying || showReplies) && (
        <div className="replies-section" onClick={(e) => e.stopPropagation()}>
          {isReplying && (
            <div className="add-reply-form">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="reply-input"
              />
              <button 
                onClick={handleAddReply}
                className="submit-reply"
                disabled={!replyContent.trim()}
              >
                Reply
              </button>
            </div>
          )}
          
          {section.replies && section.replies.length > 0 ? (
            <div className="replies-list">
              {/* We would render replies here */}
              <p>Replies would be shown here</p>
            </div>
          ) : (
            <p className="no-replies">No replies yet</p>
          )}
        </div>
      )}
    </div>
  )
  
  // Render the compact view style (icons on left, author info on right)
  const renderCompactView = () => (
    <div 
      className="section-container compact-view"
      onClick={handleSectionClick}
    >
      <div className="section-content">
        {/* Main section content */}
        {isEditing ? (
          <div className="edit-content" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="content-edit-textarea"
              autoFocus
            />
            <div className="edit-actions">
              <button 
                onClick={handleSaveEdit}
                className="save-button"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setEditedContent(section.content || '')
                  setIsEditing(false)
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="section-text">
              {section.content || <span className="empty-content">No content</span>}
            </div>
            
            {/* Attachments in compact view */}
            {renderAttachments()}
          </>
        )}
        
        {/* Compact metadata and actions row - swapped positions */}
        <div className="compact-metadata">
          <div className="compact-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              className={`like-button-compact ${isLiked ? 'liked' : ''}`}
              onClick={handleToggleLike}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{likesCount}</span>
            </button>
            
            <button 
              className="reply-button-compact"
              onClick={() => setIsReplying(!isReplying)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{section.replies?.length || 0}</span>
            </button>
            
            {isOwner && !isEditing && (
              <button 
                className="delete-button-compact"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            )}
          </div>
          
          <div className="compact-author">
            {authorInfo?.profilePic ? (
              <img 
                src={authorInfo.profilePic} 
                alt={`${authorInfo.displayName}'s avatar`}
                className="author-avatar-small"
              />
            ) : (
              <div className="author-avatar-small-placeholder">
                {authorInfo?.displayName ? authorInfo.displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <span className="author-name-small">{authorInfo?.displayName || 'Unknown'}</span>
            <span className="timestamp-small">{formatDate(section.createdAt)}</span>
          </div>
        </div>
        
        {/* Compact delete confirmation */}
        {showDeleteConfirm && (
          <div className="delete-confirm-compact" onClick={(e) => e.stopPropagation()}>
            <p>Delete this section?</p>
            <div className="delete-confirm-buttons">
              <button 
                onClick={handleDeleteSection}
                className="confirm-delete"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-delete"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Replies section for compact view */}
        {(isReplying || showReplies) && (
          <div className="replies-section compact" onClick={(e) => e.stopPropagation()}>
            {isReplying && (
              <div className="add-reply-form">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="reply-input"
                />
                <button 
                  onClick={handleAddReply}
                  className="submit-reply"
                  disabled={!replyContent.trim()}
                >
                  Reply
                </button>
              </div>
            )}
            
            {section.replies && section.replies.length > 0 ? (
              <div className="replies-list">
                {/* We would render replies here */}
                <p>Replies would be shown here</p>
              </div>
            ) : (
              <p className="no-replies">No replies yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
  
  // Render the appropriate view based on the viewStyle prop
  return viewStyle === 'timeline' ? renderTimelineView() : renderCompactView()
}