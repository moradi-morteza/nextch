'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import BottomBar from '@/components/BottomBar';
import RightBar from '@/components/RightBar';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const hideNavigation = pathname?.startsWith('/chat');

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link rel="stylesheet" href="/webfonts/fontiran.css" />
        <title>NextChat</title>
        <meta name="description" content="AI Chat Application" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="min-h-screen bg-gray-50">
          <div className={hideNavigation ? '' : 'pb-16 md:pb-0 md:pr-24'}>
            {children}
          </div>
          {!hideNavigation && (
            <>
              <BottomBar />
              <RightBar />
            </>
          )}
        </main>
      </body>
    </html>
  );
}
