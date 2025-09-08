'use client';

import React, { useState } from 'react';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

export default function Like() {
  const [activities] = useState([]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'like':
        return 'favorite';
      case 'reply':
        return 'reply';
      case 'mention':
        return 'alternate_email';
      default:
        return 'notifications';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'like':
        return 'text-red-500';
      case 'reply':
        return 'text-blue-500';
      case 'mention':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="tg-topbar flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <h1 className="text-xl font-semibold">Activity</h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="w-full max-w-2xl mx-auto">
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className={`material-symbols-rounded text-xl ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{activity.user}</span>
                      <span className="text-gray-600">{activity.message}</span>
                    </div>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <NotificationsNoneRoundedIcon 
                className="mx-auto mb-4 text-gray-300" 
                sx={{ fontSize: 96 }} 
              />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No activity yet</h3>
              <p className="text-gray-400">When someone interacts with your chats, you&apos;ll see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}