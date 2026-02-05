export const SidebarItemType = {
  PROFILE: 'profile',
  SEARCH: 'search',
  NOTIFICATION: 'notification',
  ARCHIVE: 'archive',
  HOME: 'home',
  SETTING: 'setting',
  CREATE: 'create',
} as const;

export type SidebarItemTypeValues = (typeof SidebarItemType)[keyof typeof SidebarItemType];

export const drawerTypes = [SidebarItemType.SEARCH, SidebarItemType.NOTIFICATION] as const;
