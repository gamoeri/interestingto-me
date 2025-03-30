'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import BookmarksPageComponent from '@/components/BookmarksPage'

export default function UserBookmarksPage({ params }) {
  const router = useRouter()
  const { username } = params
  const [currentUser, setCurrentUser] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [bookmarkedTopics, setBookmarkedTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Check auth and fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Check if logged in
      const authUser = auth.currentUser
      if (!authUser) {
        router.push('/signin')
        return
      }
      
      setCurrentUser(authUser)
      
      try {
        // Check if this is the current user
        const currentUserDoc = await getDoc(doc(db, 'users', authUser.uid))
        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data()
          if (userData.displayName === username) {
            // Viewing own bookmarks, redirect to personal view
            router.push('/bookmarks')
            return
          }
        }
        
        // Find user by username
        const usersQuery = query(
          collection(db, 'users'), 
          where('displayName', '==', username)
        )
        
        const usersSnapshot = await getDocs(usersQuery)
        
        if (usersSnapshot.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Get the user profile
        const userDoc = usersSnapshot.docs[0]
        const userId = userDoc.id
        const userData = userDoc.data()
        
        setViewedProfile(userData)
        setViewedUserId(userId)
        
        // Get their bookmarked topics
        const bookmarkedIds = userData.bookmarkedTopics || []
        const bookmarkedTopicsData = []
        
        for (const topicId of bookmarkedIds) {
          const topicDoc = await getDoc(doc(db, 'topics', topicId))
          if (topicDoc.exists()) {
            const topicData = topicDoc.data()
            
            // Check if topic is not archived or is the user's own topic
            if (!topicData.archived || topicData.userId === userId) {
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
        }
        
        setBookmarkedTopics(bookmarkedTopicsData)
      } catch (error) {
        console.error('Error fetching user bookmarks:', error)
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [username, router])

  const handleSelectTopic = (topicId) => {
    router.push(`/topics/${topicId}`)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bookmarks for {username}...</p>
      </div>
    )
  }
  
  if (notFound) {
    return (
      <div className="not-found-container">
        <h2>User Not Found</h2>
        <p>The user "{username}" doesn't exist or has been removed.</p>
        <button onClick={() => router.push('/notes')} className="primary-button">
          Back to My Notes
        </button>
      </div>
    )
  }

  return (
    <div className="user-bookmarks-view">
      <div className="user-bookmarks-header">
        <h2>{viewedProfile?.displayName}'s Bookmarks</h2>
        <button 
          className="back-to-profile-button"
          onClick={() => router.push(`/user/${username}`)}
        >
          Back to Profile
        </button>
      </div>
      
      <BookmarksPageComponent 
        bookmarkedTopics={bookmarkedTopics}
        onSelectTopic={handleSelectTopic}
      />
    </div>
  )
}