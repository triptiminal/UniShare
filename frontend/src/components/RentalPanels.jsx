import { useState } from 'react';
import { Bookings } from '../api';
import { useAsync } from '../hooks';
import { fmtDateTime, fmtTime, money } from '../lib/format';
import ImageUploader from './ImageUploader';
import { Chip, ErrorBox, Loading, Notice, Photo, Stars } from './ui';

const ANGLES = ['front', 'back', 'top', 'accessories'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Side-by-side handover vs return photos. Photos named in the lender's claim get a red outline. */
export function ComparisonView({ rows, evidence = [] }) {
  if (!rows.length) return <p className="muted">No photos have been added yet.</p>;
  return (
    <div className="stack">
      <div className="cmp"><span /><span className="eyebrow">Handover</span><span className="eyebrow">Return</span></div>
      {rows.map((r) => (
        <div key={r.angle} className="cmp">
          <b>{cap(r.angle)}</b>
          <div className="slot">{r.handover ? <><Photo src={r.handover.url} alt={`Handover ${r.angle}`} className="" /><span className="cap">{fmtDateTime(r.handover.uploadedAt)}</span></> : 'No photo'}</div>
          <div className={`slot ${r.returned && evidence.includes(r.returned.id) ? 'flag' : ''}`}>{r.returned ? <><Photo src={r.returned.url} alt={`Return ${r.angle}`} className="" /><span className="cap">{fmtDateTime(r.returned.uploadedAt)}{evidence.includes(r.returned.id) ? ' · marked' : ''}</span></> : 'No photo'}</div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonPanel({ bookingId, evidence = [], status }) {
  const C = useAsync(() => Bookings.comparison(bookingId), [bookingId, status]);
  return (
    <div className="card stack">
      <div className="row between"><h2>Handover vs return</h2>{evidence.length > 0 && <Chip tone="bad">{evidence.length} photo{evidence.length > 1 ? 's' : ''} marked</Chip>}</div>
      {C.loading ? <Loading /> : C.error ? <ErrorBox error={C.error} onRetry={C.reload} /> : <ComparisonView rows={C.data} evidence={evidence} />}
    </div>
  );
}

/** Condition photo slots for one stage (HANDOVER or RETURN). `footer(count)` renders the stage's action button. */
export function PhotoPanel({ bk, stage, canAdd, onChange, footer }) {
  const P = useAsync(() => Bookings.photos(bk.id), [bk.id, bk.status]);
  const [err, setErr] = useState('');
  const photos = (P.data || []).filter((p) => p.stage === stage);
  const latest = (a) => [...photos].reverse().find((p) => p.angle === a);
  const added = ANGLES.filter((a) => latest(a)).length;
  const add = (angle) => async (url) => {
    setErr('');
    try { await Bookings.addPhoto(bk.id, { stage, angle, url }); P.reload(); onChange && onChange(); }
    catch (e) { setErr(e.message); throw e; }
  };
  return (
    <div className="card stack">
      <div className="row between"><h2>{stage === 'HANDOVER' ? 'Handover photos' : 'Return photos'}</h2><Chip tone={added ? 'ok' : 'warn'}>{added} of {ANGLES.length} added</Chip></div>
      <p className="muted">{canAdd ? 'Both of you can add photos. Each one is timestamped and kept as evidence if there is a disagreement later.' : 'Photos taken at handover.'}</p>
      {P.loading ? <Loading /> : (
        <div className="slots">
          {ANGLES.map((a) => {
            const p = latest(a);
            if (p) return <div key={a} className="slot"><Photo src={p.url} alt={`${stage.toLowerCase()} ${a}`} /><span className="cap">{cap(a)} · {fmtTime(p.uploadedAt)}</span></div>;
            return canAdd
              ? <div key={a} className="slot empty"><span>{cap(a)}</span><ImageUploader folder="conditions" compact label="+ Add photo" onUploaded={add(a)} /></div>
              : <div key={a} className="slot empty">{cap(a)}<br />Not added</div>;
          })}
        </div>
      )}
      {err && <span className="err" role="alert">{err}</span>}
      {footer && footer(photos.length)}
    </div>
  );
}

/** Lender: after the return, either release the deposit or claim a deduction backed by photo evidence. */
export function ClaimForm({ bk, onDone }) {
  const P = useAsync(() => Bookings.photos(bk.id), [bk.id]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const returns = (P.data || []).filter((p) => p.stage === 'RETURN');
  const chosen = picked || new Set(returns.map((p) => p.id));
  const toggle = (id) => { const s = new Set(chosen); if (s.has(id)) s.delete(id); else s.add(id); setPicked(s); };
  const run = async (fn) => { setBusy(true); setErr(''); try { await fn(); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const claim = () => {
    const n = Number(amount);
    if (!(n > 0)) { setErr('Enter the amount you are claiming.'); return; }
    if (n > bk.depositAmount) { setErr(`The claim can't be more than the deposit (${money(bk.depositAmount)}).`); return; }
    if (!reason.trim()) { setErr('Explain what is different from the handover photos.'); return; }
    run(() => Bookings.claim(bk.id, { amount: n, reason: reason.trim(), evidencePhotoIds: [...chosen] }));
  };
  return (
    <div className="card stack">
      <h2>Claim a deduction</h2>
      <Notice tone="lav">Compare the photos, then decide. If everything matches, release the full deposit.</Notice>
      <div className="field"><label htmlFor="amt">Amount (max {money(bk.depositAmount)})</label><input id="amt" className="input" type="number" min="1" max={bk.depositAmount} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="field"><label htmlFor="why">What changed?</label><textarea id="why" className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Scratch near the lens ring that was not in the handover photos." /></div>
      {returns.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="small" style={{ marginBottom: 6 }}>Evidence attached</legend>
          {returns.map((p) => <label key={p.id} className="row" style={{ fontSize: 14 }}><input type="checkbox" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />Return · {cap(p.angle)} ({fmtTime(p.uploadedAt)})</label>)}</fieldset>
      )}
      {err && <span className="err" role="alert">{err}</span>}
      <button className="btn block" disabled={busy} onClick={claim}>Send claim to renter</button>
      <button className="btn ghost block" disabled={busy} onClick={() => run(() => Bookings.release(bk.id))}>No damage: release {money(bk.depositAmount)}</button>
    </div>
  );
}

/** Renter: accept the claimed deduction, or dispute it so an admin decides. */
export function RespondPanel({ bk, onDone }) {
  const s = bk.settlement;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (accept) => { setBusy(true); setErr(''); try { await Bookings.respond(bk.id, { accept, reason }); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return (
    <div className="card stack">
      <div className="row between"><h2>A damage claim on your rental.</h2><Chip tone="warn">Awaiting your response</Chip></div>
      <p><b>{bk.owner.name}'s reason:</b> {s.reason}</p>
      <hr className="hr" />
      <div className="kv"><span>Deposit held</span><span>{money(bk.depositAmount)}</span></div>
      <div className="kv"><span>Claimed by lender</span><span style={{ color: 'var(--bad-ink)' }}>− {money(s.claimedAmount)}</span></div>
      <div className="total"><b>You get back</b><b>{money(bk.depositAmount - s.claimedAmount)}</b></div>
      <button className="btn block" disabled={busy} onClick={() => run(true)}>Accept {money(s.claimedAmount)} deduction</button>
      <input className="input" placeholder="Tell us why you disagree (optional)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Why you disagree" />
      <button className="btn ghost block" disabled={busy} onClick={() => run(false)}>Dispute this claim</button>
      <p className="small">If you dispute, an admin compares the timestamped photos from both of you and decides. The final amount can be the full claim, a lower amount, or nothing.</p>
      {err && <span className="err" role="alert">{err}</span>}
    </div>
  );
}

export function SettlementCard({ bk }) {
  const s = bk.settlement;
  const deduction = Number(s?.finalDeduction ?? 0);
  const resolved = s && s.adminResolution !== 'NONE';
  return (
    <div className="card stack">
      <div className="row between"><h2>Deposit settled</h2>{resolved && <Chip tone="ok">Resolved by admin</Chip>}</div>
      <div className="kv"><span>Deposit held</span><span>{money(bk.depositAmount)}</span></div>
      <div className="kv"><span>{deduction > 0 ? 'Deduction applied' : 'Deduction'}</span><span style={{ color: deduction > 0 ? 'var(--bad-ink)' : undefined }}>{deduction > 0 ? `− ${money(deduction)}` : '₹0'}</span></div>
      <div className="total"><b>{bk.renterIsMe ? 'Refunded to you' : 'Refunded to renter'}</b><b>{money(bk.depositAmount - deduction)}</b></div>
      <p className="small">Refunds are sent through Razorpay to the original payment method.</p>
      {s?.adminNotes && <Notice tone="lav" title="Admin note">{s.adminNotes}</Notice>}
    </div>
  );
}

export function ReviewForm({ bk, other }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  const submit = async () => {
    setState('busy'); setErr('');
    try { await Bookings.review(bk.id, { rating, comment }); setState('done'); }
    catch (e) { if (e.status === 409) setState('done'); else { setErr(e.message); setState('idle'); } }
  };
  if (state === 'done') return <Notice tone="green" title="Thanks for sharing your feedback.">Ratings show on profiles and listings.</Notice>;
  return (
    <div className="card stack">
      <h2>How was {other.name.split(' ')[0]}?</h2>
      <Stars value={rating} onChange={setRating} />
      <textarea className="textarea" placeholder="Share how the handover went (optional)" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Review" />
      {err && <span className="err" role="alert">{err}</span>}
      <button className="btn block" disabled={state === 'busy'} onClick={submit}>Submit review</button>
      <p className="small">{other.name.split(' ')[0]} reviews you too. You can review once a rental is settled.</p>
    </div>
  );
}
