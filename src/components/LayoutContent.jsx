'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BottomBar from '@/components/BottomBar';
import RightBar from '@/components/RightBar';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render with basic layout to prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div>
          {children}
        </div>
      </main>
    );
  }
  
  // Hide navigation for chat pages or if user is not authenticated
  const hideNavigation = pathname?.startsWith('/chat') || !isAuthenticated;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/verify-otp'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not authenticated and trying to access a protected route, hide navigation
  // Only show navigation if user is authenticated AND not in chat
  const showNavigation = isAuthenticated && !pathname?.startsWith('/chat');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className={showNavigation ? 'pb-16 md:pb-0 md:pr-24' : ''}>
        {children}
      </div>
      {showNavigation && (
        <>
          <BottomBar />
          <RightBar />
        </>
      )}
    </main>
  );
}