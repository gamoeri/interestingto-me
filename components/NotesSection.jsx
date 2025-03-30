'use client'

import { useState, useEffect, useRef } from 'react'
import ProfileEdit from './ProfileEdit'

export default function NotesSection({ 
  notes = [], 
  topics = [],
  userProfile,
  onAddNote,
  onDeleteNote,
  onSelectNote,
  onPinNoteToTopic,
  activeNoteId,
  displayName,
  profilePic,
  onUpdateDisplayName,
  onUpdateBio,
  onUpdateProfilePic,
  onUpdateBannerImage,
  onUpdateBackgroundColor,
  bannerImage = userProfile?.bannerImage || '/default-banner.jpg',
  backgroundColor = userProfile?.backgroundColor || '#f8f8f8'
}) {
  const [newNote, setNewNote] = useState('')
  const [noteTopics, setNoteTopics] = useState([]) // Selected topics for the new note
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [activeTopicFilter, setActiveTopicFilter] = useState('all')
  const [showPinMenu, setShowPinMenu] = useState(null) // For pin dropdown menu
  const [mentionQuery, setMentionQuery] = useState('') // For @ mentions
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const textareaRef = useRef(null)
  const mentionMenuRef = useRef(null)
  
  // Calculate note and topic counts
  const noteCount = notes.length;
  const uniqueTopicsUsed = new Set(
    notes.flatMap(note => note.topicIds || [])
  ).size;
  
  // Handle clicking outside menus to close them
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMentionMenu && mentionMenuRef.current && !mentionMenuRef.current.contains(e.target)) {
        setShowMentionMenu(false);
      }
      
      if (showPinMenu && !e.target.closest('.pin-menu-container')) {
        setShowPinMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionMenu, showPinMenu]);
  
  // When active topic filter changes, add it to selected topics for new posts
  useEffect(() => {
    if (activeTopicFilter !== 'all') {
      // If a specific topic is selected in the filter
      const topic = topics.find(t => t.id === activeTopicFilter);
      if (topic && !noteTopics.find(t => t.id === activeTopicFilter)) {
        setNoteTopics(prev => [...prev, topic]);
      }
    }
  }, [activeTopicFilter, topics]);
  
  // Handle text input changes and detect @ mentions
  const handleNoteChange = (e) => {
    const value = e.target.value;
    setNewNote(value);
    
    // Store cursor position
    setCursorPosition(e.target.selectionStart);
    
    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atSymbolIndex !== -1 && (atSymbolIndex === 0 || textBeforeCursor[atSymbolIndex - 1] === ' ')) {
      // Extract the query text between @ and cursor
      const query = textBeforeCursor.substring(atSymbolIndex + 1);
      
      // Check if query is valid and not containing spaces (i.e., we're still typing a mention)
      if (query.length > 0 && !query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionMenu(true);
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  };
  
  // Position the mention menu at the cursor location
  useEffect(() => {
    if (showMentionMenu && textareaRef.current && mentionMenuRef.current) {
      // Get cursor coordinates
      const cursorPos = getCursorCoordinates(textareaRef.current, cursorPosition);
      
      if (cursorPos) {
        // Position the menu below and aligned with the cursor
        mentionMenuRef.current.style.top = `${cursorPos.top + 20}px`;
        mentionMenuRef.current.style.left = `${cursorPos.left}px`;
      }
    }
  }, [showMentionMenu, cursorPosition]);
  
  // Get cursor coordinates in the textarea
  const getCursorCoordinates = (textarea, position) => {
    if (!textarea) return null;
    
    // Create a hidden div with the same styling as the textarea
    const div = document.createElement('div');
    
    // Copy all computed styles from textarea to div
    const styles = window.getComputedStyle(textarea);
    Array.from(styles).forEach(style => {
      div.style[style] = styles.getPropertyValue(style);
    });
    
    // Set content and special styles for div
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.visibility = 'hidden';
    div.style.overflow = 'auto';
    div.style.whiteSpace = 'pre-wrap';
    
    // Text up to position with a span at the end
    const text = textarea.value.substring(0, position);
    div.textContent = text;
    const span = document.createElement('span');
    span.textContent = '|'; // Represents cursor
    div.appendChild(span);
    
    // Append to body, measure, and remove
    document.body.appendChild(div);
    const rect = span.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    document.body.removeChild(div);
    
    return {
      top: rect.top - textareaRect.top + textarea.scrollTop,
      left: rect.left - textareaRect.left
    };
  };
  
  // Select a topic from the mention menu
  const selectTopic = (topic) => {
    // Close the mention menu
    setShowMentionMenu(false);
    
    // Add the topic to selected topics if not already there
    if (!noteTopics.find(t => t.id === topic.id)) {
      setNoteTopics(prev => [...prev, topic]);
    }
    
    // Update the text - replace @query with empty space
    if (textareaRef.current) {
      const text = newNote;
      const cursorPos = cursorPosition;
      const atSymbolIndex = text.substring(0, cursorPos).lastIndexOf('@');
      
      if (atSymbolIndex !== -1) {
        const newText = text.substring(0, atSymbolIndex) + text.substring(cursorPos);
        setNewNote(newText);
        
        // Set cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = atSymbolIndex;
            textareaRef.current.selectionEnd = atSymbolIndex;
          }
        }, 0);
      }
    }
  };
  
  // Remove a topic from selection
  const removeTopic = (topicId) => {
    setNoteTopics(prev => prev.filter(topic => topic.id !== topicId));
  };
  
  // Filter topics based on mention query
  const filteredTopics = mentionQuery 
    ? topics.filter(topic => topic.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : topics;
  
  // Handle adding a note with topics
  const handleAddNote = () => {
    if (newNote.trim() && newNote.length <= 280) {
      // Convert selected topics to an array of IDs
      const topicIds = noteTopics.map(topic => topic.id);
      
      // Add the note with topics
      onAddNote(newNote, topicIds);
      
      // Reset the form
      setNewNote('');
      // Only clear topics if not filtering by a specific topic
      if (activeTopicFilter === 'all') {
        setNoteTopics([]);
      } else {
        // Keep only the active filter topic
        setNoteTopics(prev => prev.filter(topic => topic.id === activeTopicFilter));
      }
    }
  };
  
  // Function to pin a note to a topic
  const handlePinNote = (noteId, topicId) => {
    if (onPinNoteToTopic) {
      onPinNoteToTopic(noteId, topicId);
      setShowPinMenu(null); // Close pin menu after pinning
    }
  };
  
  // Filter notes based on active topic
  const filteredNotes = activeTopicFilter === 'all'
    ? notes
    : notes.filter(note => {
        // Check if the note has topicIds array (new format)
        if (note.topicIds && Array.isArray(note.topicIds)) {
          return note.topicIds.includes(activeTopicFilter);
        }
        // Also check for the old topicId format for backward compatibility
        else if (note.topicId) {
          return note.topicId === activeTopicFilter;
        }
        return false;
      });
  
  // If profile edit is showing, return the ProfileEdit component
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
          </div>
          <button 
            className="edit-profile-button"
            onClick={() => setShowProfileEdit(true)}
          >
            Edit Profile
          </button>
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
          {/* Topic badges that are selected */}
          {noteTopics.length > 0 && (
            <div className="selected-topics-display">
              <div className="topic-badges-container">
                {noteTopics.map(topic => (
                  <span key={topic.id} className="topic-badge-large">
                    <span className="topic-badge-prefix">@</span>
                    {topic.name}
                    <button 
                      className="remove-topic-badge"
                      onClick={() => removeTopic(topic.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={handleNoteChange}
            placeholder="What are you learning about today? Type @ to tag a topic"
            className="note-input"
          />
          
          {/* Mention menu */}
          {showMentionMenu && (
            <div 
              ref={mentionMenuRef}
              className="mention-menu"
            >
              {filteredTopics.length > 0 ? (
                filteredTopics.map(topic => (
                  <div 
                    key={topic.id}
                    className="mention-item"
                    onClick={() => selectTopic(topic)}
                  >
                    <span className="mention-prefix">@</span>
                    {topic.name}
                  </div>
                ))
              ) : (
                <div className="mention-no-results">No matching topics</div>
              )}
            </div>
          )}
          
          <div className="input-actions">
            <div className="input-info">
              <span className="mention-hint">Type @ to mention a topic</span>
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
      
      {/* Notes Timeline */}
      <div className="notes-timeline">
        {filteredNotes.length > 0 ? (
          <div className="timeline-entries">
            {filteredNotes
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((note) => {
                // Process topics for this note
                const noteTopics = [];
                
                // Handle new format (topicIds array)
                if (note.topicIds && Array.isArray(note.topicIds)) {
                  note.topicIds.forEach(topicId => {
                    const topic = topics.find(t => t.id === topicId);
                    if (topic) noteTopics.push(topic);
                  });
                } 
                // Handle old format (single topicId)
                else if (note.topicId) {
                  const topic = topics.find(t => t.id === note.topicId);
                  if (topic) noteTopics.push(topic);
                }
                
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
                        </div>
                        <span className="entry-time">{formattedDate}</span>
                      </div>
                      
                      <p className="entry-text">{note.content}</p>
                      
                      {/* Topic badges */}
                      {noteTopics.length > 0 && (
                        <div className="note-topics">
                          {noteTopics.map(topic => (
                            <span 
                              key={topic.id} 
                              className="topic-badge"
                              onClick={() => setActiveTopicFilter(topic.id)}
                            >
                              <span className="topic-badge-prefix">@</span>
                              {topic.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="entry-actions">
                        <button 
                          className="reply-action"
                          onClick={() => onSelectNote(note.id === activeNoteId ? null : note.id)}
                        >
                          {(note.replies?.length || 0) > 0 ? `${note.replies.length} ${note.replies.length === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
                        </button>
                        
                        {/* Pin to Topic button - only show if note has topics */}
                        {noteTopics.length > 0 && (
                          <div className="pin-action-container">
                            <button 
                              className={`pin-action ${note.isPinned ? 'is-pinned' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // If multiple topics, show dropdown to select which one to pin to
                                if (noteTopics.length > 1) {
                                  setShowPinMenu(note.id);
                                } else {
                                  // If only one topic, pin directly
                                  handlePinNote(note.id, noteTopics[0].id);
                                }
                              }}
                            >
                              {note.isPinned ? "Pinned" : "Pin"}
                            </button>
                            
                            {/* Pin menu dropdown */}
                            {showPinMenu === note.id && (
                              <div className="pin-menu-container">
                                <div className="pin-dropdown-menu">
                                  <div className="pin-dropdown-title">Pin to:</div>
                                  {noteTopics.map(topic => (
                                    <div 
                                      key={topic.id}
                                      className="pin-dropdown-item"
                                      onClick={() => handlePinNote(note.id, topic.id)}
                                    >
                                      {topic.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
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