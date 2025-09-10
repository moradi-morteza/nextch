'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowersClick = () => {
    router.push(`/user/${userProfile.id}/followers`);
  };

  const handleFollowingClick = () => {
    router.push(`/user/${userProfile.id}/following`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4" dir="rtl">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0 mr-3">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6 mb-4" dir="rtl">
              <div className="flex items-center gap-1">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto p-4">
          {/* Profile Header */}
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <div className="flex items-center flex-1 min-w-0">
              <Avatar 
                src={userProfile?.avatar_url} 
                alt={userProfile?.full_name}
                className="w-12 h-12 flex-shrink-0"
                sx={{ width: 48, height: 48 }}
              >
                {userProfile?.full_name?.charAt(0)?.toUpperCase() || userProfile?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-base font-semibold text-gray-900 truncate text-right">
                  {userProfile?.full_name || userProfile?.username || 'کاربر'}
                </h2>
                {userProfile?.username && userProfile?.full_name && (
                  <p className="text-gray-500 text-xs truncate text-right">@{userProfile.username}</p>
                )}
              </div>
            </div>

            <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors flex-shrink-0 mr-3">
              ویرایش پروفایل
            </button>
          </div>

          {/* Bio */}
          {userProfile?.bio && (
            <div className="mb-4">
              <p className="text-gray-700 text-xs leading-relaxed text-right">{userProfile.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mb-4" dir="rtl">
            <button
              onClick={handleFollowersClick}
              className="flex items-center gap-1 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
            >
              <span className="text-gray-500 text-xs">دنبال‌کننده</span>
              <span className="text-sm font-semibold text-gray-900">
                {userProfile?.followers_count || 0}
              </span>
            </button>

            <button
              onClick={handleFollowingClick}
              className="flex items-center gap-1 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
            >
              <span className="text-gray-500 text-xs">دنبال شده</span>
              <span className="text-sm font-semibold text-gray-900">
                {userProfile?.following_count || 0}
              </span>
            </button>
          </div>

          {/* Join Date */}
          {userProfile?.created_at && (
            <div className="text-gray-400 text-xs text-right mb-6">
              عضو از {new Date(userProfile.created_at).toLocaleDateString('fa-IR', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-right">
              <SettingsRoundedIcon sx={{ fontSize: 16 }} className="text-gray-600" />
              <span className="flex-1 text-gray-900 text-sm font-medium text-right">تنظیمات</span>
            </button>
            
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 transition-colors text-right"
            >
              <LogoutRoundedIcon sx={{ fontSize: 16 }} />
              <span className="flex-1 text-sm font-medium text-right">خروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}