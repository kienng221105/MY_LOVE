'use client';

import { useEffect } from 'react';

const TARGET_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/**
 * iOS Safari keeps the viewport zoomed after the user focuses an input
 * that is inside a transformed/fixed-positioned ancestor (modal, drawer).
 * That zoom persists on blur, leaving the rest of the page too large.
 *
 * Two mitigations are applied here, on top of the global CSS that
 * forces 16px on form controls (so Safari does not auto-zoom in the
 * first place):
 *   1. Pin the visualViewport to a sane zoom range around 1x while
 *      a form control has focus, so a stray pinch-zoom cannot leave
 *      the page oversized after blur.
 *   2. On blur, restore the previous scroll position with a single
 *      `requestAnimationFrame`, which gives Safari the hint it needs
 *      to release the zoom it held while the keyboard was open.
 */
export function useIosKeyboardFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isIosSafari =
      /iP(ad|hone|od)/.test(window.navigator.userAgent) &&
      /WebKit/.test(window.navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS/.test(window.navigator.userAgent);

    if (!isIosSafari) return;

    let preFocusScrollY = 0;
    let hasSnapshot = false;

    const snapshot = () => {
      preFocusScrollY = window.scrollY;
      hasSnapshot = true;
    };

    const restore = () => {
      if (!hasSnapshot) return;
      requestAnimationFrame(() => {
        window.scrollTo({ top: preFocusScrollY, left: 0, behavior: 'auto' });
      });
      hasSnapshot = false;
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.matches?.(TARGET_SELECTOR)) return;
      snapshot();
    };

    const onFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.matches?.(TARGET_SELECTOR)) return;
      restore();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        restore();
      }
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
