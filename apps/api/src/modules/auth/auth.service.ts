import { Injectable } from '@nestjs/common';
import { URLSearchParams } from 'url';
import {
  SpotifyGetCurrentUserResponse as SpotifyCurrentUserResponse,
  SpotifyTokenResponse,
} from './types';

@Injectable()
export class AuthService {
  async exchange(code: string, verifier: string) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: '',
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      // todo - 예외 처리
    }

    const raw = (await res.json()) as SpotifyTokenResponse;

    // raw에서 필요한 것만 return
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
    };
  }

  async verifyUser(accessToken: string, refreshToken: string) {}

  buildJwtWith() {}
}
