'use client';

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Box, PlusCircle, Search, User, X } from 'lucide-react';

import { SidebarItemType } from '@/types';
import { useModalStore, MODAL_TYPES, useAuthStore } from '@/stores';
import LoadingSpinner from '@/components/LoadingSpinner';

const SearchDrawerContent = lazy(() => import('@/components/search/SearchDrawerContent'));

type NavItem = {
  key: string;
  icon: React.ElementType;
  label: string;
  special?: boolean;
};

const navItems: NavItem[] = [
  { key: SidebarItemType.HOME, icon: Home, label: '홈' },
  { key: SidebarItemType.ARCHIVE, icon: Box, label: '보관함' },
  { key: 'create', icon: PlusCircle, label: '생성', special: true },
  { key: SidebarItemType.SEARCH, icon: Search, label: '검색' },
  { key: SidebarItemType.PROFILE, icon: User, label: '프로필' },
];

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal } = useModalStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeItem = pathname === '/' ? SidebarItemType.HOME : (pathname.split('/')[1] as string);

  const handleItemClick = useCallback(
    (key: string) => {
      switch (key) {
        case SidebarItemType.HOME:
          setIsSearchOpen(false);
          router.push('/');
          break;
        case SidebarItemType.ARCHIVE:
          setIsSearchOpen(false);
          if (!isAuthenticated) {
            openModal(MODAL_TYPES.LOGIN);
            return;
          }
          router.push('/archive');
          break;
        case 'create':
          setIsSearchOpen(false);
          if (!isAuthenticated) {
            openModal(MODAL_TYPES.LOGIN);
            return;
          }
          openModal(MODAL_TYPES.WRITE);
          break;
        case SidebarItemType.SEARCH:
          setIsSearchOpen((prev) => !prev);
          break;
        case SidebarItemType.PROFILE:
          setIsSearchOpen(false);
          if (!isAuthenticated) {
            openModal(MODAL_TYPES.LOGIN);
            return;
          }
          router.push(`/profile/${userId}`);
          break;
      }
    },
    [isAuthenticated, openModal, router, userId],
  );

  return (
    <>
      {/* 모바일 검색 패널 */}
      {isSearchOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-[60]" onClick={() => setIsSearchOpen(false)} />
          <section className="lg:hidden fixed inset-0 z-[60] bg-white border-r-2 border-primary flex flex-col">
            <div className="flex items-center justify-between px-6 pt-4 pb-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ml-auto p-2 rounded-full hover:bg-gray-4 text-primary"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
              <SearchDrawerContent enabled={isSearchOpen} />
            </Suspense>
          </section>
        </>
      )}

      {/* 하단 네비게이션 바 (flex 흐름 안에 위치) */}
      <nav className="lg:hidden w-full h-16 bg-white border-t-2 border-primary z-50 flex">
        {navItems.map(({ key, icon: Icon, label, special }) => {
          const isActive = key === activeItem || (key === SidebarItemType.SEARCH && isSearchOpen);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleItemClick(key)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                ${
                  special
                    ? 'text-white bg-primary mx-2 my-2 rounded-xl hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#00ebc7]'
                    : isActive
                      ? 'text-primary'
                      : 'text-gray-2 hover:text-primary'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
