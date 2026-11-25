import { Link } from 'react-router-dom';

export default function NotFound({ title = 'We couldn\'t find that page.', body = 'The link may be old, or the item is no longer shared.', to = '/', cta = 'Back to explore' }) {
  return (
    <div className="stack" style={{ maxWidth: 520, margin: '60px auto', alignItems: 'flex-start' }}>
      <span className="eyebrow">Hmm</span><h1>{title}</h1><p className="muted">{body}</p>
      <Link to={to} className="btn">{cta}</Link>
    </div>
  );
}
