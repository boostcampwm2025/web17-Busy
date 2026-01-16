import { create } from 'zustand';
import type { Music, Post } from '@/types';

export const MODAL_TYPES = {
  WRITE: 'WRITE',
  LOGIN: 'LOGIN',
  POST_DETAIL: 'POST_DETAIL',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES] | null;

export type ModalProps =
  | { type: typeof MODAL_TYPES.WRITE; initialMusic?: Music }
  | { type: typeof MODAL_TYPES.LOGIN; authError?: string }
  | { type: typeof MODAL_TYPES.POST_DETAIL; post?: Post; postId?: string };

interface ModalState {
  modalType: ModalType;
  isOpen: boolean;
  modalProps: ModalProps | null;

  openModal: (props: ModalProps) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalType: null,
  isOpen: false,
  modalProps: null,

  openModal: (props) =>
    set({
      isOpen: true,
      modalType: props.type,
      modalProps: props,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      modalType: null,
      modalProps: null,
    }),
}));
