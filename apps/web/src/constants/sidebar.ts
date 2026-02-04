import { Bell, Box, Home, Search, Settings, User } from 'lucide-react';
import { SidebarItemType } from '@/types';

export const menuItems = [
  { type: SidebarItemType.HOME, icon: Home, label: '홈' },
  { type: SidebarItemType.SEARCH, icon: Search, label: '검색' },
  { type: SidebarItemType.NOTIFICATION, icon: Bell, label: '알림' },
  { type: SidebarItemType.ARCHIVE, icon: Box, label: '보관함' },
  { type: SidebarItemType.PROFILE, icon: User, label: '프로필' },
  { type: SidebarItemType.SETTING, icon: Settings, label: '설정' },
];

export const SIDEBAR_WIDTH_SHRINKED = 'w-20';
export const SIDEBAR_WIDTH_EXPANDED = 'w-48 md:w-64';

export const DRAWER_LEFT_SHRINKED = 'left-20';
export const DRAWER_LEFT_EXPANDED = 'left-48 md:left-64';
