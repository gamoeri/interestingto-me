'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import BookmarksPageComponent from '@/components/BookmarksPage'

export default function BookmarksPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { bookmarkedTopics, toggleBookmark } = useTopics()
  const [loading, setLoading] = useState(true)

  // Set loading to false when data is ready
  useEffect(() => {
    if (user && bookmarkedTopics) {
      setLoading(false)
    }
  }, [user, bookmarkedTopics])

  const handleSelectTopic = (topicId) => {
    router.push(`/topics/${topicId}`)
  }
  
  // Handle bookmark toggling
  const handleBookmarkToggle = async (topicId) => {
    await toggleBookmark(topicId)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your bookmarks...</p>
      </div>
    )
  }

  return (
    <BookmarksPageComponent 
      bookmarkedTopics={bookmarkedTopics}
      onSelectTopic={handleSelectTopic}
      onToggleBookmark={handleBookmarkToggle}
    />
  )
}