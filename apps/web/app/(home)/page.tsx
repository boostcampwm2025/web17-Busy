import { FeedList } from '@/components';
import { MOCK_POSTS } from '@/constants';

export default async function Home() {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return <FeedList posts={MOCK_POSTS} />;
}
