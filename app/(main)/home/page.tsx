'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

export default function HomePage() {
  const { user, userProfile } = useAuth()
  const { activeTopics, bookmarkedTopics } = useTopics()
  
  const [activeTab, setActiveTab] = useState('following')
  const [followingNotes, setFollowingNotes] = useState([])
  const [bookmarkedNotes, setBookmarkedNotes] = useState([])
  const [loading, setLoading] = useState(true)

  // Placeholder for following notes
  useEffect(() => {
    const fetchFollowingNotes = async () => {
      try {
        setLoading(true)
        // Simulate fetching following notes
        setFollowingNotes([])
      } catch (error) {
        console.error('Error fetching following notes:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFollowingNotes()
  }, [])

  // Fetch bookmarked notes from topics
  useEffect(() => {
    const fetchBookmarkedNotes = async () => {
      if (!user || !bookmarkedTopics || bookmarkedTopics.length === 0) {
        setBookmarkedNotes([])
        return
      }

      try {
        setLoading(true)
        
        // Check if bookmarkedTopics has any entries
        if (bookmarkedTopics.length === 0) {
          setBookmarkedNotes([])
          setLoading(false)
          return
        }
        
        // Get the IDs of bookmarked topics
        const bookmarkedTopicIds = bookmarkedTopics.map(topic => topic.id)
        
        // Fetch notes from bookmarked topics
        const bookmarkedNotesQuery = query(
          collection(db, 'notes'),
          // Filter for notes in bookmarked topics
          where('topicIds', 'array-contains-any', bookmarkedTopicIds),
          orderBy('timestamp', 'desc'),
          // Limit to 20 most recent notes
          limit(20)
        )
        
        const notesSnapshot = await getDocs(bookmarkedNotesQuery)
        const notes = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setBookmarkedNotes(notes)
      } catch (error) {
        console.error('Error fetching bookmarked notes:', error)
        setBookmarkedNotes([])
      } finally {
        setLoading(false)
      }
    }
    
    if (bookmarkedTopics && bookmarkedTopics.length > 0) {
      fetchBookmarkedNotes()
    } else {
      setLoading(false)
    }
  }, [user, bookmarkedTopics])

  // Render notes list
  const renderNotesList = (notes) => {
    if (activeTab === 'following') {
      return (
        <div className="empty-state following-placeholder">
          <h3>Following Coming Soon</h3>
          <p>We're working on a feature to show notes from people you follow.</p>
          <div className="placeholder-actions">
            <button className="action-button disabled" disabled>
              Invite Friends
            </button>
            <button className="action-button disabled" disabled>
              Find People
            </button>
          </div>
        </div>
      )
    }

    if (notes.length === 0) {
      return (
        <div className="empty-state">
          <p>No bookmarked notes to show</p>
          <Link href="/notes" className="action-button">Create a note</Link>
        </div>
      )
    }

    return notes.map(note => (
      <div 
        key={note.id} 
        className="recent-note-card"
        onClick={() => {/* Handle note selection */}}
      >
        <div className="note-content-preview">
          {note.content?.length > 100 
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
  }

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
      const topic = [...activeTopics, ...bookmarkedTopics].find(t => t.id === id)
      return topic ? topic.name || topic.title : 'Unknown'
    })
    
    return topicNames.join(', ')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="content-panel home-page-container">
      {/* Tabs for Following and Bookmarks */}
      <div className="home-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
          <button 
            className={`tab-button ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'following' ? (
            <div className="following-notes-list">
              {renderNotesList(followingNotes)}
            </div>
          ) : (
            <div className="bookmarked-notes-list">
              {renderNotesList(bookmarkedNotes)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}