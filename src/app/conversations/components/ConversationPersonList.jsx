'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@mui/material/Avatar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

export default function ConversationPersonList({ type }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPersons(1);
  }, [type]);

  const fetchPersons = async (pageNum = 1) => {
    if (!user) return;
    
    setLoading(pageNum === 1);
    try {
      const response = await api.get(`/conversations/persons?type=${type}&page=${pageNum}`);
      
      if (pageNum === 1) {
        setPersons(response.data.data);
      } else {
        setPersons(prev => [...prev, ...response.data.data]);
      }
      
      setHasMore(response.data.current_page < response.data.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching conversation persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'اکنون';
    } else if (diffHours < 24) {
      return `${diffHours} ساعت پیش`;
    } else if (diffDays < 7) {
      return `${diffDays} روز پیش`;
    } else {
      return date.toLocaleDateString('fa-IR');
    }
  };

  const getStatusBadge = (status, count) => {
    const configs = {
      draft: { color: 'bg-gray-500', textColor: 'text-white' },
      pending: { color: 'bg-orange-500', textColor: 'text-white' },
      answered: { color: 'bg-green-500', textColor: 'text-white' },
      closed: { color: 'bg-red-500', textColor: 'text-white' }
    };

    const config = configs[status] || configs.draft;

    return (
      <div className={`w-6 h-6 rounded-full ${config.color} ${config.textColor} flex items-center justify-center text-xs font-medium`}>
        {count}
      </div>
    );
  };

  const handlePersonClick = (person) => {
    router.push(`/conversations/person/${person.id}?type=${type}`);
  };

  if (loading && page === 1) {
    return (
      <div className="flex-1" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center py-3 px-4 border-b border-gray-100">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-28 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mr-2"></div>
                  </div>
                  <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 flex-shrink-0 mr-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!loading && persons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AccessTimeIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {type === 'received' ? 'هیچ سوالی دریافت نکرده‌اید' : 'هیچ سوالی ارسال نکرده‌اید'}
          </h3>
          <p className="text-gray-500">
            {type === 'received' 
              ? 'زمانی که کسی از شما سوال بپرسد، در اینجا نمایش داده می‌شود'
              : 'سوالات ارسال شده شما در اینجا نمایش داده می‌شود'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div>
          {persons.map((person) => (
            <div
              key={person.id}
              className="flex items-center py-3 px-4 border-b border-gray-100 last:border-b-0"
            >
              <div
                onClick={() => handlePersonClick(person)}
                className="flex items-center flex-1 cursor-pointer transition-all duration-150 transform active:scale-95 active:bg-gray-50 rounded-lg p-2 -m-2"
              >
                {/* Avatar */}
                <Avatar
                  src={person.avatar}
                  alt={person.name}
                  className="w-12 h-12 flex-shrink-0"
                  sx={{ width: 48, height: 48 }}
                >
                  {person.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900 text-sm truncate text-right">
                      {person.name}
                    </div>
                    <div className="text-gray-400 text-xs flex-shrink-0 mr-2">
                      {formatLastMessageTime(person.last_message_time)}
                    </div>
                  </div>
                  
                  {person.last_message && (
                    <div className="text-gray-600 text-sm truncate text-right leading-relaxed">
                      {person.last_message}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 flex-shrink-0 mr-3">
                {person.conversation_counts.pending > 0 && getStatusBadge('pending', person.conversation_counts.pending)}
                {person.conversation_counts.draft > 0 && getStatusBadge('draft', person.conversation_counts.draft)}
                {person.conversation_counts.answered > 0 && getStatusBadge('answered', person.conversation_counts.answered)}
                {person.conversation_counts.closed > 0 && getStatusBadge('closed', person.conversation_counts.closed)}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchPersons(page + 1)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}