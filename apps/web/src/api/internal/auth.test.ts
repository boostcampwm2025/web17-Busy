import crypto from 'crypto';
import { describe, expect, it } from 'vitest';

import { buildGoogleAuthorizeUrl, createPkcePair } from './auth';

describe('createPkcePair', () => {
  it('challenge는 verifier의 SHA-256을 base64url로 인코딩한 값과 같다', () => {
    const { verifier, challenge } = createPkcePair();

    const expected = crypto.createHash('sha256').update(verifier).digest('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

    expect(challenge).toBe(expected);
  });

  it('verifier·challenge 둘 다 base64url 문자만 쓴다(+, /, = 없음)', () => {
    const { verifier, challenge } = createPkcePair();

    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('호출마다 다른 verifier를 만든다', () => {
    const first = createPkcePair();
    const second = createPkcePair();

    expect(first.verifier).not.toBe(second.verifier);
  });
});

describe('buildGoogleAuthorizeUrl', () => {
  const baseParams = {
    clientId: 'client-1',
    redirectUri: 'https://example.com/callback',
    codeChallenge: 'challenge-1',
    state: 'state-1',
  };

  it('필수 파라미터를 전부 담는다', () => {
    const url = new URL(buildGoogleAuthorizeUrl(baseParams));

    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('code_challenge')).toBe('challenge-1');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('access_type')).toBe('offline');
  });

  it('prompt를 안 주면 파라미터 자체를 넣지 않는다', () => {
    const url = new URL(buildGoogleAuthorizeUrl(baseParams));

    expect(url.searchParams.has('prompt')).toBe(false);
  });

  it('prompt를 주면 그대로 반영한다', () => {
    const url = new URL(buildGoogleAuthorizeUrl({ ...baseParams, prompt: 'consent' }));

    expect(url.searchParams.get('prompt')).toBe('consent');
  });
});
