'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLiveAuction } from '../../../hooks/useLiveAuction';
import { useAdminSession } from '../../../hooks/useAdminSession';
import { useAdminPin } from '../../../lib/adminContext';
import ManageTeamsTab from '../../../components/ManageTeamsTab';
import ManagePlayersTab from '../../../components/ManagePlayersTab';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function ManagePage() {
  const adminPin = useAdminPin();
  const { logout, updateStoredPin } = useAdminSession();

  const {
    teams,
    players,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    listTeamPins,
    createPlayer,
    updatePlayer,
    deletePlayer,
    changeAdminPin,
    resetAuction,
  } = useLiveAuction();

  const [tab, setTab] = useState('teams');
  const [pins, setPins] = useState({});
  const [toast, setToast] = useState(null);

  const flash = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshPins = useCallback(async () => {
    const res = await listTeamPins(adminPin);
    if (res.ok) setPins(res.pins);
  }, [listTeamPins, adminPin]);

  useEffect(() => {
    refreshPins();
  }, [refreshPins]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-2xl text-gold tracking-widest">LOADING MANAGE…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stadium text-floodlight">
      <header className="arena-panel border-b border-stadium-line p-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-mono text-xs text-slate-soft hover:text-gold transition-colors">
            ← Console
          </Link>
          <h1 className="font-display text-2xl tracking-wide">MANAGE</h1>
        </div>
        <div className="flex gap-2">
          {['teams', 'players', 'settings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-full transition-colors ${
                tab === t ? 'bg-gold text-stadium font-bold' : 'arena-panel hover:border-gold border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 md:p-8">
        {tab === 'teams' && (
          <ManageTeamsTab
            teams={teams}
            pins={pins}
            adminPin={adminPin}
            createTeam={createTeam}
            updateTeam={updateTeam}
            deleteTeam={deleteTeam}
            flash={flash}
            onPinsChanged={refreshPins}
          />
        )}

        {tab === 'players' && (
          <ManagePlayersTab
            players={players}
            teams={teams}
            adminPin={adminPin}
            createPlayer={createPlayer}
            updatePlayer={updatePlayer}
            deletePlayer={deletePlayer}
            flash={flash}
          />
        )}

        {tab === 'settings' && (
          <SettingsTab
            adminPin={adminPin}
            changeAdminPin={changeAdminPin}
            resetAuction={resetAuction}
            updateStoredPin={updateStoredPin}
            logout={logout}
            flash={flash}
          />
        )}
      </main>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 arena-panel rounded-xl px-5 py-3 font-mono text-sm border z-30 ${
            toast.isError ? 'border-danger text-danger' : 'border-gold text-gold'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ adminPin, changeAdminPin, resetAuction, updateStoredPin, logout, flash }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [changing, setChanging] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const submitPinChange = async (e) => {
    e.preventDefault();
    setChanging(true);
    setPinError(null);
    const res = await changeAdminPin(currentPin, newPin);
    setChanging(false);
    if (!res.ok) {
      setPinError(res.error);
      return;
    }
    updateStoredPin(newPin);
    setCurrentPin('');
    setNewPin('');
    flash('Admin PIN updated');
  };

  const doReset = async () => {
    const res = await resetAuction(adminPin);
    setConfirmReset(false);
    flash(res.ok ? 'Auction reset - all sales cleared, purses restored' : res.error, !res.ok);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="arena-panel rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-1">Change Admin PIN</h2>
        <p className="text-slate-soft text-sm mb-4">
          This single PIN protects the Auctioneer Console and this Manage screen. Change it from the default before your event.
        </p>
        <form onSubmit={submitPinChange} className="space-y-3">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Current PIN"
            className="w-full bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:border-gold outline-none"
          />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="New PIN (4 digits)"
            className="w-full bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:border-gold outline-none"
          />
          {pinError && <p className="text-danger text-sm">{pinError}</p>}
          <button
            type="submit"
            disabled={currentPin.length !== 4 || newPin.length !== 4 || changing}
            className="w-full bg-gold text-stadium font-mono text-sm font-bold rounded-lg py-2.5 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {changing ? 'Updating…' : 'Update PIN'}
          </button>
        </form>
      </div>

      <div className="arena-panel rounded-2xl p-6 border border-danger/30">
        <h2 className="font-display text-2xl mb-1 text-danger">Reset Auction</h2>
        <p className="text-slate-soft text-sm mb-4">
          Rehearsal tool: clears every sale and bid, restores every team's purse to its starting total, and puts every player
          back to Pending. Teams and players themselves are kept. Use this to run a practice auction before the real event.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full bg-danger font-mono text-sm font-bold rounded-lg py-2.5 hover:brightness-110 transition-all"
        >
          Reset Auction Data
        </button>
      </div>

      <button onClick={logout} className="font-mono text-xs text-slate-soft hover:text-gold transition-colors">
        Log out of admin
      </button>

      <ConfirmDialog
        open={confirmReset}
        title="Reset the entire auction?"
        message="Every sale, every bid, and every purse will be wiped back to the starting state. This cannot be undone."
        confirmLabel="Reset Everything"
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
