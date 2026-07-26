'use client';

import { useState } from 'react';

/**
 * PinGate - shared 4-digit PIN entry screen used by both the Admin
 * login and the Franchise Owner login. `onSubmit` should return
 * `{ ok: true }` on success or `{ ok: false, error }` on failure.
 */
export default function PinGate({
  eyebrow = 'EPIC ARENA',
  title,
  placeholderLabel = 'ENTER 4-DIGIT PIN',
  buttonLabel = 'ENTER',
  onSubmit,
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    setError(null);
    const res = await onSubmit(pin);
    setBusy(false);
    if (!res?.ok) {
      setError(res?.error || 'Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-stadium flex flex-col items-center justify-center px-6">
      <p className="font-mono text-gold text-xs tracking-[0.4em] mb-2">{eyebrow}</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-8 text-center">{title}</h1>

      <div className="arena-panel rounded-2xl p-6 w-full max-w-xs">
        <p className="font-mono text-xs text-slate-soft tracking-widest mb-3 text-center">{placeholderLabel}</p>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full text-center font-mono text-4xl tracking-[0.5em] bg-transparent border-b-2 border-gold/40 focus:border-gold outline-none py-2 mb-4"
          placeholder="••••"
          autoFocus
        />
        {error && <p className="text-danger text-sm text-center mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={pin.length !== 4 || busy}
          className="w-full bg-gold text-stadium font-display text-xl tracking-widest rounded-xl py-3 disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          {busy ? 'CHECKING…' : buttonLabel}
        </button>
      </div>
    </div>
  );
}
