'use client';

import { lazy } from 'react';
import { LogIn, LogOut, Menu, Plus } from 'lucide-react';

import { menuItems, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_SHRINKED } from '@/constants/sidebar';
import { SidebarItemType } from '@/types/sidebar';
import { useNotificationsQuery } from '@/hooks/noti/use-notifications-query';
import { useResizable } from '@/hooks/common/use-resizable';
import { useSidebarAuthActions } from '@/hooks/sidebar/use-sidebar-auth-actions';
import { useSidebarNavigation } from '@/hooks/sidebar/use-sidebar-navigation';

import Drawer from './Drawer';
import MenuButton from './MenuButton';
import NotiDrawerContent from '../noti/NotiDrawerContent';

const SearchDrawerContent = lazy(() => import('@/components/search/SearchDrawerContent'));

export default function Sidebar() {
  const { unreadCount: unreadNotiCount } = useNotificationsQuery();

  const {
    sidebarRef,
    isExpanded,
    activeItem,
    isSearchOpen,
    isNotificationOpen,
    handleToggleSidebar,
    handleItemClick,
    handleNavigate,
    handleCloseDrawer,
  } = useSidebarNavigation();

  const { isAuthenticated, isLoading, handleOpenWriteModal, handleOpenLoginModal } = useSidebarAuthActions();

  // 드로어 너비 드래그 조절 (검색·알림 드로어가 동일 너비 공유)
  const drawerResize = useResizable({ defaultWidth: 384, min: 256, max: 600, direction: 'right', storageKey: 'vibr:drawerWidth' });

  return (
    <div className="flex h-full relative z-30" ref={sidebarRef}>
      {/* 메뉴 버튼 영역 */}
      <nav
        className={`
          h-full bg-white border-r-2 border-primary flex flex-col justify-between py-6 transition-all duration-200 ease-in-out relative z-40
          ${isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_SHRINKED}
        `}
      >
        <div>
          <div className="px-4 mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="p-2 rounded-lg transition-colors border-2 border-transparent hover:bg-accent-cyan hover:border-primary"
              title={isExpanded ? '사이드바 닫기' : '사이드바 열기'}
            >
              <Menu className="sidebar-icon" />
            </button>

            {isExpanded && (
              <button type="button" onClick={() => handleNavigate(SidebarItemType.HOME)}>
                <span className="font-black text-xl tracking-tighter text-accent-pink animate-fade-in">VIBR</span>
              </button>
            )}
          </div>

          <div className="flex flex-col px-3 gap-4">
            {menuItems.map((item) => (
              <MenuButton key={item.type} item={item} onClick={handleItemClick} isActive={item.type === activeItem} shouldShowSpan={isExpanded}>
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
              bg-primary text-white hover:bg-accent-pink hover:shadow-[2px_2px_0px_0px_#00ebc7]
            `}
              title="추천"
            >
              <Plus className="sidebar-icon" />
              {isExpanded && <span className="ml-4 font-bold text-sm md:text-base whitespace-nowrap overflow-hidden">추천</span>}
            </button>
          </div>
        </div>

        {/* 로그인/로그아웃 토글 버튼 */}
        <button
          type="button"
          onClick={handleOpenLoginModal}
          disabled={isLoading}
          className="flex items-center p-6 disabled:opacity-60 disabled:cursor-not-allowed"
          title={isAuthenticated ? '로그아웃' : '로그인'}
        >
          {isAuthenticated ? <LogOut className="sidebar-icon" /> : <LogIn className="sidebar-icon" />}
          {isExpanded && (
            <span className="ml-4 font-medium text-sm md:text-base hover:font-bold whitespace-nowrap overflow-hidden">
              {isLoading ? '...' : isAuthenticated ? '로그아웃' : '로그인'}
            </span>
          )}
        </button>
      </nav>

      {/* 1. 검색 */}
      <Drawer isOpen={isSearchOpen} isSidebarExpanded={isExpanded} title="검색" resize={drawerResize}>
        <SearchDrawerContent enabled={isSearchOpen} />
      </Drawer>

      {/* 2. 알림 */}
      <Drawer isOpen={isNotificationOpen} isSidebarExpanded={isExpanded} title="알림" resize={drawerResize}>
        {isNotificationOpen && <NotiDrawerContent onNavigate={handleCloseDrawer} />}
      </Drawer>
    </div>
  );
}
