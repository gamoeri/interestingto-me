'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userStats, setUserStats] = useState({
    notesCount: 0,
    topicsCount: 0,
    bookmarksCount: 0
  })
  const [archivedTopics, setArchivedTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const authUser = auth.currentUser
      if (!authUser) {
        router.push('/signin')
        return
      }

      setUser(authUser)
      
      try {
        // Get user profile
        const userDocRef = doc(db, 'users', authUser.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUserProfile(userData)
          
          // Fetch actual counts
          const notesQuery = query(collection(db, 'notes'), where('authorId', '==', authUser.uid))
          const notesSnapshot = await getDocs(notesQuery)
          
          const topicsQuery = query(collection(db, 'topics'), where('userId', '==', authUser.uid))
          const topicsSnapshot = await getDocs(topicsQuery)
          
          // Fetch archived topics
          const archivedTopicsQuery = query(
            collection(db, 'topics'), 
            where('userId', '==', authUser.uid),
            where('archived', '==', true)
          )
          const archivedTopicsSnapshot = await getDocs(archivedTopicsQuery)
          const archivedTopicsList = archivedTopicsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setArchivedTopics(archivedTopicsList)
          
          // Set stats with actual counts
          setUserStats({
            notesCount: notesSnapshot.docs.length,
            topicsCount: topicsSnapshot.docs.length,
            bookmarksCount: userData.bookmarkedTopics?.length || 0
          })
        } else {
          router.push('/signin')
          return
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
      
      setLoading(false)
    }
    
    fetchUserProfile()
  }, [router])

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-section">
      {/* Profile Banner */}
      <div 
        className="profile-banner" 
        style={{ backgroundImage: `url(${userProfile?.bannerImage || '/default-banner.jpg'})` }}
      >
        <div className="profile-info-container">
          <div className="profile-pic-container">
            {userProfile?.profilePic ? (
              <img 
                src={userProfile.profilePic} 
                alt={`${userProfile.displayName}'s profile`}
                className="profile-pic"
              />
            ) : (
              <div className="profile-pic-placeholder">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="profile-details">
        <div className="profile-info-main">
          <div>
            <h2 className="profile-name">{userProfile?.displayName || 'User'}</h2>
            <p className="profile-bio">
              {userProfile?.bio || "Learning and sharing my journey."}
            </p>
          </div>
          <button 
            className="edit-profile-button"
            onClick={() => router.push('/profile/edit')}
          >
            Edit Profile
          </button>
        </div>
      </div>
      
      {/* Profile Stats - Now positioned below profile details */}
      <div className="profile-stats-horizontal">
        <div className="stat-card">
          <h3>Notes</h3>
          <p className="stat-value">{userStats.notesCount}</p>
        </div>
        <div className="stat-card">
          <h3>Topics</h3>
          <p className="stat-value">{userStats.topicsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Bookmarks</h3>
          <p className="stat-value">{userStats.bookmarksCount}</p>
        </div>
      </div>
      
      {/* Archived Topics */}
      <div className="profile-quick-links">
        <div className="quick-links-list">
          <div className="archived-topics-section">
            <h3 className="archived-topics-title">Archived Topics</h3>
            {archivedTopics.length > 0 ? (
              <ul className="archived-topics-list">
                {archivedTopics.map((topic) => (
                  <li 
                    key={topic.id} 
                    className="quick-link-button"
                    onClick={() => router.push(`/topics/${topic.id}`)}
                  >
                    {topic.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-archived-topics">No archived topics</p>
            )}
          </div>
          
          {/* Sign Out Button */}
          <button 
            className="quick-link-button signout-button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}