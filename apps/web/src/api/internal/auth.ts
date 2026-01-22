import type { UserDto } from '@repo/dto';
import { internalClient } from './client';

export async function logout() {
  await internalClient.post('/auth/logout');
}

export async function authMe() {
  const { data } = await internalClient.get<UserDto>('/user/me');
  return data;
}

export async function googleExchange(args: { code: string; verifier: string }) {
  const backendUrl = process.env.INTERNAL_API_URL!;
  const res = await fetch(`${backendUrl}/auth/google/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  if (!res.ok) return { ok: false as const };

  const data = (await res.json()) as { appJwt: string };
  return { ok: true as const, ...data };
}

export async function spotifyToken() {
  const { data } = await internalClient.get('/auth/spotify/token');
  return data;
}

export async function spotifyExchange(args: { code: string; verifier: string }) {
  const backendUrl = process.env.INTERNAL_API_URL!;
  const res = await fetch(`${backendUrl}/auth/spotify/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  if (!res.ok) return { ok: false as const };

  const data = (await res.json()) as {
    spotifyAccessToken: string;
    spotifyTokenExpiresIn: number;
    appJwt: string;
  };
  return { ok: true as const, ...data };
}

export async function tmpLogin(userId: string) {
  const { data } = await internalClient.post<{ appJwt: string }>('/auth/login/tmp', { id: userId });
  return data.appJwt;
}
