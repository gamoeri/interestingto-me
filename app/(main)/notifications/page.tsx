// @/app/(main)/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get notifications for the current user, ordered by time
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(50) // Fetch last 50 notifications
        );
        
        const snapshot = await getDocs(notificationsQuery);
        
        // Process notifications and add sender details
        const notificationsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const notificationData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Fetch sender details
          if (notificationData.senderId) {
            try {
              const senderDoc = await getDoc(doc(db, 'users', notificationData.senderId));
              if (senderDoc.exists()) {
                const senderData = senderDoc.data();
                notificationData.senderName = senderData.displayName || 'User';
                notificationData.senderProfilePic = senderData.profilePic;
              }
            } catch (error) {
              console.error('Error fetching sender details:', error);
            }
          }
          
          // Fetch topic name
          if (notificationData.topicId) {
            try {
              const topicDoc = await getDoc(doc(db, 'topics', notificationData.topicId));
              if (topicDoc.exists()) {
                const topicData = topicDoc.data();
                notificationData.topicName = topicData.title || topicData.name || 'a topic';
              }
            } catch (error) {
              console.error('Error fetching topic details:', error);
            }
          }
          
          return notificationData;
        }));
        
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user]);
  
  // Mark notification as read
  const handleMarkRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today
      return `Today at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays < 7) {
      // This week
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      // Older
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
  };
  
  // Handle click on notification
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
    
    // Navigate to topic
    if (notification.topicId) {
      router.push(`/topics/${notification.topicId}`);
    }
  };
  
  // Render notification message
  const renderMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <strong>{notification.senderName || 'Someone'}</strong> liked your content in <strong>{notification.topicName || 'a topic'}</strong>
          </>
        );
      default:
        return 'You have a new notification';
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }
  
  return (
    <div className="content-panel">
      <div className="notifications-header">
        <h1>Notifications</h1>
      </div>
      
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
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
                  {renderMessage(notification)}
                </div>
                
                <div className="notification-time">
                  {formatTime(notification.timestamp)}
                </div>
              </div>
              
              {!notification.read && <div className="notification-indicator"></div>}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No notifications yet</p>
            <p className="empty-state-detail">When someone interacts with your content, you'll see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}