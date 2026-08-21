import { ArrowRight, ArrowUpRight } from 'lucide-react';

/**
 * The page means exactly two things by an arrow, and this is where it says
 * which: `away` leaves the page (an address, a store, a repository), and the
 * default travels within it (a section further down, a panel alongside).
 *
 * Both used to be typed characters, → and ↗, sitting next to real icons that
 * meant the same thing. A glyph is drawn by whichever font caught it, so the
 * page shipped two arrow families at two weights, and a screen reader read the
 * one in the footer aloud as part of the link.
 *
 * Sized in `em` so an arrow always matches the label it belongs to rather than
 * a size picked per call site, and mirrored under rtl because both point along
 * the reading direction, which is the one thing about them that flips.
 */
export function Arrow({ away = false, className = '' }: { away?: boolean; className?: string }) {
  const Glyph = away ? ArrowUpRight : ArrowRight;
  return (
    <Glyph
      aria-hidden
      className={`h-[1em] w-[1em] flex-none rtl:-scale-x-100 ${className}`.trim()}
    />
  );
}
