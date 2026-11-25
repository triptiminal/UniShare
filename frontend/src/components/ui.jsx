import { useState } from 'react';
import { STATUS, initials } from '../lib/format';

export const Chip = ({ tone = 'ok', children }) => <span className={`chip ${tone}`}>{children}</span>;
export const StatusChip = ({ status }) => {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <Chip tone={s.tone}>{s.label}</Chip>;
};
export const Avatar = ({ name, src, size = 40 }) =>
  src ? <img className="avatar" src={src} alt="" style={{ width: size, height: size }} />
      : <span className="avatar" style={{ width: size, height: size, fontSize: size / 2.6 }}>{initials(name)}</span>;
export const Loading = () => <div className="loading">Loading…</div>;
export const Notice = ({ tone = 'lav', title, children }) => (
  <div className={`notice ${tone}`}>{title && <b>{title}</b>}{children}</div>
);
export const ErrorBox = ({ error, onRetry }) => (
  <div className="notice bad"><b>Something went wrong</b>{error?.message || 'Please try again.'}
    {onRetry && <div style={{ marginTop: 10 }}><button className="btn ghost sm" onClick={onRetry}>Try again</button></div>}
  </div>
);
export const Photo = ({ src, alt = '', className }) => {
  const [bad, setBad] = useState(false);
  return src && !bad ? <img src={src} alt={alt} className={className} onError={() => setBad(true)} />
                     : <div className={`ph ${className || ''}`} role="img" aria-label={alt}>{alt || 'No photo'}</div>;
};
export const Stars = ({ value, onChange }) => (
  <div role="radiogroup" aria-label="Rating" style={{ fontSize: 30, color: 'var(--pur)', letterSpacing: 4 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
        onClick={() => onChange(n)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 'inherit', color: 'inherit', padding: 0, opacity: n <= value ? 1 : 0.25 }}>★</button>
    ))}
  </div>
);
export const Field = ({ label, error, hint, children }) => (
  <div className="field"><label>{label}</label>{children}{hint && <span className="small">{hint}</span>}{error && <span className="err">{error}</span>}</div>
);
export const Empty = ({ title, children, action }) => (
  <div className="card stack" style={{ alignItems: 'flex-start' }}><h2>{title}</h2><p className="muted">{children}</p>{action}</div>
);
