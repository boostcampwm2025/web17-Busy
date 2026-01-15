import { getInitialFeedPosts } from '@/api';
import { FeedSection } from '@/components';

export default async function Home() {
  // 초기 데이터 fetch
  const initialData = await getInitialFeedPosts();

  return (
    <div className="flex flex-col items-center gap-4">
      <FeedSection initialData={initialData} />
    </div>
  );
}
