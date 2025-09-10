'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import MessageIcon from '@mui/icons-material/Message';
import Avatar from '@mui/material/Avatar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/utils/api';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
export default function UserProfile() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  );
}

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { userId } = params;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/user/profile/${userId}`);

      if (response.data.success) {
        setUser(response.data.data);
        setIsFollowing(response.data.data.is_following);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      await api.post(`/user/${userId}/${endpoint}`);

      setIsFollowing(!isFollowing);
      setUser(prev => ({
        ...prev,
        followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
      }));
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const handleChatClick = () => {
    const userData = {
      id: user.id,
      name: user.full_name || user.username,
      avatar: user.avatar_url
    };
    router.push(`/chat?user=${userId}&userData=${encodeURIComponent(JSON.stringify(userData))}`);
  };

  const handleFollowersClick = () => {
    router.push(`/user/${userId}/followers`);
  };

  const handleFollowingClick = () => {
    router.push(`/user/${userId}/following`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="tg-topbar flex items-center px-4 py-3 sticky top-0 z-40 bg-white border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowForwardIosRoundedIcon  className="text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto">
            <div className="p-4">
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

              <div className="mb-4">
                <div className="w-full h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
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

              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">کاربر یافت نشد</h2>
        <p className="text-gray-500 mb-4">کاربر مورد نظر شما وجود ندارد</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      {/* Header */}
      <div className="tg-topbar flex items-center px-3 py-2 sticky top-0 z-40 bg-white border-b border-gray-100" dir="rtl">
        <button
          onClick={() => router.back()}
          className="ml-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <KeyboardArrowLeftIcon className="text-gray-700" sx={{ fontSize: 20 }} />
        </button>
        <div className="flex-1 text-right">
          <h1 className="text-lg font-bold text-black truncate">
            {user.full_name || user.username}
          </h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4" dir="rtl">
              <div className="flex items-center flex-1 min-w-0">
                <Avatar
                  src={user.avatar_url}
                  alt={user.full_name || user.username}
                  className="w-12 h-12 flex-shrink-0"
                  sx={{ width: 48, height: 48 }}
                >
                  {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                </Avatar>

                <div className="flex-1 min-w-0 mr-3">
                  <h2 className="text-base font-semibold text-gray-900 truncate text-right">
                    {user.full_name || user.username}
                  </h2>
                  {user.username && user.full_name && (
                    <p className="text-gray-500 text-xs truncate text-right">@{user.username}</p>
                  )}
                  {user.bio && (
                    <p className="text-gray-600 text-xs leading-relaxed text-right mt-1">{user.bio}</p>
                  )}
                </div>
              </div>

              {!user.is_own_profile && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex-shrink-0 mr-3 ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                  }`}
                >
                  {isFollowing ? 'دنبال می‌کنید' : 'دنبال کردن'}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4" dir="rtl">
              <button
                onClick={handleFollowersClick}
                className="flex items-center gap-1 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
              >
                <span className="text-gray-500 text-xs">دنبال‌کننده</span>
                <span className="text-sm font-semibold text-gray-900">
                  {user.followers_count || 0}
                </span>
              </button>

              <button
                onClick={handleFollowingClick}
                className="flex items-center gap-1 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
              >
                <span className="text-gray-500 text-xs">دنبال شده</span>
                <span className="text-sm font-semibold text-gray-900">
                  {user.following_count || 0}
                </span>
              </button>
            </div>

            {/* Join Date */}
            <div className="text-gray-400 text-xs text-right">
              عضو از {new Date(user.created_at).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FAB for Chat */}
      {!user.is_own_profile && (
        <button
          onClick={handleChatClick}
          className="fixed bottom-20 right-4 w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl z-50"
        >
          <MessageIcon className="text-white" sx={{ fontSize: 26 }} />
        </button>
      )}
    </div>
  );
}
