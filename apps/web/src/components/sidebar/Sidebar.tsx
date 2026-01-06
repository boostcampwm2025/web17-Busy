'use client';

import { LogIn, Menu, PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <div className="flex h-full relative z-30">
      <nav
        className={`
          h-full bg-white border-r-2 border-primary flex flex-col justify-between py-6 transition-all duration-200 ease-in-out relative z-40
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* 사이드바 열기/닫기 버튼 */}
        <div className="px-4 mb-8 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg transition-colors border-2 border-transparent hover:bg-accent-cyan hover:border-primary"
            title="사이드바 열기"
          >
            <Menu className="w-6 h-6" />
          </button>

          {isExpanded && (
            <button>
              <span className="font-black text-xl tracking-tighter text-accent-pink animate-fade-in">VIBR</span>
            </button>
          )}
        </div>

        <div className="flex flex-col px-3 gap-4">
          {/* nav 버튼 목록 */}
          <ul>
            <li></li>
          </ul>

          <div className="h-0.5 bg-gray-4 mx-2 my-4" />

          {/* 컨텐츠 생성 버튼 */}
          <button
            className={`
              flex items-center p-3 rounded-xl transition-all duration-200 group mb-2
              bg-primary text-white hover:bg-secondary hover:shadow-[3px_3px_0px_0px_#00ebc7]
            `}
            title="생성"
          >
            <PlusCircle className="w-6 h-6" />
            {isExpanded && <span className="ml-4 font-bold whitespace-nowrap overflow-hidden">생성</span>}
          </button>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        <button className="flex items-center p-3" title="로그인">
          <LogIn className="w-6 h-6" />
          {isExpanded && <span className="ml-4 font-medium text-sm hover:font-bold">로그인</span>}
        </button>
      </nav>
    </div>
  );
}
