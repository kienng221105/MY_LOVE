import { create } from 'zustand';

interface DialogStore {
  isUploadModalOpen: boolean;
  isCreateMemoryOpen: boolean;
  isWriteLetterOpen: boolean;
  isCreateDiaryOpen: boolean;
  isChangePasswordOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openCreateMemory: () => void;
  closeCreateMemory: () => void;
  openWriteLetter: () => void;
  closeWriteLetter: () => void;
  openCreateDiary: () => void;
  closeCreateDiary: () => void;
  openChangePassword: () => void;
  closeChangePassword: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  isUploadModalOpen: false,
  isCreateMemoryOpen: false,
  isWriteLetterOpen: false,
  isCreateDiaryOpen: false,
  isChangePasswordOpen: false,
  openUploadModal: () => set({ isUploadModalOpen: true }),
  closeUploadModal: () => set({ isUploadModalOpen: false }),
  openCreateMemory: () => set({ isCreateMemoryOpen: true }),
  closeCreateMemory: () => set({ isCreateMemoryOpen: false }),
  openWriteLetter: () => set({ isWriteLetterOpen: true }),
  closeWriteLetter: () => set({ isWriteLetterOpen: false }),
  openCreateDiary: () => set({ isCreateDiaryOpen: true }),
  closeCreateDiary: () => set({ isCreateDiaryOpen: false }),
  openChangePassword: () => set({ isChangePasswordOpen: true }),
  closeChangePassword: () => set({ isChangePasswordOpen: false }),
}));
