import { PlusCircle } from 'lucide-react';

export default function ArchiveViewHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-black text-primary italic uppercase tracking-tighter">My Archive</h1>
        <p className="text-gray-500 font-medium mt-1">나만의 플레이리스트를 관리하세요</p>
      </div>

      <button className="mt-4 md:mt-0 flex items-center bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary hover:shadow-[4px_4px_0px_0px_#00EBC7] transition-all border-2 border-transparent hover:border-black">
        <PlusCircle className="w-5 h-5 mr-2" />
        <span>즉시 추가하기</span>
      </button>
    </div>
  );
}
