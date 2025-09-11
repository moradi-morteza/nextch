'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import ConversationListItem from '../../components/ConversationListItem';
import ProtectedRoute from '@/components/ProtectedRoute';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Avatar from '@mui/material/Avatar';

export default function PersonConversationsPage({ params }) {
  const resolvedParams = use(params);
  const [conversations, setConversations] = useState([]);
  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'received';
  
  useEffect(() => {
    fetchConversations(1);
  }, [resolvedParams.personId, type]);

  const fetchConversations = async (pageNum = 1) => {
    if (!user) return;
    
    setLoading(pageNum === 1);
    try {
      const response = await api.get(`/conversations/person/${resolvedParams.personId}?type=${type}&page=${pageNum}`);
      
      if (pageNum === 1) {
        setConversations(response.data.conversations.data);
        setPersonData(response.data.person);
      } else {
        setConversations(prev => [...prev, ...response.data.conversations.data]);
      }
      
      setHasMore(response.data.conversations.current_page < response.data.conversations.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation) => {
    const userData = type === 'received' ? conversation.starter : conversation.recipient;
    const targetUserId = type === 'received' ? conversation.starter_id : conversation.recipient_id;
    
    router.push(`/chat?user=${targetUserId}&userData=${encodeURIComponent(JSON.stringify(userData))}&conversationId=${conversation.id}`);
  };

  if (loading && page === 1) {
    return (
      <ProtectedRoute>
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-100 p-4" dir="rtl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="mr-3 flex-1">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            </div>
          </div>
          <div className="flex-1 bg-white" dir="rtl">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center">
              {personData && (
                <div className="flex items-center flex-1">
                  <Avatar
                    src={personData.avatar}
                    alt={personData.name}
                    className="w-10 h-10 flex-shrink-0"
                    sx={{ width: 40, height: 40 }}
                  >
                    {personData.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="mr-3 flex-1">
                    <h1 className="text-lg font-medium text-gray-900 text-right">{personData.name}</h1>
                    <p className="text-sm text-gray-500 text-right">
                      {type === 'received' ? 'سوالات دریافتی از این کاربر' : 'سوالات ارسالی به این کاربر'}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => router.back()}
                className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <ArrowForwardIcon sx={{ fontSize: 20, color: '#374151' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1" dir="rtl">
          {conversations.length === 0 && !loading ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Avatar sx={{ width: 50, height: 50, bgcolor: '#F3F4F6', color: '#9CA3AF' }}>
                    {personData?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  هیچ گفتگویی یافت نشد
                </h3>
                <p className="text-gray-500 text-sm">
                  {type === 'received' 
                    ? 'هیچ سوالی از این کاربر دریافت نکرده‌اید'
                    : 'هیچ سوالی به این کاربر ارسال نکرده‌اید'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white">
                {conversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => handleConversationClick(conversation)}
                    type={type}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={() => fetchConversations(page + 1)}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}