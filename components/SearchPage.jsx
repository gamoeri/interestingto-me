'use client'

import { useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function SearchPage({
  user,
  userProfile,
  onSelectNote,
  onSelectTopic,
  onSelectUser
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({
    topics: [],
    notes: [],
    users: []
  })
  const [isSearching, setIsSearching] = useState(false)
  
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      // Search logic would go here
      // This is just a placeholder
      
      setSearchResults({
        topics: [],
        notes: [],
        users: []
      })
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }
  
  return (
    <div className="content-panel search-page-container">
      <div className="page-header">
        <h2>Search</h2>
      </div>
      
      {/* Search input */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, notes, and users..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>
      
      {/* Search results */}
      {isSearching ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      ) : (
        <div className="search-results">
          {/* Topics section */}
          {searchResults.topics.length > 0 && (
            <div className="result-section">
              <h3>Topics</h3>
              <ul className="topic-results">
                {searchResults.topics.map(topic => (
                  <li 
                    key={topic.id}
                    className="result-item"
                    onClick={() => onSelectTopic(topic.id)}
                  >
                    <span className="result-title">{topic.name}</span>
                    <span className="result-subtitle">by {topic.ownerName || 'Unknown'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Notes section */}
          {searchResults.notes.length > 0 && (
            <div className="result-section">
              <h3>Notes</h3>
              <ul className="note-results">
                {searchResults.notes.map(note => (
                  <li 
                    key={note.id}
                    className="result-item"
                    onClick={() => onSelectNote(note.id)}
                  >
                    <div className="result-content">
                      <span className="result-title">By {note.author}</span>
                      <p className="result-preview">{note.content.substring(0, 100)}...</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Users section */}
          {searchResults.users.length > 0 && (
            <div className="result-section">
              <h3>Users</h3>
              <ul className="user-results">
                {searchResults.users.map(user => (
                  <li 
                    key={user.id}
                    className="result-item"
                    onClick={() => onSelectUser(user.id)}
                  >
                    <div className="user-result">
                      <div className="user-avatar">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.displayName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <span className="result-title">{user.displayName}</span>
                        <p className="result-preview">{user.bio?.substring(0, 80) || "No bio"}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* No results message */}
          {searchQuery && 
           !searchResults.topics.length && 
           !searchResults.notes.length && 
           !searchResults.users.length && (
            <div className="no-results">
              <p>No results found for "{searchQuery}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}