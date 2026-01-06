import { Injectable } from '@nestjs/common';
import { URLSearchParams } from 'url';
import { SpotifyCurrentUserResponse, SpotifyTokenResponse } from './types';

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

    // raw에서 요한 것만 return
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
    };
  }

  async verifyUser(accessToken: string, refreshToken: string) {
    const apiBaseUrl = 'https://api.spotify.com/v1';
    const url = apiBaseUrl + '/me';
    const res = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    if (!res.ok) {
      // todo - 예외 처리
    }

    const raw = (await res.json()) as SpotifyCurrentUserResponse;

    const {
      id: providerUserId,
      display_name: nickname,
      // email,
    } = raw;

    const profileImgUrl = raw.images[0]?.url;

    // user type?
    const user = await userService.verifyUser({
      nickname,
      provider: 'spotify',
      providerUserId,
      // email,
      profileImgUrl,
      refreshToken,
    });

    // jwt 생성에 사용
    return user;
  }

  buildJwtWith() {}
}
