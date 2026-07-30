'use client';

export default function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start md:items-center justify-center bg-black/70 p-3 md:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className={`arena-panel rounded-2xl p-5 md:p-6 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-6 border border-gold/30`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl md:text-3xl tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stadium-line transition-colors text-slate-soft"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
