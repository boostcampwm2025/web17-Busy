import { getInitialPosts } from '@/api/feed';
import PostList from '@/components/feed/PostList';

export default async function Home() {
  // 초기 데이터 fetch
  const initialData = await getInitialPosts();

  return (
    <div className="flex flex-col h-screen items-center gap-4 py-8">
      <PostList initialData={initialData} />
    </div>
  );
}
