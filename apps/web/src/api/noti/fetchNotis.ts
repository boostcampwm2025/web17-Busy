export async function fetchNotis() {
  const res = await fetch('/api/noti');
  if (!res.ok) throw new Error('알림을 읽는 데 실패');

  return await res.json();
}

export async function markNotiRead(notiId: string) {
  const res = await fetch(`/api/noti/${notiId}`, {
    method: 'PATCH',
  });

  return await res.json();
}
