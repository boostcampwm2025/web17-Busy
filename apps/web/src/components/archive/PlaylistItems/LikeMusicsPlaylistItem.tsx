import { Heart, Play } from 'lucide-react';

export default function LikeMusicsPlaylistItem() {
  const likeMusicsCount = 214;

  const handlePlaylistClick = () => {};

  return (
    <div
      onClick={handlePlaylistClick}
      className="group flex items-center bg-white border-2 border-accent-pink rounded-xl p-4 cursor-pointer hover:shadow-[6px_6px_0px_0px_#FF5470] hover:-translate-y-1 transition-all duration-200"
    >
      {/* Icon/Cover Area */}
      <div className="relative w-12 md:w-16 aspect-square mr-4 shrink-0">
        <div className="absolute inset-0 bg-accent-pink/10 rounded-lg transform rotate-6 border border-accent-pink/20 transition-transform group-hover:rotate-12"></div>
        <div className="absolute inset-0 bg-white rounded-lg border-2 border-accent-pink flex items-center justify-center z-10">
          <Heart className="w-6 h-6 md:w-8 md:h-8 text-accent-pink fill-accent-pink" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="sm:text-lg font-black text-accent-pink truncate">좋아요 표시한 곡</h3>
        <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1 flex items-center">
          <Heart className="w-4 h-4 mr-1 fill-current" />
          {likeMusicsCount}곡 좋아요
        </p>
      </div>

      {/* Action */}
      <div className="hidden px-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
        <div className="w-10 h-10 rounded-full bg-accent-pink text-white flex items-center justify-center shadow-md">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  );
}
