'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { FormField, TextInput, NumberInput } from './FormField';

const emptyForm = {
  name: '',
  short_code: '',
  sponsor_name: '',
  pin: '',
  captain_name: '',
  captain_mobile: '',
  captain_photo_url: '',
  purse_total: 10000,
  purse_remaining: 10000,
  color_hex: '#F5A623',
  logo_url: '',
};

export default function TeamFormModal({ open, team, knownPin, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(team);

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name ?? '',
        short_code: team.short_code ?? '',
        sponsor_name: team.sponsor_name ?? '',
        // team.pin never comes back from the normal read (it's
        // column-locked) - knownPin is fetched separately via the
        // admin_list_team_pins RPC when the Manage screen loads.
        pin: knownPin ?? '',
        captain_name: team.captain_name ?? '',
        captain_mobile: team.captain_mobile ?? '',
        captain_photo_url: team.captain_photo_url ?? '',
        purse_total: team.purse_total ?? 10000,
        purse_remaining: team.purse_remaining ?? 10000,
        color_hex: team.color_hex ?? '#F5A623',
        logo_url: team.logo_url ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [team, open, knownPin]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      // Blank PIN in edit mode means "leave unchanged" - the RPC
      // treats null as no-op via COALESCE, but an empty string would
      // fail its 4-digit validation, so translate '' -> null here.
      pin: form.pin === '' ? null : form.pin,
      purse_total: form.purse_total === '' ? null : Number(form.purse_total),
      purse_remaining: form.purse_remaining === '' ? null : Number(form.purse_remaining),
    });
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Team' : 'Add Team'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormField label="Team Name">
            <TextInput required value={form.name} onChange={set('name')} placeholder="e.g. Chennai Chargers" />
          </FormField>
          <FormField label="Short Code" hint="3-4 letters, shown on the Big Screen / hotkey grid">
            <TextInput
              required
              maxLength={4}
              value={form.short_code}
              onChange={(e) => setForm((f) => ({ ...f, short_code: e.target.value.toUpperCase() }))}
              placeholder="e.g. CHC"
            />
          </FormField>

          <FormField label="Sponsor Name" hint="Optional - shown alongside the team name">
            <TextInput value={form.sponsor_name} onChange={set('sponsor_name')} placeholder="e.g. Bright Motors" />
          </FormField>
          <FormField label="Team Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color_hex}
                onChange={set('color_hex')}
                className="w-10 h-9 rounded border border-stadium-line bg-transparent"
              />
              <TextInput value={form.color_hex} onChange={set('color_hex')} />
            </div>
          </FormField>

          <FormField
            label="Team PIN"
            hint={isEdit ? '4 digits - leave blank to keep the current PIN' : '4 digits - this is what the owner uses to log in'}
          >
            <TextInput
              required={!isEdit}
              maxLength={4}
              inputMode="numeric"
              value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="e.g. 1234"
            />
          </FormField>
          <FormField label="Logo URL" hint="Optional">
            <TextInput value={form.logo_url} onChange={set('logo_url')} placeholder="https://…" />
          </FormField>

          <FormField label="Captain Name">
            <TextInput value={form.captain_name} onChange={set('captain_name')} placeholder="e.g. Vikram" />
          </FormField>
          <FormField label="Captain Mobile">
            <TextInput value={form.captain_mobile} onChange={set('captain_mobile')} placeholder="e.g. 9876543210" />
          </FormField>

          <FormField label="Captain Photo URL" hint="Optional">
            <TextInput value={form.captain_photo_url} onChange={set('captain_photo_url')} placeholder="https://…" />
          </FormField>
          <div />

          <FormField label="Purse Total">
            <NumberInput value={form.purse_total} onChange={set('purse_total')} />
          </FormField>
          <FormField label="Purse Remaining" hint="Only change this to correct a mistake - it auto-updates on each sale">
            <NumberInput value={form.purse_remaining} onChange={set('purse_remaining')} />
          </FormField>
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
