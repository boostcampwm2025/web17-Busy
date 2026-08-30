import crypto from 'crypto';
import type { UserDto } from '@repo/dto';
import { GOOGLE_AUTH_URL, GOOGLE_SCOPES } from '@/constants/auth';
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

export async function tmpLogin(userId: string) {
  const { data } = await internalClient.post<{ appJwt: string }>('/auth/login/tmp', { id: userId });
  return data.appJwt;
}

const base64UrlEncode = (buffer: Buffer) => buffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

/** OAuth PKCE 검증자·챌린지 쌍. `hooks/auth/server/pkce.ts`에서 이동(#473) — React 훅이 아니라 순수 유틸. */
export function createPkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const hashed = crypto.createHash('sha256').update(verifier).digest();
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}

type BuildGoogleAuthorizeUrlParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  prompt?: 'consent' | 'select_account';
};

/** `hooks/auth/server/googleAuth.ts`에서 이동(#473) — React 훅이 아니라 순수 유틸. */
export function buildGoogleAuthorizeUrl(params: BuildGoogleAuthorizeUrlParams) {
  const url = new URL(GOOGLE_AUTH_URL);

  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));

  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  /** refresh_token 필요 시만 offline 유지 */
  url.searchParams.set('access_type', 'offline');

  /** 기본은 prompt를 아예 넣지 않고 진행 */
  if (params.prompt) {
    url.searchParams.set('prompt', params.prompt);
  }

  return url.toString();
}
