'use client';

import { createContext, useContext } from 'react';

// Holds the verified admin PIN for the duration of the admin session.
// Set by app/admin/layout.jsx once verify_admin_pin() succeeds, then
// read by any admin page/component that needs to call an
// admin-gated RPC (place it in the p_admin_pin argument).
export const AdminPinContext = createContext(null);

export function useAdminPin() {
  const ctx = useContext(AdminPinContext);
  if (ctx === null) {
    throw new Error('useAdminPin() must be used inside app/admin/layout.jsx (AdminPinContext.Provider)');
  }
  return ctx;
}
