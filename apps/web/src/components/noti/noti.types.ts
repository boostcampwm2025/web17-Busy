export type NotiView = {
  id: string;
  isRead: boolean;
  createdAtText: string;
  message: string;
  avatarUrl?: string | null;
  targetImgUrl?: string | null;
  kind: 'user' | 'target';
};

export type FetchStatus = 'loading' | 'success' | 'empty' | 'error';
