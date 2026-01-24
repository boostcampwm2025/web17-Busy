'use client';

import ProfileActionButton from './ProfileActionButton';
import FollowStats from './FollowStats';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useProfileStore } from '@/stores';
import { GetUserDto as Profile } from '@repo/dto';

export default function ProfileInfo({ profile }: { profile: Profile }) {
  const { userId: loggedInUserId } = useAuthMe();
  const toggleFollow = useProfileStore((s) => s.toggleFollow);

  const { nickname, profileImgUrl, bio, followerCount, followingCount, isFollowing } = profile;

  return (
    <section className="max-w-4xl">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10 mb-8">
        {/* 프로필 이미지 아바타 */}
        <div className="shrink-0 relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary p-1 bg-white shadow-[3px_3px_0px_0px_#00214D]">
          <img src={profileImgUrl ?? DEFAULT_IMAGES.PROFILE} alt={nickname} className="w-full h-full object-cover rounded-full" />
        </div>

        {/* 사용자 정보 영역 */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-center mb-4 space-y-2 md:space-y-0">
            <h2 className="text-2xl font-black text-primary md:mr-6">{nickname}</h2>

            {/* 리캡 생성/팔로우 버튼 */}
            <ProfileActionButton
              loggedInUserId={loggedInUserId}
              profileUserId={profile.id}
              isFollowing={isFollowing}
              renderIn="page"
              onFollowActionComplete={toggleFollow}
            />
          </div>

          {/* 팔로우/팔로잉 사용자 정보 */}
          <FollowStats profileUserId={profile.id} followerCount={followerCount} followingCount={followingCount} />

          {/* 프로필 소개란 */}
          <p className="text-primary font-medium whitespace-pre-wrap leading-relaxed text-center md:text-justify max-w-md lg:max-w-lg mx-auto md:mx-0">
            {bio}
          </p>
        </div>
      </div>
    </section>
  );
}
