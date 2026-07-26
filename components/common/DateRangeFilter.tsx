'use client';

import { useMemo } from 'react';

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

export interface DateRangeFilterValue {
  preset: DateRangePreset;
  from: string; // YYYY-MM-DD (inclusive)
  to: string; // YYYY-MM-DD (inclusive)
}

export const EMPTY_DATE_RANGE: DateRangeFilterValue = {
  preset: 'all',
  from: '',
  to: '',
};

export function parseDateRange(value: DateRangeFilterValue): {
  from: Date | null;
  to: Date | null;
} {
  const presets: Record<Exclude<DateRangePreset, 'custom'>, () => { from: Date | null; to: Date | null }> = {
    all: () => ({ from: null, to: null }),
    today: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: start, to: end };
    },
    '7d': () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    },
    '30d': () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    },
  };

  if (value.preset !== 'custom') return presets[value.preset]();
  const from = value.from ? new Date(`${value.from}T00:00:00`) : null;
  const to = value.to ? new Date(`${value.to}T23:59:59.999`) : null;
  return { from, to };
}

export function isDateInRange(target: Date | string | undefined, range: DateRangeFilterValue): boolean {
  if (!target) return true;
  const { from, to } = parseDateRange(range);
  if (!from && !to) return true;
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return true;
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}

const PRESET_LABELS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'custom', label: 'Tùy chọn' },
];

interface DateRangeFilterProps {
  value: DateRangeFilterValue;
  onChange: (next: DateRangeFilterValue) => void;
  totalCount: number;
  filteredCount: number;
}

export default function DateRangeFilter({
  value,
  onChange,
  totalCount,
  filteredCount,
}: DateRangeFilterProps) {
  const showCustom = value.preset === 'custom';

  const rangeText = useMemo(() => {
    if (value.preset === 'all') return 'đang hiển thị tất cả';
    if (value.preset === 'today') return 'hôm nay';
    if (value.preset === '7d') return '7 ngày gần nhất';
    if (value.preset === '30d') return '30 ngày gần nhất';
    if (value.from && value.to) return `từ ${value.from} đến ${value.to}`;
    if (value.from) return `từ ${value.from}`;
    if (value.to) return `đến ${value.to}`;
    return 'tùy chọn';
  }, [value]);

  return (
    <div className="glass-panel p-4 rounded-2xl border border-primary/20 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-lg text-primary">filter_alt</span>
          <span className="font-heading font-bold text-xs uppercase tracking-wide">
            Lọc thời gian
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PRESET_LABELS.map((preset) => {
            const active = value.preset === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  if (preset.value === 'custom') {
                    onChange({ ...value, preset: 'custom' });
                  } else {
                    onChange({ preset: preset.value, from: '', to: '' });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full font-heading font-bold text-[11px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <span className="ml-auto font-quicksand text-[11px] font-semibold text-on-surface-variant">
          Hiển thị <strong className="text-primary">{filteredCount}</strong> / {totalCount} · {rangeText}
        </span>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-primary/10">
          <label className="flex flex-col gap-1">
            <span className="font-heading font-bold text-[11px] text-on-surface-variant">Từ ngày</span>
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-heading font-bold text-[11px] text-on-surface-variant">Đến ngày</span>
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold text-xs"
            />
          </label>
          {(value.from || value.to) && (
            <button
              type="button"
              onClick={() => onChange({ preset: 'custom', from: '', to: '' })}
              className="px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant font-heading font-bold text-[11px] hover:bg-surface-container-high"
            >
              Xoá ngày
            </button>
          )}
        </div>
      )}
    </div>
  );
}
