import { create } from 'zustand';
import type { Music } from '@/types';

/**
 * 전역 플레이어 상태(State)
 * - currentMusic: 현재 선택/재생 대상
 * - isPlaying: 재생/일시정지 UI 상태
 * - queue: 재생 큐(순서 유지)
 */
interface PlayerState {
  currentMusic: Music | null;
  isPlaying: boolean;
  queue: Music[];
}

/**
 * 전역 플레이어 액션(Action)
 * - playMusic: 곡 선택(같은 곡이면 토글, 다른 곡이면 교체 + 큐에 없으면 맨 앞 삽입)
 * - add/remove/reorder/clear: 큐 편집
 */
interface PlayerActions {
  playMusic: (music: Music) => void;
  togglePlay: () => void;

  playPrev: () => void;
  playNext: () => void;

  addToQueue: (music: Music | Music[]) => void;
  removeFromQueue: (musicId: string) => void;

  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  clearQueue: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

/** 현재 곡과 대상 곡이 같은지 판별 (musicId 기준) */
const isSameMusic = (a: Music | null, b: Music): boolean => a?.musicId === b.musicId;

/** addToQueue가 단일/배열 둘 다 받기 때문에 내부에서는 배열로 정규화 */
const normalizeToArray = (music: Music | Music[]): Music[] => (Array.isArray(music) ? music : [music]);

/** 큐에 특정 musicId가 이미 존재하는지 */
const hasMusic = (queue: Music[], musicId: string): boolean => queue.some((item) => item.musicId === musicId);

/**
 * 큐에 곡이 없으면 맨 앞에 삽입.
 * playMusic에서 "재생한 곡이 큐에 없으면 맨 앞 삽입" 규칙을 담당.
 */
const prependIfMissing = (queue: Music[], music: Music): Music[] => (hasMusic(queue, music.musicId) ? queue : [music, ...queue]);

/** 큐에서 특정 곡 제거 */
const removeById = (queue: Music[], musicId: string): Music[] => queue.filter((item) => item.musicId !== musicId);

/**
 * 큐의 두 인덱스를 swap.
 * noUncheckedIndexedAccess 옵션 때문에 undefined 가능성을 가드함.
 */
const swap = (queue: Music[], from: number, to: number): Music[] => {
  const next = [...queue];
  const fromItem = next[from];
  const toItem = next[to];

  if (!fromItem || !toItem) {
    return next;
  }

  next[from] = toItem;
  next[to] = fromItem;
  return next;
};

const ensureCurrentInQueue = (queue: Music[], current: Music | null): Music[] => {
  if (!current) {
    return queue;
  }
  return prependIfMissing(queue, current);
};

const findCurrentIndex = (queue: Music[], current: Music | null): number => {
  if (!current) {
    return -1;
  }
  return queue.findIndex((item) => item.musicId === current.musicId);
};

/**
 * usePlayerStore
 * - 컴포넌트에서 usePlayerStore((s) => s.currentMusic) 형태로 구독 가능
 * - set/get으로 상태/액션 구현
 */
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentMusic: null,
  isPlaying: false,
  queue: [],

  /**
   * 곡 선택/재생 규칙
   * 1) 같은 곡이면: 재생/일시정지 토글
   * 2) 다른 곡이면: 현재곡 교체 + 재생 상태 true + 큐에 없으면 맨 앞 삽입
   */
  playMusic: (music) => {
    const { currentMusic, queue } = get();

    if (isSameMusic(currentMusic, music)) {
      get().togglePlay();
      return;
    }

    set({
      currentMusic: music,
      isPlaying: true,
      queue: prependIfMissing(queue, music),
    });
  },

  /** 재생/일시정지 UI 상태만 토글 (실제 Spotify 재생 호출은 비범위) */
  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  playPrev: () => {
    const { currentMusic, queue, isPlaying } = get();
    const normalizedQueue = ensureCurrentInQueue(queue, currentMusic);
    const currentIndex = findCurrentIndex(normalizedQueue, currentMusic);

    if (currentIndex <= 0) {
      return;
    }

    set({
      queue: normalizedQueue,
      currentMusic: normalizedQueue[currentIndex - 1] ?? null,
      isPlaying,
    });
  },

  playNext: () => {
    const { currentMusic, queue, isPlaying } = get();
    const normalizedQueue = ensureCurrentInQueue(queue, currentMusic);
    const currentIndex = findCurrentIndex(normalizedQueue, currentMusic);

    if (normalizedQueue.length === 0) {
      return;
    }

    // currentMusic이 큐에 없으면 0번째로 이동
    if (currentIndex === -1) {
      set({ queue: normalizedQueue, currentMusic: normalizedQueue[0] ?? null, isPlaying });
      return;
    }

    if (currentIndex >= normalizedQueue.length - 1) {
      return;
    }

    set({
      queue: normalizedQueue,
      currentMusic: normalizedQueue[currentIndex + 1] ?? null,
      isPlaying,
    });
  },

  /** 큐에 음악 추가 (중복은 제거 후 뒤에 append) */
  addToQueue: (music) => {
    const items = normalizeToArray(music);

    set((state) => {
      const deduped = items.filter((item) => !hasMusic(state.queue, item.musicId));
      const nextQueue = [...state.queue, ...deduped];

      // 기존 큐가 비어있었고, 새로운 곡이 추가되었다면
      if (state.queue.length === 0 && nextQueue.length > 0) {
        return {
          queue: nextQueue,
          currentMusic: nextQueue[0],
          isPlaying: true,
        };
      }

      return { queue: nextQueue };
    });
  },

  /**
   * 큐에서 음악 제거
   * - 제거 대상이 현재곡이면: 큐의 첫 곡을 currentMusic으로 승격(없으면 null)
   * - currentMusic이 null이 되면: isPlaying은 false로 내림
   */
  removeFromQueue: (musicId) => {
    set((state) => {
      const nextQueue = removeById(state.queue, musicId);
      const nextCurrent = state.currentMusic?.musicId === musicId ? (nextQueue[0] ?? null) : state.currentMusic;

      return {
        queue: nextQueue,
        currentMusic: nextCurrent,
        isPlaying: nextCurrent ? state.isPlaying : false,
      };
    });
  },

  /** 큐에서 위로 이동 (swap) */
  moveUp: (index) => {
    set((state) => {
      if (index <= 0 || index >= state.queue.length) {
        return state;
      }
      return { queue: swap(state.queue, index, index - 1) };
    });
  },

  /** 큐에서 아래로 이동 (swap) */
  moveDown: (index) => {
    set((state) => {
      if (index < 0 || index >= state.queue.length - 1) {
        return state;
      }
      return { queue: swap(state.queue, index, index + 1) };
    });
  },

  /** 큐 전체 초기화 + 현재곡/재생 상태도 초기화 */
  clearQueue: () => {
    set({ queue: [], currentMusic: null, isPlaying: false });
  },
}));
