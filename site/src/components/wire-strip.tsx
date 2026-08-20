import { ArrowDown, ArrowRight, Globe, Monitor } from 'lucide-react';
import { ConnectionVisual } from '@/components/m3/connection-visual';
import { t } from '../i18n';

/** The positioning line drawn in the family's node-and-pill grammar. */
export function WireStrip() {
  // The rise stagger runs in reading order, machine to wire, so the entrance
  // narrates the direction the diagram claims data flows.
  return (
    <div className="flex flex-col gap-2 min-[900px]:flex-row min-[900px]:items-stretch" role="group" aria-label={t('home.strip.aria')}>
      <div className="node-card rise-5 min-[900px]:flex-1 max-[640px]:p-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-secondary-container text-secondary-foreground">
            <Monitor className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-title-small leading-tight">{t('home.strip.machine.ctx')}</div>
        </div>
        <div className="text-body-medium">{t('home.strip.machine.title')}</div>
        <div className="text-label-small text-on-surface-variant">{t('home.strip.machine.sub')}</div>
      </div>
      <div className="rise-6 flex flex-none flex-col items-center justify-center px-1 py-1">
        <div className="flex items-center gap-1 max-[899px]:flex-col max-[899px]:gap-1.5">
          <ConnectionVisual state="connected" size={20} className="shrink-0" />
          {/* on-container green: the readable success shade in both themes,
              since --success itself falls under 4.5:1 on the light ground. */}
          <span className="whitespace-nowrap rounded-pill border border-success/40 bg-background px-2 py-0.5 text-label-small font-medium text-success-on-container">
            {t('home.strip.pill')}
          </span>
          <ArrowRight className="hidden h-3.5 w-3.5 text-on-surface-variant min-[900px]:inline-block" aria-hidden />
          <ArrowDown className="h-3.5 w-3.5 text-on-surface-variant min-[900px]:hidden" aria-hidden />
        </div>
      </div>
      <div className="node-card muted rise-7 min-[900px]:flex-1 max-[640px]:p-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-surface-container-high text-on-surface-variant">
            <Globe className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-title-small leading-tight text-on-surface-variant">{t('home.strip.wire.ctx')}</div>
        </div>
        <div className="text-body-medium text-on-surface-variant">{t('home.strip.wire.title')}</div>
        <div className="text-label-small text-on-surface-variant">{t('home.strip.wire.sub')}</div>
      </div>
    </div>
  );
}
