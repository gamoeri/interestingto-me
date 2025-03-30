'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import ProfileEdit from '@/components/ProfileEdit'

export default function ProfileEditPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
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
          setUserProfile(userDoc.data())
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

  const updateDisplayName = useCallback(async (newName) => {
    if (!user || !newName.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { displayName: newName })
      setUserProfile(prev => ({...prev, displayName: newName}))
    } catch (error) {
      console.error('Error updating name:', error)
      alert('Failed to update name. Please try again.')
    }
  }, [user])

  const updateBio = useCallback(async (newBio) => {
    if (!user) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { bio: newBio })
      setUserProfile(prev => ({...prev, bio: newBio}))
    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio. Please try again.')
    }
  }, [user])

  const updateProfilePic = useCallback(async (newPic) => {
    if (!user || !newPic.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { profilePic: newPic })
      setUserProfile(prev => ({...prev, profilePic: newPic}))
    } catch (error) {
      console.error('Error updating profile picture:', error)
      alert('Failed to update profile picture. Please try again.')
    }
  }, [user])

  const updateBannerImage = useCallback(async (newBanner) => {
    if (!user || !newBanner.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { bannerImage: newBanner })
      setUserProfile(prev => ({...prev, bannerImage: newBanner}))
    } catch (error) {
      console.error('Error updating banner image:', error)
      alert('Failed to update banner image. Please try again.')
    }
  }, [user])

  const updateBackgroundColor = useCallback(async (newColor) => {
    if (!user || !newColor.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { backgroundColor: newColor })
      setUserProfile(prev => ({...prev, backgroundColor: newColor}))
    } catch (error) {
      console.error('Error updating background color:', error)
      alert('Failed to update background color. Please try again.')
    }
  }, [user])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <ProfileEdit 
      userProfile={userProfile}
      onUpdateDisplayName={updateDisplayName}
      onUpdateBio={updateBio}
      onUpdateProfilePic={updateProfilePic}
      onUpdateBannerImage={updateBannerImage}
      onUpdateBackgroundColor={updateBackgroundColor}
      onClose={() => router.push('/profile')}
    />
  )
}