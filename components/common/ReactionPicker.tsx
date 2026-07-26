'use client';

import { useState, useRef, useEffect } from 'react';
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
   * - 'fb':  Pill button nhỏ + emoji bay khi thả (giống Facebook) + viewer
   * - 'icon': nút tròn emoji lớn (dùng cho action bar trên card)
   * - 'full': thanh 5 emoji ngang hàng (compact layout)
   */
  variant?: 'fb' | 'icon' | 'full';
  showViewer?: boolean;
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
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<ReactionSummary | undefined>(summary);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; createdAt: number }[]
  >([]);
  const [hoverType, setHoverType] = useState<ReactionTypeValue | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(summary);
  }, [summary]);

  /* Click-outside để đóng */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    return () => {
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

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = window.setTimeout(() => setIsOpen(true), 80);
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setHoverType(null);
    }, 280);
  };

  const total = local?.total ?? 0;
  const byMe = local?.byMe ?? null;
  const byPartner = local?.byPartner ?? null;
  const myEmoji = byMe ? REACTION_META[byMe].emoji : null;

  /* ===== Picker popover (FB-style: emoji trượt lên + label) ===== */
  const picker = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
          className="absolute z-30 bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-2 rounded-full bg-surface border border-primary/20 shadow-2xl flex items-end gap-1"
        >
          {REACTION_OPTIONS.map((opt) => {
            const isMine = byMe === opt.type;
            const isHover = hoverType === opt.type;
            return (
              <motion.button
                key={opt.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(opt.type);
                }}
                onMouseEnter={() => setHoverType(opt.type)}
                onMouseLeave={() => setHoverType(null)}
                disabled={busy}
                animate={{
                  y: isHover ? -10 : 0,
                  scale: isHover ? 1.3 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={`relative w-10 h-10 flex items-center justify-center rounded-full text-2xl ${
                  isMine
                    ? 'bg-primary-container'
                    : 'hover:bg-surface-container'
                }`}
                title={opt.label}
              >
                {opt.emoji}
                {isHover && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-on-surface text-surface text-[10px] font-quicksand font-bold shadow"
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

  /* ===== Floating emojis render (dùng cho fb variant) ===== */
  const floating = (
    <AnimatePresence>
      {floatingEmojis.map((e) => (
        <motion.span
          key={e.id}
          initial={{ opacity: 0, y: 0, scale: 0.5, x: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -70,
            x: (Math.random() - 0.5) * 40,
            scale: [0.5, 1.5, 1.2, 0.9],
            rotate: (Math.random() - 0.5) * 40,
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

  /* ===== ICON VARIANT — nút tròn emoji lớn ===== */
  if (variant === 'icon') {
    return (
      <div ref={containerRef} className="relative inline-block">
        {floating}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((v) => !v);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={busy}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 disabled:opacity-50 ${
            byMe
              ? 'bg-primary text-on-primary shadow-md'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
          aria-label="Thả cảm xúc"
        >
          <span className="text-xl leading-none">{myEmoji ?? '⭐'}</span>
        </button>
        {picker}
      </div>
    );
  }

  /* ===== FULL VARIANT — 5 emoji nằm ngang ===== */
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
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all border ${
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

  /* ===== FB VARIANT — Pill + emoji bay + viewer below ===== */
  return (
    <div
      ref={containerRef}
      className="relative inline-flex flex-col items-start gap-1.5"
    >
      <div className="relative">
        {floating}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(byMe || 'HEART');
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={busy}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-heading font-bold border transition-all active:scale-95 disabled:opacity-50 ${
            byMe
              ? 'bg-primary text-on-primary border-primary shadow-md'
              : byPartner
                ? 'bg-primary-container text-on-primary-container border-primary/40'
                : 'bg-surface-container-low text-on-surface-variant border-primary/10 hover:bg-surface-container'
          }`}
          aria-label="Thả cảm xúc"
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
          <span>{byMe ? REACTION_META[byMe].label.split(' ')[0] : 'Cảm xúc'}</span>
        </button>
        {picker}
      </div>

      {showViewer && <ReactionsViewer summary={local} compact />}
    </div>
  );
}