import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: {
    title: 'Xác nhận',
    confirmLabel: 'Xác nhận',
    cancelLabel: 'Hủy',
    variant: 'info',
  },
  resolve: null,

  confirm: (options) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        options: {
          confirmLabel: 'Xác nhận',
          cancelLabel: 'Hủy',
          variant: 'info',
          ...options,
        },
        resolve,
      });
    });
  },

  onConfirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, resolve: null });
  },

  onCancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, resolve: null });
  },
}));

export const useConfirm = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  return { confirm };
};
