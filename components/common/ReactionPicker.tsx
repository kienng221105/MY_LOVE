'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  REACTION_OPTIONS,
  ReactionTypeValue,
  ReactionSummary,
  ReactionTargetValue,
} from '@/types/reaction';
import { ReactionsService } from '@/services/reactions.service';
import { ReactionBy } from '@/hooks/useReactionContext';

interface ReactionPickerProps {
  targetType: ReactionTargetValue;
  targetId: string;
  me: ReactionBy;
  summary: ReactionSummary | undefined;
  onUpdate?: (next: ReactionSummary) => void;
  /**
   * Variant:
   * - 'compact': chỉ hiện tổng số + 1 emoji "đầu tiên", bấm vào mở picker
   * - 'full':    hiện đủ 5 emoji với số đếm và badge đã thả
   */
  variant?: 'compact' | 'full';
}

const EMOJI_BY_TYPE: Record<ReactionTypeValue, string> = REACTION_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.type]: opt.emoji }),
  {} as Record<ReactionTypeValue, string>
);

export function ReactionPicker({
  targetType,
  targetId,
  me,
  summary,
  onUpdate,
  variant = 'compact',
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<ReactionSummary | undefined>(summary);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocal(summary);
  }, [summary]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

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
    } catch (err: any) {
      console.warn('Toggle reaction failed', err);
    } finally {
      setBusy(false);
    }
  };

  const total = local?.total ?? 0;
  const byMe = local?.byMe ?? null;
  const byPartner = local?.byPartner ?? null;
  const primaryType: ReactionTypeValue = byMe || byPartner || 'HEART';
  const primaryEmoji = EMOJI_BY_TYPE[primaryType];

  if (variant === 'full') {
    return (
      <div
        ref={containerRef}
        className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/10"
      >
        {REACTION_OPTIONS.map((opt) => {
          const g = local?.grouped[opt.type];
          const total = g?.total ?? 0;
          const mine = g?.mine ?? false;
          const partner = g?.partner ?? false;
          const highlighted = mine || partner;
          return (
            <button
              key={opt.type}
              onClick={() => handleToggle(opt.type)}
              disabled={busy}
              title={`${opt.label} — Kiên: ${mine ? 'đã thả' : 'chưa'}, Trà: ${
                partner ? 'đã thả' : 'chưa'
              }`}
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
              {mine && (
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-on-primary text-primary text-[9px] font-extrabold shadow-sm">
                  {me === 'Kien' ? 'Kiên' : 'Trà'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // compact variant
  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold border transition-all ${
          total > 0
            ? byMe
              ? 'bg-primary text-on-primary border-primary shadow-sm'
              : 'bg-primary-container text-on-primary-container border-primary/40'
            : 'bg-surface-container/60 text-on-surface-variant border-primary/10 hover:bg-primary-container/30'
        }`}
        aria-label="Thả cảm xúc"
      >
        <span className="text-base leading-none">
          {total > 0 ? primaryEmoji : '💗'}
        </span>
        {total > 0 && <span>{total}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 left-0 flex items-center gap-1.5 p-2 rounded-full bg-surface border border-primary/30 shadow-xl"
          >
            {REACTION_OPTIONS.map((opt) => {
              const mine = local?.grouped[opt.type]?.mine ?? false;
              return (
                <button
                  key={opt.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(opt.type);
                  }}
                  disabled={busy}
                  title={opt.label}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-xl transition-transform ${
                    mine
                      ? 'bg-primary text-on-primary scale-110'
                      : 'hover:bg-primary-container/40 hover:scale-110'
                  }`}
                >
                  {opt.emoji}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}