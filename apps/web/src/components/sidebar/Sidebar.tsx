'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, Box, Home, LogIn, Menu, PlusCircle, RefreshCcw, Search, Settings, User } from 'lucide-react';
import { SidebarItemType } from '@/types/sidebar';
import MenuButton from './MenuButton';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState(pathname === '/' ? 'home' : pathname.slice(1));

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  const menuItems = [
    { type: SidebarItemType.HOME, icon: Home, label: '홈', handleClick: () => router.push('/') },
    { type: SidebarItemType.SEARCH, icon: Search, label: '검색', handleClick: () => isExpanded && toggleSidebar() },
    { type: SidebarItemType.NOTIFICATIONS, icon: Bell, label: '알림', handleClick: () => isExpanded && toggleSidebar() },
    { type: SidebarItemType.ARCHIVE, icon: Box, label: '보관함', handleClick: () => router.push('/') },
    { type: SidebarItemType.SYNC, icon: RefreshCcw, label: 'Sync / 협업', handleClick: () => {} },
    { type: SidebarItemType.PROFILE, icon: User, label: '프로필', handleClick: () => router.push('/profile') },
    { type: SidebarItemType.SETTINGS, icon: Settings, label: '설정', handleClick: () => {} },
  ];

  return (
    <div className="flex h-full relative z-30">
      <nav
        className={`
          h-full bg-white border-r-2 border-primary flex flex-col justify-between py-6 transition-all duration-200 ease-in-out relative z-40 overflow-y-scroll
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* 사이드바 열기/닫기 버튼 */}
        <div className="px-4 mb-8 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg transition-colors border-2 border-transparent hover:bg-accent-cyan hover:border-primary"
            title="사이드바 열기"
          >
            <Menu className="w-6 h-6" />
          </button>

          {isExpanded && (
            <button>
              <span className="font-black text-xl tracking-tighter text-accent-pink animate-fade-in">VIBR</span>
            </button>
          )}
        </div>

        <div className="flex flex-col px-3 gap-4">
          {/* nav 버튼 목록 */}
          {menuItems.map((item) => (
            <MenuButton
              key={item.type}
              Icon={item.icon}
              label={item.label}
              handleClick={() => {
                setActiveItem(item.type);
                item.handleClick();
              }}
              isActive={item.type === activeItem}
              shouldShowSpan={isExpanded}
            />
          ))}

          <div className="h-0.5 bg-gray-4 mx-2 my-4" />

          {/* 컨텐츠 생성 버튼 */}
          <button
            className={`
              flex items-center p-3 rounded-xl transition-all duration-200 group mb-2
              bg-primary text-white hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#00ebc7]
            `}
            title="생성"
          >
            <PlusCircle className="w-6 h-6" />
            {isExpanded && <span className="ml-4 font-bold">생성</span>}
          </button>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        <button className="flex items-center p-6" title="로그인">
          <LogIn className="w-6 h-6" />
          {isExpanded && <span className="ml-4 font-medium text-sm hover:font-bold">로그인</span>}
        </button>
      </nav>
    </div>
  );
}
