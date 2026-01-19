export default function ProfileActionButton({ isMyProfile, isFollowing }: { isMyProfile: boolean; isFollowing: boolean }) {
  // TODO: 버튼별 액션 핸들러 연결하기
  return (
    <>
      {isMyProfile ? (
        <button
          title="프로필 리캡 생성"
          className="flex items-center px-6 py-2 bg-accent-yellow border-2 border-primary text-primary font-black rounded-full hover:bg-accent hover:shadow-[2px_2px_0px_0px_#00214D] transition-all"
        >
          Recap
        </button>
      ) : isFollowing ? (
        <button
          title="팔로우 취소"
          className="px-6 py-2 bg-primary text-white border-2 border-primary font-bold rounded-full hover:bg-secondary hover:border-secondary hover:shadow-[2px_2px_0px_0px_#00EBC7] transition-all"
        >
          팔로우 취소
        </button>
      ) : (
        <button
          title="팔로우"
          className="px-6 py-2 bg-primary text-white border-2 border-primary font-bold rounded-full hover:bg-secondary hover:border-secondary hover:shadow-[2px_2px_0px_0px_#00EBC7] transition-all"
        >
          팔로우
        </button>
      )}
    </>
  );
}
