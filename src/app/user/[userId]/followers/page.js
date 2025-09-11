'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserListItem from '@/components/UserListItem';
import api from '@/utils/api';

export default function FollowersPage() {
  return (
    <ProtectedRoute>
      <FollowersContent />
    </ProtectedRoute>
  );
}

function FollowersContent() {
  const params = useParams();
  const router = useRouter();
  const { userId } = params;
  
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    fetchFollowers(1);
  }, [userId]);

  const fetchFollowers = async (pageNum, append = false) => {
    try {
      const response = await api.get(`/user/${userId}/followers`, {
        params: { page: pageNum, limit: 20 }
      });

      if (response.data.success) {
        const newFollowers = response.data.data;
        
        if (append) {
          setFollowers(prev => [...prev, ...newFollowers]);
        } else {
          setFollowers(newFollowers);
        }

        const states = {};
        newFollowers.forEach(user => {
          states[user.id] = user.is_following;
        });
        setFollowingStates(prev => ({ ...prev, ...states }));
        
        setHasMore(response.data.pagination.has_more);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchFollowers(page + 1, true);
    }
  };

  const handleFollowToggle = async (targetUserId, isCurrentlyFollowing) => {
    try {
      const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      await api.post(`/user/${targetUserId}/${endpoint}`);

      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: !isCurrentlyFollowing
      }));

      setFollowers(prev => 
        prev.map(user => 
          user.id === targetUserId 
            ? { ...user, is_following: !isCurrentlyFollowing }
            : user
        )
      );
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const handleUserClick = (targetUserId) => {
    router.push(`/user/${targetUserId}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="tg-topbar flex items-center px-3 py-2 sticky top-0 z-40 bg-white border-b border-gray-100" dir="rtl">
          <button
            onClick={() => router.back()}
            className="ml-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <KeyboardArrowLeftIcon className="text-gray-700" sx={{ fontSize: 20 }} />
          </button>
          <h1 className="text-lg font-bold text-black">دنبال‌کنندگان</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto">
            <div className="p-4 space-y-3" dir="rtl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center py-2">
                  <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0 mr-3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="tg-topbar flex items-center px-3 py-2 sticky top-0 z-40 bg-white border-b border-gray-100" dir="rtl">
        <button
          onClick={() => router.back()}
          className="ml-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <KeyboardArrowLeftIcon className="text-gray-700" sx={{ fontSize: 20 }} />
        </button>
        <h1 className="text-lg font-bold text-black">دنبال‌کنندگان</h1>
      </div>

      {/* Followers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto">
          {followers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">هنوز دنبال‌کننده‌ای نیست</h3>
              <p className="text-gray-500">وقتی کسی این کاربر را دنبال کند، اینجا نمایش داده می‌شود</p>
            </div>
          ) : (
            <div>
              {followers.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  isFollowing={followingStates[user.id]}
                  onUserClick={handleUserClick}
                  onFollowToggle={handleFollowToggle}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    {isLoadingMore ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}