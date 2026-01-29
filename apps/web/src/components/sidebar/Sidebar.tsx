'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, lazy, useEffect, useRef, useCallback } from 'react';
import { LogIn, LogOut, Menu, PlusCircle } from 'lucide-react';

import { menuItems } from '@/constants';
import { drawerTypes, SidebarItemType, type SidebarItemTypeValues } from '@/types';
import { useModalStore, MODAL_TYPES } from '@/stores';

import Drawer from './Drawer';
import MenuButton from './MenuButton';
import { NotiDrawerContent } from '../noti';

import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { performLogout } from '@/hooks/auth/client/logout';
import { useNotiStore } from '@/stores/useNotiStore';

const SearchDrawerContent = lazy(() => import('@/components/search/SearchDrawerContent'));
const isDrawerItem = (type: SidebarItemTypeValues): boolean => (drawerTypes as readonly SidebarItemTypeValues[]).includes(type);
const needLogin = (type: SidebarItemTypeValues) => {
  return type === SidebarItemType.PROFILE || type === SidebarItemType.ARCHIVE || type === SidebarItemType.SETTING;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { openModal } = useModalStore();
  const { userId, isAuthenticated, isLoading } = useAuthMe();

  const unreadNotiCount = useNotiStore((s) => s.unreadCount);

  const initialActiveItem = useMemo<SidebarItemTypeValues>(() => {
    if (pathname === '/') {
      return SidebarItemType.HOME;
    }
    return pathname.split('/')[1] as SidebarItemTypeValues;
  }, [pathname]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<SidebarItemTypeValues>(initialActiveItem);
  const [activeDrawer, setActiveDrawer] = useState<SidebarItemTypeValues | null>(null);

  // 사이드바 영역 클릭 여부 관리
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 드로어별 open/close 여부 상태 관리
  const isSearchOpen = activeDrawer === SidebarItemType.SEARCH;
  const isNotificationOpen = activeDrawer === SidebarItemType.NOTIFICATION;
  const isSyncOpen = activeDrawer === SidebarItemType.SYNC;

  const handleToggleSidebar = useCallback(() => setIsExpanded((prev) => !prev), []);

  const handleCloseDrawer = useCallback(() => setActiveDrawer(null), []);

  const handleOpenDrawer = useCallback(
    (type: SidebarItemTypeValues) => {
      setActiveDrawer((currentDrawer) => {
        if (currentDrawer === type) {
          return null;
        }

        isExpanded && setIsExpanded(false);
        return type;
      });
    },
    [isExpanded],
  );

  const handleMyProfileNavigate = useCallback(() => {
    if (!userId) return;
    setActiveItem(SidebarItemType.PROFILE);
    router.push(`/profile/${userId}`);
  }, [router, userId]);

  const handleNavigate = useCallback(
    (type: SidebarItemTypeValues) => {
      setActiveItem(type);
      router.push(type === SidebarItemType.HOME ? '/' : `/${type}`);
    },
    [router],
  );

  const handleItemClick = useCallback(
    (type: SidebarItemTypeValues) => {
      // 드로어 아이콘 클릭 시 토글 로직 수행
      if (isDrawerItem(type)) {
        setActiveItem(type);
        handleOpenDrawer(type);
        return;
      }

      // 일반 메뉴 아이템 클릭 시, 열려 있는 드로어를 닫고 페이지 이동/모달 오픈
      handleCloseDrawer();

      if (needLogin(type) && !isAuthenticated) {
        openModal(MODAL_TYPES.LOGIN);
        return;
      }

      type === SidebarItemType.PROFILE ? handleMyProfileNavigate() : handleNavigate(type);
    },
    [handleCloseDrawer, handleOpenDrawer, isAuthenticated, openModal, handleMyProfileNavigate, handleNavigate],
  );

  const handleOpenWriteModal = useCallback(() => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    openModal(MODAL_TYPES.WRITE);
  }, [isAuthenticated, openModal]);

  const handleOpenLoginModal = useCallback(async () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }

    await performLogout();
  }, [isLoading, isAuthenticated, openModal]);

  useEffect(() => {
    // 페이지 url 경로가 바뀔 때마다 사이드바 활성화 아이콘을 현재 pathname 기반으로 업데이트
    setActiveItem(initialActiveItem);
  }, [pathname, initialActiveItem]);

  useEffect(() => {
    // 드로어가 닫힐 때마다 사이드바 활성화 아이콘을 현재 pathname 기반으로 업데이트
    !activeDrawer && setActiveItem(initialActiveItem);
  }, [activeDrawer, initialActiveItem]);

  useEffect(() => {
    // 외부 영역 클릭 여부 판단 후 열린 드로어가 있다면 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && activeDrawer) {
        handleCloseDrawer();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 언마운트 시 이벤트 리스너 정리
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDrawer, handleCloseDrawer]);

  return (
    <div className="flex h-full relative z-30" ref={sidebarRef}>
      {/* 메뉴 버튼 영역 */}
      <nav
        className={`
          h-full bg-white border-r-2 border-primary flex flex-col justify-between py-6 transition-all duration-200 ease-in-out relative z-40
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        <div className="px-4 mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg transition-colors border-2 border-transparent hover:bg-accent-cyan hover:border-primary"
            title="사이드바 열기"
          >
            <Menu className="w-6 h-6" />
          </button>

          {isExpanded && (
            <button type="button" onClick={() => handleNavigate(SidebarItemType.HOME)}>
              <span className="font-black text-xl tracking-tighter text-accent-pink animate-fade-in">VIBR</span>
            </button>
          )}
        </div>

        <div className="flex flex-col px-3 gap-4">
          {menuItems.map((item) => (
            <MenuButton
              key={item.type}
              type={item.type}
              Icon={item.icon}
              label={item.label}
              onClick={handleItemClick}
              isActive={item.type === activeItem}
              shouldShowSpan={isExpanded}
            >
              {item.type === SidebarItemType.NOTIFICATION && unreadNotiCount > 0 && (
                <span className="absolute top-1 left-6 min-w-5 h-5 px-1 rounded-full bg-accent-pink text-white text-[10px] flex items-center justify-center">
                  {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                </span>
              )}
            </MenuButton>
          ))}

          <div className="h-0.5 bg-gray-4 mx-2 my-4" />

          <button
            type="button"
            onClick={handleOpenWriteModal}
            className={`
              flex items-center p-3 rounded-xl transition-all duration-150 mb-2
              bg-primary text-white hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#00ebc7]
            `}
            title="생성"
          >
            <PlusCircle className="w-6 h-6" />
            {isExpanded && <span className="ml-4 font-bold whitespace-nowrap overflow-hidden">생성</span>}
          </button>
        </div>

        {/* 로그인/로그아웃 토글 버튼 */}
        <button
          type="button"
          onClick={handleOpenLoginModal}
          disabled={isLoading}
          className="flex items-center p-6 disabled:opacity-60 disabled:cursor-not-allowed"
          title={isAuthenticated ? '로그아웃' : '로그인'}
        >
          {isAuthenticated ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          {isExpanded && (
            <span className="ml-4 font-medium text-sm hover:font-bold whitespace-nowrap overflow-hidden">
              {isLoading ? '...' : isAuthenticated ? '로그아웃' : '로그인'}
            </span>
          )}
        </button>
      </nav>

      {/* 1. 검색 */}
      <Drawer isOpen={isSearchOpen} isSidebarExpanded={isExpanded}>
        <SearchDrawerContent enabled={isSearchOpen} />
      </Drawer>

      {/* 2. 알림 */}
      <Drawer isOpen={isNotificationOpen} isSidebarExpanded={isExpanded}>
        <NotiDrawerContent />
      </Drawer>

      {/* 3. 싱크룸 */}
      <Drawer isOpen={isSyncOpen} isSidebarExpanded={isExpanded}>
        <div className="flex h-full justify-center items-center text-lg">협업 드로어</div>
      </Drawer>
    </div>
  );
}
