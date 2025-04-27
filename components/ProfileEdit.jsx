'use client'

import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext' // Import useAuth

export default function ProfileEdit({ onClose }) {
  const router = useRouter()
  const { refreshUserProfile } = useAuth() // Get the refresh function
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    profilePic: '',
    bannerImage: '',
    backgroundColor: '#f8f8f8'
  })
  const [originalData, setOriginalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState({ saving: false, success: false, error: null })

  // Fetch user profile once
  useEffect(() => {
    let isMounted = true
    
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          router.push('/signin')
          return
        }
        
        // Get user profile from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists() && isMounted) {
          const userData = userDoc.data()
          console.log('[ProfileEdit] User profile loaded', { userId: currentUser.uid })
          
          // Store original data
          setOriginalData(userData)
          
          // Initialize form state
          setFormData({
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            profilePic: userData.profilePic || '',
            bannerImage: userData.bannerImage || '',
            backgroundColor: userData.backgroundColor || '#f8f8f8'
          })
        }
      } catch (error) {
        console.error('[ProfileEdit] Error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchUserProfile()
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false
    }
  }, [router])
  
  // Handle input changes
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])
  
  // Handle save - memoized to prevent recreating on render
  const handleSave = useCallback(async (e) => {
    e.preventDefault()
    
    const currentUser = auth.currentUser
    if (!currentUser) return
    
    setSaveStatus({ saving: true, success: false, error: null })
    
    try {
      // Create updates object with only changed fields
      const updates = {}
      
      if (formData.displayName.trim() && formData.displayName !== originalData?.displayName) {
        updates.displayName = formData.displayName
      }
      
      if (formData.bio !== originalData?.bio) {
        updates.bio = formData.bio
      }
      
      if (formData.profilePic.trim() && formData.profilePic !== originalData?.profilePic) {
        updates.profilePic = formData.profilePic
      }
      
      if (formData.bannerImage.trim() && formData.bannerImage !== originalData?.bannerImage) {
        updates.bannerImage = formData.bannerImage
      }
      
      if (formData.backgroundColor !== originalData?.backgroundColor) {
        updates.backgroundColor = formData.backgroundColor
        console.log('[ProfileEdit] Updating background color to:', formData.backgroundColor)
      }
      
      // Add timestamp only if we have changes
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString()
        
        // Update Firestore
        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, updates)
        console.log('[ProfileEdit] Profile updated successfully')
        
        // Refresh user profile in context
        await refreshUserProfile()
        console.log('[ProfileEdit] Auth context refreshed')
        
        setSaveStatus({ saving: false, success: true, error: null })
        
        // Redirect with small delay to show success message
        setTimeout(() => {
          router.push('/profile')
        }, 1000)
      } else {
        // No changes to save
        router.push('/profile')
      }
    } catch (error) {
      console.error('[ProfileEdit] Save error:', error)
      setSaveStatus({ saving: false, success: false, error: 'Failed to save profile changes' })
    }
  }, [formData, originalData, router, refreshUserProfile]) // Add refreshUserProfile to dependencies
  
  // Handle close/cancel
  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose()
    } else {
      router.push('/profile')
    }
  }, [onClose, router])
  
  if (loading) {
    return (
      <div className="content-panel profile-edit-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }
  
  return (
    <div className="content-panel profile-edit-container">
      <div className="profile-edit-header">
        <h2>Edit Profile</h2>
        <button 
          onClick={handleClose} 
          className="close-button"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      {saveStatus.error && (
        <div className="error-message">
          {saveStatus.error}
        </div>
      )}
      
      {saveStatus.success && (
        <div className="success-message">
          Profile updated successfully!
        </div>
      )}
      
      <form onSubmit={handleSave} className="profile-edit-form">
        {/* Profile Picture */}
        <div className="edit-section">
          <label className="form-label">Profile Picture</label>
          <div className="profile-pic-edit">
            <div className="current-pic">
              {formData.profilePic ? (
                <img 
                  src={formData.profilePic} 
                  alt="Profile preview" 
                  className="preview-image"
                />
              ) : (
                <div className="pic-placeholder">
                  {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="pic-input">
              <input
                type="url"
                value={formData.profilePic}
                onChange={(e) => handleChange('profilePic', e.target.value)}
                placeholder="Enter image URL"
                className="text-input"
              />
            </div>
          </div>
        </div>
        
        {/* Banner Image */}
        <div className="edit-section">
          <label className="form-label">Banner Image</label>
          <div className="banner-pic-edit">
            {formData.bannerImage && (
              <div className="banner-preview" style={{ backgroundImage: `url(${formData.bannerImage})` }}>
              </div>
            )}
            <input
              type="url"
              value={formData.bannerImage}
              onChange={(e) => handleChange('bannerImage', e.target.value)}
              placeholder="Enter banner image URL"
              className="text-input"
            />
          </div>
        </div>
        
        {/* Background Color */}
        <div className="edit-section">
          <label className="form-label">Background Color</label>
          <div className="color-picker-container">
            <input
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={formData.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              placeholder="#RRGGBB"
              className="text-input color-text"
            />
          </div>
        </div>
        
        {/* Display Name */}
        <div className="edit-section">
          <label className="form-label">Display Name</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            placeholder="Your name"
            className="text-input"
            required
          />
        </div>
        
        {/* Bio */}
        <div className="edit-section">
          <label className="form-label">About Me</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell others about yourself..."
            className="textarea"
            rows={4}
          />
        </div>
        
        {/* Buttons */}
        <div className="button-row">
          <button 
            type="submit" 
            className="primary-button"
            disabled={saveStatus.saving}
          >
            {saveStatus.saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            onClick={handleClose} 
            className="secondary-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}