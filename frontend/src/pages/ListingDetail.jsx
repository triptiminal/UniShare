import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bookings, Listings } from '../api';
import { Avatar, Chip, ErrorBox, Loading, Notice, Photo, Stars } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks';
import { catLabel, condLabel, daysBetween, fmtRange, fmtShort, money, todayStr } from '../lib/format';
import NotFound from './NotFound';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const L = useAsync(() => Listings.get(id), [id]);
  const reviews = useAsync(() => Listings.reviews(id), [id]);
  const mine = useAsync(() => (user ? Bookings.list({ role: 'renter' }) : []), [user?.id]);
  const [start, setStart] = useState(todayStr(1));
  const [end, setEnd] = useState(todayStr(4));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [reported, setReported] = useState(false);
  useEffect(() => { setErr(''); }, [start, end]);

  if (L.loading) return <Loading />;
  if (L.error?.status === 404) return <NotFound title="Someone beat you to it." body="This item is no longer available for new requests. Explore other things being shared on campus." cta="Back to explore" />;
  if (L.error) return <ErrorBox error={L.error} onRetry={L.reload} />;

  const l = L.data;
  const isMine = user && l.owner.id === user.id;
  const days = end > start ? daysBetween(start, end) : 0;
  const clash = (l.blockedRanges || []).some((r) => start < r.end && end > r.start);
  const unavailable = l.status !== 'ACTIVE';
  const conversation = (mine.data || []).find((b) => b.listingId === l.id && !['DECLINED', 'CANCELLED'].includes(b.status));
  const needsVerify = user && user.verificationStatus !== 'VERIFIED';

  const request = async () => {
    if (!user) { nav('/login', { state: { from: loc } }); return; }
    setBusy(true); setErr('');
    try { const b = await Bookings.create({ listingId: l.id, startDate: start, endDate: end }); nav(`/rental/${b.id}`); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const report = async () => {
    const reason = window.prompt('What is wrong with this listing?');
    if (reason === null) return;
    try { await Listings.report(l.id, reason); setReported(true); } catch (ex) { setErr(ex.message); }
  };

  return (
    <div className="stack">
      <div className="small"><Link to="/">Explore</Link> / {catLabel(l.category)} / {l.title}</div>
      <div className="head"><h1>{l.title}</h1><p className="muted">{[catLabel(l.category), l.subcategory, condLabel(l.condition) + ' condition'].filter(Boolean).join(' · ')}</p></div>
      <div className="grid2">
        <div className="stack">
          <div style={{ position: 'relative' }}>
            <Photo src={l.photos?.[0]} alt={l.title} className="detail-img" />
            <span className="chip ok" style={{ position: 'absolute', left: 16, top: 16, background: '#fff' }}>{unavailable ? 'Not available' : '● Available'}</span>
          </div>
          {l.photos?.length > 1 && <div className="row wrap">{l.photos.slice(1).map((p) => <Photo key={p} src={p} alt="" className="thumb" />)}</div>}
          <p style={{ lineHeight: 1.6 }}>{l.description || 'No description provided.'}</p>
          {l.includedItems?.length > 0 && (
            <div className="card row wrap" style={{ background: '#F0EEEA', border: 0 }}>{l.includedItems.map((i) => <span key={i} className="muted" style={{ marginRight: 18 }}>{i}</span>)}</div>
          )}
          <div className="stack sm">
            <h2>Meet your lender</h2>
            <div className="row between card">
              <Link to={`/u/${l.owner.id}`} className="row" style={{ color: 'inherit' }}>
                <Avatar name={l.owner.name} src={l.owner.profilePhotoUrl} size={48} />
                <div><b>{l.owner.name}</b><div className="muted">{[l.owner.yearOfStudy, l.owner.branch].filter(Boolean).join(', ') || 'Student'} · {l.owner.campus || 'Medi-Caps University'}</div></div>
                {l.owner.verified && <Chip tone="ok">Verified</Chip>}
              </Link>
              {conversation
                ? <Link className="btn ghost" to={`/messages/${conversation.id}`}>Message lender</Link>
                : <span className="small" style={{ maxWidth: 180, textAlign: 'right' }}>Messaging opens once you send a request.</span>}
            </div>
          </div>
          <div className="stack sm">
            <h2>Reviews {l.ratingCount > 0 && <span className="muted" style={{ fontFamily: 'DM Sans', fontSize: 15 }}>· {l.ratingAvg.toFixed(1)} ★ ({l.ratingCount})</span>}</h2>
            {(reviews.data || []).length === 0 && <p className="muted">No reviews yet.</p>}
            {(reviews.data || []).map((r) => (
              <div key={r.id} className="card stack sm"><div className="row between"><b>{r.reviewerName}</b><Stars value={r.rating} onChange={() => {}} /></div>{r.comment && <p className="muted">{r.comment}</p>}</div>
            ))}
          </div>
          {!isMine && <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={report} disabled={reported}>{reported ? 'Thanks, we will take a look.' : 'Report this listing'}</button>}
        </div>

        <aside className="stack">
          <div className="card stack">
            <h2>Make it yours. Just for a while.</h2>
            <div className="price"><b style={{ fontSize: 34 }}>{money(l.pricePerDay)}</b><span className="muted">/ day</span></div>
            <hr className="hr" />
            {isMine ? (
              <><Notice tone="lav" title="This is your listing">You can't rent your own item.</Notice><Link to={`/listings/${l.id}/edit`} className="btn block">Edit listing</Link></>
            ) : (
              <>
                <b style={{ fontSize: 14 }}>Your rental dates</b>
                <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field"><label htmlFor="pk">Pickup date</label><input id="pk" className="input" type="date" min={todayStr()} value={start} onChange={(e) => setStart(e.target.value)} /></div>
                  <div className="field"><label htmlFor="rt">Return date</label><input id="rt" className="input" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
                </div>
                <div className="kv"><span>Rental charge</span><span>{days > 0 ? `${money(l.pricePerDay)} × ${days} day${days > 1 ? 's' : ''}` : '—'}</span></div>
                <div className="kv"><span>Refundable deposit</span><span>{money(l.depositAmount)}</span></div>
                <div className="total"><b style={{ fontSize: 15 }}>Estimated rent</b><b>{days > 0 ? money(l.pricePerDay * days) : '—'}</b></div>
                {days <= 0 && <span className="err">The return date must be after the pickup date.</span>}
                {clash && <span className="err">Those dates are already booked. Try other dates.</span>}
                {err && <span className="err" role="alert">{err}</span>}
                {needsVerify && <Notice tone="warn"><Link to="/verify">Verify your college</Link> to send a request.</Notice>}
                <button className="btn block" onClick={request} disabled={busy || days <= 0 || clash || unavailable || (needsVerify && !!user)}>{busy ? 'Sending…' : 'Send rental request →'}</button>
                <p className="muted" style={{ textAlign: 'center' }}>You won't be charged yet.</p>
                <Notice tone="lav" title="First, a quick yes from your lender.">Pay securely after your request is accepted. A platform fee and the refundable deposit are added at checkout.</Notice>
              </>
            )}
          </div>
          {(l.blockedRanges || []).length > 0 && (
            <div className="card stack sm"><b>Already booked</b>{l.blockedRanges.map((r) => <span key={r.bookingId} className="muted">{fmtRange(r.start, r.end)}</span>)}</div>
          )}
          <Notice tone="green" title="A good exchange starts with a conversation.">Agree on condition, pickup, and return with your lender. Photos are taken at handover and return to keep everyone protected.</Notice>
        </aside>
      </div>
    </div>
  );
}
