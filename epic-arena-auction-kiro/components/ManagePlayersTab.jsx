'use client';

import { useMemo, useState } from 'react';
import PlayerFormModal from './PlayerFormModal';
import ConfirmDialog from './ConfirmDialog';

const roleBadge = {
  Batsman: 'bg-blue-500/20 text-blue-300',
  Bowler: 'bg-red-500/20 text-red-300',
  'All-Rounder': 'bg-purple-500/20 text-purple-300',
  'Wicket-Keeper': 'bg-teal-500/20 text-teal-300',
};

const statusBadge = {
  pending: 'text-slate-soft',
  in_auction: 'text-gold',
  sold: 'text-turf',
  unsold: 'text-danger',
};

export default function ManagePlayersTab({ players, teams, adminPin, createPlayer, updatePlayer, deletePlayer, flash }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('queue_order');

  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  const nextQueueOrder = useMemo(
    () => (players.length ? Math.max(...players.map((p) => p.queue_order)) + 1 : 1),
    [players]
  );

  const filtered = useMemo(() => {
    let list = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.mobile ?? '').includes(q));
    }
    if (roleFilter !== 'all') {
      list = roleFilter === 'unassigned' ? list.filter((p) => !p.role) : list.filter((p) => p.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    const sorted = [...list];
    if (sortBy === 'queue_order') sorted.sort((a, b) => a.queue_order - b.queue_order);
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'base_price') sorted.sort((a, b) => b.base_price - a.base_price);
    if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [players, search, roleFilter, statusFilter, sortBy]);

  const unassignedCount = useMemo(() => players.filter((p) => !p.role).length, [players]);

  const openCreate = () => {
    setFormError(null);
    setShowCreate(true);
  };
  const openEdit = (player) => {
    setFormError(null);
    setEditingPlayer(player);
  };
  const closeForm = () => {
    setShowCreate(false);
    setEditingPlayer(null);
  };

  const handleSave = async (fields) => {
    setSaving(true);
    setFormError(null);
    const isEdit = Boolean(editingPlayer);
    const res = isEdit
      ? await updatePlayer(adminPin, editingPlayer.id, fields)
      : await createPlayer(adminPin, fields);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    flash(isEdit ? 'Player updated' : 'Player added');
    closeForm();
  };

  const handleDelete = async () => {
    const res = await deletePlayer(adminPin, deleteTarget.id);
    setDeleteTarget(null);
    flash(res.ok ? 'Player deleted' : res.error, !res.ok);
  };

  return (
    <div>
      {/* Summary + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="font-mono text-xs text-slate-soft tracking-widest">
          {players.length} PLAYERS
          {unassignedCount > 0 && <span className="text-gold"> · {unassignedCount} unassigned role</span>}
        </p>
        <button
          onClick={openCreate}
          className="ml-auto bg-gold text-stadium font-mono text-sm font-bold rounded-lg px-4 py-2 hover:brightness-110 transition-all"
        >
          + Add Player
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or mobile…"
          className="flex-1 min-w-[160px] bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
        >
          <option value="all">All Roles</option>
          <option value="unassigned">Unassigned</option>
          <option value="Batsman">Batsman</option>
          <option value="Bowler">Bowler</option>
          <option value="All-Rounder">All-Rounder</option>
          <option value="Wicket-Keeper">Wicket-Keeper</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_auction">In Auction</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
        >
          <option value="queue_order">Sort: Queue Order</option>
          <option value="name">Sort: Name</option>
          <option value="base_price">Sort: Base Price</option>
          <option value="rating">Sort: Rating</option>
        </select>
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="arena-panel rounded-xl p-3 flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <span className="font-mono text-xs text-slate-soft w-8 flex-shrink-0">#{p.queue_order}</span>

            <div className="min-w-[140px] flex-1">
              <p className="font-display text-lg leading-tight">{p.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    p.role ? roleBadge[p.role] : 'bg-gold/20 text-gold'
                  }`}
                >
                  {p.role || 'UNASSIGNED'}
                </span>
                {p.rating > 0 && <span className="text-gold text-xs">{'★'.repeat(p.rating)}</span>}
                {p.source_group && <span className="text-[10px] text-slate-soft/60 font-mono">{p.source_group}</span>}
              </div>
            </div>

            <span className="font-mono text-sm text-gold w-16 text-right flex-shrink-0">{p.base_price}</span>

            <span className={`font-mono text-xs uppercase w-20 text-center flex-shrink-0 ${statusBadge[p.status]}`}>
              {p.status.replace('_', ' ')}
            </span>

            <span className="font-mono text-xs text-slate-soft w-28 flex-shrink-0 hidden md:inline">
              {p.status === 'sold' && p.sold_to_team_id
                ? `→ ${teamById[p.sold_to_team_id]?.short_code ?? '?'} @ ${p.sold_price}`
                : p.mobile || '—'}
            </span>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => openEdit(p)}
                className="text-xs font-mono px-3 py-1.5 rounded-lg arena-panel hover:border-gold border border-transparent transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(p)}
                className="text-xs font-mono px-3 py-1.5 rounded-lg arena-panel hover:border-danger border border-transparent transition-colors text-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-slate-soft font-mono text-sm py-8">No players match your filters.</p>
        )}
      </div>

      <PlayerFormModal
        open={showCreate || Boolean(editingPlayer)}
        player={editingPlayer}
        nextQueueOrder={nextQueueOrder}
        onClose={closeForm}
        onSave={handleSave}
        saving={saving}
        error={formError}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message={
          deleteTarget?.status === 'sold'
            ? "This player was already sold - deleting will refund the purchasing team's purse and free their roster slot."
            : "This can't be undone."
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
