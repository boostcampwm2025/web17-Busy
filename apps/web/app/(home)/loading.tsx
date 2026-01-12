export default function Loading() {
  return (
    <div role="status" className="flex flex-col w-full max-w-195 mx-auto py-8 px-8 gap-y-4">
      <PostCardPulse />
      <PostCardPulse />
    </div>
  );
}

function PostCardPulse() {
  return (
    <div className="animate-pulse w-full flex flex-col gap-5 border-2 border-gray-3 rounded-2xl p-6 overflow-hidden">
      <div className="flex gap-2 items-center">
        <div className="size-14 rounded-full bg-gray-3" />
        <div className="flex flex-col gap-1">
          <div className="h-5 w-40 bg-gray-3 rounded-md" />
          <div className="h-3 w-20 bg-gray-3 rounded-md" />
        </div>
      </div>
      <div className="w-full aspect-square md:aspect-video bg-gray-3 rounded-md" />
      <div className="h-8 w-1/3 bg-gray-3 rounded-md" />
      <div className="flex flex-col gap-1">
        <div className="h-5 w-full bg-gray-3 rounded-md" />
        <div className="h-5 w-full bg-gray-3 rounded-md" />
      </div>
    </div>
  );
}
