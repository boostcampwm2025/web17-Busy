import type { MusicResponseDto as Music } from '@repo/dto';
import { create } from 'zustand';

/**
 * 전역 플레이어 상태(State)
 * - currentMusic: 현재 선택/재생 대상
 * - isPlaying: 재생/일시정지 UI 상태
 * - queue: 재생 큐(순서 유지)
 * - volume: 0~1
 * - play 실패 메시지(NowPlaying에서 배너로 표시)
 */
interface PlayerState {
  currentMusic: Music | null;
  isPlaying: boolean;
  queue: Music[];
  volume: number;
  playError: string | null;
}

/**
 * 전역 플레이어 액션(Action)
 * - playMusic: 곡 선택(같은 곡이면 토글, 다른 곡이면 교체 + 큐에 없으면 맨 앞 삽입)
 * - add/remove/reorder/clear: 큐 편집
 * - set volume/playError : 볼륨 조절  및 에러 정보
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
  initializeQueue: (queue: Music[]) => void;

  setVolume: (v: number) => void;
  setPlayError: (msg: string | null) => void;
}

type PlayerStore = PlayerState & PlayerActions;

const DEFAULT_VOLUME = 0.5;

/** 현재 곡과 대상 곡이 같은지 판별 (musicId 기준) */
const isSameMusic = (a: Music | null, b: Music): boolean => a?.id === b.id;
/** addToQueue가 단일/배열 둘 다 받기 때문에 내부에서는 배열로 정규화 */
const normalizeToArray = (music: Music | Music[]): Music[] => (Array.isArray(music) ? music : [music]);
/** 큐에 특정 musicId가 이미 존재하는지 */
const hasMusic = (queue: Music[], musicId: string): boolean => queue.some((item) => item.id === musicId);
/**
 * 큐에 곡이 없으면 맨 뒤에 삽입.
 * playMusic에서 "재생한 곡이 큐에 없으면 맨 뒤 삽입" 규칙을 담당.
 */
const appendIfMissing = (queue: Music[], music: Music): Music[] => (hasMusic(queue, music.id) ? queue : [...queue, music]);
/** 큐에서 특정 곡 제거 */
const removeById = (queue: Music[], musicId: string): Music[] => queue.filter((item) => item.id !== musicId);
/**
 * 큐의 두 인덱스를 swap.
 * noUncheckedIndexedAccess 옵션 때문에 undefined 가능성을 가드함.
 */
const swap = (queue: Music[], from: number, to: number): Music[] => {
  const next = [...queue];
  const fromItem = next[from];
  const toItem = next[to];

  if (!fromItem || !toItem) return next;

  next[from] = toItem;
  next[to] = fromItem;
  return next;
};

/** 현재 음악의 인덱스를 탐색 */
const findCurrentIndex = (queue: Music[], current: Music | null): number => {
  if (!current) return -1;
  return queue.findIndex((item) => item.id === current.id);
};

/** queue에서 중복 노래 제거와 순서 유지 */
const dedupeQueue = (queue: Music[]): Music[] => {
  const seen = new Set<string>();
  const out: Music[] = [];
  for (const m of queue) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * usePlayerStore
 * - 컴포넌트에서 usePlayerStore((s) => s.currentMusic) 형태로 구독 가능
 * - set/get으로 상태/액션 구현
 */
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentMusic: null,
  isPlaying: false,
  queue: [],

  volume: DEFAULT_VOLUME,
  playError: null,

  setVolume: (v) => {
    set({ volume: clamp01(Number(v)) });
  },

  setPlayError: (msg) => {
    set({ playError: msg });
  },

  /**
   * 곡 선택/재생 규칙
   * 1) 같은 곡이면: 재생/일시정지 토글
   * 2) 다른 곡이면: 현재곡 교체 + 재생 상태 true + 큐에 없으면 맨 뒤 삽입
   */
  initializeQueue: (queue) => {
    // 서버에서 가져온 데이터로 큐 교체
    set({ queue: dedupeQueue(queue) });
  },

  playMusic: (music) => {
    const { currentMusic, queue } = get();

    // 새 재생 시 기존 에러 메시지 제거
    set({ playError: null });

    if (isSameMusic(currentMusic, music)) {
      get().togglePlay();
      return;
    }

    set({
      currentMusic: music,
      isPlaying: true,
      queue: appendIfMissing(queue, music),
    });
  },

  /** 재생/일시정지 UI 상태만 토글 (실제 Spotify 재생 호출은 비범위) */
  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  playPrev: () => {
    const { currentMusic, queue, isPlaying } = get();
    if (queue.length === 0) return;

    const currentIndex = findCurrentIndex(queue, currentMusic);
    // currentMusic이 큐에 없으면 "이전"은 마지막 곡으로 이동
    if (currentIndex === -1) {
      set({ currentMusic: queue[queue.length - 1] ?? null, isPlaying });
      return;
    }
    // 첫 곡이면 마지막 곡으로 순환
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    set({ currentMusic: queue[prevIndex] ?? null, isPlaying });
  },

  playNext: () => {
    const { currentMusic, queue, isPlaying } = get();
    if (queue.length === 0) return;

    const currentIndex = findCurrentIndex(queue, currentMusic);
    // currentMusic이 큐에 없으면 "다음"은 첫 곡으로 이동
    if (currentIndex === -1) {
      set({ currentMusic: queue[0] ?? null, isPlaying });
      return;
    }
    // 마지막 곡이면 처음 곡으로 순환
    const nextIndex = currentIndex >= queue.length - 1 ? 0 : currentIndex + 1;
    set({ currentMusic: queue[nextIndex] ?? null, isPlaying });
  },
  /** 큐에 음악 추가 (중복은 제거 후 뒤에 append) */
  addToQueue: (music) => {
    const items = normalizeToArray(music);

    set((state) => {
      const deduped = items.filter((item) => !hasMusic(state.queue, item.id));
      if (deduped.length === 0) return state;
      return { queue: [...state.queue, ...deduped] };
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
      const nextCurrent = state.currentMusic?.id === musicId ? (nextQueue[0] ?? null) : state.currentMusic;

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
      if (index <= 0 || index >= state.queue.length) return state;
      return { queue: swap(state.queue, index, index - 1) };
    });
  },
  /** 큐에서 아래로 이동 (swap) */
  moveDown: (index) => {
    set((state) => {
      if (index < 0 || index >= state.queue.length - 1) return state;
      return { queue: swap(state.queue, index, index + 1) };
    });
  },
  /** 큐 전체 초기화 + 현재곡/재생 상태도 초기화 */
  clearQueue: () => {
    set({
      queue: [],
      currentMusic: null,
      isPlaying: false,
      playError: null,
    });
  },
}));
