'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * BidTicker - LED-scoreboard style number tween. Animates from the
 * previous value to `value` over ~0.5s so every screen sees the bid
 * "climb" rather than snap, which is what makes concurrent bids feel
 * alive rather than laggy.
 */
export default function BidTicker({ value = 0, className = '', prefix = '' }) {
  const spanRef = useRef(null);
  const proxy = useRef({ val: 0 });

  useEffect(() => {
    const tween = gsap.to(proxy.current, {
      val: value,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = prefix + Math.round(proxy.current.val).toLocaleString('en-IN');
        }
      },
    });
    return () => tween.kill();
  }, [value, prefix]);

  return (
    <span ref={spanRef} className={`font-mono tabular-nums ${className}`}>
      {prefix}0
    </span>
  );
}
