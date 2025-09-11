'use client';

import React, { useState } from 'react';
import { useLang } from '@/hooks/useLang';
import ConversationPersonList from './components/ConversationPersonList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ConversationsPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col" dir="rtl">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">مدیریت گفتگوها</h1>
            
            {/* Android Style Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-4 py-3 text-sm font-medium text-center rounded-lg transition-all duration-200 ${
                  activeTab === 'received'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                سوالات دریافتی
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-4 py-3 text-sm font-medium text-center rounded-lg transition-all duration-200 ${
                  activeTab === 'sent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                سوالات ارسالی
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <ConversationPersonList type={activeTab} />
        </div>
      </div>
    </ProtectedRoute>
  );
}