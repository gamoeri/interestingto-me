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

export default function UserTopicsPage({ params }) {
  const router = useRouter()
  const { username } = params
  const [currentUser, setCurrentUser] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [topics, setTopics] = useState([])
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
            // Viewing own topics - we could redirect, but for now show same view
            // with edit capabilities disabled
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
        
        // Get their topics
        const topicsQuery = query(
          collection(db, 'topics'), 
          where('userId', '==', userId)
        )
        
        const topicsSnapshot = await getDocs(topicsQuery)
        const allTopics = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Filter out archived topics if not the owner
        const isOwner = authUser.uid === userId
        const visibleTopics = isOwner ? 
          allTopics : 
          allTopics.filter(topic => !topic.archived)
        
        setTopics(visibleTopics)
      } catch (error) {
        console.error('Error fetching user topics:', error)
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [username, router])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading topics for {username}...</p>
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
    <div className="user-topics-view">
      <div className="user-topics-header">
        <h2>{viewedProfile?.displayName}'s Topics</h2>
        <button 
          className="back-to-profile-button"
          onClick={() => router.push(`/user/${username}`)}
        >
          Back to Profile
        </button>
      </div>
      
      {topics.length > 0 ? (
        <div className="topics-grid">
          {topics.map(topic => (
            <div 
              key={topic.id} 
              className="topic-card"
              onClick={() => router.push(`/topics/${topic.id}`)}
            >
              <h3 className="topic-title">{topic.name}</h3>
              {topic.content && (
                <p className="topic-preview">
                  {topic.content.substring(0, 100)}
                  {topic.content.length > 100 && '...'}
                </p>
              )}
              <div className="topic-meta">
                <span className="topic-date">
                  Created: {new Date(topic.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-topics">
          <p>This user hasn't created any topics yet.</p>
        </div>
      )}
    </div>
  )
}