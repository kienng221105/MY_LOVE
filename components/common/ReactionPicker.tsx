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

/** Detect thiết bị có touch primary + check pointer coarse (mobile/tablet) */
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  /* Hover trên desktop với delay ngắn (FB-like) */
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  /* Long-press cho mobile */
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  /* Swipe-to-select (mobile nâng cao) */
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(summary);
  }, [summary]);

  /* Click-outside to close */
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

  /* ESC đóng + cleanup timers */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
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
        const id = `${Date.now()}-${Math.random()}`;
        setFloatingEmojis((prev) => [
          ...prev,
          { id, emoji: REACTION_META[type].emoji, createdAt: Date.now() },
        ]);
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
        }, 1400);
      }
    } catch (err: any) {
      console.warn('Toggle reaction failed', err);
    } finally {
      setBusy(false);
      setIsOpen(false);
      setHoverType(null);
    }
  };

  /* ====== DESKTOP: hover-to-open ====== */
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

  /* ====== MOBILE: long-press + tap-to-toggle ====== */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      longPressTriggeredRef.current = false;
      touchStartXRef.current = e.touches[0].clientX;
      // 350ms = ngưỡng long-press chuẩn
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        setIsOpen(true);
      }, 350);
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      // Nếu đã trigger long-press → không làm gì (popover đã mở)
      if (longPressTriggeredRef.current) {
        e.preventDefault();
        return;
      }
      // Tap ngắn → toggle HEART (giống FB quick-react)
      e.preventDefault();
      if (!isOpen) handleToggle('HEART');
    },
    [handleToggle, isOpen]
  );

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const total = local?.total ?? 0;
  const byMe = local?.byMe ?? null;
  const byPartner = local?.byPartner ?? null;
  const myEmoji = byMe ? REACTION_META[byMe].emoji : null;

  /* ====== PICKER POPOVER ====== */
  /* Tính toán hướng hiển thị: nếu sắp tràn mép phải thì mở bên trái */
  const [popoverSide, setPopoverSide] = useState<'top' | 'top-left'>('top');
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Nếu container ở góc phải của viewport (< 240px) thì canh trái
    if (rect.left < 200) setPopoverSide('top-left');
    else setPopoverSide('top');
  }, [isOpen]);

  const picker = (
    <AnimatePresence>
      {isOpen && (
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
          className={`absolute z-40 bottom-full mb-2 ${
            popoverSide === 'top-left' ? 'left-0' : 'left-1/2 -translate-x-1/2'
          } px-2 py-2 rounded-full bg-surface border border-primary/25 shadow-2xl flex items-end gap-1`}
          /* Ngăn click popover lan ra ngoài */
          onClick={(e) => e.stopPropagation()}
        >
          {REACTION_OPTIONS.map((opt, idx) => {
            const isMine = byMe === opt.type;
            const isHover = hoverType === opt.type;
            return (
              <motion.button
                key={opt.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(opt.type);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoverType(opt.type)}
                onMouseLeave={() => setHoverType(null)}
                disabled={busy}
                animate={{
                  y: isHover ? -12 : 0,
                  scale: isHover ? 1.35 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className={`relative flex items-center justify-center text-2xl ${
                  isCoarse ? 'w-11 h-11' : 'w-10 h-10'
                } rounded-full ${
                  isMine
                    ? 'bg-primary-container'
                    : isHover
                      ? 'bg-surface-container-high'
                      : 'hover:bg-surface-container'
                }`}
                title={opt.label}
                aria-label={opt.label}
              >
                {opt.emoji}
                {/* Label phía dưới: chỉ hiện trên desktop hover, mobile thì tự show tooltip on tap */}
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

  /* ====== FLOATING EMOJIS (pop nhảy khi thả) ====== */
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {floating}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isCoarse) {
              handleToggle('HEART');
              return;
            }
            setIsOpen((v) => !v);
          }}
          disabled={busy}
          aria-label="Thả cảm xúc"
          className={`flex items-center justify-center ${
            isCoarse ? 'w-11 h-11' : 'w-10 h-10'
          } rounded-full transition-all active:scale-90 disabled:opacity-50 ${
            byMe
              ? 'bg-primary text-on-primary shadow-md'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="text-xl leading-none">{myEmoji ?? '⭐'}</span>
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
              className={`relative flex items-center gap-1.5 ${
                isCoarse ? 'min-w-[44px] min-h-[44px] px-4 py-2.5' : 'px-3 py-1.5'
              } rounded-full text-xs font-heading font-bold transition-all border ${
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {floating}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isCoarse) {
              handleToggle('HEART');
              return;
            }
            handleToggle(byMe || 'HEART');
          }}
          disabled={busy}
          aria-label="Thả cảm xúc"
          className={`relative flex items-center gap-1.5 ${
            isCoarse ? 'min-h-[44px] px-4 py-2 text-sm' : 'px-3.5 py-1.5 text-xs'
          } rounded-full font-heading font-bold border transition-all active:scale-95 disabled:opacity-50 ${
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
            className="text-base leading-none"
          >
            {myEmoji ?? '😶'}
          </motion.span>
          <span className="whitespace-nowrap">
            {byMe ? REACTION_META[byMe].label.split(' ')[0] : 'Cảm xúc'}
          </span>
        </button>
        {picker}
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
    </div>
  );
}