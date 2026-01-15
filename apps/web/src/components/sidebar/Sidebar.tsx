'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, lazy } from 'react';
import { LogIn, LogOut, Menu, PlusCircle } from 'lucide-react';

import { menuItems } from '@/constants';
import { drawerTypes, SidebarItemType, type SidebarItemTypeValues } from '@/types';
import { useModalStore, MODAL_TYPES } from '@/stores';

import Drawer from './Drawer';
import MenuButton from './MenuButton';
import { NotiDrawerContent } from '../noti';

import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { performLogout } from '@/hooks/auth/client/logout';

const SearchDrawerContent = lazy(() => import('@/components/search/SearchDrawerContent'));
const isDrawerItem = (type: SidebarItemTypeValues): boolean => (drawerTypes as readonly SidebarItemTypeValues[]).includes(type);

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { openModal } = useModalStore();
  const { isAuthenticated, isLoading } = useAuthMe();

  const initialActiveItem = useMemo<SidebarItemTypeValues>(() => {
    if (pathname === '/') {
      return SidebarItemType.HOME;
    }
    return pathname.slice(1) as SidebarItemTypeValues;
  }, [pathname]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<SidebarItemTypeValues>(initialActiveItem);
  const [activeDrawer, setActiveDrawer] = useState<SidebarItemTypeValues | null>(null);

  const handleToggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
  };

  const handleOpenDrawer = (type: SidebarItemTypeValues) => {
    if (activeDrawer === type) {
      return;
    }
    if (isExpanded) {
      setIsExpanded(false);
    }
    setActiveDrawer(type);
  };

  const handleNavigate = (type: SidebarItemTypeValues) => {
    router.push(type === SidebarItemType.HOME ? '/' : type);
  };

  const handleItemClick = (type: SidebarItemTypeValues) => {
    setActiveItem(type);
    handleCloseDrawer();

    if (isDrawerItem(type)) {
      handleOpenDrawer(type);
      return;
    }

    handleNavigate(type);
  };

  const handleOpenWriteModal = () => {
    openModal(MODAL_TYPES.WRITE);
  };

  const handlerOpenLoginModal = () => {
    openModal(MODAL_TYPES.LOGIN);
  };

  const handleAuthButtonClick = async () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }

    await performLogout();
  };

  const isSearchOpen = activeDrawer === SidebarItemType.SEARCH && activeItem === SidebarItemType.SEARCH;
  const isNotificationOpen = activeDrawer === SidebarItemType.NOTIFICATION && activeItem === SidebarItemType.NOTIFICATION;
  const isSyncOpen = activeDrawer === SidebarItemType.SYNC && activeItem === SidebarItemType.SYNC;

  return (
    <div className="flex h-full relative z-30">
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
              Icon={item.icon}
              label={item.label}
              onClick={() => handleItemClick(item.type)}
              isActive={item.type === activeItem}
              shouldShowSpan={isExpanded}
            />
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
          onClick={() => void handleAuthButtonClick()}
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

      {/* 드로어 영역 */}
      <Drawer isOpen={isSearchOpen} isSidebarExpanded={isExpanded}>
        <SearchDrawerContent />
      </Drawer>

      <Drawer isOpen={isNotificationOpen} isSidebarExpanded={isExpanded}>
        <NotiDrawerContent />
      </Drawer>

      <Drawer isOpen={isSyncOpen} isSidebarExpanded={isExpanded}>
        <div className="flex h-full justify-center items-center text-lg">협업 드로어</div>
      </Drawer>
    </div>
  );
}
