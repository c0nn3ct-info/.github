import { Fragment, useLayoutEffect, useRef } from 'react';
import { t } from '../i18n';

const LINES = ['1', '2', '3', '4', '5'] as const;

/** The baseline's radius as a share of the ring box: between the dashed ring
 * (330/800 of the box) and the outer line (392/800), with the caps clear of
 * both. */
const RADIUS = 0.44;

/** How long the sentence is along its path, where the browser can say. jsdom
 * cannot, and a browser that cannot gets the text at its natural length. */
function ownLength(el: SVGTextPathElement): number {
  return typeof el.getComputedTextLength === 'function' ? el.getComputedTextLength() : 0;
}

/**
 * The five refusals set along the hero's ring and turning with it, so the
 * studio's promises circle its headline. Decoration only: the belt under the
 * hero stays the copy a screen reader hears and the one a reader without
 * motion sees, so this svg is out of the tree and the words are not read twice.
 *
 * Drawn in pixels rather than through a viewBox so the type keeps the tag
 * role's 12px whatever the ring measures. The path is redrawn from the box's
 * width, and the text is stretched along the whole circle, in its spacing and
 * never its glyphs, so the ring has no seam. A locale longer than the circle,
 * which only a short window can produce, is squeezed instead.
 */
export function RingText() {
  const svg = useRef<SVGSVGElement>(null);
  const orbit = useRef<SVGPathElement>(null);
  const run = useRef<SVGTextPathElement>(null);

  useLayoutEffect(() => {
    const box = svg.current as SVGSVGElement;
    const fit = () => {
      const size = box.clientWidth;
      if (!size) return;
      const c = size / 2;
      const r = size * RADIUS;
      (orbit.current as SVGPathElement).setAttribute(
        'd',
        `M ${c} ${c - r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 ${-2 * r}`,
      );
      const text = run.current as SVGTextPathElement;
      const around = 2 * Math.PI * r;
      const own = ownLength(text);
      if (!own) return;
      text.setAttribute('textLength', String(around));
      text.setAttribute('lengthAdjust', own > around ? 'spacingAndGlyphs' : 'spacing');
    };
    fit();
    // The mono face can land after the first fit, and a measurement taken in
    // the fallback face picks the wrong adjustment for a long locale.
    void document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={svg} className="ring-text" aria-hidden data-loop>
      <path ref={orbit} id="ring-orbit" fill="none" />
      <text className="tag">
        <textPath ref={run} href="#ring-orbit">
          {/* Each sentence carries its own separator, as on the belt, so the
              fifth meets the first across one instead of running into it. The
              spaces are no-break ones: SVG trims an ordinary space at the end
              of the text, and the ring closes on that end. */}
          {LINES.map((n) => (
            <Fragment key={n}>
              {t(`home.strip.${n}`)}
              <tspan className="sep">{'\u00a0/\u00a0'}</tspan>
            </Fragment>
          ))}
        </textPath>
      </text>
    </svg>
  );
}
