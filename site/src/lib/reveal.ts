/** Scroll reveals for .reveal elements. The hidden state is gated behind the
 * `js` root class and prefers-reduced-motion, so a no-JS or reduced-motion
 * visitor sees a static page. */
export function initReveals(): () => void {
  document.documentElement.classList.add('js');
  const els = Array.from(document.querySelectorAll('.reveal'));
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (!motion || typeof IntersectionObserver === 'undefined') {
    for (const el of els) el.classList.add('in');
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.12 },
  );
  for (const el of els) io.observe(el);
  return () => io.disconnect();
}
