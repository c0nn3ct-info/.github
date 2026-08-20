import { useEffect } from 'react';
import { t } from '../i18n';

export interface Shot {
  src: string;
  alt: string;
}

/** The screenshot at full size. Anywhere is a close target, so the dialog has
 * exactly one control and it is the one under the pointer. */
export function Lightbox({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={shot.alt}>
      {/* The dialog opens with its one control already focused, so Escape and
          Enter both work the moment it appears. */}
      <button
        type="button"
        autoFocus
        className="absolute inset-0 cursor-zoom-out border-0 bg-transparent"
        onClick={onClose}
        aria-label={t('home.shot.close')}
      />
      <img src={shot.src} alt={shot.alt} />
      <span className="eyebrow pointer-events-none absolute bottom-6 start-1/2 -translate-x-1/2 text-white/60 rtl:translate-x-1/2">
        {t('home.shot.close_hint')}
      </span>
    </div>
  );
}
