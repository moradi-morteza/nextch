'use client';

import React from 'react';
import Link from 'next/link';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="tg-topbar flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <h1 className="text-xl font-semibold">Feed</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome to NextChat</h2>
            <p className="text-gray-600">Start a conversation with AI</p>
          </div>
          
          <Link
            href="/chat"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <ChatBubbleRoundedIcon sx={{ fontSize: 24 }} />
            <span className="text-lg font-medium">Start Chat</span>
          </Link>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Tap the button above to enter the chat
          </div>
        </div>
      </div>
    </div>
  );
}
