'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  REACTION_META,
  ReactionSummary,
  ReactionTypeValue,
  ReactionUser,
} from '@/types/reaction';

interface ReactionsViewerProps {
  summary: ReactionSummary | undefined;
  compact?: boolean;
  /** Stack mini pill (FB-style) */
  fpStyle?: boolean;
}

function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse)');
    setIsCoarse(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isCoarse;
}

export function ReactionsViewer({
  summary,
  compact = true,
  fpStyle = true,
}: ReactionsViewerProps) {
  const [showList, setShowList] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    left: number;
    top: number;
    flipUp: boolean;
  } | null>(null);

  const isCoarse = useIsCoarsePointer();

  /* Tính toán vị trí popover khi mở — fixed positioning */
  useEffect(() => {
    if (!showList) return;
    const btn = document.querySelector(
      '[data-reactions-pill-active="true"]'
    ) as HTMLElement | null;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const popoverWidth = Math.min(280, window.innerWidth - 32);
    const margin = 8;
    const desiredLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    const minLeft = margin;
    const maxLeft = window.innerWidth - popoverWidth - margin;
    const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
    const flipUp = rect.top > 220;
    const top = flipUp ? rect.top - 8 : rect.bottom + 8;
    setPopoverPos({ left, top, flipUp });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [showList]);

  /* Click-outside / touch-outside đóng */
  useEffect(() => {
    if (!showList) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-reactions-pill-root]')) {
        setShowList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showList]);

  /* ESC đóng */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowList(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!summary || summary.total === 0) return null;

  const activeTypes = (Object.keys(summary.grouped) as ReactionTypeValue[])
    .filter((t) => summary.grouped[t].total > 0)
    .sort((a, b) => summary.grouped[b].total - summary.grouped[a].total);

  if (activeTypes.length === 0) return null;

  if (compact && fpStyle) {
    return (
      <div className="relative inline-flex" data-reactions-pill-root>
        <motion.button
          data-reactions-pill-active="true"
          onClick={(e) => {
            e.stopPropagation();
            setShowList((v) => !v);
          }}
          onTouchStart={(e) => {
            /* ngắt ghost click trên mobile */
            e.stopPropagation();
          }}
          whileTap={{ scale: 0.95 }}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            WebkitTouchCallout: 'none',
          }}
          className={`inline-flex items-center gap-1 select-none rounded-full bg-surface-container border border-primary/20 shadow-sm hover:shadow-md transition-all ${
            isCoarse ? 'min-h-[36px] px-3 py-1.5' : 'px-2 py-0.5'
          }`}
          aria-label="Xem ai đã thả cảm xúc"
        >
          <span className="flex -space-x-1">
            {activeTypes.slice(0, 3).map((t) => (
              <span
                key={t}
                className={`inline-flex items-center justify-center rounded-full bg-surface-container-lowest border border-white text-[11px] leading-none ${
                  isCoarse ? 'w-6 h-6' : 'w-5 h-5'
                }`}
              >
                {REACTION_META[t].emoji}
              </span>
            ))}
          </span>
          <span
            className={`font-heading font-bold pl-0.5 ${
              isCoarse ? 'text-sm text-on-surface' : 'text-[11px] text-on-surface'
            }`}
          >
            {summary.total}
          </span>
        </motion.button>

        <AnimatePresence>
          {showList && popoverPos && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: popoverPos.left,
                top: popoverPos.top,
                transform: popoverPos.flipUp
                  ? 'translateY(-100%)'
                  : undefined,
                maxWidth: `calc(100vw - 16px)`,
              }}
              className="z-40 min-w-[220px] p-3 rounded-2xl bg-surface border border-primary/20 shadow-2xl space-y-2"
            >
              <div className="text-[10px] font-quicksand font-bold text-outline uppercase tracking-wider">
                Cảm xúc về mục này
              </div>
              {activeTypes.map((t) => {
                const group = summary.grouped[t];
                return (
                  <div
                    key={t}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-surface-container-low"
                  >
                    <span className="text-xl leading-none">
                      {REACTION_META[t].emoji}
                    </span>
                    <div className="flex-1 flex flex-wrap items-center gap-1.5">
                      {group.users.map((u) => (
                        <UserChip key={u.id + t} user={u} />
                      ))}
                    </div>
                    <span className="font-heading font-bold text-xs text-on-surface">
                      {group.total}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeTypes.map((t) => {
        const group = summary.grouped[t];
        return (
          <div
            key={t}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low border border-primary/20"
          >
            <span className="text-base leading-none">{REACTION_META[t].emoji}</span>
            {group.users.map((u) => (
              <UserChip key={u.id + t} user={u} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function UserChip({ user }: { user: ReactionUser }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold border border-white shadow-sm ${
        user.color === 'blue'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-pink-100 text-pink-600'
      }`}
      title={user.name}
    >
      {user.short}
    </span>
  );
}