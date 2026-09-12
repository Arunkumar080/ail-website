import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Scroll entrance, one uniform 240ms fade-up per element — no stagger.
 *
 * Deliberately a geometry sweep writing inline styles, not an animation
 * library driving frames: an IntersectionObserver callback is not delivered
 * in a non-painting frame, and a frame-driven tween never reaches its final
 * value if no frames are painted — either way the content is stranded at
 * opacity 0 (thumbnail capture, headless render, a backgrounded tab). Writing
 * `opacity: 1` straight onto the element means the end state is correct even
 * when nothing ever animates; the CSS transition is pure decoration on top.
 *
 * The sweep runs on scroll, on resize, and on a short poll, so an element can
 * never stay hidden once it is in view.
 */
const armed = new Set<HTMLElement>();
let wired = false;
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * Reveal once an element's top has risen past 85% of the viewport. The test is
 * deliberately monotonic in scroll position rather than "is 15% of it on
 * screen": a visibility test can never fire for an element that has already
 * been scrolled clean past (its rect is entirely above the viewport), which
 * strands anything skipped by an anchor jump or a fast fling at opacity 0.
 */
function sweep() {
  const vh = window.innerHeight || 800;
  armed.forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.85) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      armed.delete(el);
    }
  });
  if (armed.size === 0) unwire();
}

function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener('scroll', sweep, { passive: true, capture: true });
  window.addEventListener('resize', sweep);
  timer = setInterval(sweep, 250);
}

function unwire() {
  if (!wired) return;
  wired = false;
  window.removeEventListener('scroll', sweep, true);
  window.removeEventListener('resize', sweep);
  if (timer) clearInterval(timer);
  timer = undefined;
}

export function Item({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced-motion readers get the content outright, never a hidden element.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.style.transition = 'opacity 240ms ease-out, transform 240ms ease-out';
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    armed.add(el);
    wire();
    sweep();

    return () => {
      armed.delete(el);
      if (armed.size === 0) unwire();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
