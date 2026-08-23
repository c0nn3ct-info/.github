import { useEffect, useLayoutEffect, useState } from 'react';
import { ShotTrack, type Shot } from '@/components/shot-track';
import { t } from '../i18n';

export type { Shot };

/** Everything the dialog can put focus on, in the order Tab walks them. */
function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('button, [tabindex="0"]')];
}

/**
 * The captures at full size, as the same carousel the pane shows. Every surface
 * that is not a carousel control closes: the ground around the capture, and the
 * capture itself, which is what a reader who opened it by clicking expects to
 * be able to click again.
 */
export function Lightbox({
  shots,
  at,
  onClose,
}: {
  shots: readonly Shot[];
  at: number;
  onClose: () => void;
}) {
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null);
  // Read during the first render, which is the last moment the thumbnail still
  // holds focus. Closing hands the keyboard back there, so a reader returns to
  // the capture they opened rather than to the top of the document.
  const [opener] = useState(() => document.activeElement as HTMLElement);

  useLayoutEffect(() => {
    if (!dialog) return;
    // The ground, so Enter closes the moment the dialog appears and the arrow
    // keys reach the track on the very next Tab.
    focusables(dialog)[0]?.focus();
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // aria-modal hides the page from assistive tech but does nothing to the
      // tab ring, so Tab would otherwise walk into content the reader cannot
      // see. The ring is closed by hand instead; Escape is still the way out,
      // so this is a modal rather than a keyboard trap.
      if (e.key !== 'Tab') return;
      const ring = focusables(dialog);
      const edge = e.shiftKey ? ring[0] : ring[ring.length - 1];
      if (document.activeElement !== edge) return;
      e.preventDefault();
      (e.shiftKey ? ring[ring.length - 1] : ring[0]).focus();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener.focus();
    };
  }, [dialog, onClose, opener]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={shots[at]?.alt}
      ref={setDialog}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out border-0 bg-transparent"
        onClick={onClose}
        aria-label={t('home.shot.close')}
      />
      <ShotTrack
        shots={shots}
        at={at}
        /* The captures keep turning over here too: a reader who opened one is
         * looking at the set, and the dialog is where the whole set fits. */
        auto
        label={t('home.work.shots_aria')}
        onSurface={onClose}
        eager
      />
      <span className="eyebrow pointer-events-none absolute bottom-6 start-1/2 -translate-x-1/2 text-white/60 rtl:translate-x-1/2">
        {t('home.shot.close_hint')}
      </span>
    </div>
  );
}
