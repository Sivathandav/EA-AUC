'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { FormField, TextInput, NumberInput, SelectInput } from './FormField';

const emptyForm = {
  name: '',
  role: '',
  base_price: 100,
  queue_order: '',
  photo_url: '',
  mobile: '',
  rating: 0,
  entry_fee: '',
  source_group: '',
};

export default function PlayerFormModal({ open, player, nextQueueOrder, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(player);

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name ?? '',
        role: player.role ?? '',
        base_price: player.base_price ?? 100,
        queue_order: player.queue_order ?? '',
        photo_url: player.photo_url ?? '',
        mobile: player.mobile ?? '',
        rating: player.rating ?? 0,
        entry_fee: player.entry_fee ?? '',
        source_group: player.source_group ?? '',
      });
    } else {
      setForm({ ...emptyForm, queue_order: nextQueueOrder ?? '' });
    }
  }, [player, open, nextQueueOrder]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      role: form.role === '' ? null : form.role,
      clear_role: form.role === '',
      base_price: form.base_price === '' ? null : Number(form.base_price),
      queue_order: form.queue_order === '' ? null : Number(form.queue_order),
      rating: form.rating === '' ? 0 : Number(form.rating),
      entry_fee: form.entry_fee === '' ? null : Number(form.entry_fee),
    });
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Player' : 'Add Player'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormField label="Player Name">
            <TextInput required value={form.name} onChange={set('name')} placeholder="e.g. Virat Kohli" />
          </FormField>
          <FormField label="Role">
            <SelectInput value={form.role} onChange={set('role')}>
              <option value="">Unassigned</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket-Keeper">Wicket-Keeper</option>
            </SelectInput>
          </FormField>

          <FormField label="Base Price">
            <NumberInput required value={form.base_price} onChange={set('base_price')} />
          </FormField>
          <FormField label="Rating" hint="0 = unrated, 1 = ★, 2 = ★★">
            <SelectInput value={form.rating} onChange={set('rating')}>
              <option value={0}>Unrated</option>
              <option value={1}>★</option>
              <option value={2}>★★</option>
            </SelectInput>
          </FormField>

          <FormField label="Mobile" hint="Optional">
            <TextInput value={form.mobile} onChange={set('mobile')} placeholder="e.g. 9876543210" />
          </FormField>
          <FormField label="Entry Fee" hint="Optional - informational only">
            <NumberInput value={form.entry_fee} onChange={set('entry_fee')} placeholder="e.g. 400" />
          </FormField>

          <FormField label="Queue Position" hint="Order this player comes up for auction">
            <NumberInput value={form.queue_order} onChange={set('queue_order')} />
          </FormField>
          <FormField label="Source Group" hint="Optional note, e.g. original sign-up group">
            <TextInput value={form.source_group} onChange={set('source_group')} placeholder="e.g. Bhai Team" />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Photo URL" hint="Optional - shows on the Big Screen">
              <TextInput value={form.photo_url} onChange={set('photo_url')} placeholder="https://…" />
            </FormField>
          </div>
        </div>

        {error && <p className="text-danger text-sm mb-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 arena-panel rounded-xl py-2.5 font-mono text-sm hover:border-gold border border-transparent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gold text-stadium rounded-xl py-2.5 font-mono text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
