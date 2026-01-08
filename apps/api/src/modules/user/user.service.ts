import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  // todo - return type -> User Entity로 변경 예정
  async findOrCreateBySpotifyUserId(profile: {
    spotifyUserId: string;
    nickname: string;
    email: string;
    profileImgUrl: string;
    refreshToken: string;
  }): Promise<{
    id: string;
    nickname: string;
    profileImageUrl?: string | null;
  }> {
    return {
      id: '111',
      nickname: 'test user',
      profileImageUrl: null,
    };
  }
}
