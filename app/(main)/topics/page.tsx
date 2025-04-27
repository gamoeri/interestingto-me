// app/(main)/topics/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTopics } from '@/context/TopicsContext'
import { useNotes } from '@/hooks/useNotes'

export default function TopicsPage() {
  const { activeTopics } = useTopics()
  const { notes } = useNotes()
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)

  // Function to get notes for a specific topic
  const getTopicNotes = (topicId: string) => {
    return notes.filter(note => note.topicId === topicId)
  }

  // Function to get bookmarks for a topic (placeholder - implement actual bookmark logic)
  const getTopicBookmarks = (topicId: string) => {
    // TODO: Implement actual bookmark tracking
    return 0
  }

  // Function to handle editing a topic
  const handleEditTopic = (topicId: string) => {
    setEditingTopicId(topicId)
  }

  // Function to save topic edits
  const handleSaveTopicEdit = (topicId: string) => {
    // TODO: Implement topic edit save logic
    setEditingTopicId(null)
  }

  return (
    <div className="topics-page">
      <h1 className="page-title">Your Topics</h1>
      
      {activeTopics.length === 0 ? (
        <div className="empty-topics-message">
          <p>You haven't created any topics yet.</p>
          <button className="create-topic-button">Create First Topic</button>
        </div>
      ) : (
        <div className="topics-list">
          {activeTopics.map(topic => {
            const topicNotes = getTopicNotes(topic.id)
            const topicBookmarks = getTopicBookmarks(topic.id)
            
            return (
              <div key={topic.id} className="topic-item">
                <div className="topic-header">
                  {editingTopicId === topic.id ? (
                    <div className="topic-edit-mode">
                      <input 
                        type="text" 
                        defaultValue={topic.title} 
                        className="topic-edit-input"
                      />
                      <div className="topic-edit-actions">
                        <button 
                          onClick={() => handleSaveTopicEdit(topic.id)}
                          className="save-topic-button"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingTopicId(null)}
                          className="cancel-edit-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="topic-view-mode">
                      <Link href={`/topics/${topic.id}`} className="topic-title">
                        {topic.title}
                      </Link>
                      <div className="topic-actions">
                        <button 
                          onClick={() => handleEditTopic(topic.id)}
                          className="edit-topic-button"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="topic-stats">
                  <span className="topic-notes-count">
                    {topicNotes.length} {topicNotes.length === 1 ? 'Note' : 'Notes'}
                  </span>
                  <span className="topic-bookmarks-count">
                    {topicBookmarks} {topicBookmarks === 1 ? 'Bookmark' : 'Bookmarks'}
                  </span>
                </div>
                
                {topicNotes.length > 0 && (
                  <div className="topic-notes-preview">
                    {topicNotes.slice(0, 2).map(note => (
                      <div key={note.id} className="topic-note-preview">
                        <p>{note.content}</p>
                      </div>
                    ))}
                    {topicNotes.length > 2 && (
                      <Link 
                        href={`/topics/${topic.id}`} 
                        className="view-all-notes-link"
                      >
                        View all notes
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}