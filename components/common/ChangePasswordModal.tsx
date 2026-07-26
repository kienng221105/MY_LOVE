'use client';

import { useState } from 'react';
import { useDialogStore } from '@/store/useDialogStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';

export function ChangePasswordModal() {
  const { isChangePasswordOpen, closeChangePassword } = useDialogStore();
  const { setMagicPhrase, magicPhrase } = useAuthStore();
  const { showToast } = useNotificationStore();

  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  if (!isChangePasswordOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) {
      showToast('Vui lòng nhập mật mã mới! 🥺', 'error');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      showToast('Mật mã xác nhận không trùng khớp! 🥺', 'error');
      return;
    }

    await setMagicPhrase(newPasscode);
    showToast('Đã đổi mật mã bí mật thành công! 💖');
    setNewPasscode('');
    setConfirmPasscode('');
    closeChangePassword();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl relative"
        >
          <button
            onClick={closeChangePassword}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <h3 className="font-heading font-extrabold text-xl text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">key</span>
            Đổi mật mã bí mật 🔒
          </h3>
          <p className="font-quicksand text-xs text-on-surface-variant mb-6 font-semibold">
            Thay đổi mật mã mở cánh cửa tình yêu của hai đứa.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                Mật mã mới
              </label>
              <input
                type="password"
                required
                placeholder="Nhập mật mã mới..."
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
              />
            </div>

            <div>
              <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                Xác nhận mật mã mới
              </label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật mã mới..."
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeChangePassword}
                className="px-5 py-2.5 rounded-full font-heading font-bold text-xs text-on-surface-variant hover:bg-surface-container"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
              >
                Cập nhật mật mã
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
