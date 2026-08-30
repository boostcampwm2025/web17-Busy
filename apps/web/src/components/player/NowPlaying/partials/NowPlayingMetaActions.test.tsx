import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

const mocks = vi.hoisted(() => ({ tickerRenders: 0 }));

vi.mock('@/hooks/auth/client/use-auth-me', () => ({
  useAuthMe: () => ({ user: null, userId: null, isAuthenticated: true, isLoading: false }),
}));

/** NowPlayingMetaActions는 곡이 있을 때 제목·아티스트로 TickerText를 정확히 2번 그린다. */
vi.mock('@/components/common/TickerText', () => ({
  default: ({ text }: { text: string }) => {
    mocks.tickerRenders += 1;
    return <span>{text}</span>;
  },
}));

import { useCurrentMusicActions } from '@/hooks/player/use-current-music-actions';
import { usePlayerStore } from '@/stores/usePlayerStore';
import NowPlayingMetaActions from './NowPlayingMetaActions';

const music = (id: string, title: string) =>
  ({
    id,
    title,
    artistName: '가수',
    albumCoverUrl: 'https://example.com/cover.png',
    durationMs: 1000,
    provider: 'youtube',
    trackUri: `youtube:${id}`,
  }) as unknown as Music;

/** NowPlaying과 같은 배선. 곡과 무관한 상태 하나가 부모를 다시 그리게 한다. */
function Harness() {
  const [tick, setTick] = useState(0);
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const actions = useCurrentMusicActions();

  return (
    <>
      <button type="button" onClick={() => setTick((n) => n + 1)}>
        bump {tick}
      </button>
      <NowPlayingMetaActions currentMusic={currentMusic} playError={null} onPost={actions.post} onSave={actions.save} />
    </>
  );
}

describe('NowPlayingMetaActions memo', () => {
  beforeEach(() => {
    mocks.tickerRenders = 0;
    usePlayerStore.setState({ currentMusic: music('a', '노래') });
  });

  /**
   * useCurrentMusicActions가 매 렌더 새 post·save를 만들면 memo()가 통째로 무효화된다.
   * 실제로 그랬을 때 이 테스트는 2가 아니라 8을 본다.
   */
  it('곡과 무관하게 부모가 다시 그려져도 리프는 다시 그리지 않는다', () => {
    render(<Harness />);
    const afterMount = mocks.tickerRenders;

    const bump = screen.getByRole('button', { name: /bump/ });
    fireEvent.click(bump);
    fireEvent.click(bump);
    fireEvent.click(bump);

    expect(mocks.tickerRenders).toBe(afterMount);
  });

  it('곡이 바뀌면 리프를 다시 그린다', () => {
    render(<Harness />);
    const afterMount = mocks.tickerRenders;

    act(() => usePlayerStore.setState({ currentMusic: music('b', '다른 노래') }));

    expect(mocks.tickerRenders).toBeGreaterThan(afterMount);
    expect(screen.getByText('다른 노래')).toBeInTheDocument();
  });
});
