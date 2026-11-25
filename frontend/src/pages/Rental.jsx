import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookings } from '../api';
import { ClaimForm, ComparisonPanel, PhotoPanel, RespondPanel, ReviewForm, SettlementCard } from '../components/RentalPanels';
import { Avatar, ErrorBox, Loading, Notice, Photo, StatusChip } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks';
import { fmtDate, fmtRange, fmtShort, money } from '../lib/format';
import NotFound from './NotFound';

export default function Rental() {
  const { id } = useParams();
  const { user } = useAuth();
  const B = useAsync(() => Bookings.get(id), [id]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [declining, setDeclining] = useState(false);

  if (B.loading) return <Loading />;
  if (B.error?.status === 403) return <NotFound title="This rental is private." body="Only the renter and lender can view this activity. Sign in to the account associated with the rental." to="/dashboard" cta="Back to my dashboard" />;
  if (B.error?.status === 404) return <NotFound title="We couldn't find that rental." to="/dashboard" cta="Back to my dashboard" />;
  if (B.error) return <ErrorBox error={B.error} onRetry={B.reload} />;

  const bk = { ...B.data };
  const isOwner = bk.owner.id === user.id;
  bk.renterIsMe = !isOwner;
  const other = isOwner ? bk.renter : bk.owner;
  const st = bk.status;
  const act = async (fn) => { setBusy(true); setErr(''); try { await fn(); setDeclining(false); B.reload(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };

  const steps = [['Requested', bk.requestedAt], ['Accepted', bk.acceptedAt], ['Payment verified', bk.paidAt], ['Handover', bk.handoverAt], ['Return', bk.returnedAt], ['Settled', bk.settledAt]];
  const headline = {
    REQUESTED: isOwner ? 'A request is waiting for you.' : 'Request sent!',
    ACCEPTED: isOwner ? 'Accepted. Waiting for payment.' : `A yes from ${bk.owner.name.split(' ')[0]}.`,
    PAID: 'All set for a little adventure.', ACTIVE: 'Enjoy it. Return it with care.', RETURNED: isOwner ? 'Back home. Time for a quick check.' : 'Returned. Waiting for the lender\'s check.',
    UNDER_REVIEW: isOwner ? 'Claim sent. Waiting for the renter.' : 'A damage claim needs your response.', DEDUCTION_ACCEPTED: 'Deduction accepted.',
    DISPUTED: 'Under admin review.', SETTLED: 'A good share, all wrapped up.', DECLINED: 'This request was declined.', CANCELLED: 'This request was cancelled.',
  }[st];
  const evidence = bk.settlement?.evidencePhotoIds || [];

  return (
    <div className="stack">
      <div className="small"><Link to="/dashboard">Dashboard</Link> / Your rentals / {bk.code}</div>
      <div className="row between"><div className="head" style={{ margin: 0 }}><h1>{headline}</h1><p className="muted">Request, payment, and rental progress are tracked step by step.</p></div><Link className="btn ghost" to="/requests">View all rentals →</Link></div>
      {bk.paidAt && <Notice tone="green" title={`${money(bk.total)} payment verified`}>Recorded on {fmtDate(bk.paidAt)} · Rental {bk.code}</Notice>}
      {err && <span className="err" role="alert">{err}</span>}

      <div className="grid2">
        <div className="stack">
          <div className="card row" style={{ alignItems: 'flex-start' }}>
            <Photo src={bk.listingPhoto} alt={bk.listingTitle} className="thumb" />
            <div className="stack sm grow">
              <h2 style={{ fontSize: 28 }}>{bk.listingTitle}</h2>
              <span className="muted">{isOwner ? `Rented by ${bk.renter.name}` : `Lent by ${bk.owner.name}`}</span>
              <div className="row wrap"><StatusChip status={st} />{bk.paidAt && <span className="chip ok">Payment verified</span>}</div>
              <div className="row" style={{ gap: 40 }}><div><span className="eyebrow">Pickup</span><div>{fmtDate(bk.startDate)}</div></div><div><span className="eyebrow">Return</span><div>{fmtDate(bk.endDate)}</div></div></div>
            </div>
          </div>

          <div className="card stack">
            <h2>Every step, in one place.</h2>
            <div className="steps">{steps.map(([l, d]) => <div key={l} className={`step ${d ? 'done' : ''}`}><i>{d ? '✓' : ''}</i><b>{l}</b><span className="small">{d ? fmtShort(d) : 'Upcoming'}</span></div>)}</div>
          </div>

          {st === 'REQUESTED' && (
            <div className="card stack">
              {isOwner ? (
                <>
                  <h2>Review this request</h2><p className="muted">Check your item's availability before accepting. Payment is available only after you accept.</p>
                  <button className="btn" disabled={busy} onClick={() => act(() => Bookings.accept(bk.id))}>Accept request</button>
                  {declining ? <div className="row"><input className="input" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="btn danger" disabled={busy} onClick={() => act(() => Bookings.decline(bk.id, reason))}>Confirm</button></div>
                             : <button className="btn ghost" onClick={() => setDeclining(true)}>Decline</button>}
                </>
              ) : (
                <><h2>Waiting for {other.name.split(' ')[0]}.</h2><p className="muted">You won't be charged until your lender accepts.</p>
                  <button className="btn ghost" disabled={busy} onClick={() => act(() => Bookings.cancel(bk.id))}>Cancel request</button></>
              )}
            </div>
          )}

          {st === 'ACCEPTED' && (
            <div className="card stack">
              {isOwner ? <><h2>Accepted</h2><p className="muted">{other.name} can now pay. You'll be notified when it's confirmed.</p></>
                       : <><h2>Your request is accepted.</h2><p className="muted">Pay securely to confirm. You pay rent, a small platform fee, and a refundable deposit.</p><Link className="btn" to={`/rental/${bk.id}/pay`}>Review &amp; pay {money(bk.total)} →</Link></>}
              <button className="btn ghost" disabled={busy} onClick={() => act(() => Bookings.cancel(bk.id))}>Cancel this rental</button>
            </div>
          )}

          {st === 'PAID' && (
            <PhotoPanel bk={bk} stage="HANDOVER" canAdd onChange={B.reload}
              footer={(n) => isOwner ? (
                <><button className="btn block" disabled={busy || n === 0} onClick={() => act(() => Bookings.handover(bk.id))}>Confirm handover</button>
                  {n === 0 && <span className="small">Add at least one photo to confirm the handover.</span>}</>
              ) : <span className="small">The lender confirms the handover once at least one photo is added. Check the item together first.</span>} />
          )}

          {st === 'ACTIVE' && (
            <>
              <PhotoPanel bk={bk} stage="RETURN" canAdd onChange={B.reload}
                footer={(n) => !isOwner ? (
                  <><button className="btn block" disabled={busy || n === 0} onClick={() => act(() => Bookings.returned(bk.id))}>Mark as returned</button>
                    {n === 0 && <span className="small">Add at least one return photo first.</span>}</>
                ) : <span className="small">The renter marks the item returned once photos are added.</span>} />
              <PhotoPanel bk={bk} stage="HANDOVER" canAdd={false} />
            </>
          )}

          {st === 'RETURNED' && (
            <>
              <ComparisonPanel bookingId={bk.id} status={st} />
              {isOwner ? <ClaimForm bk={bk} onDone={B.reload} /> : <Notice tone="lav" title="Waiting for the lender's check.">They will compare the photos and either release your deposit or raise a claim.</Notice>}
            </>
          )}

          {(st === 'UNDER_REVIEW' || st === 'DEDUCTION_ACCEPTED') && bk.settlement && (
            <>
              <ComparisonPanel bookingId={bk.id} evidence={evidence} status={st} />
              {isOwner ? <Notice tone="warn" title="Claim sent.">You claimed {money(bk.settlement.claimedAmount)}. Waiting for {other.name.split(' ')[0]} to accept or dispute it.</Notice>
                       : <RespondPanel bk={bk} onDone={B.reload} />}
            </>
          )}

          {st === 'DISPUTED' && bk.settlement && (
            <>
              <Notice tone="bad" title="This claim is under admin review.">An admin is comparing the timestamped photos from both of you. You'll be notified of the decision.</Notice>
              <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="card stack sm"><h3>Lender claim · {money(bk.settlement.claimedAmount)}</h3><span className="muted">{bk.settlement.reason}</span></div>
                <div className="card stack sm"><h3>Renter response</h3><span className="muted">{bk.settlement.disputeReason || 'Disputed'}</span></div>
              </div>
              <ComparisonPanel bookingId={bk.id} evidence={evidence} status={st} />
            </>
          )}

          {st === 'SETTLED' && (
            <>
              <SettlementCard bk={bk} />
              <ReviewForm bk={bk} other={other} />
            </>
          )}

          {st === 'DECLINED' && <Notice tone="bad" title="Declined">{bk.declineReason || 'The lender could not lend this item for those dates.'} <Link to="/">Explore other items</Link></Notice>}
          {st === 'CANCELLED' && <Notice tone="lav" title="Cancelled">This rental was cancelled. Nothing was charged.</Notice>}
        </div>

        <aside className="stack">
          <div className="card stack">
            <div className="row"><Avatar name={other.name} src={other.profilePhotoUrl} size={46} /><div><Link to={`/u/${other.id}`}><b>{other.name}</b></Link><div className="small">{isOwner ? 'Renter' : 'Lender'} · {other.campus || 'Medi-Caps University'}</div></div></div>
            {!['DECLINED', 'CANCELLED'].includes(st) && <Link className="btn block" to={`/messages/${bk.id}`}>Message {isOwner ? 'renter' : 'lender'}</Link>}
            <hr className="hr" /><div className="kv"><span>Rental</span><span>{bk.code}</span></div>
            <div className="kv"><span>Dates</span><span>{fmtRange(bk.startDate, bk.endDate)}</span></div>
          </div>
          <div className="card stack">
            <h2>{bk.paidAt ? 'Payment, settled.' : 'Payment summary'}</h2>
            <div className="kv"><span>{money(bk.rentalPrice / bk.days)} × {bk.days} days</span><span>{money(bk.rentalPrice)}</span></div>
            <div className="kv"><span>Platform fee</span><span>{money(bk.platformFee)}</span></div>
            <div className="kv"><span>Refundable deposit</span><span>{money(bk.depositAmount)}</span></div>
            <div className="total"><b>Total</b><b>{money(bk.total)}</b></div>
            <div className="kv"><span>Payment status</span><span>{bk.paidAt ? 'Verified' : 'Not paid'}</span></div>
            {!isOwner && st === 'ACCEPTED' && <Link className="btn block" to={`/rental/${bk.id}/pay`}>Continue to payment</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
