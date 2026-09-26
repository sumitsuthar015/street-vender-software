import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import confetti from 'canvas-confetti';

/** Fades + slides its content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

/** Staggered list: children with `variants={fadeUpItem}` animate in one after another. */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
export const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

/** A number that counts up to `value` (e.g. stats). `format` turns the number into text. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-IN'), duration = 0.9 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(from.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, duration]);

  return <span ref={ref}>{format(display)}</span>;
}

/** Party popper burst, e.g. when an order is ready. Skipped for "reduce motion" users. */
export function celebrate() {
  const colors = ['#ea580c', '#f43f5e', '#f59e0b', '#22c55e', '#ffffff'];
  const shoot = (x, angle) =>
    confetti({
      particleCount: 70,
      spread: 70,
      angle,
      origin: { x, y: 0.7 },
      colors,
      disableForReducedMotion: true,
      zIndex: 70,
    });
  shoot(0.1, 60);
  shoot(0.9, 120);
}
