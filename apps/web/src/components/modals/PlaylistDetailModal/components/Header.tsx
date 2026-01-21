import { Play, Search, X } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

type Props = {
  title: string;
  tracksCount: number;
  coverImgUrl: string;
  isSearchOpen: boolean;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onPlayTotalSongs: () => void;
};

export function Header({ title, tracksCount, coverImgUrl, isSearchOpen, setIsSearchOpen, onClose, onPlayTotalSongs }: Props) {
  return (
    <div className="relative bg-grayish border-b-2 border-primary p-6">
      <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white rounded-full transition-colors z-10">
        <X className="w-6 h-6 text-primary" />
      </button>

      <div className="flex items-center space-x-6">
        {/* Cover */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl"></div>
          <img src={coverImgUrl} alt={title} className="relative w-full h-full object-cover rounded-xl border-2 border-primary z-10" />
          <div className="absolute -bottom-2 -right-2 z-20 bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary">
            {tracksCount}곡
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-primary leading-tight mb-1">{title}</h2>
          <p className="text-sm font-bold text-gray-500 mb-3">Created by Me</p>

          <div className="flex items-center space-x-2">
            <button
              className="flex-1 bg-primary text-white py-1.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 hover:bg-secondary border-2 border-transparent hover:border-black transition-all shadow-sm hover:shadow-md"
              onClick={() => tracksCount > 0 && onPlayTotalSongs()}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>재생</span>
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg border-2 transition-all ${isSearchOpen ? 'bg-accent border-primary text-primary' : 'bg-white border-primary/30 text-gray-500 hover:border-primary hover:text-primary'}`}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
