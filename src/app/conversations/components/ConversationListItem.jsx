'use client';

import React from 'react';

export default function ConversationListItem({ conversation, onClick, type }) {
  const formatTime = (timestamp) => {
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

  const getStatusConfig = (status) => {
    const configs = {
      draft: { 
        color: 'bg-gray-500', 
        text: 'پیش‌نویس',
        bgColor: 'bg-gray-50'
      },
      pending: { 
        color: 'bg-orange-500', 
        text: type === 'received' ? 'نیاز به پاسخ' : 'منتظر پاسخ',
        bgColor: 'bg-orange-50'
      },
      answered: { 
        color: 'bg-green-500', 
        text: 'پاسخ داده شده',
        bgColor: 'bg-green-50'
      },
      closed: { 
        color: 'bg-red-500', 
        text: 'بسته شده',
        bgColor: 'bg-red-50'
      }
    };
    return configs[status] || configs.draft;
  };

  const statusConfig = getStatusConfig(conversation.status);
  const messageCount = conversation.message_count || 0;
  const lastMessage = conversation.last_message;

  return (
    <div
      onClick={onClick}
      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
      dir="rtl"
    >
      <div className="px-4 py-4">
        {/* Header with status and time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
            <span className="text-sm font-medium text-gray-900">{statusConfig.text}</span>
            {messageCount > 0 && (
              <span className="text-xs text-gray-500">• {messageCount} پیام</span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {formatTime(conversation.updated_at)}
          </span>
        </div>

        {/* Message preview */}
        {lastMessage && (
          <div className="text-sm text-gray-600 text-right leading-relaxed">
            {lastMessage.length > 120 ? `${lastMessage.substring(0, 120)}...` : lastMessage}
          </div>
        )}

        {/* Conversation ID */}
        <div className="mt-2">
          <span className="text-xs text-gray-400">گفتگو #{conversation.id.slice(-8)}</span>
        </div>
      </div>
    </div>
  );
}