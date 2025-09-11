'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const RightBar = () => {
    const pathname = usePathname();

    const tabs = [
        { 
            icon: <HomeOutlinedIcon sx={{ fontSize: 28 }} />, 
            activeIcon: <HomeIcon sx={{ fontSize: 28 }} />, 
            path: '/' 
        },
        { 
            icon: <SearchOutlinedIcon sx={{ fontSize: 28 }} />, 
            activeIcon: <SearchIcon sx={{ fontSize: 28 }} />, 
            path: '/search' 
        },
        { 
            icon: <HelpOutlineIcon sx={{ fontSize: 28 }} />, 
            activeIcon: <HelpOutlineIcon sx={{ fontSize: 28 }} />, 
            path: '/conversations' 
        },
        { 
            icon: <FavoriteBorderIcon sx={{ fontSize: 28 }} />, 
            activeIcon: <FavoriteIcon sx={{ fontSize: 28 }} />, 
            path: '/like' 
        },
        { 
            icon: <PersonOutlineIcon sx={{ fontSize: 28 }} />, 
            activeIcon: <PersonIcon sx={{ fontSize: 28 }} />, 
            path: '/profile' 
        }
    ];

    return (
        <div className="hidden md:flex fixed right-0 top-0 bottom-0 w-24 bg-white border-l border-gray-200">
            <div className="flex flex-col justify-start items-center w-full h-full py-4 space-y-4">
                {tabs.map((tab, index) => (
                    <div key={index} className="w-full flex justify-center">
                        <Link
                            href={tab.path}
                            className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:bg-gray-100 active:scale-90 hover:scale-110"
                        >
                            <div className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className={`transition-all duration-300 group-hover:scale-110 ${
                                pathname === tab.path ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                                {pathname === tab.path ? tab.activeIcon : tab.icon}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RightBar;