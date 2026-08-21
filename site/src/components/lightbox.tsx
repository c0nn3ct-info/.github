import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';

export interface Shot {
  src: string;
  alt: string;
}

/** The screenshot at full size. Anywhere is a close target, so the dialog has
 * exactly one control and it is the one under the pointer. */
export function Lightbox({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  // Read during the first render, which is the last moment the thumbnail still
  // holds focus: autoFocus below moves it at commit, before any effect runs.
  // Closing hands the keyboard back here, so a reader returns to the shot they
  // opened rather than to the top of the document.
  const [opener] = useState(() => document.activeElement as HTMLElement);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // aria-modal hides the page from assistive tech but does nothing to the
      // tab ring, so Tab would otherwise walk into content the reader cannot
      // see. One control means the trap is a loop of length one; Escape is
      // still the way out, so this is a modal, not a keyboard trap.
      if (e.key === 'Tab') {
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener.focus();
    };
  }, [onClose, opener]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={shot.alt}>
      {/* The dialog opens with its one control already focused, so Escape and
          Enter both work the moment it appears. */}
      <button
        type="button"
        autoFocus
        ref={close}
        className="absolute inset-0 cursor-zoom-out border-0 bg-transparent"
        onClick={onClose}
        aria-label={t('home.shot.close')}
      />
      {/* The dialog's own name is this description, so repeating it here would
          read the screenshot out twice. */}
      <img src={shot.src} alt="" />
      <span className="eyebrow pointer-events-none absolute bottom-6 start-1/2 -translate-x-1/2 text-white/60 rtl:translate-x-1/2">
        {t('home.shot.close_hint')}
      </span>
    </div>
  );
}
