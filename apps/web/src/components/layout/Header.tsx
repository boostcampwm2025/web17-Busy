'use client';

import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-primary px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-black italic tracking-tighter text-primary uppercase">{pathname === '/' ? 'feed' : pathname.slice(1)}</h1>
    </header>
  );
}
