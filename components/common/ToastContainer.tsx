'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';

export function ToastContainer() {
  const { notifications, removeToast } = useNotificationStore();

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="pointer-events-auto glass-panel p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-primary/30 bg-surface/95"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">
                {n.type === 'error' ? 'error' : 'favorite'}
              </span>
              <p className="font-heading font-bold text-xs sm:text-sm text-on-surface">
                {n.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(n.id)}
              className="text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
