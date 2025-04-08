'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage({
  user,
  userProfile,
  bookmarkedTopics,
  topics,
  userNotes,
  onSelectNote,
  onSelectTopic,
  activeNoteId
}) {
  const [recentNotes, setRecentNotes] = useState([])
  
  // Get 3 most recent notes
  useEffect(() => {
    if (userNotes && userNotes.length > 0) {
      const sorted = [...userNotes].sort((a, b) => {
        const dateA = new Date(a.timestamp)
        const dateB = new Date(b.timestamp)
        return dateB - dateA
      })
      
      setRecentNotes(sorted.slice(0, 3))
    }
  }, [userNotes])
  
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
  
  // Get topic name by id
  const getTopicNames = (topicIds) => {
    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) return 'No topics'
    
    const topicNames = topicIds.map(id => {
      const topic = topics?.find(t => t.id === id)
      return topic ? topic.name : 'Unknown'
    })
    
    return topicNames.join(', ')
  }
  
  return (
    <div className="content-panel home-page-container">
      <div className="page-header">
        <h1 className="welcome-title">Welcome back, {userProfile?.displayName || 'User'}</h1>
      </div>
      
      <div className="home-dashboard">
        {/* Stats summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <h3>{userNotes?.length || 0}</h3>
            <p>Total Notes</p>
          </div>
          <div className="stat-card">
            <h3>{topics?.length || 0}</h3>
            <p>Topics</p>
          </div>
          <div className="stat-card">
            <h3>{bookmarkedTopics?.length || 0}</h3>
            <p>Bookmarks</p>
          </div>
        </div>
        
        {/* Two column layout for dashboard */}
        <div className="dashboard-columns">
          {/* Left column */}
          <div className="dashboard-column">
            {/* Recent notes */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Recent Notes</h2>
                <Link href="/notes" className="view-all-link">View all</Link>
              </div>
              
              <div className="recent-notes-list">
                {recentNotes.length > 0 ? (
                  recentNotes.map(note => (
                    <div 
                      key={note.id} 
                      className="recent-note-card"
                      onClick={() => onSelectNote(note.id)}
                    >
                      <div className="note-content-preview">
                        {note.content.length > 100 
                          ? `${note.content.substring(0, 100)}...` 
                          : note.content
                        }
                      </div>
                      <div className="note-meta">
                        <span className="note-date">{formatDate(note.timestamp)}</span>
                        <span className="note-topics">{getTopicNames(note.topicIds)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>You haven't created any notes yet</p>
                    <Link href="/notes" className="action-button">Create your first note</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="dashboard-column">
            {/* Bookmarked topics */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Bookmarked Topics</h2>
                <Link href="/bookmarks" className="view-all-link">View all</Link>
              </div>
              
              <div className="bookmarked-topics-list">
                {bookmarkedTopics && bookmarkedTopics.length > 0 ? (
                  bookmarkedTopics.slice(0, 5).map(topic => (
                    <div 
                      key={topic.id} 
                      className="bookmark-topic-card"
                      onClick={() => onSelectTopic(topic.id)}
                    >
                      <h3>{topic.name}</h3>
                      <p className="topic-author">by {topic.ownerName || 'Unknown'}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No bookmarked topics yet</p>
                    <p className="empty-state-hint">
                      Bookmark topics to quickly access them here
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick actions section */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Quick Actions</h2>
              </div>
              
              <div className="quick-actions">
                <Link href="/notes" className="quick-action-button">
                  <span className="action-icon">✏️</span>
                  <span>New Note</span>
                </Link>
                <button className="quick-action-button" onClick={() => setShowAddTopic(true)}>
                  <span className="action-icon">📌</span>
                  <span>New Topic</span>
                </button>
                <Link href="/profile" className="quick-action-button">
                  <span className="action-icon">👤</span>
                  <span>Edit Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}