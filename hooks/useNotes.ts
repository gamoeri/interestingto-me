// hooks/useNotes.ts
'use client'
import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

export interface Note {
  id: string;
  content: string;
  authorId: string;
  topicIds?: string[];
  timestamp: string;
  likes?: string[];
  replies?: any[];
}

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [viewMode, setViewMode] = useState<'feed' | 'reply'>('feed')

  useEffect(() => {
    if (!user?.uid) {
      setNotes([])
      setLoading(false)
      return
    }

    console.log('[useNotes] Setting up notes listener', { userId: user.uid })
    setLoading(true)
    
    const notesQuery = query(
      collection(db, 'notes'), 
      where('authorId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      notesQuery, 
      (snapshot) => {
        const fetchedNotes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Note))
        
        console.log('[useNotes] Notes fetched', { count: fetchedNotes.length })
        setNotes(fetchedNotes)
        setLoading(false)
      },
      (error) => {
        console.error('[useNotes] Error fetching notes:', error)
        setLoading(false)
      }
    )

    return () => {
      console.log('[useNotes] Cleaning up notes listener')
      unsubscribe()
    }
  }, [user?.uid])

  // Define the functions within the hook
  const addNote = async (content: string, topicIds: string[] = []) => {
    if (!user) {
      console.warn('[useNotes] Cannot add note - no user')
      return
    }

    try {
      console.log('[useNotes] Adding note', { content, topicIds })
      await addDoc(collection(db, 'notes'), {
        content,
        topicIds,
        authorId: user.uid,
        timestamp: new Date().toISOString(),
        likes: [],
        replies: []
      })
    } catch (error) {
      console.error('[useNotes] Error adding note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      console.log('[useNotes] Deleting note', { noteId })
      await deleteDoc(doc(db, 'notes', noteId))
      
      // Reset active note if deleted
      if (activeNote?.id === noteId) {
        setActiveNote(null)
        setViewMode('feed')
      }
    } catch (error) {
      console.error('[useNotes] Error deleting note:', error)
    }
  }

  const getNotesByTopic = (topicId: string): Note[] => {
    console.log('[useNotes] Filtering notes by topic', { topicId })
    return notes.filter(note => 
      note.topicIds && note.topicIds.includes(topicId)
    )
  }

  const addReply = async (noteId: string, content: string) => {
    if (!user) {
      console.warn('[useNotes] Cannot add reply - no user')
      return
    }

    try {
      console.log('[useNotes] Adding reply to note', { noteId, content })
      const reply = {
        content,
        userId: user.uid,
        timestamp: new Date().toISOString()
      }

      await updateDoc(doc(db, 'notes', noteId), {
        replies: arrayUnion(reply)
      })
    } catch (error) {
      console.error('[useNotes] Error adding reply:', error)
    }
  }

  const toggleLike = async (noteId: string) => {
    if (!user) {
      console.warn('[useNotes] Cannot toggle like - no user')
      return
    }

    try {
      const noteRef = doc(db, 'notes', noteId)
      const note = notes.find(n => n.id === noteId)
      
      if (!note) {
        console.warn('[useNotes] Note not found for like toggle')
        return
      }

      const likes = note.likes || []
      const isLiked = likes.includes(user.uid)

      await updateDoc(noteRef, {
        likes: isLiked 
          ? arrayRemove(user.uid) 
          : arrayUnion(user.uid)
      })
    } catch (error) {
      console.error('[useNotes] Error toggling like:', error)
    }
  }

  const changeNoteTopic = async (noteId: string, topicId: string) => {
    try {
      const noteRef = doc(db, 'notes', noteId)
      const note = notes.find(n => n.id === noteId)
      
      if (!note) {
        console.warn('[useNotes] Note not found for topic change')
        return
      }

      const currentTopics = note.topicIds || []
      const topicIndex = currentTopics.indexOf(topicId)
      
      const updatedTopics = topicIndex > -1
        ? currentTopics.filter(id => id !== topicId)
        : [...currentTopics, topicId]

      await updateDoc(noteRef, {
        topicIds: updatedTopics
      })
    } catch (error) {
      console.error('[useNotes] Error changing note topic:', error)
    }
  }

  const selectNote = (noteId: string | null) => {
    console.log('[useNotes] Selecting note', { noteId })
    const selectedNote = noteId ? notes.find(n => n.id === noteId) : null
    setActiveNote(selectedNote || null)
    setViewMode(noteId ? 'reply' : 'feed')
  }

  const backToFeed = () => {
    console.log('[useNotes] Returning to feed')
    setActiveNote(null)
    setViewMode('feed')
  }

  // Return all functions and state
  return {
    notes,
    loading,
    activeNote,
    viewMode,
    addNote,
    deleteNote,
    getNotesByTopic,
    addReply,
    toggleLike,
    changeNoteTopic,
    selectNote,
    backToFeed
  }
}