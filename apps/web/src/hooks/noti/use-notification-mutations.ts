'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotiResponseDto } from '@repo/dto';

import { deleteAllNotis, markAllNotiRead, markNotiRead, queryKeys } from '@/api';

type Context = {
  previousNotifications: NotiResponseDto[] | undefined;
};

const setNotifications = (current: NotiResponseDto[] | undefined, updater: (notifications: NotiResponseDto[]) => NotiResponseDto[]) =>
  updater(current ?? []);

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const notificationsKey = queryKeys.notifications.all;

  const readNotiMutation = useMutation({
    mutationFn: markNotiRead,
    onMutate: async (notiId) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });

      const previousNotifications = queryClient.getQueryData<NotiResponseDto[]>(notificationsKey);

      queryClient.setQueryData<NotiResponseDto[]>(notificationsKey, (current) =>
        setNotifications(current, (notifications) => notifications.map((noti) => (noti.id === notiId ? { ...noti, isRead: true } : noti))),
      );

      return { previousNotifications } satisfies Context;
    },
    onError: (_error, _notiId, context) => {
      queryClient.setQueryData(notificationsKey, context?.previousNotifications ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  const readAllNotisMutation = useMutation({
    mutationFn: markAllNotiRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });

      const previousNotifications = queryClient.getQueryData<NotiResponseDto[]>(notificationsKey);

      queryClient.setQueryData<NotiResponseDto[]>(notificationsKey, (current) =>
        setNotifications(current, (notifications) => notifications.map((noti) => (noti.isRead ? noti : { ...noti, isRead: true }))),
      );

      return { previousNotifications } satisfies Context;
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationsKey, context?.previousNotifications ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  const deleteAllNotisMutation = useMutation({
    mutationFn: deleteAllNotis,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });

      const previousNotifications = queryClient.getQueryData<NotiResponseDto[]>(notificationsKey);

      queryClient.setQueryData<NotiResponseDto[]>(notificationsKey, []);

      return { previousNotifications } satisfies Context;
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationsKey, context?.previousNotifications ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  return {
    readNoti: readNotiMutation.mutate,
    readAllNotis: readAllNotisMutation.mutate,
    deleteAllNotis: deleteAllNotisMutation.mutate,
    isReadingNoti: readNotiMutation.isPending,
    isReadingAllNotis: readAllNotisMutation.isPending,
    isDeletingAllNotis: deleteAllNotisMutation.isPending,
  };
}
