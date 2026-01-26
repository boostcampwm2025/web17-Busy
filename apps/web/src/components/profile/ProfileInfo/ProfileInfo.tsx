'use client';

import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import Image from 'next/image';
import ProfileActionButton from './ProfileActionButton';
import FollowStats from './FollowStats';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useProfileStore } from '@/stores';
import { GetUserDto as Profile } from '@repo/dto';
import { EditTextarea, EditInput } from './ProfileInputs';
import { updateProfile } from '@/api';

export default function ProfileInfo({ profile }: { profile: Profile }) {
  const { userId: loggedInUserId } = useAuthMe();
  const toggleFollow = useProfileStore((s) => s.toggleFollow);

  const isOwner = loggedInUserId === profile.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: profile.nickname || '',
    bio: profile.bio || '',
  });

  useEffect(() => {
    setEditForm({
      nickname: profile.nickname || '',
      bio: profile.bio || '',
    });
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(editForm.nickname, editForm.bio);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const { nickname, profileImgUrl, bio, followerCount, followingCount, isFollowing } = profile;

  return (
    <section className="max-w-4xl">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10 mb-8">
        {/* 프로필 이미지 아바타 */}
        <div className="shrink-0">
          <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary p-1 bg-white shadow-[3px_3px_0px_0px_#00214D]">
            <Image src={profileImgUrl || DEFAULT_IMAGES.PROFILE} alt={nickname} fill className="object-cover" />
          </div>
        </div>

        {/* 사용자 정보 영역 */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-center mb-4 space-y-2 md:space-y-0">
            <div className="flex items-center md:mr-6 gap-2">
              {isEditing ? (
                <div className="w-48 md:w-60">
                  <EditInput
                    value={editForm.nickname}
                    onChange={(e: any) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="text-2xl font-black text-center md:text-left"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-black text-primary">{nickname}</h2>
              )}

              {isOwner &&
                (isEditing ? (
                  <div className="flex gap-1">
                    <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors" aria-label="저장">
                      <Check size={20} />
                    </button>
                    <button onClick={handleCancel} className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors" aria-label="취소">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-full transition-all"
                    aria-label="프로필 수정"
                  >
                    <Pencil size={18} />
                  </button>
                ))}
            </div>
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
          <div className="relative mt-4 md:mt-0 max-w-md lg:max-w-lg mx-auto md:mx-0">
            {isEditing ? (
              <EditTextarea value={editForm.bio} onChange={(e: any) => setEditForm({ ...editForm, bio: e.target.value })} />
            ) : (
              <p className="text-primary font-medium whitespace-pre-wrap leading-relaxed text-justify">
                {bio || (isOwner ? '자기소개를 입력해주세요.' : '')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
