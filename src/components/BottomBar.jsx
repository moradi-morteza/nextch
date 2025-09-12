'use client';

import React, {useState, useEffect} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

const BottomBar = () => {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const tabs = [
        {icon: '/icons/feed.svg', activeIcon: '/icons/feed_enable.svg', path: '/'},
        {icon: '/icons/explore.svg', activeIcon: '/icons/explore_enable.svg', path: '/search'},
        {icon: '/icons/question.svg', activeIcon: '/icons/question_enable.svg', path: '/conversations'},
        {icon: '/icons/heart.svg', activeIcon: '/icons/heart_enable.svg', path: '/like'},
        {icon: '/icons/profile.svg', activeIcon: '/icons/profile_enable.svg', path: '/profile'}
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 tg-bottombar z-[80]">
            <div className="flex justify-around items-center h-16 px-4">
                {tabs.map((tab, index) => (
                    <Link
                        key={index}
                        href={tab.path}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:bg-gray-100 active:scale-90 hover:scale-110"
                    >
                        <div
                            className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <Image
                            src={pathname === tab.path ? tab.activeIcon : tab.icon}
                            alt=""
                            width={tab.path === '/conversations' ? 27 : 22}
                            height={tab.path === '/conversations' ? 27 : 22}
                            className="transition-all duration-300 group-hover:scale-110"
                        />

                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BottomBar;
