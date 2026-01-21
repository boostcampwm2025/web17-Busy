export default function ProfileSkeleton() {
  return (
    <div role="status" className="animate-pulse flex flex-col w-full items-center mx-auto py-8 px-8 gap-y-4">
      <ProfilePulse />
      <PostListPulse />
    </div>
  );
}

function ProfilePulse() {
  return (
    <div className="flex-1 text-center md:text-left md:self-start">
      <div className="flex flex-col md:flex-row items-center md:items-center mb-4 space-y-2 md:space-y-0">
        <div className="size-36 rounded-full bg-gray-3 m-5" />
        <div className="flex flex-col gap-4 items-center md:items-start">
          <div className="h-8 w-40 bg-gray-3 rounded-md" />
          <div className="h-5 w-20 bg-gray-3 rounded-md" />
          <div className="flex flex-col gap-1 items-center md:items-start">
            <div className="h-3 w-60 bg-gray-3 rounded-md" />
            <div className="h-3 w-50 bg-gray-3 rounded-md" />
            <div className="h-3 w-50 bg-gray-3 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PostListPulse() {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6 mt-4">
      <div className="aspect-square rounded-xl bg-gray-3" />
      <div className="aspect-square rounded-xl bg-gray-3" />
      <div className="aspect-square rounded-xl bg-gray-3" />
      <div className="aspect-square rounded-xl bg-gray-3" />
      <div className="aspect-square rounded-xl bg-gray-3" />
      <div className="aspect-square rounded-xl bg-gray-3" />
    </div>
  );
}
