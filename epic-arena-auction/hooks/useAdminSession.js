'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ADMIN_PIN_KEY = 'epicArena.adminPin';

/**
 * useAdminSession
 * Mirrors the frictionless-PIN pattern used for team owners, but for
 * the single shared admin role. The PIN itself (not just a boolean
 * flag) is kept in localStorage and threaded into every admin RPC
 * call, because the real enforcement happens server-side inside
 * each `admin_*` Postgres function - the client-side gate here is
 * just what makes the UX pleasant (verify once, stay logged in).
 */
export function useAdminSession() {
  const [pin, setPin] = useState(undefined); // undefined = still checking storage
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PIN_KEY);
    if (!stored) {
      setPin(null);
      setChecking(false);
      return;
    }
    // Re-validate the stored PIN against the server on load, in case
    // it was rotated via admin_change_pin() from another device.
    supabase.rpc('verify_admin_pin', { p_pin: stored }).then(({ data, error }) => {
      if (!error && data === true) {
        setPin(stored);
      } else {
        localStorage.removeItem(ADMIN_PIN_KEY);
        setPin(null);
      }
      setChecking(false);
    });
  }, []);

  const login = useCallback(async (candidatePin) => {
    const { data, error } = await supabase.rpc('verify_admin_pin', { p_pin: candidatePin });
    if (error || data !== true) {
      return { ok: false, error: 'Incorrect admin PIN' };
    }
    localStorage.setItem(ADMIN_PIN_KEY, candidatePin);
    setPin(candidatePin);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_PIN_KEY);
    setPin(null);
  }, []);

  // Called after admin_change_pin() succeeds elsewhere in the app,
  // so this session doesn't get logged out by its own PIN rotation.
  const updateStoredPin = useCallback((newPin) => {
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
    setPin(newPin);
  }, []);

  return { pin, checking, login, logout, updateStoredPin };
}
