'use client';

import React from 'react';
import Avatar from '@mui/material/Avatar';

const UserListItem = ({ 
  user, 
  isFollowing, 
  onUserClick, 
  onFollowToggle, 
  showFollowButton = true,
  className = ""
}) => {
  return (
    <div 
      className={`flex items-center py-2 px-4 cursor-pointer ${className}`}
      onClick={() => onUserClick(user.id)}
      dir="rtl"
    >
      <Avatar 
        src={user.avatar_url} 
        alt={user.full_name}
        className="w-11 h-11 flex-shrink-0"
        sx={{ width: 44, height: 44 }}
      >
        {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
      </Avatar>
      
      <div className="flex-1 min-w-0 mr-3">
        <div className="font-medium text-gray-900 text-sm truncate text-right">
          {user.full_name || user.username}
        </div>
        {user.username && user.full_name && (
          <div className="text-gray-500 text-xs truncate text-right">
            @{user.username}
          </div>
        )}
        {user.bio && (
          <div className="text-gray-600 text-xs truncate mt-0.5 text-right">
            {user.bio}
          </div>
        )}
      </div>

      {showFollowButton && (
        <div className="flex flex-col items-end mr-3">
          {/* Rating and conversation count */}
          <div className="flex items-center gap-2 mb-1">
            {user.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-gray-600 text-xs">{user.average_rating}</span>
              </div>
            )}
            {user.closed_conversations_count > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-xs">💬</span>
                <span className="text-gray-600 text-xs">{user.closed_conversations_count}</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFollowToggle(user.id, isFollowing);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex-shrink-0 ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
            }`}
          >
            {isFollowing ? 'دنبال می‌کنید' : 'دنبال کردن'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserListItem;