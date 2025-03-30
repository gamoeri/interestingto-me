'use client'

import { useContext, useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import BookmarksPageComponent from '@/components/BookmarksPage'
import { AppContext } from '../layout'

export default function BookmarksPage() {
  const router = useRouter()
  const { user, userProfile, bookmarkedTopics: contextBookmarks, toggleBookmark } = useContext(AppContext)
  const [bookmarkedTopics, setBookmarkedTopics] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch bookmarks directly from database on every visit to this page
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        return
      }
      
      try {
        console.log("Fetching bookmarks directly from database")
        // Get user profile to fetch bookmark IDs
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const bookmarkIds = userData.bookmarkedTopics || []
          
          console.log("Found bookmarked topics:", bookmarkIds.length)
          
          // Fetch each bookmarked topic by ID
          const bookmarkedTopicsData = []
          
          for (const topicId of bookmarkIds) {
            const topicDoc = await getDoc(doc(db, 'topics', topicId))
            if (topicDoc.exists()) {
              const topicData = topicDoc.data()
              
              // Get owner info
              let ownerName = 'Unknown'
              if (topicData.userId) {
                const ownerDoc = await getDoc(doc(db, 'users', topicData.userId))
                if (ownerDoc.exists()) {
                  ownerName = ownerDoc.data().displayName || 'Unknown'
                }
              }
              
              bookmarkedTopicsData.push({
                id: topicDoc.id,
                ...topicData,
                ownerName
              })
            }
          }
          
          console.log("Fetched bookmarked topics data:", bookmarkedTopicsData.length)
          setBookmarkedTopics(bookmarkedTopicsData)
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
      }
      
      setLoading(false)
    }
    
    fetchBookmarks()
  }, [user, router]) // Re-fetch whenever this page is visited or user changes

  const handleSelectTopic = (topicId) => {
    router.push(`/topics/${topicId}`)
  }
  
  // Handle bookmark toggling
  const handleBookmarkToggle = async (topicId) => {
    await toggleBookmark(topicId)
    // After toggling, refresh the bookmarks
    const updatedBookmarks = bookmarkedTopics.filter(topic => topic.id !== topicId)
    setBookmarkedTopics(updatedBookmarks)
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