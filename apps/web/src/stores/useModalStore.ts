import { create } from 'zustand';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

export const MODAL_TYPES = {
  WRITE: 'WRITE',
  LOGIN: 'LOGIN',
  POST_DETAIL: 'POST_DETAIL',
  FOLLOWER_USER: 'FOLLOWER_USER',
  FOLLOWING_USER: 'FOLLOWING_USER',
  PLAYLIST_DETAIL: 'PLAYLIST_DETAIL',
  PLAYLIST_PICKER: 'PLAYLIST_PICKER',
  PRIVACY_CONCENT: 'PRIVACY_CONCENT',
} as const;

type NoProps = Record<string, never>;

/** 모달마다 받는 props가 달라, 여는 쪽과 읽는 쪽이 같은 키를 쓰는지 컴파일러가 확인할 수 있게 한다. */
export type ModalPropsMap = {
  [MODAL_TYPES.WRITE]: { initialMusics?: Music[] };
  [MODAL_TYPES.LOGIN]: { authError?: string };
  [MODAL_TYPES.POST_DETAIL]: {
    postId: string;
    post?: Post;
    initialIsEditing?: boolean;
    initialEditingContent?: string;
  };
  [MODAL_TYPES.FOLLOWER_USER]: { profileUserId: string };
  [MODAL_TYPES.FOLLOWING_USER]: { profileUserId: string };
  [MODAL_TYPES.PLAYLIST_DETAIL]: { playlistId: string };
  [MODAL_TYPES.PLAYLIST_PICKER]: { musics: Music[] };
  [MODAL_TYPES.PRIVACY_CONCENT]: NoProps;
};

export type ModalType = keyof ModalPropsMap;

interface ModalState {
  modalType: ModalType | null;
  isOpen: boolean;
  modalProps: Partial<ModalPropsMap[ModalType]>;

  openModal: <T extends ModalType>(type: T, props?: ModalPropsMap[T]) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalType: null,
  isOpen: false,
  modalProps: {},
  openModal: (type, props) => set({ isOpen: true, modalType: type, modalProps: props ?? {} }),
  closeModal: () => set({ isOpen: false, modalType: null, modalProps: {} }),
}));

/**
 * 스토어의 modalProps는 모든 모달의 합집합이라 그대로는 좁혀지지 않는다.
 * 열려 있는 모달이 인자로 받은 타입일 때만 해당 props를 돌려준다.
 */
export const useModalProps = <T extends ModalType>(type: T): ModalPropsMap[T] | undefined =>
  useModalStore((s) => (s.modalType === type ? (s.modalProps as ModalPropsMap[T]) : undefined));
