import { fireEvent, render, screen } from '@testing-library/react';
import { act, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import PostMedia from './PostMedia';

const CONTAINER_WIDTH = 300;
const THRESHOLD = CONTAINER_WIDTH * 0.3;
const TRANSITION_MS = 250;

const buildMusic = (id: string): Music => ({
  id,
  trackUri: `uri:${id}`,
  provider: 'itunes' as Music['provider'], // 값 import는 class-transformer 데코레이터를 끌어와 jsdom에서 터진다
  albumCoverUrl: `https://example.com/${id}.jpg`,
  title: `track-${id}`,
  artistName: `artist-${id}`,
  durationMs: 1000,
});

// 커버 1장 + 곡 2장 = 슬라이드 3장. 인덱스는 0·1·2 셋뿐이라 두 칸 이동이 바로 드러난다.
const POST: Post = {
  id: 'post-1',
  author: { id: 'author-1', nickname: 'nick', profileImgUrl: '' },
  coverImgUrl: 'https://example.com/cover.jpg',
  content: 'content',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date(0).toISOString(),
  musics: [buildMusic('m1'), buildMusic('m2')],
  isLiked: false,
  isEdited: false,
};

const renderPostMedia = () =>
  render(
    createElement(PostMedia, {
      post: POST,
      variant: 'card' as const,
      currentMusicId: null,
      isPlayingGlobal: false,
      onPlay: vi.fn(),
      onPlayAll: vi.fn(),
    }),
  );

const getCarousel = () => {
  const el = document.querySelector('[data-swipe-carousel]');
  if (!el) throw new Error('carousel container not found');
  return el;
};

/** 왼쪽으로 임계값을 넘겨 스와이프한다(= 다음 슬라이드). */
const swipeLeft = (el: Element, { withStart = true } = {}) => {
  const startX = 200;
  const endX = startX - THRESHOLD * 2;
  if (withStart) {
    fireEvent.touchStart(el, { touches: [{ clientX: startX }] });
    fireEvent.touchMove(el, { touches: [{ clientX: endX }] });
  }
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: endX }] });
};

const flushTransition = () => act(() => void vi.advanceTimersByTime(TRANSITION_MS));

describe('PostMedia swipe carousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom은 레이아웃을 계산하지 않아 offsetWidth가 0이다. 0이면 임계값도 0이 된다.
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: CONTAINER_WIDTH });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances one slide per swipe', () => {
    renderPostMedia();
    const carousel = getCarousel();

    expect(screen.queryByTitle('이전')).toBeNull(); // 인덱스 0
    expect(screen.getByTitle('다음')).toBeTruthy();

    swipeLeft(carousel);
    flushTransition();

    expect(screen.getByTitle('이전')).toBeTruthy(); // 인덱스 1
    expect(screen.getByTitle('다음')).toBeTruthy();
  });

  /**
   * 전환 중에는 touchStart가 건너뛰어져 touchStartX가 직전 스와이프 값 그대로 남는다.
   * touchEnd에만 전환 가드가 없으면 그 값으로 delta를 재 임계값을 넘기고, 한 번의 스와이프가 두 칸을 넘긴다.
   */
  it('ignores a touchEnd that arrives while the slide transition is still running', () => {
    renderPostMedia();
    const carousel = getCarousel();

    swipeLeft(carousel);
    // 전환이 끝나기 전에 도착한 두 번째 touchEnd. touchStart는 가드에 걸려 좌표를 갱신하지 못한다.
    swipeLeft(carousel, { withStart: false });
    flushTransition();

    expect(screen.getByTitle('다음')).toBeTruthy(); // 인덱스 1이면 남아 있고, 2로 건너뛰었으면 사라진다
  });

  it('clears the pending transition timer on unmount', () => {
    const { unmount } = renderPostMedia();
    swipeLeft(getCarousel());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
