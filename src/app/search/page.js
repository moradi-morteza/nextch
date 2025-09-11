'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserListItem from '@/components/UserListItem';
import api from '@/utils/api';

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchContent />
    </ProtectedRoute>
  );
}

function SearchContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    // Restore search state from sessionStorage
    const savedQuery = sessionStorage.getItem('search_query');
    const savedResults = sessionStorage.getItem('search_results');
    const savedStates = sessionStorage.getItem('following_states');
    
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
    if (savedResults) {
      setSearchResults(JSON.parse(savedResults));
    }
    if (savedStates) {
      setFollowingStates(JSON.parse(savedStates));
    }
    // Mark that we've restored from sessionStorage
    setIsRestored(true);
  }, []);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const searchUsers = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setFollowingStates({});
        // Clear sessionStorage when query is empty
        sessionStorage.removeItem('search_query');
        sessionStorage.removeItem('search_results');
        sessionStorage.removeItem('following_states');
        return;
      }

      setIsLoading(true);
      setSearchResults([]); // Clear previous results before loading new ones
      try {
        const response = await api.get('/search/users', {
          params: { query, limit: 10 }
        });

        if (response.data.success) {
          setSearchResults(response.data.data);
          const initialStates = {};
          response.data.data.forEach(user => {
            initialStates[user.id] = user.is_following;
          });
          setFollowingStates(initialStates);
          
          // Save to sessionStorage
          sessionStorage.setItem('search_query', query);
          sessionStorage.setItem('search_results', JSON.stringify(response.data.data));
          sessionStorage.setItem('following_states', JSON.stringify(initialStates));
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // Only search if we've restored from sessionStorage and the query is different from what's saved
    if (isRestored) {
      const savedQuery = sessionStorage.getItem('search_query');
      const savedResults = sessionStorage.getItem('search_results');
      
      // If we have saved results and the current query matches the saved query, don't search again
      if (savedQuery === searchQuery && savedResults) {
        return;
      }
      
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers, isRestored]);

  const handleFollowToggle = async (userId, isCurrentlyFollowing) => {
    try {
      const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      await api.post(`/user/${userId}/${endpoint}`);

      setFollowingStates(prev => ({
        ...prev,
        [userId]: !isCurrentlyFollowing
      }));

      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_following: !isCurrentlyFollowing }
            : user
        )
      );
      
      // Update sessionStorage
      const updatedStates = { ...followingStates, [userId]: !isCurrentlyFollowing };
      sessionStorage.setItem('following_states', JSON.stringify(updatedStates));
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/user/${userId}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1">
        <div className="w-full max-w-2xl mx-auto p-4">
          <div className="mb-6">
            <div className="relative" dir="rtl">
              <SearchRoundedIcon 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                sx={{ fontSize: 20 }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی افراد..."
                className="w-full pr-12 pl-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 text-right"
                dir="rtl"
              />
            </div>
          </div>

          {!searchQuery && !isLoading && (
            <div className="text-center py-20">
              <SearchRoundedIcon 
                className="mx-auto mb-4 text-gray-300" 
                sx={{ fontSize: 64 }} 
              />
              <h3 className="text-lg font-medium text-gray-700 mb-2">جستجوی افراد</h3>
              <p className="text-gray-500">افراد را پیدا کرده و با آن‌ها ارتباط برقرار کنید</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3" dir="rtl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center py-2 px-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0 mr-3"></div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && !isLoading && searchResults.length === 0 && (
            <div className="text-center py-16">
              <SearchRoundedIcon 
                className="mx-auto mb-4 text-gray-300" 
                sx={{ fontSize: 64 }} 
              />
              <h3 className="text-lg font-medium text-gray-700 mb-2">کاربری یافت نشد</h3>
              <p className="text-gray-500">نام یا نام کاربری دیگری را جستجو کنید</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              {searchResults.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  isFollowing={followingStates[user.id]}
                  onUserClick={handleUserClick}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}