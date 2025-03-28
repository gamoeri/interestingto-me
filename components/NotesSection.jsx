'use client'

import { useState } from 'react'
import ProfileEdit from './ProfileEdit' // Import the ProfileEdit component

export default function NotesSection({ 
  notes = [], 
  topics = [],
  userProfile, // Add userProfile prop
  onAddNote,
  onDeleteNote,
  onSelectNote,
  activeNoteId,
  displayName,
  profilePic,
  onUpdateDisplayName, // Profile update handlers
  onUpdateBio,
  onUpdateProfilePic,
  onUpdateBannerImage,
  onUpdateBackgroundColor,
  bannerImage = userProfile?.bannerImage || '/default-banner.jpg',
  backgroundColor = userProfile?.backgroundColor || '#f8f8f8'
}) {
  const [newNote, setNewNote] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [showProfileEdit, setShowProfileEdit] = useState(false) // State for profile edit
  
  // Calculate note and topic counts
  const noteCount = notes.length;
  const uniqueTopicsUsed = new Set(notes.filter(note => note.topicId).map(note => note.topicId)).size;
  
  const handleAddNote = () => {
    if (newNote.trim() && newNote.length <= 280) {
      onAddNote(newNote, selectedTopicId || null)
      setNewNote('')
      setSelectedTopicId('')
    }
  }
  
  // If profile edit is showing, return the ProfileEdit component instead of notes
  if (showProfileEdit) {
    return (
      <ProfileEdit 
        userProfile={userProfile}
        onUpdateDisplayName={onUpdateDisplayName}
        onUpdateBio={onUpdateBio}
        onUpdateProfilePic={onUpdateProfilePic}
        onUpdateBannerImage={onUpdateBannerImage}
        onUpdateBackgroundColor={onUpdateBackgroundColor}
        onClose={() => setShowProfileEdit(false)}
      />
    );
  }
  
  return (
    <div className="notes-section-redesigned">
      {/* Profile Banner */}
      <div className="profile-banner" style={{ backgroundImage: `url(${bannerImage})` }}>
        <div className="profile-info-container">
          <div className="profile-pic-container">
            {profilePic ? (
              <img 
                src={profilePic} 
                alt={`${displayName}'s profile`}
                className="profile-pic"
              />
            ) : (
              <div className="profile-pic-placeholder">
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="profile-details">
        <div className="profile-info-main">
          <div>
            <h2 className="profile-name">{displayName || 'User'}</h2>
            <p className="profile-bio">
              {userProfile?.bio || "Learning and sharing my journey. Taking notes on everything that inspires me."}
            </p>
            <div className="profile-stats">
              <span className="stat-item">{noteCount} {noteCount === 1 ? 'Note' : 'Notes'}</span>
              <span className="stat-divider">·</span>
              <span className="stat-item">{uniqueTopicsUsed} {uniqueTopicsUsed === 1 ? 'Topic' : 'Topics'}</span>
            </div>
          </div>
          <button 
            className="edit-profile-button"
            onClick={() => setShowProfileEdit(true)}
          >
            Edit Profile
          </button>
        </div>
      </div>
      
      {/* New Note Input */}
      <div className="new-note-input">
        <div className="input-container">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What are you learning about today?"
            className="note-input"
          />
          
          <div className="input-actions">
            <div className="topic-selection">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="topic-select"
              >
                <option value="">Select topic (optional)</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-buttons">
              <span className="char-count">{newNote.length}/280</span>
              <button 
                onClick={handleAddNote}
                disabled={newNote.length > 280 || newNote.length === 0}
                className="post-button"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes Timeline */}
      <div className="notes-timeline">
        {notes.length > 0 ? (
          <div className="timeline-entries">
            {notes
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((note) => {
                // Find topic name if note has a topicId
                const noteTopic = note.topicId ? topics.find(t => t.id === note.topicId) : null;
                const formattedDate = new Date(note.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div 
                    key={note.id} 
                    className={`timeline-entry ${activeNoteId === note.id ? 'entry-active' : ''}`}
                  >
                    <div className="entry-avatar">
                      {note.profilePic ? (
                        <img 
                          src={note.profilePic} 
                          alt={`${note.author}'s avatar`}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {note.author ? note.author.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div className="entry-content">
                      <div className="entry-header">
                        <div className="author-info">
                          <span className="entry-author">{note.author}</span>
                          {noteTopic && (
                            <span className="topic-badge">
                              {noteTopic.name}
                            </span>
                          )}
                        </div>
                        <span className="entry-time">{formattedDate}</span>
                      </div>
                      
                      <p className="entry-text">{note.content}</p>
                      
                      <div className="entry-actions">
                        <button 
                          className="reply-action"
                          onClick={() => onSelectNote(note.id === activeNoteId ? null : note.id)}
                        >
                          {(note.replies?.length || 0) > 0 ? `${note.replies.length} ${note.replies.length === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
                        </button>
                        
                        <button 
                          className="delete-action"
                          onClick={(e) => {
                            if (window.confirm('Delete this note?')) {
                              onDeleteNote(note.id);
                            }
                          }}
                          title="Delete note"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-timeline">
            <p>No notes yet. Share what you're learning!</p>
          </div>
        )}
      </div>
    </div>
  )
}