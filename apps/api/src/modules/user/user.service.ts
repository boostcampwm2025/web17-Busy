import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  // todo - return type -> User Entity로 변경 예정
  async findOrCreateBySpotifyUserId(
    spotifyUserId: string,
    profile: {
      nickname: string;
      email: string;
      profileImgUrl: string;
      refreshToken: string;
    },
  ): Promise<{
    id: string;
    nickname: string;
    profileImageUrl?: string | null;
  }> {
    return {
      id: '',
      nickname: '',
      profileImageUrl: null,
    };
  }
}
