interface ProfileActionButtonProps {
  isMyProfile: boolean;
  isFollowing: boolean;
  renderIn: 'page' | 'modal';
}

export default function ProfileActionButton({ isMyProfile, isFollowing, renderIn = 'page' }: ProfileActionButtonProps) {
  // TODO: 버튼별 액션 핸들러 연결하기
  /**
   * [프로필 페이지에서 볼 때]
   * - 내 프로필이면 -> 리캡 생성 버튼
   * - isFollowing -> [팔로잉] 버튼, 누르면 팔로우 취소 요청
   * - !isFollowing -> [팔로우] 버튼, 누르면 팔로우 요청
   *
   * [팔로워/팔로잉 모달에서 볼 때]
   * - 내 프로필이면 -> null
   * - isFollowing -> [팔로잉] 버튼, 누르면 팔로우 취소 요청
   * - !isFollowing -> [팔로우] 버튼, 누르면 팔로우 요청
   */

  // 내 프로필이면 -> 프로필 페이지에서는 리캡 생성 버튼, 모달에서는 버튼 필요 x
  if (isMyProfile) {
    return renderIn === 'modal' ? null : (
      <button
        title="프로필 리캡 생성"
        className="px-6 py-2 rounded-full bg-accent-yellow/90 border-2 border-primary text-primary font-bold hover:bg-accent-yellow hover:shadow-[2px_2px_0px_0px_#00214D] transition-all"
      >
        Recap
      </button>
    );
  }

  // isFollowing === true -> [팔로잉] 버튼, 누르면 팔로우 취소 요청
  if (isFollowing) {
    return (
      <button
        title="팔로우 취소"
        className={`${renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'} bg-transparent border-gray-3 text-gray-1 border-2 font-bold hover:bg-gray-4 transition-colors`}
      >
        팔로잉
      </button>
    );
  }

  // isFollowing === false -> [팔로우] 버튼, 누르면 팔로우 요청
  return (
    <button
      title="팔로우"
      className={`${renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'} bg-primary/90 text-white border-2 border-primary font-bold hover:bg-primary transition-colors`}
    >
      팔로우
    </button>
  );
}
