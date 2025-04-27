'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AddSection({ topicId, userId, onSectionAdded }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [attachmentType, setAttachmentType] = useState(null)
  const [showNoteSelector, setShowNoteSelector] = useState(false)
  const [userNotes, setUserNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  
  // Fetch user's notes for attaching
  useEffect(() => {
    const fetchUserNotes = async () => {
      if (!userId || !showNoteSelector) return
      
      try {
        const notesQuery = query(
          collection(db, 'notes'),
          where('authorId', '==', userId)
        )
        
        const notesSnapshot = await getDocs(notesQuery)
        const notesData = await Promise.all(
          notesSnapshot.docs.map(async (noteDoc) => {
            const note = {
              id: noteDoc.id,
              ...noteDoc.data()
            }
            
            return note
          })
        )
        
        setUserNotes(notesData)
      } catch (error) {
        console.error('Error fetching user notes:', error)
      }
    }
    
    fetchUserNotes()
  }, [userId, showNoteSelector])
  
  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  // Reset form
  const resetForm = () => {
    setContent('')
    setAttachmentType(null)
    setShowNoteSelector(false)
    setSelectedNoteId(null)
    setIsAdding(false)
    setIsExpanded(false)
  }
  
  // Handle add section
  const handleAddSection = async () => {
    if (!userId || (!content.trim() && !selectedNoteId)) return
    
    try {
      setIsAdding(true)
      
      // Prepare attachments
      const attachments = []
      
      if (attachmentType === 'note' && selectedNoteId) {
        attachments.push({
          type: 'note',
          id: selectedNoteId
        })
      }
      
      // Create section document
      const sectionData = {
        content: content.trim(),
        attachments,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: {
          count: 0,
          userIds: []
        },
        replies: [],
        deleted: false
      }
      
      // Add to firestore
      const sectionRef = await addDoc(
        collection(db, 'topics', topicId, 'sections'),
        sectionData
      )
      
      console.log('Section added:', sectionRef.id)
      
      // Call callback with new section data
      if (onSectionAdded) {
        onSectionAdded({
          id: sectionRef.id,
          ...sectionData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      
      // Reset form
      resetForm()
    } catch (error) {
      console.error('Error adding section:', error)
      alert('Failed to add section. Please try again.')
      setIsAdding(false)
    }
  }
  
  // If not expanded, show just the "+ Add Section" button
  if (!isExpanded) {
    return (
      <div 
        className="add-section-button-container" 
        onClick={() => setIsExpanded(true)}
      >
        <button className="add-section-button">
          Add Section
        </button>
      </div>
    )
  }
  
  // Expanded section form
  return (
    <div className="add-section-container">
      <div className="section-content-input">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add content to this section..."
          className="content-textarea"
          autoFocus
        />
      </div>
      
      {/* Attachment options */}
      <div className="attachment-options">
        <div className="attachment-toggle">
          <div className="attachment-buttons">
            <button
              type="button"
              className={`attachment-button ${attachmentType === 'note' ? 'selected' : ''}`}
              onClick={() => {
                setAttachmentType('note')
                setShowNoteSelector(true)
              }}
            >
              Add Note
            </button>
            {attachmentType && (
              <button
                type="button"
                className="clear-attachment-button"
                onClick={() => {
                  setAttachmentType(null)
                  setShowNoteSelector(false)
                  setSelectedNoteId(null)
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Note selector */}
        {showNoteSelector && (
          <div className="note-selector">
            <h4>Select a note to attach</h4>
            {userNotes.length > 0 ? (
              <div className="notes-list">
                {userNotes.map((note, index) => (
                  <div 
                    key={`note-${note.id}-${index}`} 
                    className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <div className="note-preview">
                      <div className="note-preview-content">
                        {note.content?.length > 100
                          ? `${note.content.substring(0, 100)}...`
                          : note.content
                        }
                      </div>
                      <div className="note-preview-date">
                        {formatDate(note.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-notes">
                You don't have any notes to attach. Create a note first.
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="add-section-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={resetForm}
        >
          Cancel
        </button>
        <button
          type="button"
          className="add-button"
          onClick={handleAddSection}
          disabled={
            isAdding || 
            (!content.trim() && !selectedNoteId) ||
            (attachmentType === 'note' && !selectedNoteId)
          }
        >
          {isAdding ? 'Adding...' : 'Add Section'}
        </button>
      </div>
    </div>
  )
}