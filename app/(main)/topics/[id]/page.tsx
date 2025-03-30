'use client'

import { useContext, useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  doc, 
  deleteDoc,
  arrayRemove,
  updateDoc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import TopicContent from '@/components/TopicContent'
import { AppContext } from '../../layout' // Fixed import path

export default function TopicPage({ params }) {
  const router = useRouter()
  const topicId = params.id
  const { user, userProfile, toggleBookmark } = useContext(AppContext)
  const [loading, setLoading] = useState(!user)
  const [error, setError] = useState(null)


  useEffect(() => {
    // If user is loaded from context, no need for additional auth check
    if (user) {
      setLoading(false)
    }
  }, [user])

  // Handle topic deletion
  const handleDeleteTopic = async () => {
    if (!user) return
    
    try {
      // Delete the topic from Firestore
      await deleteDoc(doc(db, 'topics', topicId))
      
      // Update user's bookmarkedTopics if it was there
      if (userProfile?.bookmarkedTopics?.includes(topicId)) {
        await updateDoc(doc(db, 'users', user.uid), {
          bookmarkedTopics: arrayRemove(topicId)
        })
      }
      
      if (userProfile?.archivedTopics?.includes(topicId)) {
        await updateDoc(doc(db, 'users', user.uid), {
          archivedTopics: arrayRemove(topicId)
        })
      }
      
      // Navigate back to notes
      router.push('/notes')
    } catch (error) {
      console.error('Error deleting topic:', error)
      setError('Failed to delete topic. Please try again.')
    }
  }

  // Use the context's toggleBookmark function
  const handleBookmarkToggle = async (isBookmarked) => {
    if (!user) return
    await toggleBookmark(topicId)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading topic...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => router.push('/notes')} className="primary-button">
          Back to Notes
        </button>
      </div>
    )
  }

  return (
    <TopicContent
      topicId={topicId}
      userId={user?.uid}
      onTopicDeleted={handleDeleteTopic}
      onBookmarkToggle={handleBookmarkToggle}
    />
  )
}