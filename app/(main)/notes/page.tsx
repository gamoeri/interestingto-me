'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useNotes } from '@/hooks/useNotes'
import { useTopics } from '@/context/TopicsContext'
import NotesSection from '@/components/NotesSection'

export default function NotesPage() {
  console.log('[NotesPage] Rendering component')
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const { 
    notes, 
    activeNote,
    viewMode,
    loading: notesLoading, 
    addNote, 
    deleteNote, 
    addReply,
    toggleLike,
    changeNoteTopic,
    selectNote,
    backToFeed
  } = useNotes()
  
  const { 
    topics = [], // Ensures empty array if undefined
    loading: topicsLoading
  } = useTopics()

  useEffect(() => {
    console.log('[NotesPage] Auth check running', {
      authLoading,
      userExists: !!user,
      userProfileExists: !!userProfile 
    })
    
    if (!authLoading && !user) {
      console.log('[NotesPage] Redirecting to sign-in')
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    console.log('[NotesPage] Mounted with notes data', {
      notesCount: notes?.length || 0,
      topicsCount: topics?.length || 0,
      activeNote: activeNote?.id
    })
  }, [notes, topics, activeNote])

  if (authLoading || notesLoading || !user) {
    console.log('[NotesPage] Rendering loading state', {
      authLoading,
      notesLoading,
      userExists: !!user
    })
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    )
  }

  console.log('[NotesPage] Rendering NotesSection with props', {
    notesCount: notes.length,
    topicsCount: topics.length,
    userProfileExists: !!userProfile,
    activeNoteId: activeNote?.id,
    viewMode
  })

  return (
    <NotesSection 
      notes={notes}
      topics={topics}
      userProfile={userProfile}
      user={user}
      onAddNote={addNote}
      onDeleteNote={deleteNote}
      onSelectNote={selectNote}
      onAddReply={addReply}
      onToggleLike={toggleLike}
      onChangeNoteTopic={changeNoteTopic}
      activeNoteId={activeNote?.id}
      viewMode={viewMode}
      onBackToFeed={backToFeed}
      displayName={userProfile?.displayName}
      profilePic={userProfile?.profilePic}
      bannerImage={userProfile?.bannerImage}
    />
  )
}