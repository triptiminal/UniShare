import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Admin } from '../../api';
import { Chip, ErrorBox, Loading, Photo } from '../../components/ui';
import { useAsync } from '../../hooks';
import { money } from '../../lib/format';

export default function AdminListings() {
  const [flagged, setFlagged] = useState(true);
  const L = useAsync(() => Admin.listings({ flagged, size: 50 }), [flagged]);
  const [err, setErr] = useState('');
  const run = async (fn) => { setErr(''); try { await fn(); L.reload(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <div className="head"><h1>Listings</h1><p className="muted">Review reported listings, restore them, or archive them.</p></div>
      <div className="tabs"><button className={flagged ? 'on' : ''} onClick={() => setFlagged(true)}>Flagged</button><button className={!flagged ? 'on' : ''} onClick={() => setFlagged(false)}>All listings</button></div>
      {err && <span className="err" role="alert">{err}</span>}
      {L.loading ? <Loading /> : L.error ? <ErrorBox error={L.error} onRetry={L.reload} /> : (
        <div className="stack">
          {L.data.items.length === 0 && <p className="muted">Nothing to show.</p>}
          {L.data.items.map((l) => (
            <div key={l.id} className="card row">
              <Photo src={l.photos?.[0]} alt={l.title} className="thumb" />
              <div className="grow"><Link to={`/listing/${l.id}`}><b>{l.title}</b></Link><div className="muted">{l.owner.name} · {money(l.pricePerDay)} / day</div></div>
              {l.flagged && <Chip tone="bad">Flagged</Chip>}<Chip tone={l.status === 'ACTIVE' ? 'ok' : 'neutral'}>{l.status.toLowerCase()}</Chip>
              {l.flagged ? <button className="btn ghost sm" onClick={() => run(() => Admin.moderate(l.id, 'unflag'))}>Unflag</button>
                         : <button className="btn ghost sm" onClick={() => { const r = window.prompt('Reason'); if (r !== null) run(() => Admin.moderate(l.id, 'flag', r)); }}>Flag</button>}
              {l.status !== 'ARCHIVED' && <button className="btn danger sm" onClick={() => run(() => Admin.moderate(l.id, 'archive'))}>Archive</button>}
            </div>
          ))}
        </div>)}
    </>
  );
}
