import { Injectable, UnauthorizedException } from '@nestjs/common';
import { URLSearchParams } from 'url';
import { SpotifyCurrentUserResponse, SpotifyTokenResponse } from './types';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async exchange(
    code: string,
    verifier: string,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
  }> {
    const tokenUrl = this.configService.get<string>('SPOTIFY_TOKEN_URL')!;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.configService.get<string>('SPOTIFY_CLIENT_ID')!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.configService.get<string>('SPOTIFY_REDIRECT_URI')!,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      // todo - 예외 처리
      throw new UnauthorizedException('Access Token 받는 데 실패했습니다.');
    }

    const spotifyTokenResponse = (await res.json()) as SpotifyTokenResponse;

    return {
      accessToken: spotifyTokenResponse.access_token,
      expiresIn: spotifyTokenResponse.expires_in,
      refreshToken: spotifyTokenResponse.refresh_token,
    };
  }

  async handleSpotifySignIn(spotifyTokens: {
    accessToken: string;
    refreshToken: string;
  }) {
    const apiBaseUrl = this.configService.get<string>('SPOTIFY_API_BASE_URL')!;
    const url = apiBaseUrl + '/me';

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${spotifyTokens.accessToken}`,
      },
    });

    if (!res.ok) {
      // todo - 예외 처리
      throw new UnauthorizedException(
        'Spotify에서 사용자의 정보를 불러들이는데 실패했습니다.',
      );
    }

    const spotifyCurrentUserResponse =
      (await res.json()) as SpotifyCurrentUserResponse;

    const {
      id: spotifyUserId,
      display_name: nickname,
      email,
      images,
    } = spotifyCurrentUserResponse;
    const profileImgUrl = images[0]?.url;

    const user = await this.userService.findOrCreateBySpotifyUserId({
      spotifyUserId,
      nickname,
      email,
      profileImgUrl,
      refreshToken: spotifyTokens.refreshToken,
    });

    return user;
  }

  async issueJwt(user: {
    id: string;
    nickname: string;
    profileImgUrl?: string;
  }) {
    const payload = {
      sub: user.id,
      nickname: user.nickname,
      profileImgUrl: user.profileImgUrl,
    };

    return await this.jwtService.signAsync(payload, {});
  }
}
