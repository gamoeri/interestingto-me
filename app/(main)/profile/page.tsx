'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
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
          
          // Set stats
          setUserStats({
            notesCount: 0, // You might want to fetch this count
            topicsCount: 0, // You might want to fetch this count
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-view">
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
      
      {/* Profile Stats */}
      <div className="profile-stats">
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
      
      {/* Quick Links */}
      <div className="profile-quick-links">
        <button 
          className="quick-link-button"
          onClick={() => router.push('/notes')}
        >
          View My Notes
        </button>
        <button 
          className="quick-link-button"
          onClick={() => router.push('/bookmarks')}
        >
          View My Bookmarks
        </button>
      </div>
    </div>
  )
}