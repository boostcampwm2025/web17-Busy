export const SidebarItemType = {
  PROFILE: 'profile',
  SEARCH: 'search',
  NOTIFICATION: 'notification',
  ARCHIVE: 'archive',
  SYNC: 'sync',
  HOME: 'home',
  SETTING: 'setting',
  CREATE: 'create',
} as const;

export type SidebarItemTypeValues = (typeof SidebarItemType)[keyof typeof SidebarItemType];

export const drawerTypes = [SidebarItemType.SEARCH, SidebarItemType.NOTIFICATION, SidebarItemType.SYNC] as const;
