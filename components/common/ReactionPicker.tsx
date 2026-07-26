'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  REACTION_OPTIONS,
  REACTION_META,
  ReactionTypeValue,
  ReactionSummary,
  ReactionTargetValue,
} from '@/types/reaction';
import { ReactionsService } from '@/services/reactions.service';
import { ReactionBy } from '@/hooks/useReactionContext';
import { ReactionsViewer } from '@/components/common/ReactionsViewer';

interface ReactionPickerProps {
  targetType: ReactionTargetValue;
  targetId: string;
  me: ReactionBy;
  summary: ReactionSummary | undefined;
  onUpdate?: (next: ReactionSummary) => void;
  /**
   * Variant:
   * - 'fb':   Pill button (FB-style) + emoji bay + viewer — dùng chính
   * - 'icon': nút tròn emoji lớn (action bar trên card)
   * - 'full': thanh 5 emoji ngang hàng
   */
  variant?: 'fb' | 'icon' | 'full';
  showViewer?: boolean;
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

/** Cấm bôi đen text khi giữ phần tử (tránh giữ text bị select khi bấm reaction) */
function preventSelection(el: HTMLElement | null) {
  if (!el) return;
  const s = el.style as CSSStyleDeclaration & {
    webkitTouchCallout?: string;
  };
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.webkitTouchCallout = 'none';
  s.touchAction = 'manipulation';
}

interface PopoverPos {
  left: number;
  bottom: number;
  /** Có nên flip lên trên hay không (true = hiện phía trên trigger) */
  flipUp: boolean;
}

export function ReactionPicker({
  targetType,
  targetId,
  me,
  summary,
  onUpdate,
  variant = 'fb',
  showViewer = true,
}: ReactionPickerProps) {
  const isCoarse = useIsCoarsePointer();

  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<ReactionSummary | undefined>(summary);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; createdAt: number }[]
  >([]);
  const [hoverType, setHoverType] = useState<ReactionTypeValue | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  /* Hover trên desktop */
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(summary);
  }, [summary]);

  /* Tính toán vị trí popover khi mở — luôn nằm trong viewport */
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const popoverWidth = 280; // ước tính (sẽ clamp theo viewport)
    const margin = 8;
    const desiredLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    const minLeft = margin;
    const maxLeft = window.innerWidth - popoverWidth - margin;
    const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
    const flipUp = rect.top > 100; // nếu đủ chỗ phía trên thì hiện phía trên
    const bottom = window.innerHeight - rect.top + margin;
    setPopoverPos({ left, bottom, flipUp });
  }, [isOpen]);

  /* Cleanup khi unmount */
  useEffect(() => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector('button');
    if (btn) preventSelection(btn);
    return () => {
      if (btn) {
        const s = btn.style as CSSStyleDeclaration & {
          webkitTouchCallout?: string;
        };
        s.userSelect = '';
        s.webkitUserSelect = '';
        s.webkitTouchCallout = '';
        s.touchAction = '';
      }
    };
  }, []);

  /* Click-outside / touch-outside đóng */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  /* ESC đóng */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleToggle = async (type: ReactionTypeValue) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await ReactionsService.toggle({
        type,
        targetType,
        targetId,
        reactionBy: me,
      });
      setLocal(res.summary);
      onUpdate?.(res.summary);
      if (res.action !== 'removed') {
        // Chỉ hiện 1 floating emoji gần nhất trên mobile (giảm render)
        const id = `${Date.now()}-${Math.random()}`;
        setFloatingEmojis((prev) => {
          const next = [
            ...prev,
            { id, emoji: REACTION_META[type].emoji, createdAt: Date.now() },
          ];
          return next.slice(-2); // tối đa 2 cái cùng lúc
        });
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
        }, 1100);
      }
    } catch (err: any) {
      console.warn('Toggle reaction failed', err);
    } finally {
      // Tắt busy nhanh để tương tác kế tiếp không bị khóa
      setTimeout(() => setBusy(false), 0);
      setIsOpen(false);
      setHoverType(null);
    }
  };

  /* Tap chỉ mở popover — không auto-toggle */
  const openPicker = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsOpen(true);
    },
    []
  );

  /* DESKTOP hover-to-open */
  const handleMouseEnter = useCallback(() => {
    if (isCoarse) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = window.setTimeout(() => setIsOpen(true), 80);
  }, [isCoarse]);

  const handleMouseLeave = useCallback(() => {
    if (isCoarse) return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setHoverType(null);
    }, 280);
  }, [isCoarse]);

  const total = local?.total ?? 0;
  const byMe = local?.byMe ?? null;
  const byPartner = local?.byPartner ?? null;
  const myEmoji = byMe ? REACTION_META[byMe].emoji : null;

  /* ====== PICKER POPOVER (fixed positioning) ====== */
  const picker = (
    <AnimatePresence>
      {isOpen && popoverPos && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.85 }}
          transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: popoverPos.left,
            bottom: popoverPos.flipUp
              ? popoverPos.bottom
              : undefined,
            top: popoverPos.flipUp ? undefined : 8,
          }}
          className="z-40 px-2 py-2 rounded-full bg-surface border border-primary/25 shadow-2xl flex items-end gap-1"
        >
          {REACTION_OPTIONS.map((opt) => {
            const isMine = byMe === opt.type;
            const isHover = hoverType === opt.type;
            return (
              <motion.button
                key={opt.type}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggle(opt.type);
                }}
                onTouchStart={(e) => {
                  /* Giữ trên touch — KHÔNG toggle, chỉ ngắt trigger click tiếp theo */
                  e.stopPropagation();
                }}
                onMouseEnter={() => setHoverType(opt.type)}
                onMouseLeave={() => setHoverType(null)}
                disabled={busy}
                /* Mobile: bỏ animate theo hover để tránh layout shift/lag */
                animate={isCoarse ? false : {
                  y: isHover ? -12 : 0,
                  scale: isHover ? 1.35 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className={`relative flex items-center justify-center text-2xl rounded-full select-none ${
                  isCoarse ? 'w-11 h-11' : 'w-10 h-10'
                } ${
                  isMine
                    ? 'bg-primary-container'
                    : isHover
                      ? 'bg-surface-container-high'
                      : 'hover:bg-surface-container'
                }`}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  WebkitTouchCallout: 'none',
                }}
                title={opt.label}
                aria-label={opt.label}
              >
                {opt.emoji}
                {isHover && !isCoarse && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-on-surface text-surface text-[10px] font-quicksand font-bold shadow pointer-events-none"
                  >
                    {opt.label}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ====== FLOATING EMOJIS ====== */
  const floating = (
    <AnimatePresence>
      {floatingEmojis.map((e) => (
        <motion.span
          key={e.id}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -80,
            x: (Math.random() - 0.5) * 50,
            scale: [0.5, 1.6, 1.2, 0.9],
            rotate: (Math.random() - 0.5) * 50,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none text-2xl"
          style={{ zIndex: 50 }}
        >
          {e.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );

  /* ====== ICON VARIANT ====== */
  if (variant === 'icon') {
    return (
      <div
        ref={containerRef}
        className="relative inline-flex items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {floating}
        <button
          onClick={openPicker}
          disabled={busy}
          aria-label="Thả cảm xúc"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            WebkitTouchCallout: 'none',
          }}
          className={`flex items-center justify-center ${
            isCoarse ? 'w-11 h-11' : 'w-10 h-10'
          } rounded-full transition-all active:scale-90 disabled:opacity-50 ${
            byMe
              ? 'bg-primary text-on-primary shadow-md'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="text-xl leading-none pointer-events-none">
            {myEmoji ?? '⭐'}
          </span>
        </button>
        {picker}
      </div>
    );
  }

  /* ====== FULL VARIANT ====== */
  if (variant === 'full') {
    return (
      <div ref={containerRef} className="flex flex-wrap items-center gap-2">
        {floating}
        {REACTION_OPTIONS.map((opt) => {
          const g = local?.grouped[opt.type];
          const total = g?.total ?? 0;
          const mine = g?.mine ?? false;
          const partner = g?.partner ?? false;
          return (
            <button
              key={opt.type}
              onClick={() => handleToggle(opt.type)}
              disabled={busy}
              title={opt.label}
              aria-label={opt.label}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
              }}
              className={`relative flex items-center gap-1.5 ${
                isCoarse
                  ? 'min-w-[44px] min-h-[44px] px-4 py-2.5'
                  : 'px-3 py-1.5'
              } rounded-full text-xs font-heading font-bold transition-all border select-none ${
                mine
                  ? 'bg-primary text-on-primary border-primary shadow-md scale-105'
                  : partner
                    ? 'bg-primary-container text-on-primary-container border-primary/40'
                    : 'bg-surface-container/60 text-on-surface-variant border-primary/10 hover:bg-primary-container/30'
              } disabled:opacity-60`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span>{total || ''}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ====== FB VARIANT (default) ====== */
  return (
    <div
      ref={containerRef}
      className="relative inline-flex flex-col items-start gap-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {floating}
        <button
          onClick={openPicker}
          disabled={busy}
          aria-label="Thả cảm xúc"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            WebkitTouchCallout: 'none',
          }}
          className={`relative flex items-center gap-1.5 ${
            isCoarse
              ? 'min-h-[44px] px-4 py-2 text-sm'
              : 'px-3.5 py-1.5 text-xs'
          } rounded-full font-heading font-bold border transition-all active:scale-95 disabled:opacity-50 select-none ${
            byMe
              ? 'bg-primary text-on-primary border-primary shadow-md'
              : byPartner
                ? 'bg-primary-container text-on-primary-container border-primary/40'
                : 'bg-surface-container-low text-on-surface-variant border-primary/10 hover:bg-surface-container'
          }`}
        >
          <motion.span
            key={myEmoji || 'empty'}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
            className="text-base leading-none pointer-events-none"
          >
            {myEmoji ?? '😶'}
          </motion.span>
          <span className="whitespace-nowrap pointer-events-none">
            {byMe
              ? REACTION_META[byMe].label.split(' ')[0]
              : 'Cảm xúc'}
          </span>
        </button>
      </div>

      {showViewer && (
        <div className="flex flex-wrap items-center gap-1">
          <ReactionsViewer summary={local} compact />
          {isCoarse && local && local.total > 0 && (
            <span className="text-[10px] font-quicksand font-bold text-outline">
              {total} lượt
            </span>
          )}
        </div>
      )}

      {picker}
    </div>
  );
}