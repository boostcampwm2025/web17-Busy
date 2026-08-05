'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotiResponseDto } from '@repo/dto';

import { deleteAllNotis, markAllNotiRead, markNotiRead, queryKeys } from '@/api';

type Context = {
  previousNotifications: NotiResponseDto[] | undefined;
};

type OptimisticUpdater<TVariables> = (notifications: NotiResponseDto[], variables: TVariables) => NotiResponseDto[];

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const notificationsKey = queryKeys.notifications.all;

  const updateNotifications = async <TVariables>(variables: TVariables, updater: OptimisticUpdater<TVariables>) => {
    await queryClient.cancelQueries({ queryKey: notificationsKey });

    const previousNotifications = queryClient.getQueryData<NotiResponseDto[]>(notificationsKey);

    queryClient.setQueryData<NotiResponseDto[]>(notificationsKey, (current) => updater(current ?? [], variables));

    return { previousNotifications } satisfies Context;
  };

  const rollbackNotifications = (context: Context | undefined) => {
    queryClient.setQueryData(notificationsKey, context?.previousNotifications ?? []);
  };

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: notificationsKey });
  };

  const readNotiMutation = useMutation({
    mutationFn: markNotiRead,
    onMutate: (notiId) =>
      updateNotifications(notiId, (notifications, id) => notifications.map((noti) => (noti.id === id ? { ...noti, isRead: true } : noti))),
    onError: (_error, _notiId, context) => {
      rollbackNotifications(context);
    },
    onSettled: invalidateNotifications,
  });

  const readAllNotisMutation = useMutation({
    mutationFn: markAllNotiRead,
    onMutate: () => updateNotifications(undefined, (notifications) => notifications.map((noti) => (noti.isRead ? noti : { ...noti, isRead: true }))),
    onError: (_error, _variables, context) => {
      rollbackNotifications(context);
    },
    onSettled: invalidateNotifications,
  });

  const deleteAllNotisMutation = useMutation({
    mutationFn: deleteAllNotis,
    onMutate: () => updateNotifications(undefined, () => []),
    onError: (_error, _variables, context) => {
      rollbackNotifications(context);
    },
    onSettled: invalidateNotifications,
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
