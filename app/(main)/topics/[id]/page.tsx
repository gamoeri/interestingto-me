'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTopics } from '@/context/TopicsContext'
import TopicContent from '@/components/TopicContent'
import { use } from 'react' 

export default function TopicPage({ params }) {
  const router = useRouter()
  const topicId = use(params).id 
  const { user, userProfile } = useAuth()
  const { activeTopics, bookmarkedTopics, deleteTopic, toggleBookmark } = useTopics()
  const [loading, setLoading] = useState(!user)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      setLoading(false)
    }
  }, [user])

  // Find the topic in both active and bookmarked topics
  const allTopics = [...activeTopics, ...bookmarkedTopics]
  const topic = allTopics.find(t => t.id === topicId)
  const isBookmarked = bookmarkedTopics.some(t => t.id === topicId)

  // Handle topic deletion
  const handleDeleteTopic = async () => {
    if (!user) return
    
    try {
      await deleteTopic(topicId)
      router.push('/notes')
    } catch (error) {
      console.error('Error deleting topic:', error)
      setError('Failed to delete topic. Please try again.')
    }
  }

  // Use the context's toggleBookmark function
  const handleBookmarkToggle = async () => {
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

  if (!topic) {
    return (
      <div className="error-container">
        <p>Topic not found</p>
        <button onClick={() => router.push('/notes')} className="primary-button">
          Back to Notes
        </button>
      </div>
    )
  }

  return (
    <TopicContent
      topic={topic}
      topicId={topicId}
      userId={user?.uid}
      isBookmarked={isBookmarked}
      onTopicDeleted={handleDeleteTopic}
      onBookmarkToggle={handleBookmarkToggle}
    />
  )
}