'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';

const RightBar = () => {
    const pathname = usePathname();

    const tabs = [
        {icon: '/icons/feed.svg', activeIcon: '/icons/feed_enable.svg', path: '/'},
        {icon: '/icons/explore.svg', activeIcon: '/icons/explore_enable.svg', path: '/search'},
        {icon: '/icons/question.svg', activeIcon: '/icons/question_enable.svg', path: '/conversations'},
        {icon: '/icons/heart.svg', activeIcon: '/icons/heart_enable.svg', path: '/like'},
        {icon: '/icons/profile.svg', activeIcon: '/icons/profile_enable.svg', path: '/profile'}
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
                            <div
                                className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Image
                                src={pathname === tab.path ? tab.activeIcon : tab.icon}
                                alt=""
                                width={22}
                                height={22}
                                className="transition-all duration-300 group-hover:scale-110"
                            />

                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RightBar;
