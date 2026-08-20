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
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Languages className="h-[19px] w-[19px]" aria-hidden />
      </button>
      {open && (
        <ul className="lang-menu" role="menu">
          {LOCALES.map((code) => (
            <li key={code} role="none">
              <a
                role="menuitem"
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
