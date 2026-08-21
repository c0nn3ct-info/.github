import { t } from '../i18n';

const LINES = ['1', '2', '3', '4', '5'] as const;

function Run({ hidden }: { hidden?: boolean }) {
  return (
    <div className="marquee-run" aria-hidden={hidden || undefined}>
      {LINES.map((n) => (
        <span className="contents" key={n}>
          <span>{t(`home.strip.${n}`)}</span>
          <span className="text-faint">/</span>
        </span>
      ))}
    </div>
  );
}

/** The belt of habits between the hero and the work. The second run is the
 * seam that makes the loop continuous, and is hidden from both the
 * accessibility tree and the reduced-motion layout. */
export function Marquee() {
  return (
    <div className="marquee" role="group" aria-label={t('home.strip.aria')}>
      <div className="marquee-track" data-loop>
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
