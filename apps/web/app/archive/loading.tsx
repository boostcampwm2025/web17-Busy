export default function Loading() {
  return (
    <div role="status" className="animate-pulse flex flex-col w-full max-w-[890px] mx-auto py-8 px-8 gap-y-4">
      <div className="flex flex-col justify-between md:flex-row mb-4 gap-4">
        <div className="space-y-2">
          <div className="h-10 w-50 bg-gray-3 rounded-md" />
          <div className="h-8 w-70 bg-gray-3 rounded-md" />
        </div>
        <div className="h-15 w-full md:w-50 bg-gray-3 rounded-md" />
      </div>
      <PlaylistPulse />
      <PlaylistPulse />
      <PlaylistPulse />
    </div>
  );
}

function PlaylistPulse() {
  return (
    <div className="w-full flex items-center gap-5 border-2 border-gray-3 rounded-2xl p-6 overflow-hidden">
      <div className="size-24 aspect-square rounded-xl bg-gray-3" />
      <div className="flex flex-col gap-2">
        <div className="h-8 w-50 bg-gray-3 rounded-md" />
        <div className="h-5 w-20 bg-gray-3 rounded-md" />
      </div>
    </div>
  );
}
