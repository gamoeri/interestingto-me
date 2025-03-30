'use client'

import { useState, useEffect } from 'react'

export default function BookmarksPage({ 
  bookmarkedTopics = [], 
  onSelectTopic 
}) {
  const [sortedBookmarks, setSortedBookmarks] = useState([])
  
  // This useEffect will run whenever bookmarkedTopics changes
  useEffect(() => {
    console.log("BookmarksPage received topics:", bookmarkedTopics.length);
    
    // Create a copy to avoid mutating props
    const sortedTopics = [...bookmarkedTopics];
    
    // Sort by createdAt date (newest first)
    sortedTopics.sort((a, b) => {
      // If no dates available, keep original order
      if (!a.createdAt && !b.createdAt) return 0;
      // If only one has a date, put the one with a date first
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      // Otherwise sort newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    setSortedBookmarks(sortedTopics);
  }, [bookmarkedTopics]); // Only depend on bookmarkedTopics
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h2>Your Bookmarks</h2>
        <p className="bookmarks-count">
          {bookmarkedTopics.length} {bookmarkedTopics.length === 1 ? 'topic' : 'topics'} bookmarked
        </p>
      </div>
      
      {sortedBookmarks.length > 0 ? (
        <div className="bookmarks-list">
          {sortedBookmarks.map(topic => (
            <div 
              key={topic.id} 
              className="bookmark-item"
              onClick={() => onSelectTopic(topic.id)}
            >
              <div className="bookmark-content">
                <h3 className="bookmark-title">{topic.name}</h3>
                <div className="bookmark-meta">
                  <span className="bookmark-author">by {topic.ownerName || 'Unknown author'}</span>
                  {topic.createdAt && (
                    <span className="bookmark-date">Created: {formatDate(topic.createdAt)}</span>
                  )}
                </div>
                {topic.content && (
                  <p className="bookmark-preview">
                    {topic.content.substring(0, 120)}
                    {topic.content.length > 120 && '...'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-bookmarks">
          <p>You haven't bookmarked any topics yet.</p>
          <p>When you find interesting topics, click the bookmark button to save them here.</p>
        </div>
      )}
    </div>
  )
}