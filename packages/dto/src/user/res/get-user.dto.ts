export interface GetUserDto {
  id: string;
  nickname: string;
  profileImgUrl: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}
