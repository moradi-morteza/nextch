'use client';

import React, { useState } from 'react';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

export default function Profile() {
  const [user] = useState({
    name: 'User',
    username: '@user',
    bio: 'Welcome to NextChat',
    avatar: '/default-avatar.png',
    stats: {
      chats: 0,
      messages: 0,
      likes: 0
    }
  });

  const [menuItems] = useState([
    { icon: 'settings', label: 'Settings', href: '/settings' },
    { icon: 'history', label: 'Chat History', href: '/history' },
    { icon: 'help', label: 'Help & Support', href: '/help' },
    { icon: 'info', label: 'About', href: '/about' }
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="tg-topbar flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <h1 className="text-xl font-semibold">Profile</h1>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MoreVertRoundedIcon sx={{ fontSize: 24 }} />
        </button>
      </div>
      
      <div className="flex-1 p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <PersonRoundedIcon sx={{ fontSize: 48, color: 'white' }} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-600 mb-3">{user.username}</p>
              <p className="text-gray-700 mb-6 max-w-sm">{user.bio}</p>
              
              <button className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Stats */}
            <div className="flex justify-around mt-8 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.chats}</div>
                <div className="text-sm text-gray-600">Chats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.messages}</div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.stats.likes}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {item.icon === 'settings' && <SettingsRoundedIcon sx={{ fontSize: 20, color: 'gray.600' }} />}
                  {item.icon === 'history' && <HistoryRoundedIcon sx={{ fontSize: 20, color: 'gray.600' }} />}
                  {item.icon === 'help' && <HelpOutlineRoundedIcon sx={{ fontSize: 20, color: 'gray.600' }} />}
                  {item.icon === 'info' && <InfoOutlinedIcon sx={{ fontSize: 20, color: 'gray.600' }} />}
                </div>
                <span className="flex-1 text-gray-900 font-medium">{item.label}</span>
                <ChevronRightRoundedIcon sx={{ fontSize: 20 }} className="text-gray-400" />
              </button>
            ))}
          </div>

          {/* Sign Out Button */}
          <div className="mt-8">
            <button className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors">
              <LogoutRoundedIcon sx={{ fontSize: 20 }} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}