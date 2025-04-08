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
  const [replyContent, setReplyContent] = useState('')
  
  // Find the active note
  const activeNote = activeNoteId ? notes.find(note => note.id === activeNoteId) : null
  
  const handleReplySubmit = () => {
    if (replyContent.trim() && activeNoteId && onAddReply) {
      onAddReply(activeNoteId, replyContent.trim(), {
        displayName,
        profilePic
      });
      setReplyContent('');
    }
  };
  
  if (!activeNote) {
    return (
      <div className="empty-replies-panel">
        <p>Select a note to view related content</p>
      </div>
    )
  }
  
  return (
    <div className="replies-panel">
      <div className="replies-header">
        <h3 className="replies-title">Conversation</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      {/* Original Note */}
      <div className="original-note-container">
        <div className="note-main-content">
          <div className="entry-avatar">
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
          <div className="entry-details">
            <div className="entry-header">
              <span className="entry-author">{activeNote.author}</span>
              <span className="entry-time">
                {new Date(activeNote.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className="entry-text">{activeNote.content}</p>
          </div>
        </div>
      </div>
      
      {/* Reply Input */}
      <div className="reply-form-container">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write a reply..."
          className="reply-textarea"
        />
        <div className="reply-form-actions">
          <span className="char-count">{replyContent.length}/280</span>
          <button 
            onClick={handleReplySubmit}
            disabled={replyContent.length > 280 || replyContent.length === 0}
            className="post-button"
          >
            Reply
          </button>
        </div>
      </div>
      
      {/* Replies List */}
      <div className="replies-list-container">
        <h4 className="replies-subheader">
          {activeNote.replies && activeNote.replies.length > 0 
            ? `${activeNote.replies.length} ${activeNote.replies.length === 1 ? 'Reply' : 'Replies'}`
            : 'No replies yet'}
        </h4>
        
        {activeNote.replies && activeNote.replies.length > 0 ? (
          <div className="replies-items">
            {activeNote.replies
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map((reply, index) => (
                <div key={index} className="reply-item">
                  <div className="reply-avatar">
                    {reply.profilePic ? (
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
                  <div className="reply-content">
                    <div className="reply-header">
                      <span className="reply-author">{reply.author}</span>
                      <span className="reply-time">
                        {new Date(reply.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="reply-text">{reply.content}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="empty-replies">No replies yet. Be the first to reply!</p>
        )}
      </div>
    </div>
  )
}