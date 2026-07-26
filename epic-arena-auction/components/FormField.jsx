'use client';

export function FormField({ label, children, hint }) {
  return (
    <label className="block mb-3">
      <span className="block font-mono text-xs text-slate-soft tracking-widest mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-soft/70 mt-1">{hint}</span>}
    </label>
  );
}

const baseInputClass =
  'w-full bg-stadium border border-stadium-line rounded-lg px-3 py-2 text-sm text-floodlight focus:border-gold outline-none transition-colors';

export function TextInput(props) {
  return <input {...props} className={`${baseInputClass} ${props.className ?? ''}`} />;
}

export function NumberInput(props) {
  return <input type="number" {...props} className={`${baseInputClass} ${props.className ?? ''}`} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select {...props} className={`${baseInputClass} ${props.className ?? ''}`}>
      {children}
    </select>
  );
}
