import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import {
  LOCALES,
  LOCALE_LABEL,
  getLocale,
  stripLocale,
  t,
  withLocale,
  type Locale,
} from '../i18n';

/** The same page in another language: the current path with its locale prefix
 * swapped, so a visitor keeps their place. */
export function pairPath(currentPath: string, target: Locale): string {
  return withLocale(stripLocale(currentPath), target);
}

export function LanguageSwitcher() {
  const locale = getLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // The switcher marks its own subtree, so the outside test is one lookup on
    // the click target rather than a nullable ref.
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-lang]')) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative flex-none" data-lang>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('nav.lang_switch_aria')}
        aria-expanded={open}
        aria-controls="lang-menu"
      >
        <Languages className="h-[19px] w-[19px]" aria-hidden />
      </button>
      {open && (
        // A disclosure of six links rather than a menu: role="menu" promised
        // arrow keys and focus moving into it, and the page did neither.
        <ul className="lang-menu" id="lang-menu">
          {LOCALES.map((code) => (
            <li key={code}>
              <a
                href={pairPath(window.location.pathname, code)}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? 'true' : undefined}
              >
                {LOCALE_LABEL[code]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
