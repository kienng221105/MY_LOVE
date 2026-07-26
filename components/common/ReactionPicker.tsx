'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

/**
 * Hook chia sẻ: chỉ duy nhất 1 picker có popover mở cùng lúc.
 * Mỗi picker gọi `open()` sẽ tự đóng popover của picker khác.
 */
function useReactionModalState(uid: string) {
  const [openUid, setOpenUid] = useState<string | null>(null);
  const open = useCallback(() => setOpenUid(uid), [uid]);
  const close = useCallback(() => {
    setOpenUid((current) => (current === uid ? null : current));
  }, [uid]);
  const closeOthers = useCallback(
    () => setOpenUid((current) => (current && current !== uid ? null : openUid)),
    [uid]
  );
  const toggle = useCallback(() => {
    setOpenUid((current) => (current === uid ? null : uid));
  }, [uid]);
  return { isOpen: openUid === uid, open, close, closeOthers, toggle, openUid, setOpenUid };
}

/** Tính vị trí popover luôn nằm trọn trong viewport */
function computePopoverPos(rect: DOMRect, popoverWidth: number): PopoverPos {
  const margin = 8;
  const desiredLeft = rect.left + rect.width / 2 - popoverWidth / 2;
  const minLeft = margin;
  const maxLeft = window.innerWidth - popoverWidth - margin;
  const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
  const flipUp = rect.top > 100;
  const top = flipUp ? rect.top - 8 : rect.bottom + 8;
  const bottom: number | 'auto' = flipUp
    ? window.innerHeight - rect.top + 8
    : 'auto';
  return { left, flipUp, top, bottom };
}

interface PopoverPos {
  left: number;
  flipUp: boolean;
  top: number;
  bottom: number | 'auto';
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
  const isClient = useIsClient();

  // Tạo uid ổn định cho mỗi entry
  const uid = useMemo(
    () => `${targetType}:${targetId}:${Math.random().toString(36).slice(2, 9)}`,
    [targetType, targetId]
  );

  const { isOpen, open, close, toggle } = useReactionModalState(uid);

  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<ReactionSummary | undefined>(summary);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; createdAt: number }[]
  >([]);
  const [hoverType, setHoverType] = useState<ReactionTypeValue | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);

  const pillRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLocal(summary);
  }, [summary]);

  /* Tính vị trí popover khi mở */
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const el = pillRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popoverWidth = Math.min(280, window.innerWidth - 32);
    setPopoverPos(computePopoverPos(rect, popoverWidth));
    /* Cập nhật lại khi resize/scroll */
    const onResize = () => setPopoverPos(computePopoverPos(el.getBoundingClientRect(), popoverWidth));
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isOpen]);

  /* Touch / click outside */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      const portalEl = document.querySelector('[data-reaction-portal-root]');
      if (portalEl?.contains(t)) return;
      if (pillRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen, close]);

  /* ESC đóng */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const handleToggle = useCallback(
    async (type: ReactionTypeValue) => {
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
          setFloatingEmojis((prev) => {
            const next = [
              ...prev,
              { id, emoji: REACTION_META[type].emoji, createdAt: Date.now() },
            ];
            return next.slice(-2);
          });
          window.setTimeout(() => {
            setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
          }, 1100);
        }
      } catch (err: any) {
        console.warn('Toggle reaction failed', err);
      } finally {
        // Dùng microtask để không block UI update
        window.setTimeout(() => setBusy(false), 0);
        close();
        setHoverType(null);
      }
    },
    [busy, targetType, targetId, me, onUpdate, close]
  );

  /* Pill click — chỉ mở popover (không auto-toggle) */
  const openPicker = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      toggle();
    },
    [toggle]
  );

  const total = local?.total ?? 0;
  const byMe = local?.byMe ?? null;
  const byPartner = local?.byPartner ?? null;
  const myEmoji = byMe ? REACTION_META[byMe].emoji : null;

  /* ====== POPOVER (qua Portal) ====== */
  const popover = isClient
    ? createPortal(
        <AnimatePresence>
          {isOpen && popoverPos && (
            <motion.div
              data-reaction-portal-root
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: 'fixed',
                left: popoverPos.left,
                top: popoverPos.flipUp ? 'auto' : popoverPos.top,
                bottom: popoverPos.flipUp ? popoverPos.bottom : 'auto',
                zIndex: 60,
              }}
              className="px-2 py-2 rounded-full bg-surface border border-primary/25 shadow-2xl flex items-end gap-1"
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
                    onTouchStart={(e) => e.stopPropagation()}
                    onMouseEnter={() => setHoverType(opt.type)}
                    onMouseLeave={() => setHoverType(null)}
                    disabled={busy}
                    animate={
                      isCoarse
                        ? false
                        : {
                            y: isHover ? -12 : 0,
                            scale: isHover ? 1.35 : 1,
                          }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 18,
                    }}
                    className={`relative flex items-center justify-center text-2xl rounded-full select-none ${
                      isCoarse ? 'w-11 h-11' : 'w-10 h-10'
                    } ${
                      isMine
                        ? 'bg-primary-container'
                        : isHover
                          ? 'bg-surface-container-high'
                          : 'hover:bg-surface-container'
                    } ${busy ? 'opacity-60' : ''}`}
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
        </AnimatePresence>,
        document.body
      )
    : null;

  /* ====== FLOATING EMOJI ====== */
  const floating = (
    <AnimatePresence>
      {floatingEmojis.map((e) => (
        <motion.span
          key={e.id}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -60,
            x: (Math.random() - 0.5) * 30,
            scale: [0.5, 1.6, 1.2, 0.9],
            rotate: (Math.random() - 0.5) * 50,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none text-2xl"
          style={{ zIndex: 70 }}
        >
          {e.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );

  /* ====== ICON VARIANT ====== */
  if (variant === 'icon') {
    return (
      <div className="relative inline-flex items-center justify-center">
        {floating}
        <button
          ref={pillRef}
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
          } ${isOpen ? 'ring-2 ring-primary/40' : ''}`}
        >
          <span className="text-xl leading-none pointer-events-none">
            {myEmoji ?? '⭐'}
          </span>
        </button>
        {popover}
      </div>
    );
  }

  /* ====== FULL VARIANT ====== */
  if (variant === 'full') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {floating}
        {REACTION_OPTIONS.map((opt) => {
          const g = local?.grouped[opt.type];
          const t = g?.total ?? 0;
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
              <span>{t || ''}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ====== FB VARIANT (default) ====== */
  return (
    <div className="relative inline-flex flex-col items-start gap-1.5">
      <div className="relative">
        {floating}
        <button
          ref={pillRef}
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
          } ${isOpen ? 'ring-2 ring-primary/40' : ''}`}
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

      {popover}
    </div>
  );
}