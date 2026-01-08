import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface CoverImgUploaderProps {
  currentCover: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CoverImgUploader = ({ currentCover, onFileChange }: CoverImgUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full md:w-1/3 shrink-0">
      <div
        className="group relative w-full aspect-square rounded-xl border-2 border-primary overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all bg-gray-4"
        onClick={() => fileInputRef.current?.click()}
      >
        <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-xs font-bold">이미지 변경</span>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
      </div>
    </div>
  );
};
