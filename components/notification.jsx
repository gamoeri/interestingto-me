// @/components/Notification.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function Notification({ notification, onMarkRead }) {
  const router = useRouter();
  
  const handleClick = () => {
    // Mark as read if not already
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    
    // Navigate to the appropriate content
    router.push(`/topics/${notification.topicId}`);
  };
  
  // Get notification message based on type
  const getMessage = () => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="notification-sender">{notification.senderName}</span> 
            liked your content in 
            <span className="notification-topic">{notification.topicName}</span>
          </>
        );
      // Add more notification types as needed
      default:
        return 'You have a new notification';
    }
  };
  
  return (
    <div 
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-avatar">
        {notification.senderProfilePic ? (
          <img src={notification.senderProfilePic} alt={notification.senderName} />
        ) : (
          <div className="avatar-placeholder">
            {notification.senderName ? notification.senderName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
      
      <div className="notification-content">
        <div className="notification-message">
          {getMessage()}
        </div>
        
        <div className="notification-time">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </div>
      </div>
      
      {!notification.read && <div className="notification-indicator"></div>}
    </div>
  );
}