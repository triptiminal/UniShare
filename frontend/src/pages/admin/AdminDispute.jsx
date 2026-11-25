import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Admin } from '../../api';
import { ComparisonView } from '../../components/RentalPanels';
import { Chip, ErrorBox, Loading, Notice } from '../../components/ui';
import { useAsync } from '../../hooks';
import { money } from '../../lib/format';

export default function AdminDispute() {
  const { id } = useParams();
  const D = useAsync(() => Admin.dispute(id), [id]);
  const [mode, setMode] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (D.loading) return <Loading />;
  if (D.error) return <ErrorBox error={D.error} onRetry={D.reload} />;

  const { booking: b, comparison } = D.data;
  const s = b.settlement;
  const settled = b.status === 'SETTLED';
  const resolve = async (resolution) => {
    setBusy(true); setErr('');
    try { await Admin.resolve(b.id, { resolution, amount: resolution === 'ADJUSTED' ? Number(amount) : undefined, notes }); D.reload(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="small"><Link to="/admin/disputes">Disputes</Link> / {b.code}</div>
      <div className="row between"><h1>Dispute · {b.code}</h1><Chip tone={settled ? 'ok' : 'bad'}>{settled ? 'Settled' : 'Disputed'}</Chip></div>
      <p className="muted">{b.listingTitle} · Lender {b.owner.name} · Renter {b.renter.name}</p>
      <div className="card stack"><h2>Condition evidence</h2><ComparisonView rows={comparison} evidence={s?.evidencePhotoIds || []} /></div>
      <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card stack sm"><h2>Lender claim · {money(s?.claimedAmount)}</h2><span className="muted">{s?.reason}</span></div>
        <div className="card stack sm"><h2>Renter response · {s?.renterResponse === 'DISPUTED' ? 'Disputed' : s?.renterResponse}</h2><span className="muted">{s?.disputeReason || 'No reason given.'}</span></div>
      </div>
      {settled ? (
        <Notice tone="green" title={`Resolved: ${s.adminResolution.toLowerCase()}`}>Final deduction {money(s.finalDeduction)}. Renter refunded {money(b.depositAmount - s.finalDeduction)}.{s.adminNotes ? ` Note: ${s.adminNotes}` : ''}</Notice>
      ) : (
        <div className="card stack">
          <h2>Your decision</h2>
          <div className="field"><label htmlFor="n">Note for both parties (optional)</label><input id="n" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {mode === 'ADJUSTED' && <div className="field"><label htmlFor="a">Adjusted deduction (0 to {money(b.depositAmount)})</label><input id="a" className="input" type="number" min="0" max={b.depositAmount} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>}
          {err && <span className="err" role="alert">{err}</span>}
          <div className="row wrap">
            <button className="btn" disabled={busy} onClick={() => resolve('APPROVED')}>Approve claim · {money(s?.claimedAmount)}</button>
            {mode === 'ADJUSTED' ? <button className="btn ghost" disabled={busy || amount === ''} onClick={() => resolve('ADJUSTED')}>Confirm adjusted amount</button>
                                 : <button className="btn ghost" onClick={() => setMode('ADJUSTED')}>Adjust amount</button>}
            <button className="btn ghost" disabled={busy} onClick={() => resolve('REJECTED')}>Reject · refund {money(b.depositAmount)}</button>
          </div>
          <span className="small">Every decision is saved with your admin ID and a timestamp. Refunds go out through Razorpay immediately.</span>
        </div>
      )}
    </>
  );
}
