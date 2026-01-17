import { create } from 'zustand';

export const MODAL_TYPES = {
  WRITE: 'WRITE',
  LOGIN: 'LOGIN',
  POST_DETAIL: 'POST_DETAIL',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES] | null;

interface ModalState {
  modalType: ModalType;
  isOpen: boolean;
  modalProps: any;

  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalType: null,
  isOpen: false,
  modalProps: {},
  openModal: (type, props?) => set({ isOpen: true, modalType: type, modalProps: props || {} }),
  closeModal: () => set({ isOpen: false, modalType: null, modalProps: {} }),
}));
