import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['variant', ['.dark &', '[data-theme="dark"] &']],
  content: ['./src/**/*.{ts,tsx,html}', './pages/**/index.html'],
  theme: {
    extend: {
      colors: {
        /* Page roles that are not M3 tones: the dark block card, the hero
         * stage, the AA-safe faint ink, and the per-product LED pair a
         * [data-product] scope sets. */
        block: 'var(--block)',
        'on-block': 'var(--on-block)',
        'on-block-dim': 'var(--on-block-dim)',
        'on-block-faint': 'var(--on-block-faint)',
        stage: 'var(--stage)',
        'on-stage-dim': 'var(--on-stage-dim)',
        'on-stage-faint': 'var(--on-stage-faint)',
        faint: 'var(--faint-ink)',
        led: 'var(--led)',
        'led-ink': 'var(--led-ink)',
        'wire-go': 'var(--wire-go)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          container: 'hsl(var(--primary-container))',
          'on-container': 'hsl(var(--on-primary-container))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--secondary-container))',
          'on-container': 'hsl(var(--on-secondary-container))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--on-tertiary))',
          container: 'hsl(var(--tertiary-container))',
          'on-container': 'hsl(var(--on-tertiary-container))',
        },
        dir: {
          DEFAULT: 'hsl(var(--dir))',
          foreground: 'hsl(var(--dir-on))',
          container: 'hsl(var(--dir-container))',
          'on-container': 'hsl(var(--dir-on-container))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          variant: 'hsl(var(--surface-variant))',
          'container-lowest': 'hsl(var(--surface-container-lowest))',
          'container-low': 'hsl(var(--surface-container-low))',
          container: 'hsl(var(--surface-container))',
          'container-high': 'hsl(var(--surface-container-high))',
          'container-highest': 'hsl(var(--surface-container-highest))',
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface))',
          variant: 'hsl(var(--on-surface-variant))',
        },
        outline: {
          DEFAULT: 'hsl(var(--outline))',
          variant: 'hsl(var(--outline-variant))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--on-success))',
          container: 'hsl(var(--success-container))',
          'on-container': 'hsl(var(--on-success-container))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          container: 'hsl(var(--warning-container))',
          'on-container': 'hsl(var(--on-warning-container))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--on-error))',
          container: 'hsl(var(--error-container))',
          'on-container': 'hsl(var(--on-error-container))',
        },
      },
      borderRadius: {
        xs: 'var(--shape-xs)',
        sm: 'var(--shape-sm)',
        md: 'var(--shape-md)',
        lg: 'var(--shape-lg)',
        xl: 'var(--shape-xl)',
        pill: 'var(--shape-pill)',
      },
      boxShadow: {
        e1: 'var(--shadow-1)',
        e2: 'var(--shadow-2)',
        e3: 'var(--shadow-3)',
        e4: 'var(--shadow-4)',
      },
      transitionTimingFunction: {
        emph: 'var(--ease-emph)',
        'emph-decel': 'var(--ease-emph-decel)',
        pane: 'var(--ease-pane)',
      },
      transitionDuration: {
        'x-short': '80ms',
        short: '120ms',
        med: '250ms',
        long: '450ms',
        'x-long': '600ms',
      },
      fontSize: {
        'display-small':   ['36px', { lineHeight: '44px', letterSpacing: '0px' }],
        'headline-large':  ['32px', { lineHeight: '40px', letterSpacing: '0px' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px' }],
        'headline-small':  ['24px', { lineHeight: '32px', letterSpacing: '0px' }],
        'title-large':     ['22px', { lineHeight: '28px', letterSpacing: '0px' }],
        'title-medium':    ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small':     ['14px', { lineHeight: '20px', letterSpacing: '0.1px',  fontWeight: '500' }],
        'label-large':     ['14px', { lineHeight: '20px', letterSpacing: '0.1px',  fontWeight: '500' }],
        'label-medium':    ['12px', { lineHeight: '16px', letterSpacing: '0.5px',  fontWeight: '500' }],
        'label-small':     ['11px', { lineHeight: '16px', letterSpacing: '0.5px',  fontWeight: '500' }],
        'body-large':      ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-medium':     ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'body-small':      ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
      },
    },
  },
  plugins: [animate],
} satisfies Config;
