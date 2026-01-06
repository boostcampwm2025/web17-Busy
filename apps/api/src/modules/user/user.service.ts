import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async findOrCreateBySpotify(
    spotifyUserId: string,
    profile: {
      nickname: string;
      email: string;
      profileImgUrl: string;
      refreshToken: string;
    },
  ) {}
}
