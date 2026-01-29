import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Setting() {
  return (
    <div className="flex px-8 py-16">
      <section className="w-full flex items-center space-x-2 py-6 border-b border-primary/20">
        <h2 className="text-2xl font-bold">이용 약관</h2>
        <ChevronRight />
        <Link href={'/setting/terms'} className="text-lg">
          이용 약관 확인 및 철회
        </Link>
      </section>
    </div>
  );
}
