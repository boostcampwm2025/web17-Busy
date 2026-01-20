export default function FollowStats({ followerCount, followingCount }: { followerCount: number; followingCount: number }) {
  // TODO: 팔로우 모달 오픈 로직 연결
  // TODO: 팔로워/팔로잉 숫자 포맷팅 함수
  return (
    <div className="flex items-center justify-center md:justify-start space-x-6 mb-4 text-primary">
      <button title="팔로워 목록" className="flex flex-col-reverse items-center md:flex-row ">
        <span className="text-sm font-medium text-gray-1">팔로워</span>
        <span className="font-bold text-xl md:ml-2">{followerCount}</span>
      </button>
      <button title="팔로잉 목록" className="flex flex-col-reverse items-center md:flex-row ">
        <span className="text-sm font-medium text-gray-1">팔로잉</span>
        <span className="font-bold text-xl md:ml-2">{followingCount}</span>
      </button>
    </div>
  );
}
