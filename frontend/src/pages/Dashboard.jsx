import { Link } from 'react-router-dom';
import { Bookings, Listings, Payments } from '../api';
import { Chip, ErrorBox, Loading, Notice, Photo, StatusChip } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks';
import { fmtRange, fmtShort, money } from '../lib/format';

const two = (n) => String(n).padStart(2, '0');

export default function Dashboard() {
  const { user } = useAuth();
  const D = useAsync(async () => {
    const [renter, owner, mine, earn] = await Promise.all([
      Bookings.list({ role: 'renter' }), Bookings.list({ role: 'owner' }), Listings.mine(), Payments.transactions('EARNING')]);
    return { renter, owner, mine: mine.filter((l) => l.status !== 'ARCHIVED'), earned: earn.reduce((s, t) => s + Number(t.amount), 0) };
  }, []);
  if (D.loading) return <Loading />;
  if (D.error) return <ErrorBox error={D.error} onRetry={D.reload} />;

  const { renter, owner, mine, earned } = D.data;
  const borrowing = renter.filter((b) => ['ACCEPTED', 'PAID', 'ACTIVE', 'RETURNED', 'UNDER_REVIEW', 'DISPUTED'].includes(b.status));
  const readyToPay = renter.filter((b) => b.status === 'ACCEPTED');
  const incoming = owner.filter((b) => b.status === 'REQUESTED');
  const featured = readyToPay[0] || borrowing[0];
  const steps = featured ? [['Requested', featured.requestedAt], ['Accepted', featured.acceptedAt], ['Payment', featured.paidAt], ['Pickup', featured.handoverAt]] : [];
  const first = user.name.split(' ')[0];

  return (
    <div className="stack">
      <div className="row between">
        <div className="head" style={{ margin: 0 }}><span className="eyebrow">Your campus, connected</span><h1>A little sharing goes a long way, {first}.</h1><p className="muted">Here's what's happening with your rentals and listings.</p></div>
        <Link className="btn" to="/">Explore items →</Link>
      </div>
      <div className="grid4">
        <div className="stat hl"><span className="muted">Items you're borrowing</span><b>{two(borrowing.length)}</b><span className="small">{readyToPay.length} ready for payment</span></div>
        <div className="stat"><span className="muted">Your live listings</span><b>{two(mine.length)}</b><span className="small">{mine.filter((l) => l.status === 'ACTIVE').length} available to rent</span></div>
        <div className="stat"><span className="muted">Incoming requests</span><b>{two(incoming.length)}</b><span className="small" style={{ color: 'var(--warn-ink)' }}>Waiting for your review</span></div>
        <div className="stat"><span className="muted">Rental earnings</span><b>{money(earned)}</b><span className="small">From completed rentals</span></div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
        <div className="card stack">
          <div className="row between"><h2>One step closer to your next adventure.</h2>{featured && <StatusChip status={featured.status} />}</div>
          {!featured ? <p className="muted">No active rentals yet. <Link to="/">Find something to borrow</Link>.</p> : (
            <>
              <div className="row">
                <Photo src={featured.listingPhoto} alt={featured.listingTitle} className="thumb" />
                <div className="grow"><b style={{ fontSize: 18 }}>{featured.listingTitle}</b><div className="muted">{featured.owner.name} · {fmtRange(featured.startDate, featured.endDate)}</div></div>
                <div style={{ textAlign: 'right' }}><b style={{ fontSize: 22 }}>{money(featured.total)}</b><div className="small">{featured.days}-day rental</div></div>
              </div>
              <div className="steps">{steps.map(([l, d]) => <div key={l} className={`step ${d ? 'done' : ''}`}><i>{d ? '✓' : ''}</i><b>{l}</b><span className="small">{d ? fmtShort(d) : 'Upcoming'}</span></div>)}</div>
              <div className="row"><Link className="btn" to={featured.status === 'ACCEPTED' ? `/rental/${featured.id}/pay` : `/rental/${featured.id}`}>{featured.status === 'ACCEPTED' ? `Pay ${money(featured.total)}` : 'View rental'}</Link><Link className="btn ghost" to={`/messages/${featured.id}`}>Message {featured.owner.name.split(' ')[0]}</Link></div>
            </>
          )}
        </div>
        <div className="card stack">
          <h2>A neighbour needs a hand.</h2><p className="muted">{incoming.length} request{incoming.length === 1 ? '' : 's'} waiting for you</p>
          {incoming[0] ? (
            <>
              <div className="row between"><b>{incoming[0].renter.name}</b><Chip tone="warn">Pending</Chip></div>
              <span className="muted">{incoming[0].listingTitle} · {fmtRange(incoming[0].startDate, incoming[0].endDate)}</span>
              <Link className="btn" to={`/requests?tab=incoming&sel=${incoming[0].id}`}>Review request</Link>
            </>
          ) : <p className="muted">All caught up.</p>}
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
        <div className="card stack">
          <div className="row between"><h2>Your shelf, shared.</h2><Link to="/my-listings">Manage all listings →</Link></div>
          {mine.length === 0 && <p className="muted">You haven't listed anything yet.</p>}
          {mine.slice(0, 3).map((l) => (
            <div key={l.id} className="row">
              <Photo src={l.photos?.[0]} alt={l.title} className="thumb" />
              <div className="grow"><b>{l.title}</b><div className="small">{money(l.pricePerDay)} / day</div></div>
              <Chip tone={l.status === 'ACTIVE' ? 'ok' : 'neutral'}>{l.status === 'ACTIVE' ? 'Available' : 'Not available'}</Chip>
              <Link className="btn ghost sm" to={`/listings/${l.id}/edit`}>Edit listing</Link>
            </div>
          ))}
        </div>
        <Notice tone="green" title="Good for your pocket. Better for your campus.">An unused item can be someone else's perfect find. Give your shelf a second life.
          <div style={{ marginTop: 14 }}><Link className="btn ghost sm" to="/listings/new">+ Share something new</Link></div></Notice>
      </div>
    </div>
  );
}
