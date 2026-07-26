'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  IDENTITIES,
  IdentityId,
  useIdentityStore,
} from '@/store/useIdentityStore';

interface IdentitySwitcherProps {
  variant?: 'box' | 'compact';
}

export function IdentitySwitcher({ variant = 'box' }: IdentitySwitcherProps) {
  const { identity, setIdentity } = useIdentityStore();
  const [showHint, setShowHint] = useState(false);

  if (variant === 'compact') {
    return (
      <button
        onClick={() => {
          setIdentity(identity === 'Kien' ? 'Love' : 'Kien');
          setShowHint(true);
          setTimeout(() => setShowHint(false), 1500);
        }}
        title={`Đang là ${IDENTITIES[identity].displayName} — bấm để chuyển`}
        className="relative flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface-container hover:bg-primary-container transition-colors"
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
            identity === 'Kien'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-pink-100 text-pink-600'
          }`}
        >
          {IDENTITIES[identity].shortLabel}
        </span>
        <span className="font-heading font-bold text-xs">
          {IDENTITIES[identity].displayName}
        </span>
        <AnimatePresence>
          {showHint && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1 right-0 px-2 py-1 rounded-md bg-on-surface text-surface text-[10px] font-quicksand font-medium whitespace-nowrap shadow"
            >
              Đã chuyển sang {IDENTITIES[identity === 'Kien' ? 'Love' : 'Kien'].displayName}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // box variant (cho trang chủ)
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 sm:p-6 rounded-3xl border border-primary/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-sm sm:text-base text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">badge</span>
            Mình là: <span className="text-base sm:text-lg">{IDENTITIES[identity].displayName}</span>
          </h3>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium mt-1">
            Hệ thống sẽ tự động phân quyền: người gửi thư, người viết nhật ký và ai đã thả cảm xúc.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-full bg-surface-container-low/70 border border-primary/15">
          {(['Kien', 'Love'] as IdentityId[]).map((id) => {
            const info = IDENTITIES[id];
            const active = identity === id;
            return (
              <button
                key={id}
                onClick={() => setIdentity(id)}
                className={`relative px-4 py-2 rounded-full font-heading font-bold text-xs flex items-center gap-1.5 transition-all ${
                  active
                    ? info.color === 'blue'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-pink-500 text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-extrabold">
                  {info.shortLabel}
                </span>
                <span>{info.displayName}</span>
                {active && (
                  <motion.span
                    layoutId="identity-active"
                    className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-surface ring-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}