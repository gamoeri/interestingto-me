'use client'

import { useState, useCallback, useContext, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc,
  updateDoc,
  arrayUnion,
  getDoc
} from 'firebase/firestore'
import NotesSection from '@/components/NotesSection'
import { useRouter } from 'next/navigation'
import { AppContext } from '../layout'

export default function NotesPage() {
  // Get data from context
  const { 
    user, 
    userProfile, 
    userNotes: contextNotes = [], 
    topics: contextTopics = [],
    setActiveNote: setGlobalActiveNote
  } = useContext(AppContext)
  
  const router = useRouter()
  const [userNotes, setUserNotes] = useState(contextNotes)
  const [topics, setTopics] = useState(contextTopics)
  const [loading, setLoading] = useState(!user)
  const [activeNote, setLocalActiveNote] = useState(null)

  // Update local state when context changes
  useEffect(() => {
    setUserNotes(contextNotes)
    setTopics(contextTopics)
    setLoading(!user)
  }, [contextNotes, contextTopics, user])

  // Add note function
  const addNote = useCallback(async (noteContent, selectedTopicIds = []) => {
    if (!noteContent.trim() || !user || noteContent.length > 280) return
  
    try {
      // Create a new document in the notes collection
      const noteData = {
        content: noteContent.trim(),
        timestamp: new Date().toISOString(),
        author: userProfile?.displayName || user.email.split('@')[0],
        authorId: user.uid,
        profilePic: userProfile?.profilePic || null,
        replies: [],
        topicIds: Array.isArray(selectedTopicIds) ? selectedTopicIds : [selectedTopicIds].filter(Boolean)
      }
      
      // Add to the notes collection
      const noteRef = await addDoc(collection(db, 'notes'), noteData)
      
      // Add the new note to the local state
      const newNote = {
        id: noteRef.id,
        ...noteData
      }
      
      setUserNotes(prev => [newNote, ...prev])
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    }
  }, [user, userProfile])
  
  // Delete note function
  const deleteNote = useCallback(async (noteId) => {
    if (!user || !noteId) return
    
    try {
      // Delete the note document
      await deleteDoc(doc(db, 'notes', noteId))
      
      // Update the local state
      setUserNotes(prev => prev.filter(note => note.id !== noteId))
      
      // If this was the active note, clear the selection
      if (activeNote === noteId) {
        setLocalActiveNote(null)
        setGlobalActiveNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    }
  }, [user, activeNote, setGlobalActiveNote])

  // Pin note to topic function
  const pinNoteToTopic = useCallback(async (noteId, topicId) => {
    if (!user || !noteId || !topicId) return
    
    try {
      // First, get the topic document
      const topicRef = doc(db, 'topics', topicId)
      const topicDoc = await getDoc(topicRef)
      
      if (!topicDoc.exists()) {
        console.error('Topic not found')
        return
      }
      
      // Update the topic with the new pinned note ID
      const topicData = topicDoc.data()
      const pinnedNoteIds = topicData.pinnedNoteIds || []
      
      // Only add if not already pinned
      if (!pinnedNoteIds.includes(noteId)) {
        await updateDoc(topicRef, {
          pinnedNoteIds: arrayUnion(noteId)
        })
      }
      
      // Update the note to mark it as pinned
      const noteRef = doc(db, 'notes', noteId)
      await updateDoc(noteRef, {
        isPinned: true,
        pinnedToTopics: arrayUnion(topicId)
      })
      
      // Update local state
      setUserNotes(prev => prev.map(note => 
        note.id === noteId ? {...note, isPinned: true} : note
      ))
      
    } catch (error) {
      console.error('Error pinning note to topic:', error)
      alert('Failed to pin note. Please try again.')
    }
  }, [user])

  // Sync local and global active note
  const handleSelectNote = useCallback((noteId) => {
    setLocalActiveNote(noteId)
    setGlobalActiveNote(noteId)
  }, [setGlobalActiveNote])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    )
  }

  return (
    <NotesSection 
      notes={userNotes}
      topics={topics}
      userProfile={userProfile}
      onAddNote={addNote}
      onDeleteNote={deleteNote}
      onSelectNote={handleSelectNote}
      activeNoteId={activeNote}
      displayName={userProfile?.displayName}
      profilePic={userProfile?.profilePic}
      onPinNoteToTopic={pinNoteToTopic}
      bannerImage={userProfile?.bannerImage}
      showReadOnlyTags={true} // Add this prop to indicate topic tags should be read-only
    />
  )
}