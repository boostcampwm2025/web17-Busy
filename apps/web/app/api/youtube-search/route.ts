import { YOUTUBE_SEARCH } from '@/constants';
import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_SEARCH_API_KEY;
const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ message: '검색어가 필요합니다.' }, { status: 400 });
  }

  const controller = new AbortController();

  // 클라이언트가 요청 끊으면 서버도 abort 처리
  req.signal.addEventListener('abort', () => {
    controller.abort();
  });

  const params = new URLSearchParams({
    q: keyword,
    part: 'snippet',
    type: 'video',
    topicId: '/m/04rlf',
    videoCategoryId: '10',
    maxResults: String(YOUTUBE_SEARCH.DEFAULT_LIMIT),
    regionCode: YOUTUBE_SEARCH.COUNTRY,
    videoEmbeddable: 'true',
    key: YOUTUBE_API_KEY!,
  });

  const url = `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('유튜브 검색 요청 에러:', error);
    return NextResponse.json({ message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
