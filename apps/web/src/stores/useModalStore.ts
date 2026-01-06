import { create } from 'zustand';

export const MODAL_TYPES = {
  WRITE: 'WRITE',
  LOGIN: 'LOGIN',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES] | null;

interface ModalState {
  modalType: ModalType;
  isOpen: boolean;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalType: null,
  isOpen: false,
  openModal: (type) => set({ isOpen: true, modalType: type }),
  closeModal: () => set({ isOpen: false, modalType: null }),
}));
