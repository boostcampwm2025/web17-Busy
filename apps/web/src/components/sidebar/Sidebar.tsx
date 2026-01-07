'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { LogIn, Menu, PlusCircle } from 'lucide-react';
import { drawerTypes, SidebarItemType, SidebarItemTypeValues } from '@/types/sidebar';
import { menuItems } from '@/constants/sidebar';
import MenuButton from './MenuButton';
import Drawer from './Drawer';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal } = useModalStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState(pathname === '/' ? SidebarItemType.HOME : pathname.slice(1));
  const [activeDrawer, setActiveDrawer] = useState<SidebarItemTypeValues | null>(null);

  /** 사이드바 확장 상태 토글 핸들러 */
  const handleToggleSidebar = () => setIsExpanded((prev) => !prev);

  /** 버튼 아이템 클릭 이벤트 핸들러 */
  const handleItemClick = (type: SidebarItemTypeValues) => {
    setActiveItem(type); // 선택한 버튼 아이템 활성화
    activeDrawer && setActiveDrawer(null); // 열려있는 드로어 있으면 닫기
    // 드로어 아이템이면 사이드바 닫고 해당 type 드로어 활성화
    if ((drawerTypes as readonly SidebarItemTypeValues[]).includes(type)) {
      if (activeDrawer === type) return;
      isExpanded && handleToggleSidebar();
      setActiveDrawer(type);
    }
    // 내비게이션 아이템이면 해당 type 경로로 라우팅 처리
    else {
      router.push(type === SidebarItemType.HOME ? '/' : type);
    }
  };

  const isSearchOpen = activeDrawer === SidebarItemType.SEARCH && activeItem === SidebarItemType.SEARCH;
  const isNotificationOpen = activeDrawer === SidebarItemType.NOTIFICATION && activeItem === SidebarItemType.NOTIFICATION;
  const isSyncOpen = activeDrawer === SidebarItemType.SYNC && activeItem === SidebarItemType.SYNC;

  return (
    <div className="flex h-full relative z-30">
      {/** 메뉴 버튼 영역 */}
      <nav
        className={`
          h-full bg-white border-r-2 border-primary flex flex-col justify-between py-6 transition-all duration-200 ease-in-out relative z-40 overflow-y-auto
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* 사이드바 열기/닫기 버튼 */}
        <div className="px-4 mb-8 flex items-center justify-between">
          <button
            onClick={handleToggleSidebar}
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
              onClick={() => handleItemClick(item.type)}
              isActive={item.type === activeItem}
              shouldShowSpan={isExpanded}
            />
          ))}

          <div className="h-0.5 bg-gray-4 mx-2 my-4" />

          {/* 컨텐츠 생성 버튼 */}
          <button
            onClick={() => openModal(MODAL_TYPES.WRITE)}
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

        {/* 로그인/로그아웃 버튼 */}
        <button className="flex items-center p-6" title="로그인">
          <LogIn className="w-6 h-6" />
          {isExpanded && <span className="ml-4 font-medium text-sm hover:font-bold whitespace-nowrap overflow-hidden">로그인</span>}
        </button>
      </nav>

      {/** 드로어(drawer) 영역 */}
      <Drawer isOpen={isSearchOpen} isSidebarExpanded={isExpanded}>
        <div className="flex h-full justify-center items-center text-lg">검색 드로어</div>
      </Drawer>

      <Drawer isOpen={isNotificationOpen} isSidebarExpanded={isExpanded}>
        <div className="flex h-full justify-center items-center text-lg">알림 드로어</div>
      </Drawer>

      <Drawer isOpen={isSyncOpen} isSidebarExpanded={isExpanded}>
        <div className="flex h-full justify-center items-center text-lg">협업 드로어</div>
      </Drawer>
    </div>
  );
}
