import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FeedView } from '@/components';

interface Props {
  params: Promise<{ id: string }>;
}

// 데이터 페칭 (서버 동작)
async function getPost(id: string) {
  console.log(`${process.env.INTERNAL_API_URL}/post/${id}`);
  const res = await fetch(`${process.env.INTERNAL_API_URL}/post/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return undefined;
  return res.json();
}

// 메타데이터 생성 (서버 동작)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) return {};
  const mainMusic = post.musics?.[0];

  return {
    title: `VIBR - ${post.author.nickname}님의 추천 음악`,
    description: post.content,
    openGraph: {
      title: mainMusic ? `${mainMusic.title} - ${mainMusic.artist}` : 'VIBR',
      description: post.content,
      images: mainMusic ? [{ url: mainMusic.albumCoverUrl, width: 800, height: 600 }] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <FeedView initialPost={post} />;
}
