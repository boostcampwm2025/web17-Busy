import { FeedSection } from '@/components';

export default async function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <FeedSection />
    </div>
  );
}
