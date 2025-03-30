'use client'

import { useState, useEffect, useContext } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore'
import { AppContext } from '../layout' // Fixed import path
import { useRouter } from 'next/navigation'
import NotesSection from '@/components/NotesSection'

export default function HomePage() {
  const router = useRouter()
  const { user, userProfile, bookmarkedTopics, toggleBookmark } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [feedNotes, setFeedNotes] = useState([])
  
  // Fetch notes tagged with bookmarked topics
  useEffect(() => {
    const fetchFeedNotes = async () => {
      if (!user || !userProfile?.bookmarkedTopics || userProfile.bookmarkedTopics.length === 0) {
        if (user) {
          // If user is logged in but has no bookmarks, redirect to notes
          router.push('/notes')
        } else {
          // If no user, redirect to signin
          router.push('/signin')
        }
        return
      }
      
      try {
        setLoading(true)
        const feedItems = []
        
        // Get notes that contain any of the user's bookmarked topic IDs
        const topicIds = userProfile.bookmarkedTopics || []
        
        // Firebase doesn't support direct array-contains-any with multiple values
        // So we might need to fetch each topic's notes separately
        for (const topicId of topicIds) {
          const notesQuery = query(
            collection(db, 'notes'),
            where('topicIds', 'array-contains', topicId),
            orderBy('timestamp', 'desc')
          )
          
          const notesSnapshot = await getDocs(notesQuery)
          const topicNotes = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fromBookmarkedTopic: topicId
          }))
          
          feedItems.push(...topicNotes)
        }
        
        // Remove duplicates (if a note is in multiple bookmarked topics)
        const uniqueNotes = feedItems.reduce((acc, current) => {
          const isDuplicate = acc.find(item => item.id === current.id)
          if (!isDuplicate) {
            acc.push(current)
          }
          return acc
        }, [])
        
        // Sort by timestamp (newest first)
        const sortedNotes = uniqueNotes.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp)
        })
        
        setFeedNotes(sortedNotes)
      } catch (error) {
        console.error('Error fetching feed notes:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFeedNotes()
  }, [user, userProfile, router])
  
  // Handle note selection (e.g., to view replies)
  const handleSelectNote = (noteId) => {
    // Implement note selection logic
    console.log('Selected note:', noteId)
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your personalized feed...</p>
      </div>
    )
  }
  
  return (
    <div className="home-feed-container">
      <div className="feed-header">
        <h1 className="text-2xl font-bold mb-4">Your Interest Feed</h1>
        <p className="text-gray-600 mb-6">
          Notes from topics you've bookmarked
        </p>
      </div>
      
      {feedNotes.length > 0 ? (
        <div className="feed-content">
          <NotesSection
            notes={feedNotes}
            topics={bookmarkedTopics}
            userProfile={userProfile}
            onSelectNote={handleSelectNote}
            displayName={userProfile?.displayName}
            profilePic={userProfile?.profilePic}
            onToggleBookmark={toggleBookmark}
            showBookmarkInfo={true}
          />
        </div>
      ) : (
        <div className="empty-feed-state">
          <h2 className="text-xl font-semibold mb-3">No Notes in Your Feed</h2>
          <p className="text-gray-600 mb-4">
            Bookmark more topics or explore notes in your bookmarked topics to 
            populate your feed.
          </p>
          <button 
            onClick={() => router.push('/notes')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to My Notes
          </button>
        </div>
      )}
    </div>
  )
}