import { cn } from '@/lib/utils';

export type ConnState = 'idle' | 'connecting' | 'connected' | 'error';

interface Props {
  state: ConnState;
  size?: number;
  className?: string;
}

// Static by design: the visual names a state through colour alone, so it can
// sit in a diagram without demanding attention from live data it doesn't have.
const styleByState: Record<ConnState, { ring: string; core: string }> = {
  idle: {
    ring: 'bg-outline/30',
    core: 'bg-surface-container-highest text-on-surface-variant',
  },
  connecting: {
    ring: 'bg-primary/40',
    core: 'bg-primary-container text-primary-on-container',
  },
  connected: {
    ring: 'bg-success/35',
    core: 'bg-success text-success-foreground',
  },
  error: {
    ring: 'bg-error/40',
    core: 'bg-error-container text-error-on-container',
  },
};

export function ConnectionVisual({ state, size = 188, className }: Props) {
  const s = styleByState[state];
  const coreSize = Math.round(size * 0.7);
  const ringSize = Math.round(size * 0.86);

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <span className={cn('absolute rounded-full', s.ring)} style={{ width: ringSize, height: ringSize }} />
      <span
        className={cn(
          'relative grid place-items-center rounded-full shadow-e2',
          s.core,
        )}
        style={{ width: coreSize, height: coreSize }}
      >
        <PowerGlyph size={Math.round(coreSize * 0.42)} />
      </span>
    </div>
  );
}

function PowerGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v9" />
      <path d="M5.5 7a8.5 8.5 0 1 0 13 0" />
    </svg>
  );
}
