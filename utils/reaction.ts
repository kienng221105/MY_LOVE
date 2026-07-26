/**
 * Phân loại "me" — Kiên hay Trà — dựa trên tên hiển thị.
 * Trả về 'Kien' | 'Love' — đúng với giá trị author trong DiaryEntry và reactionBy.
 */
export function resolveReactionBy(displayName: string): 'Kien' | 'Love' {
  const normalized = (displayName || '').trim().toLowerCase();
  if (normalized === 'trà' || normalized === 'tra') return 'Love';
  return 'Kien';
}