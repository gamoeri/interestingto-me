'use client'

import { useState } from 'react'

export default function RepliesPanel({
  notes = [],
  activeNoteId,
  onAddReply,
  onClose,
  displayName,
  profilePic
}) {
  // Ensure we have the current user's profile info for displaying in replies
  const currentUserInfo = {
    profilePic,
    displayName
  };
  
  const [replyContent, setReplyContent] = useState('')
  
  // Find the active note
  const activeNote = activeNoteId ? notes.find(note => note.id === activeNoteId) : null
  
  const handleSubmitReply = () => {
    if (replyContent.trim() && replyContent.length <= 280 && activeNoteId) {
      // Pass the current user's profile info with the reply
      onAddReply(activeNoteId, replyContent, currentUserInfo)
      setReplyContent('')
    }
  }
  
  if (!activeNote) {
    return (
      <div className="empty-replies-panel">
        <p>Select a note to view and add replies</p>
      </div>
    )
  }
  
  return (
    <div className="replies-panel">
      <div className="replies-header">
        <h3 className="replies-title">Replies</h3>
        <button onClick={onClose} className="close-replies">×</button>
      </div>
      
      <div className="original-note">
        <div className="original-note-container">
          <div className="note-avatar">
            {activeNote.profilePic ? (
              <img 
                src={activeNote.profilePic} 
                alt={`${activeNote.author}'s avatar`}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {activeNote.author ? activeNote.author.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div className="note-content-wrapper">
            <div className="note-header">
              <span className="note-author">{activeNote.author}</span>
              <span className="note-date">{new Date(activeNote.timestamp).toLocaleDateString()}</span>
            </div>
            <p className="note-content">{activeNote.content}</p>
          </div>
        </div>
      </div>
      
      <div className="reply-form-container">
        <textarea
          placeholder="Write a reply..."
          className="textarea reply-textarea"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
        />
        <div className="reply-form-actions">
          <span className="char-count">{replyContent.length}/280</span>
          <button 
            onClick={handleSubmitReply} 
            disabled={replyContent.length === 0 || replyContent.length > 280}
            className="primary-button"
          >
            Reply
          </button>
        </div>
      </div>
      
      <div className="replies-list-container">
        <h4 className="replies-subheader">
          {activeNote.replies && activeNote.replies.length > 0 
            ? `${activeNote.replies.length} ${activeNote.replies.length === 1 ? 'Reply' : 'Replies'}`
            : 'No replies yet'}
        </h4>
        
        <div className="replies-list">
          {activeNote.replies && activeNote.replies.length > 0 ? (
            activeNote.replies
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map((reply, index) => {
                // Determine if this reply is from the current user
                const isCurrentUser = reply.author === displayName;
                
                return (
                  <div key={index} className="reply-item">
                    <div className="reply-avatar">
                      {isCurrentUser && profilePic ? (
                        // Use current profile pic for current user's replies
                        <img 
                          src={profilePic} 
                          alt={`${reply.author}'s avatar`}
                          className="avatar-image"
                        />
                      ) : reply.profilePic ? (
                        // Use stored profile pic for other users' replies
                        <img 
                          src={reply.profilePic} 
                          alt={`${reply.author}'s avatar`}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {reply.author ? reply.author.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div className="reply-content-wrapper">
                      <div className="reply-header">
                        <span className="reply-author">{reply.author}</span>
                        <span className="reply-date">{new Date(reply.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="reply-content">{reply.content}</p>
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="empty-replies">No replies yet. Be the first to reply!</p>
          )}
        </div>
      </div>
    </div>
  )
}