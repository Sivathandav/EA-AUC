'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * SoldHammer - the signature cinematic beat of the whole app.
 * Fires once per rising edge of `trigger` (pass a value that changes,
 * e.g. a counter incremented every time auctionState.status becomes 'sold').
 * Hardware-accelerated: only transform/opacity are animated.
 */
export default function SoldHammer({ trigger, teamName = '', teamColor = '#F5A623' }) {
  const containerRef = useRef(null);
  const hammerRef = useRef(null);
  const textRef = useRef(null);
  const subRef = useRef(null);
  const burstRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.set(containerRef.current, { autoAlpha: 1 })
        .set([hammerRef.current, textRef.current, subRef.current], { autoAlpha: 0 })
        // hammer drops in from above with a heavy ease-in (weight)
        .fromTo(
          hammerRef.current,
          { y: -260, rotate: -40, autoAlpha: 0, scale: 0.9 },
          { y: 0, rotate: 0, autoAlpha: 1, scale: 1, duration: 0.32, ease: 'power3.in' }
        )
        // impact: quick counter-rotation + gold shockwave ring
        .to(hammerRef.current, { rotate: -14, duration: 0.05, ease: 'power1.out' })
        .fromTo(
          burstRef.current,
          { scale: 0.2, autoAlpha: 0.9 },
          { scale: 3.2, autoAlpha: 0, duration: 0.55, ease: 'power2.out' },
          '<'
        )
        .to(hammerRef.current, { rotate: 0, duration: 0.22, ease: 'elastic.out(1, 0.45)' })
        // stadium camera-shake on impact (transform only, cheap)
        .to('.arena-stage', { x: -6, duration: 0.045, repeat: 5, yoyo: true }, '<')
        // SOLD! text punches in
        .fromTo(
          textRef.current,
          { scale: 0.5, autoAlpha: 0, letterSpacing: '0.6em' },
          { scale: 1, autoAlpha: 1, letterSpacing: '0.06em', duration: 0.45, ease: 'back.out(2.2)' },
          '-=0.15'
        )
        .fromTo(subRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, '-=0.1')
        // hold, then dissolve the whole overlay
        .to(containerRef.current, { autoAlpha: 0, duration: 0.5, delay: 1.3 });
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center opacity-0"
    >
      <div
        ref={burstRef}
        className="absolute w-40 h-40 rounded-full opacity-0"
        style={{ backgroundColor: teamColor, filter: 'blur(20px)' }}
      />
      <div
        ref={hammerRef}
        className="text-[9rem] leading-none opacity-0"
        style={{ filter: `drop-shadow(0 0 45px ${teamColor}aa)` }}
      >
        🔨
      </div>
      <div
        ref={textRef}
        className="font-display text-7xl md:text-9xl tracking-widest mt-2 opacity-0"
        style={{ color: teamColor, textShadow: `0 0 50px ${teamColor}` }}
      >
        SOLD!
      </div>
      {teamName ? (
        <div ref={subRef} className="font-mono text-xl md:text-2xl text-floodlight mt-3 tracking-[0.3em] opacity-0">
          TO {teamName.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}
