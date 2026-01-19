import { MusicResponseDto } from '@repo/dto';
import { create } from 'zustand';

/**
 * 전역 플레이어 상태(State)
 * - currentMusic: 현재 선택/재생 대상
 * - isPlaying: 재생/일시정지 UI 상태
 * - queue: 재생 큐(순서 유지)
 */
interface PlayerState {
  currentMusic: MusicResponseDto | null;
  isPlaying: boolean;
  queue: MusicResponseDto[];
}

/**
 * 전역 플레이어 액션(Action)
 * - playMusic: 곡 선택(같은 곡이면 토글, 다른 곡이면 교체 + 큐에 없으면 맨 앞 삽입)
 * - add/remove/reorder/clear: 큐 편집
 */
interface PlayerActions {
  playMusic: (music: MusicResponseDto) => void;
  togglePlay: () => void;

  playPrev: () => void;
  playNext: () => void;

  addToQueue: (music: MusicResponseDto | MusicResponseDto[]) => void;
  removeFromQueue: (musicId: string) => void;

  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  clearQueue: () => void;
  initializeQueue: (queue: MusicResponseDto[]) => void;
}

type PlayerStore = PlayerState & PlayerActions;

/** 현재 곡과 대상 곡이 같은지 판별 (musicId 기준) */
const isSameMusic = (a: MusicResponseDto | null, b: MusicResponseDto): boolean => a?.id === b.id;

/** addToQueue가 단일/배열 둘 다 받기 때문에 내부에서는 배열로 정규화 */
const normalizeToArray = (music: MusicResponseDto | MusicResponseDto[]): MusicResponseDto[] => (Array.isArray(music) ? music : [music]);

/** 큐에 특정 musicId가 이미 존재하는지 */
const hasMusic = (queue: MusicResponseDto[], musicId: string): boolean => queue.some((item) => item.id === musicId);

/**
 * 큐에 곡이 없으면 맨 뒤에 삽입.
 * playMusic에서 "재생한 곡이 큐에 없으면 맨 뒤 삽입" 규칙을 담당.
 */
const appendIfMissing = (queue: MusicResponseDto[], music: MusicResponseDto): MusicResponseDto[] =>
  hasMusic(queue, music.id) ? queue : [...queue, music];

/** 큐에서 특정 곡 제거 */
const removeById = (queue: MusicResponseDto[], musicId: string): MusicResponseDto[] => queue.filter((item) => item.id !== musicId);

/**
 * 큐의 두 인덱스를 swap.
 * noUncheckedIndexedAccess 옵션 때문에 undefined 가능성을 가드함.
 */
const swap = (queue: MusicResponseDto[], from: number, to: number): MusicResponseDto[] => {
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

const ensureCurrentInQueue = (queue: MusicResponseDto[], current: MusicResponseDto | null): MusicResponseDto[] => {
  if (!current) {
    return queue;
  }
  return appendIfMissing(queue, current);
};

const findCurrentIndex = (queue: MusicResponseDto[], current: MusicResponseDto | null): number => {
  if (!current) {
    return -1;
  }
  return queue.findIndex((item) => item.id === current.id);
};

// 서버에 중복이 남아있거나, 과거 데이터가 중복이면 FE에서도 한 번 정리해주는 작업 필요
const dedupeQueue = (queue: Music[]): Music[] => {
  const seen = new Set<string>();
  const out: Music[] = [];
  for (const m of queue) {
    if (seen.has(m.musicId)) continue;
    seen.add(m.musicId);
    out.push(m);
  }
  return out;
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
   * 2) 다른 곡이면: 현재곡 교체 + 재생 상태 true + 큐에 없으면 맨 뒤 삽입
   */

  initializeQueue: (queue: MusicResponseDto[]) => {
    // 서버에서 가져온 데이터로 큐 교체
    set({ queue: dedupeQueue(queue) });
  },

  playMusic: (music) => {
    const { currentMusic, queue } = get();

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

    if (queue.length === 0) {
      return;
    }

    const currentIndex = findCurrentIndex(queue, currentMusic);

    // currentMusic이 큐에 없으면 "이전"은 마지막 곡으로 이동
    if (currentIndex === -1) {
      set({
        currentMusic: queue[queue.length - 1] ?? null,
        isPlaying,
      });
      return;
    }

    // 첫 곡이면 마지막 곡으로 순환
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;

    set({
      currentMusic: queue[prevIndex] ?? null,
      isPlaying,
    });
  },

  playNext: () => {
    const { currentMusic, queue, isPlaying } = get();

    if (queue.length === 0) {
      return;
    }

    const currentIndex = findCurrentIndex(queue, currentMusic);

    // currentMusic이 큐에 없으면 "다음"은 첫 곡으로 이동
    if (currentIndex === -1) {
      set({
        currentMusic: queue[0] ?? null,
        isPlaying,
      });
      return;
    }

    // 마지막 곡이면 처음 곡으로 순환
    const nextIndex = currentIndex >= queue.length - 1 ? 0 : currentIndex + 1;

    set({
      currentMusic: queue[nextIndex] ?? null,
      isPlaying,
    });
  },

  /** 큐에 음악 추가 (중복은 제거 후 뒤에 append) */
  addToQueue: (music) => {
    const items = normalizeToArray(music);

    set((state) => {
      const deduped = items.filter((item) => !hasMusic(state.queue, item.id));
      if (deduped.length === 0) {
        return state;
      }
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
