'use client';

import { useState } from 'react';
import TeamFormModal from './TeamFormModal';
import ConfirmDialog from './ConfirmDialog';

export default function ManageTeamsTab({ teams, pins, adminPin, createTeam, updateTeam, deleteTeam, flash, onPinsChanged }) {
  const [editingTeam, setEditingTeam] = useState(null); // null = closed, {} = create, {...team} = edit
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setFormError(null);
    setEditingTeam({});
  };
  const openEdit = (team) => {
    setFormError(null);
    setEditingTeam(team);
  };
  const closeForm = () => setEditingTeam(null);

  const handleSave = async (fields) => {
    setSaving(true);
    setFormError(null);
    const isEdit = Boolean(editingTeam?.id);
    const res = isEdit
      ? await updateTeam(adminPin, editingTeam.id, fields)
      : await createTeam(adminPin, fields);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    flash(isEdit ? 'Team updated' : 'Team added');
    setEditingTeam(null);
    onPinsChanged();
  };

  const handleDelete = async () => {
    const res = await deleteTeam(adminPin, deleteTarget.id);
    setDeleteTarget(null);
    flash(res.ok ? 'Team deleted' : res.error, !res.ok);
  };

  const copyInvite = (team) => {
    const pin = pins[team.id] ?? '????';
    const text = `${team.name} - your Epic Arena auction PIN is ${pin}. Bid here: ${window.location.origin}/owner`;
    navigator.clipboard?.writeText(text);
    flash('Invite text copied to clipboard');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs text-slate-soft tracking-widest">{teams.length} TEAMS</p>
        <button
          onClick={openCreate}
          className="bg-gold text-stadium font-mono text-sm font-bold rounded-lg px-4 py-2 hover:brightness-110 transition-all"
        >
          + Add Team
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...teams]
          .sort((a, b) => a.id - b.id)
          .map((team) => (
            <div key={team.id} className="arena-panel rounded-2xl p-4 border-t-4" style={{ borderTopColor: team.color_hex }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-display text-2xl leading-tight">{team.name}</p>
                  {team.sponsor_name ? (
                    <p className="font-mono text-xs text-slate-soft">sponsored by {team.sponsor_name}</p>
                  ) : (
                    <p className="font-mono text-xs text-slate-soft/50">no sponsor set</p>
                  )}
                </div>
                <span className="font-mono text-xs arena-panel rounded-full px-2 py-1 border border-stadium-line">
                  {team.short_code}
                </span>
              </div>

              <div className="text-sm text-slate-soft mb-3 space-y-0.5">
                <p>Captain: <span className="text-floodlight">{team.captain_name || '—'}</span></p>
                {team.captain_mobile && <p className="font-mono text-xs">{team.captain_mobile}</p>}
                <p>
                  Purse: <span className="text-gold font-mono">{team.purse_remaining?.toLocaleString('en-IN')}</span>
                  <span className="text-slate-soft/60"> / {team.purse_total?.toLocaleString('en-IN')}</span>
                </p>
                <p>Roster: <span className="text-floodlight">{team.roster_count}/7</span></p>
                <p className="font-mono">
                  PIN: <span className="text-gold tracking-widest">{pins[team.id] ?? '••••'}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(team)}
                  className="flex-1 arena-panel rounded-lg py-1.5 text-xs font-mono hover:border-gold border border-transparent transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => copyInvite(team)}
                  className="flex-1 arena-panel rounded-lg py-1.5 text-xs font-mono hover:border-gold border border-transparent transition-colors"
                >
                  Copy Invite
                </button>
                <button
                  onClick={() => setDeleteTarget(team)}
                  className="flex-1 arena-panel rounded-lg py-1.5 text-xs font-mono hover:border-danger border border-transparent transition-colors text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      <TeamFormModal
        open={Boolean(editingTeam)}
        team={editingTeam?.id ? editingTeam : null}
        knownPin={editingTeam?.id ? pins[editingTeam.id] : null}
        onClose={closeForm}
        onSave={handleSave}
        saving={saving}
        error={formError}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message="This can't be undone. Teams that already own purchased players can't be deleted - unsell those players first."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
