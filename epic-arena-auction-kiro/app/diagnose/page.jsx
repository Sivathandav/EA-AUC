'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function DiagnosticsPage() {
  const [status, setStatus] = useState({
    connection: 'checking...',
    teams: 'checking...',
    players: 'checking...',
    error: null,
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
        if (teamsError) {
          setStatus({
            connection: '❌ Connection Failed',
            teams: `❌ ${teamsError.message}`,
            players: 'N/A',
            error: `Database Error: ${teamsError.message}`,
          });
          return;
        }

        const { data: playersData } = await supabase.from('players').select('*');

        setStatus({
          connection: '✅ Connected to Supabase',
          teams: teamsData ? `✅ ${teamsData.length} teams found` : '❌ 0 teams',
          players: playersData ? `✅ ${playersData.length} players found` : '❌ 0 players',
          error: null,
        });
      } catch (err) {
        setStatus({
          connection: '❌ Error',
          teams: 'N/A',
          players: 'N/A',
          error: err.message,
        });
      }
    };
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-stadium p-8 text-floodlight">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl mb-8 text-gold">🔍 Diagnostics</h1>

        <div className="space-y-4 mb-8">
          <div className="arena-panel rounded-lg p-4">
            <p className="font-mono text-xs text-slate-soft">CONNECTION</p>
            <p className="font-display text-lg mt-1">{status.connection}</p>
          </div>
          <div className="arena-panel rounded-lg p-4">
            <p className="font-mono text-xs text-slate-soft">TEAMS</p>
            <p className="font-display text-lg mt-1">{status.teams}</p>
          </div>
          <div className="arena-panel rounded-lg p-4">
            <p className="font-mono text-xs text-slate-soft">PLAYERS</p>
            <p className="font-display text-lg mt-1">{status.players}</p>
          </div>
        </div>

        {status.error && (
          <div className="arena-panel border border-danger rounded-lg p-4 mb-8">
            <p className="text-danger text-sm">{status.error}</p>
          </div>
        )}

        <div className="arena-panel rounded-lg p-6 space-y-4">
          <h2 className="font-display text-xl text-gold mb-4">📋 SETUP STEPS</h2>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Open your Supabase dashboard</li>
            <li>Go to SQL Editor</li>
            <li>Run schema.sql (create tables)</li>
            <li>Run rpc_functions.sql (create functions)</li>
            <li>Run seed_new_teams.sql (add teams)</li>
            <li>Refresh this page</li>
          </ol>
        </div>

        <a href="/" className="block mt-8 text-center text-gold hover:underline">← Back Home</a>
      </div>
    </div>
  );
}
