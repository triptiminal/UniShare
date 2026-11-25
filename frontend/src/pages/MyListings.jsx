import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookings, Listings } from '../api';
import { Chip, ErrorBox, Loading, Notice, Photo } from '../components/ui';
import { useAsync } from '../hooks';
import { condLabel, money } from '../lib/format';

export default function MyListings() {
  const L = useAsync(async () => {
    const [mine, owner, earn] = await Promise.all([Listings.mine(), Bookings.list({ role: 'owner' }), Promise.resolve(null)]);
    return { mine: mine.filter((l) => l.status !== 'ARCHIVED'), owner, earn };
  }, []);
  const [tab, setTab] = useState('all');
  const [err, setErr] = useState('');

  if (L.loading) return <Loading />;
  if (L.error) return <ErrorBox error={L.error} onRetry={L.reload} />;
  const { mine, owner } = L.data;
  const pending = (id) => owner.filter((b) => b.listingId === id && b.status === 'REQUESTED').length;
  const totalPending = owner.filter((b) => b.status === 'REQUESTED').length;
  const available = mine.filter((l) => l.status === 'ACTIVE');
  const hidden = mine.filter((l) => l.status === 'INACTIVE');
  const shown = tab === 'available' ? available : tab === 'hidden' ? hidden : mine;

  const toggle = async (l) => { setErr(''); try { await Listings.setStatus(l.id, l.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); L.reload(); } catch (e) { setErr(e.message); } };
  const remove = async (l) => {
    if (!window.confirm(`Remove "${l.title}"? Listings with rental history are archived instead of deleted.`)) return;
    try { await Listings.remove(l.id); L.reload(); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="stack">
      <div className="row between"><div className="head" style={{ margin: 0 }}><span className="eyebrow">My listings</span><h1>Your shelf. Their next good find.</h1><p className="muted">Manage what you share, keep availability current, and make room for new connections.</p></div>
        <Link className="btn" to="/listings/new">+ List something new</Link></div>
      <div className="grid4">
        <div className="stat"><span className="muted">Live listings</span><b>{String(mine.length).padStart(2, '0')}</b></div>
        <div className="stat hl"><span className="muted">Available to rent</span><b>{String(available.length).padStart(2, '0')}</b></div>
        <div className="stat"><span className="muted">Requests to review</span><b>{String(totalPending).padStart(2, '0')}</b></div>
        <div className="stat"><span className="muted">Not available</span><b>{String(hidden.length).padStart(2, '0')}</b></div>
      </div>
      <div className="tabs" role="tablist">
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All listings {mine.length}</button>
        <button className={tab === 'available' ? 'on' : ''} onClick={() => setTab('available')}>Available {available.length}</button>
        <button className={tab === 'hidden' ? 'on' : ''} onClick={() => setTab('hidden')}>Not available {hidden.length}</button>
      </div>
      {err && <span className="err" role="alert">{err}</span>}
      {shown.length === 0 && <Notice tone="lav" title="Nothing here yet.">Share something you rarely use. <Link to="/listings/new">List an item</Link></Notice>}
      <div className="cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {shown.map((l) => (
          <div key={l.id} className="lcard">
            <div className="img"><Photo src={l.photos?.[0]} alt={l.title} /><span className="tag">{l.status === 'ACTIVE' ? 'Available' : 'Not available'}</span></div>
            <div className="body">
              <Link to={`/listing/${l.id}`}><h3>{l.title}</h3></Link>
              <span className="muted">{condLabel(l.condition)} condition</span>
              <div className="row between"><span className="price"><b>{money(l.pricePerDay)}</b><span className="muted">/ day</span></span>{pending(l.id) > 0 && <Chip tone="warn">{pending(l.id)} pending</Chip>}</div>
              <div className="row"><Link to={`/listings/${l.id}/edit`} className="btn sm grow">Edit listing</Link><button className="btn ghost sm grow" onClick={() => toggle(l)}>{l.status === 'ACTIVE' ? 'Mark unavailable' : 'Mark available'}</button></div>
              <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => remove(l)}>Remove listing</button>
            </div>
          </div>
        ))}
      </div>
      <Notice tone="lav" title="Not lending for a while? Keep it simple.">Mark an item unavailable to stop new requests. Existing rental records stay in your activity.</Notice>
    </div>
  );
}
