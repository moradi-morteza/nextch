'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import LoginIcon from '@mui/icons-material/Login';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">NextChat</h1>
            <p className="text-gray-600 text-lg mb-2">Welcome to NextChat</p>
            <p className="text-gray-500">Please login to start chatting</p>
          </div>
          
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <LoginIcon sx={{ fontSize: 24 }} />
            <span className="text-lg font-medium">Login</span>
          </Link>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Enter your phone number to get started
          </div>
        </div>
      </div>
    );
  }

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
