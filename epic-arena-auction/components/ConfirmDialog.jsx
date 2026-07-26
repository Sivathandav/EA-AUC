'use client';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        className="arena-panel rounded-2xl p-6 w-full max-w-sm border border-danger/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl mb-2">{title}</h3>
        <p className="text-slate-soft text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 arena-panel rounded-xl py-2.5 font-mono text-sm hover:border-gold border border-transparent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 font-mono text-sm font-bold transition-colors ${
              danger ? 'bg-danger hover:brightness-110' : 'bg-gold text-stadium hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
