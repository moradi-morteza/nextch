'use client';

import React, { useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchContent />
    </ProtectedRoute>
  );
}

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Placeholder for search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="tg-topbar flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <h1 className="text-xl font-semibold">Search</h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <SearchRoundedIcon 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                sx={{ fontSize: 20 }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for posts, users, or topics..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-200 focus:shadow-lg transition-all duration-200"
              />
            </div>
          </form>

          {!searchQuery && (
            <div className="text-center py-16">
              <SearchRoundedIcon 
                className="mx-auto mb-4 text-gray-300" 
                sx={{ fontSize: 96 }} 
              />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Search NextChat</h3>
              <p className="text-gray-400">Find conversations, topics, and more</p>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="text-center py-16">
              <SearchRoundedIcon 
                className="mx-auto mb-4 text-gray-300" 
                sx={{ fontSize: 96 }} 
              />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No results found</h3>
              <p className="text-gray-400">Try searching for something else</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}