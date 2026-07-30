'use client';

import { useAdminSession } from '../../hooks/useAdminSession';
import { AdminPinContext } from '../../lib/adminContext';
import PinGate from '../../components/PinGate';

export default function AdminLayout({ children }) {
  const { pin, checking, login } = useAdminSession();

  if (checking) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-2xl text-gold tracking-widest">LOADING…</p>
      </div>
    );
  }

  if (!pin) {
    return (
      <PinGate
        eyebrow="EPIC ARENA · ADMIN"
        title="AUCTIONEER LOGIN"
        placeholderLabel="ENTER ADMIN PIN"
        buttonLabel="ENTER CONSOLE"
        onSubmit={login}
      />
    );
  }

  return <AdminPinContext.Provider value={pin}>{children}</AdminPinContext.Provider>;
}
