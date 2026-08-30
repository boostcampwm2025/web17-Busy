'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';
import { useOutsideClick } from '@/hooks/common/use-outside-click';
import { drawerTypes, SidebarItemType, type SidebarItemTypeValues } from '@/types/sidebar';

const isDrawerItem = (type: SidebarItemTypeValues): boolean => (drawerTypes as readonly SidebarItemTypeValues[]).includes(type);
const needLogin = (type: SidebarItemTypeValues) =>
  type === SidebarItemType.PROFILE || type === SidebarItemType.ARCHIVE || type === SidebarItemType.SETTING;

/** 사이드바 확장/축소, 활성 아이템, 드로어 열림/닫힘과 그 닫기 트리거(바깥클릭·ESC)를 관리한다. */
export function useSidebarNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const openModal = useModalStore((s) => s.openModal);
  const { userId, isAuthenticated } = useAuthMe();

  const initialActiveItem = useMemo<SidebarItemTypeValues>(() => {
    if (pathname === '/') {
      return SidebarItemType.HOME;
    }
    return pathname.split('/')[1] as SidebarItemTypeValues;
  }, [pathname]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<SidebarItemTypeValues>(initialActiveItem);
  const [activeDrawer, setActiveDrawer] = useState<SidebarItemTypeValues | null>(null);

  const isSearchOpen = activeDrawer === SidebarItemType.SEARCH;
  const isNotificationOpen = activeDrawer === SidebarItemType.NOTIFICATION;

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

  useEffect(() => {
    // 페이지 url 경로가 바뀔 때마다 사이드바 활성화 아이콘을 현재 pathname 기반으로 업데이트
    setActiveItem(initialActiveItem);
  }, [pathname, initialActiveItem]);

  useEffect(() => {
    // 드로어가 닫힐 때마다 사이드바 활성화 아이콘을 현재 pathname 기반으로 업데이트
    !activeDrawer && setActiveItem(initialActiveItem);
  }, [activeDrawer, initialActiveItem]);

  const handleOutsideDrawer = useCallback(
    (target: Node) => {
      // 포털로 띄워진 모달/오버레이 위 클릭은 바깥 클릭으로 보지 않음
      // (sidebarRef DOM 밖이라 그냥 두면 드로어가 닫혀버림)
      if (useModalStore.getState().isOpen) return;
      if (target instanceof HTMLElement && target.closest('[data-drawer-keep]')) return;

      if (activeDrawer) handleCloseDrawer();
    },
    [activeDrawer, handleCloseDrawer],
  );

  useOutsideClick([sidebarRef], handleOutsideDrawer);

  useEffect(() => {
    // ESC 키로 열린 드로어 닫기 (모달이 열려 있으면 모달 닫기가 우선)
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (useModalStore.getState().isOpen) return;
      if (activeDrawer) handleCloseDrawer();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [activeDrawer, handleCloseDrawer]);

  return {
    sidebarRef,
    isExpanded,
    activeItem,
    isSearchOpen,
    isNotificationOpen,
    handleToggleSidebar,
    handleItemClick,
    handleNavigate,
    handleCloseDrawer,
  };
}
