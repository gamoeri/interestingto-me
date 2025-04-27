'use client'

import { useState, useEffect, memo, useRef } from 'react'
import useNotes from '@/hooks/useNotes.tsx'

export default memo(function NotesSection({ 
  notes = [], 
  topics = [],
  userProfile,
  user,
  onAddNote,
  onDeleteNote,
  onSelectNote,
  onAddReply,
  onToggleLike,
  activeNoteId,
  viewMode = 'feed',
  onBackToFeed,
  displayName,
  profilePic,
  onChangeNoteTopic, // For changing a note's topic
  bannerImage = userProfile?.bannerImage || '/default-banner.jpg',
  backgroundColor = userProfile?.backgroundColor || '#f8f8f8'
}) {
  
  console.log("NotesSection rendering", { viewMode, activeNoteId });

  const [newNote, setNewNote] = useState('')
  const [activeTopicFilter, setActiveTopicFilter] = useState('all')
  const [replyContent, setReplyContent] = useState('')
  const [showTopicDropdown, setShowTopicDropdown] = useState(null) // For storing ID of note with open dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 }) // Store position for dropdown
  const [dropdownType, setDropdownType] = useState('banner') // 'banner' or 'header'
  
  const textareaRef = useRef(null)
  const dropdownRef = useRef(null)
  
  const noteCount = notes.length;
  const uniqueTopicsUsed = new Set(
    notes.flatMap(note => note.topicIds || [])
  ).size;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTopicDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleNoteChange = (e) => {
    const value = e.target.value;
    setNewNote(value);
  };
  
  const handleAddNote = () => {
    if (newNote.trim() && newNote.length <= 280) {
      const topicIds = activeTopicFilter !== 'all' ? [activeTopicFilter] : [];
      console.log("Author info being passed:", { displayName, profilePic });
      onAddNote(newNote, topicIds, {
        displayName,
        profilePic
      });
      setNewNote('');
    }
  };

  const handleReplySubmit = () => {
    if (replyContent.trim() && replyContent.length <= 280 && activeNoteId) {
      onAddReply(activeNoteId, replyContent, {
        displayName,
        profilePic
      });
      setReplyContent('');
    }
  };
  
  const handleBackToFeedClick = () => {
    if (onBackToFeed) {
      onBackToFeed();
    } else {
      onSelectNote(null);
    }
  };
  
  const handleLikeToggle = (noteId) => {
    if (onToggleLike) {
      onToggleLike(noteId);
    }
  };

  // Handle changing a note's topic
  const handleChangeNoteTopic = (noteId, topicId) => {
    if (onChangeNoteTopic) {
      onChangeNoteTopic(noteId, topicId);
      setShowTopicDropdown(null); // Close dropdown after selection
    }
  };
  
  // Toggle topic dropdown for a specific note
  const toggleTopicDropdown = (noteId, e, type = 'inline') => {
    // Stop event propagation to prevent immediate closing
    if (e) {
      e.stopPropagation();
    }
    
    // If opening dropdown, calculate position
    if (showTopicDropdown !== noteId) {
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Different positioning based on dropdown type
      if (type === 'banner') {
        // Position below the banner kebab button
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right - 160, // Align right edge with button
        });
      } else if (type === 'header' || type === 'inline') {
        // Position below the badge or "Add a badge" text
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4, // Add a bit of space
          left: rect.left, // Align left edge with the badge
        });
      }
      
      setDropdownType(type);
    }
    
    setShowTopicDropdown(showTopicDropdown === noteId ? null : noteId);
  };
  
  const filteredNotes = activeTopicFilter === 'all'
    ? notes
    : notes.filter(note => {
        if (note.topicIds && Array.isArray(note.topicIds)) {
          return note.topicIds.includes(activeTopicFilter);
        }
        else if (note.topicId) {
          if (typeof note.topicId === 'string' && note.topicId.includes(',')) {
            const topicIdArray = note.topicId.split(',');
            return topicIdArray.includes(activeTopicFilter);
          }
          return note.topicId === activeTopicFilter;
        }
        return false;
      });
  
  // Find active note for reply view
  const activeNote = activeNoteId ? notes.find(note => note.id === activeNoteId) : null;
  
  return (
    <div className="notes-section-redesigned">
      {/* Profile Banner (Keep it but remove Edit Profile button) */}
      {viewMode === 'feed' && (
        <>
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
          
          {/* Profile Info - without Edit button */}
          <div className="profile-details">
            <div className="profile-info-main">
              <div>
                <h2 className="profile-name">{displayName || 'User'}</h2>
                <p className="profile-bio">
                  {userProfile?.bio || "Learning and sharing my journey. Taking notes on everything that inspires me."}
                </p>
              </div>
              {/* Edit button removed from here */}
            </div>
          </div>
          
          {/* Topic Tabs Navigation */}
          <div className="topic-tabs-container">
            <div className="topic-tabs-wrap">
              <button 
                className={`topic-tab ${activeTopicFilter === 'all' ? 'active-tab' : ''}`}
                onClick={() => setActiveTopicFilter('all')}
              >
                All Notes
              </button>
              
              {topics.map(topic => (
                <button
                  key={topic.id}
                  className={`topic-tab ${activeTopicFilter === topic.id ? 'active-tab' : ''}`}
                  onClick={() => setActiveTopicFilter(topic.id)}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* New Note Input */}
          <div className="new-note-input">
            <div className="input-container">
              {activeTopicFilter !== 'all' && (
                <div className="selected-topic-indicator">
                  Creating note in: <span className="topic-name">
                    {topics.find(t => t.id === activeTopicFilter)?.name || 'Selected Topic'}
                  </span>
                </div>
              )}
              
              <textarea
                ref={textareaRef}
                value={newNote}
                onChange={handleNoteChange}
                placeholder={activeTopicFilter === 'all' 
                  ? "What are you learning about today?" 
                  : `Write a note about ${topics.find(t => t.id === activeTopicFilter)?.name || 'this topic'}...`}
                className="note-input"
              />
              
              <div className="input-actions">
                <div className="input-info">
                  <span className="char-count">{newNote.length}/280</span>
                </div>
                
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
        </>
      )}
      
      {/* Topic Dropdown Portal (rendered at document level) */}
      {showTopicDropdown && (
        <div 
          className="topic-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 1000,
          }}
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="topic-change-dropdown">
            <div className="dropdown-header">
              {dropdownType === 'header' ? 'Add Topic' : 'Change Topic'}
            </div>
            {topics.map(topic => {
              // Only check for active state if it's a change operation (not adding new)
              const activeNote = notes.find(n => n.id === showTopicDropdown);
              const noteTopics = [];
              
              if (activeNote) {
                if (activeNote.topicIds && Array.isArray(activeNote.topicIds)) {
                  activeNote.topicIds.forEach(topicId => {
                    const topic = topics.find(t => t.id === topicId);
                    if (topic) noteTopics.push(topic);
                  });
                } 
                else if (activeNote.topicId) {
                  if (typeof activeNote.topicId === 'string' && activeNote.topicId.includes(',')) {
                    const topicIdArray = activeNote.topicId.split(',');
                    topicIdArray.forEach(topicId => {
                      const topic = topics.find(t => t.id === topicId);
                      if (topic) noteTopics.push(topic);
                    });
                  } else {
                    const topic = topics.find(t => t.id === activeNote.topicId);
                    if (topic) noteTopics.push(topic);
                  }
                }
              }
              
              const isActive = noteTopics.some(t => t.id === topic.id);
              
              return (
                <div 
                  key={topic.id}
                  className={`dropdown-item ${isActive ? 'active-topic' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeNoteTopic(showTopicDropdown, topic.id);
                  }}
                >
                  {topic.name}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Conditionally render either Notes Timeline or Reply View */}
      {viewMode === 'feed' ? (
        /* Notes Timeline */
        <div className="notes-timeline">
          {filteredNotes.length > 0 ? (
            <div className="timeline-entries">
              {filteredNotes
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((note, index) => {
                  const noteTopics = [];
                  
                  if (note.topicIds && Array.isArray(note.topicIds)) {
                    note.topicIds.forEach(topicId => {
                      const topic = topics.find(t => t.id === topicId);
                      if (topic) noteTopics.push(topic);
                    });
                  } 
                  else if (note.topicId) {
                    if (typeof note.topicId === 'string' && note.topicId.includes(',')) {
                      const topicIdArray = note.topicId.split(',');
                      topicIdArray.forEach(topicId => {
                        const topic = topics.find(t => t.id === topicId);
                        if (topic) noteTopics.push(topic);
                      });
                    } else {
                      const topic = topics.find(t => t.id === note.topicId);
                      if (topic) noteTopics.push(topic);
                    }
                  }
                  
                  const formattedDate = new Date(note.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  // Determine if note is liked by current user
                  const likes = note.likes || [];
                  const isLiked = user ? likes.includes(user.uid) : false;
                  const likeCount = likes.length;
                  
                  return (
                    <div 
                      key={`${note.id}-${index}`} 
                      className={`timeline-entry ${activeNoteId === note.id ? 'entry-active' : ''}`}
                    >
                      <div className="entry-content-container">
                        {/* Topic banner - only show if there are topics */}
                        {noteTopics.length > 0 && (
                          <div className="note-topic-banner">
                            <div className="topic-badges">
                              {noteTopics.map(topic => (
                                <span 
                                  key={topic.id} 
                                  className="topic-banner-badge"
                                  onClick={() => setActiveTopicFilter(topic.id)}
                                >
                                  <span className="topic-badge-prefix">3FK</span>
                                  {topic.name}
                                </span>
                              ))}
                            </div>
                            
                            {/* Topic change dropdown icon */}
                            <button 
                              className="change-topic-button"
                              onClick={(e) => toggleTopicDropdown(note.id, e, 'banner')}
                              title="Change topic"
                            >
                              ⋮
                            </button>
                          </div>
                        )}

                        {/* Main content */}
                        <div className="note-main-content">
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
                          <div className="entry-details">
                            <div className="entry-header">
                              <div className="author-info">
                                <span className="entry-author">{note.author}</span>
                                {/* "Add a badge" text for notes without topics */}
                                {noteTopics.length > 0 ? (
                                    noteTopics.map(topic => (
                                      <span 
                                        key={topic.id} 
                                        className="inline-topic-badge"
                                        onClick={(e) => toggleTopicDropdown(note.id, e, 'inline')}
                                      >
                                        <span className="topic-badge-prefix"></span>
                                        {topic.name}
                                      </span>
                                    ))
                                  ) : (
                                    <button 
                                      className="add-badge-link"
                                      onClick={(e) => toggleTopicDropdown(note.id, e, 'inline')}
                                      title="Change topic"
                                    >
                                      Add a badge
                                    </button>
                                  )}
                              </div>
                              <span className="entry-time">{formattedDate}</span>
                            </div>
                            <p className="entry-text">{note.content}</p>
                            <div className="entry-actions">
                              {/* Like button */}
                              {onToggleLike && (
                                <button 
                                  className={`like-action ${isLiked ? 'is-liked' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLikeToggle(note.id);
                                  }}
                                >
                                  {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'Like' : 'Likes'}` : 'Like'}
                                </button>
                              )}
                              
                              {/* Reply button */}
                              <button 
                                className="reply-action"
                                onClick={() => onSelectNote(note.id)}
                              >
                                {(note.replies?.length || 0) > 0 ? `${note.replies.length} ${note.replies.length === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
                              </button>
                              
                              {/* Delete button */}
                              <button 
                                className="delete-action"
                                onClick={(e) => {
                                  e.stopPropagation();
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
      ) : (
        /* Reply View - updated to match RepliesPanel structure */
        <div className="replies-panel">
          {activeNote && (
            <>
              <div className="replies-header">
                <button 
                  className="back-to-feed-button"
                  onClick={handleBackToFeedClick}
                >
                  ← Back to Notes
                </button>
                <h3 className="replies-title">Conversation</h3>
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
                    
                    {/* Add like button for original note */}
                    {onToggleLike && (
                      <div className="entry-actions">
                        <button 
                          className={`like-action ${activeNote.likes?.includes(user?.uid) ? 'is-liked' : ''}`}
                          onClick={() => handleLikeToggle(activeNote.id)}
                        >
                          {(activeNote.likes?.length || 0) > 0 ? `${activeNote.likes.length} ${activeNote.likes.length === 1 ? 'Like' : 'Likes'}` : 'Like'}
                        </button>
                      </div>
                    )}
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
            </>
          )}
        </div>
      )}
    </div>
  )
});