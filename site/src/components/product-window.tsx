import { cn } from '@/lib/utils';

interface Props {
  href: string;
  ariaLabel: string;
  title: string;
  led: 'noctis' | 'aria2t';
  darkSrc: string;
  lightSrc: string;
  alt: string;
  width: number;
  height: number;
  zoom?: boolean;
  className?: string;
}

/** A product screenshot in the family's window chrome; the whole window links to the product site. */
export function ProductWindow({ href, ariaLabel, title, led, darkSrc, lightSrc, alt, width, height, zoom, className }: Props) {
  return (
    <a
      className={cn('window-frame reveal', zoom && 'window-zoom', className)}
      href={href}
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      {/* Titlebar in the products' own idiom: LED lamp plus address, no
          borrowed macOS chrome. */}
      <div className="flex items-center gap-2 border-b border-outline-variant px-3 py-[9px]">
        <span className={cn('led', led === 'noctis' ? 'led-noctis' : 'led-aria2t')} aria-hidden />
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] tracking-[0.02em] text-on-surface-variant">
          {title}
        </span>
      </div>
      {/* One capture downloads per scheme; the page has no manual theme toggle,
          so the class on <html> always agrees with this media query. */}
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet={darkSrc} width={width} height={height} />
        <img
          className="block w-full"
          src={lightSrc}
          width={width}
          height={height}
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </a>
  );
}
