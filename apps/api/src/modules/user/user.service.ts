import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async verifyUser({
    nickname,
    provider,
    providerUserId,
    profileImgUrl,
    refreshToken,
  }: {
    nickname: string;
    provider: string;
    providerUserId: string;
    profileImgUrl: string;
    refreshToken: string;
  }) {}
}
