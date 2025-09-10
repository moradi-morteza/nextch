'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import LoginIcon from '@mui/icons-material/Login';
import { useLang } from '@/hooks/useLang.js';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">{t('action.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">{t('page.home.title')}</h1>
            <p className="text-gray-600 text-lg mb-2">{t('page.home.welcome')}</p>
            <p className="text-gray-500">{t('page.home.loginPrompt')}</p>
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <LoginIcon sx={{ fontSize: 24 }} />
            <span className="text-lg font-medium">{t('auth.login')}</span>
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('page.home.welcomeBack')}</h2>
          </div>

          <Link
            href="/chat"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <ChatBubbleRoundedIcon sx={{ fontSize: 24 }} />
            <span className="text-lg font-medium">{t('page.home.startChat')}</span>
          </Link>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('page.home.tapToChat')}
          </div>
        </div>
      </div>
    </div>
  );
}
