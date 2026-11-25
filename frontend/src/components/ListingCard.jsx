import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Saved } from '../api';
import { catLabel, condLabel, money } from '../lib/format';
import { Photo } from './ui';

export default function ListingCard({ l, saved, onSaved }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const toggle = async (e) => {
    e.preventDefault();
    if (!user) return nav('/login');
    try { if (saved) await Saved.remove(l.id); else await Saved.add(l.id); onSaved && onSaved(l.id, !saved); } catch { /* ignore */ }
    return undefined;
  };
  return (
    <Link to={`/listing/${l.id}`} className="lcard">
      <div className="img">
        <Photo src={l.photos?.[0]} alt={l.title} />
        <span className="tag">{l.status === 'ACTIVE' ? 'Available' : 'Not available'}</span>
        <button className="heart" onClick={toggle} aria-label={saved ? 'Remove from saved' : 'Save item'} aria-pressed={!!saved}>{saved ? '♥' : '♡'}</button>
      </div>
      <div className="body">
        <span className="eyebrow">{catLabel(l.category)}</span>
        <h3>{l.title}</h3>
        <span className="muted">{[l.subcategory, condLabel(l.condition)].filter(Boolean).join(' · ')}</span>
        <div className="row between" style={{ marginTop: 6 }}>
          <span className="price"><b>{money(l.pricePerDay)}</b><span className="muted">/ day</span></span>
          <span className="small">{l.campus || 'On campus'}</span>
        </div>
      </div>
    </Link>
  );
}
