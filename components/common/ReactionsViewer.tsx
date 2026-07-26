'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  REACTION_META,
  ReactionSummary,
  ReactionTypeValue,
  ReactionUser,
} from '@/types/reaction';

interface ReactionsViewerProps {
  summary: ReactionSummary | undefined;
  compact?: boolean;
  /** Hiển thị dưới dạng stack mini (giống FB reactions-count pill) */
  fpStyle?: boolean;
}

/**
 * Hiển thị đã có ai thả reaction gì:
 * - compact: chỉ pill nhỏ "❤️ 🤗 2" (FB-style)
 * - fpStyle: stack 3 emoji + count + tooltip tên
 */
export function ReactionsViewer({
  summary,
  compact = true,
  fpStyle = true,
}: ReactionsViewerProps) {
  const [showList, setShowList] = useState(false);

  if (!summary || summary.total === 0) return null;

  /* Tổng hợp các emoji đã được thả (unique by type) */
  const activeTypes = (Object.keys(summary.grouped) as ReactionTypeValue[])
    .filter((t) => summary.grouped[t].total > 0)
    .sort((a, b) => summary.grouped[b].total - summary.grouped[a].total);

  if (activeTypes.length === 0) return null;

  if (compact && fpStyle) {
    return (
      <div className="relative inline-flex">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setShowList((v) => !v);
          }}
          whileHover={{ y: -1 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container border border-primary/20 shadow-sm hover:shadow-md transition-all"
          aria-label="Xem ai đã thả cảm xúc"
        >
          <span className="flex -space-x-1">
            {activeTypes.slice(0, 3).map((t) => (
              <span
                key={t}
                className="w-5 h-5 rounded-full bg-surface-container-lowest border border-white flex items-center justify-center text-[11px] leading-none"
              >
                {REACTION_META[t].emoji}
              </span>
            ))}
          </span>
          <span className="font-heading font-bold text-[11px] text-on-surface pl-0.5">
            {summary.total}
          </span>
        </motion.button>

        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-30 bottom-full mb-2 left-0 min-w-[220px] max-w-[280px] p-3 rounded-2xl bg-surface border border-primary/20 shadow-2xl space-y-2"
            >
              <div className="text-[10px] font-quicksand font-bold text-outline uppercase">
                Cảm xúc về mục này
              </div>
              {activeTypes.map((t) => {
                const group = summary.grouped[t];
                return (
                  <div
                    key={t}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-surface-container-low"
                  >
                    <span className="text-xl leading-none">{REACTION_META[t].emoji}</span>
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

  /* Default: danh sách các emoji + tên */
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