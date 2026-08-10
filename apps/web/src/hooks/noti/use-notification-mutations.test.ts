import type { NotiResponseDto } from '@repo/dto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/internal/noti', () => ({
  deleteAllNotis: vi.fn(),
  markAllNotiRead: vi.fn(),
  markNotiRead: vi.fn(),
}));

import { clearNotificationsInCache, markAllNotificationsReadInCache, markNotificationReadInCache } from './use-notification-mutations';

const createNotification = (id: string, isRead: boolean): NotiResponseDto =>
  ({
    id,
    isRead,
    type: 'LIKE',
    createdAt: '2026-08-10T00:00:00.000Z',
  }) as unknown as NotiResponseDto;

describe('notification cache updaters', () => {
  it('marks only the selected notification as read', () => {
    const notifications = [createNotification('noti-1', false), createNotification('noti-2', false)];

    expect(markNotificationReadInCache(notifications, 'noti-1')).toEqual([
      expect.objectContaining({ id: 'noti-1', isRead: true }),
      expect.objectContaining({ id: 'noti-2', isRead: false }),
    ]);
  });

  it('marks every unread notification as read', () => {
    const notifications = [createNotification('noti-1', false), createNotification('noti-2', true)];

    expect(markAllNotificationsReadInCache(notifications)).toEqual([
      expect.objectContaining({ id: 'noti-1', isRead: true }),
      expect.objectContaining({ id: 'noti-2', isRead: true }),
    ]);
  });

  it('clears notifications for delete-all optimistic updates', () => {
    expect(clearNotificationsInCache()).toEqual([]);
  });
});
