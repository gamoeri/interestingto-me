'use client'

import { useState } from 'react'

export default function ProfileEdit({
  userProfile,
  onUpdateDisplayName,
  onUpdateBio,
  onUpdateProfilePic,
  onUpdateBannerImage,
  onUpdateBackgroundColor,
  onClose
}) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '')
  const [bio, setBio] = useState(userProfile?.bio || '')
  const [profilePic, setProfilePic] = useState(userProfile?.profilePic || '')
  const [bannerImage, setBannerImage] = useState(userProfile?.bannerImage || '')
  const [backgroundColor, setBackgroundColor] = useState(userProfile?.backgroundColor || '#f8f8f8')
  
  const handleSaveAll = (e) => {
    e.preventDefault()
    
    // Only update fields that have changed
    if (displayName.trim() && displayName !== userProfile?.displayName) {
      onUpdateDisplayName(displayName)
    }
    
    if (bio !== userProfile?.bio) {
      onUpdateBio(bio)
    }
    
    if (profilePic.trim() && profilePic !== userProfile?.profilePic) {
      onUpdateProfilePic(profilePic)
    }
    
    if (bannerImage.trim() && bannerImage !== userProfile?.bannerImage) {
      onUpdateBannerImage(bannerImage)
    }
    
    if (backgroundColor !== userProfile?.backgroundColor) {
      onUpdateBackgroundColor(backgroundColor)
    }
    
    onClose()
  }
  
  return (
    <div className="profile-edit-section">
      <div className="profile-edit-header">
        <h2>Edit Profile</h2>
        <button 
          onClick={onClose} 
          className="close-button"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      <form onSubmit={handleSaveAll} className="profile-edit-form">
        {/* Profile Picture */}
        <div className="edit-section">
          <label className="form-label">Profile Picture</label>
          <div className="profile-pic-edit">
            <div className="current-pic">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Profile preview" 
                />
              ) : (
                <div className="pic-placeholder">
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="pic-input">
              <input
                type="url"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
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
            {bannerImage && (
              <div 
                className="banner-preview" 
                style={{ backgroundImage: `url(${bannerImage})` }}
              />
            )}
            <input
              type="url"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
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
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
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
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="text-input"
            required
          />
        </div>
        
        {/* Bio */}
        <div className="edit-section">
          <label className="form-label">About Me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            className="textarea"
            rows={4}
          />
        </div>
        
        {/* Buttons */}
        <div className="button-row">
          <button type="submit" className="primary-button">
            Save Changes
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="secondary-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}