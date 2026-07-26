/**
 * Format ngày từ ISO string hoặc date string sang định dạng Việt Nam đẹp
 * VD: "2026-07-26T06:50:18.312Z" → "26/07/2026"
 * VD: "2026-07-18" → "18/07/2026"
 */
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    // Format in Vietnam timezone (UTC+7)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format ngày giờ đầy đủ với giờ Việt Nam
 * VD: "2026-07-26T06:50:18.312Z" → "26/07/2026, 13:50"
 */
export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch {
    return String(dateStr);
  }
}
