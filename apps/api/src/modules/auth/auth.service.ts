import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { URLSearchParams } from 'url';
import {
  AuthProvider,
  GoogleTokenResponse,
  GoogleUserInfoResponse,
} from './types';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async exchangeGoogle(code: string, verifier?: string) {
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    const redirectUri = this.configService.getOrThrow<string>(
      'GOOGLE_REDIRECT_URI',
    );

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    if (verifier) {
      body.set('code_verifier', verifier);
    }

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.warn(
        `Google token exchange failed: ${res.status} ${errorText}`,
      );
      throw new UnauthorizedException('Google Token 교환에 실패했습니다.');
    }

    return (await res.json()) as GoogleTokenResponse;
  }

  async fetchGoogleUserInfo(accessToken: string) {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      this.logger.warn(`Google userinfo failed: ${res.status}`);
      throw new UnauthorizedException(
        'Google 사용자 정보 조회에 실패했습니다.',
      );
    }

    return (await res.json()) as GoogleUserInfoResponse;
  }

  async handleGoogleSignIn(tokens: GoogleTokenResponse) {
    const me = await this.fetchGoogleUserInfo(tokens.access_token);

    // Phase 2에서 findOrCreateByProviderUserId로 일반화 예정
    // 일단은 Google도 user 테이블에 저장되어야 "제대로 로그인"이 성립함.
    const user = await this.userService.findOrCreateByProviderUserId({
      provider: AuthProvider.GOOGLE,
      providerUserId: me.sub,
      nickname: me.name ?? 'Google User',
      email: me.email,
      profileImgUrl: me.picture,
      refreshToken: tokens.refresh_token,
    });

    return user;
  }

  async issueJwt(user: { id: string }) {
    return this.jwtService.signAsync({ sub: user.id });
  }
}
