import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookings, Payments } from '../api';
import { ErrorBox, Loading, Notice, Photo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks';
import { fmtDate, money } from '../lib/format';
import { loadRazorpay } from '../lib/razorpay';
import NotFound from './NotFound';

const OUTCOMES = {
  verified: { tone: 'green', title: 'Payment received', body: 'Your payment has been verified.', btn: 'View rental' },
  pending: { tone: 'warn', title: "We're checking your payment", body: 'Confirmation is still pending. Please don\'t pay again just yet.', btn: 'Check payment status' },
  failed: { tone: 'bad', title: "That didn't go through", body: 'Your payment wasn\'t completed. Check its status before trying again.', btn: 'Review payment' },
  cancelled: { tone: 'lav', title: 'Checkout was cancelled', body: 'No successful payment is recorded. Your accepted request is still here.', btn: 'Return to rental' },
};

export default function Pay() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const B = useAsync(() => Bookings.get(id), [id]);
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (B.loading) return <Loading />;
  if (B.error?.status === 403) return <NotFound title="This rental is private." to="/dashboard" cta="Back to my dashboard" />;
  if (B.error) return <ErrorBox error={B.error} onRetry={B.reload} />;
  const bk = B.data;
  if (bk.renter.id !== user.id) return <NotFound title="Only the renter pays." body="Open your own rental to pay." to="/dashboard" cta="Back to my dashboard" />;

  const paid = bk.paidAt || outcome === 'verified';
  const state = paid ? 'verified' : outcome;

  const pay = async () => {
    setBusy(true); setErr(''); setOutcome(null);
    try {
      const init = await Bookings.pay(bk.id);               // 1. backend creates a Razorpay order
      const Razorpay = await loadRazorpay();                // 2. open Razorpay's own checkout popup
      const rzp = new Razorpay({
        key: init.keyId, amount: init.amountPaise, currency: init.currency, order_id: init.orderId,
        name: 'UniShare', description: `${bk.listingTitle} · ${bk.code}`,
        prefill: { name: user.name, email: user.email }, theme: { color: '#6F4F8F' },
        handler: async (resp) => {                          // 3. backend verifies the signature
          try {
            await Payments.verify({ razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
            setOutcome('verified'); B.reload();
          } catch { setOutcome('pending'); }
          setBusy(false);
        },
        modal: { ondismiss: () => { setOutcome((o) => o || 'cancelled'); setBusy(false); } },
      });
      rzp.on('payment.failed', () => { setOutcome('failed'); setBusy(false); });
      rzp.open();
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  const outcomeAction = async () => {
    if (state === 'verified' || state === 'cancelled') { nav(`/rental/${bk.id}`); return; }
    if (state === 'pending') { B.reload(); return; }
    setOutcome(null);
  };

  return (
    <div className="stack">
      <div className="small"><Link to="/dashboard">Dashboard</Link> / Rental {bk.code} / Payment</div>
      <div className="row between"><div className="head" style={{ margin: 0 }}><h1>A good find. One last step.</h1><p className="muted">Review your rental before continuing to secure checkout.</p></div>
        <span className="chip lav" style={{ padding: '10px 18px' }}>1 Review → 2 Checkout → 3 Confirm</span></div>

      {state && <Notice tone={OUTCOMES[state].tone} title={OUTCOMES[state].title}>{OUTCOMES[state].body}
        <div style={{ marginTop: 10 }}><button className="btn ghost sm" onClick={outcomeAction}>{OUTCOMES[state].btn}</button></div></Notice>}

      <div className="grid2" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
        <div className="stack">
          <div className="card row" style={{ alignItems: 'flex-start' }}>
            <Photo src={bk.listingPhoto} alt={bk.listingTitle} className="thumb" />
            <div className="stack sm grow"><h2>{bk.listingTitle}</h2><span className="muted">Lent by {bk.owner.name}</span>
              <div className="row" style={{ gap: 40 }}><div><span className="eyebrow">Pickup</span><div>{fmtDate(bk.startDate)}</div></div><div><span className="eyebrow">Return</span><div>{fmtDate(bk.endDate)}</div></div></div>
              <span className="muted">{bk.days} days · {money(bk.rentalPrice / bk.days)} per day</span></div>
          </div>
          <Notice tone="lav" title="Your deposit is held, not spent.">{money(bk.depositAmount)} is returned after the return check, once the photos at pickup and return match. If your lender claims damage, you can accept it or dispute it with photo evidence.</Notice>
          <div className="card stack sm"><h2>Your payment, handled with care.</h2><p className="muted">You'll choose a payment method in Razorpay Checkout. UniShare never asks for your card details. Your payment is confirmed only after verification, so a pending payment will never be shown as paid.</p></div>
          <div className="card stack sm"><h2>And then? Make a plan to meet.</h2><p className="muted">Use Messages to agree on pickup and return. At handover you both add condition photos, and again at return. They protect you both.</p></div>
        </div>
        <aside className="stack">
          <div className="card stack">
            <h2>Rental summary</h2><span className="small">Rental {bk.code}</span><hr className="hr" />
            <div className="kv"><span>Rental charge ({money(bk.rentalPrice / bk.days)} × {bk.days} days)</span><span>{money(bk.rentalPrice)}</span></div>
            <div className="kv"><span>Platform fee</span><span>{money(bk.platformFee)}</span></div>
            <div className="kv"><span>Refundable deposit</span><span>{money(bk.depositAmount)}</span></div>
            <hr className="hr" /><div className="total"><b>Total to pay</b><b style={{ fontSize: 34 }}>{money(bk.total)}</b></div>
            <span className="small">Payment status: {paid ? 'Verified' : state === 'pending' ? 'Awaiting verification' : 'Not started'}</span>
            {err && <span className="err" role="alert">{err}</span>}
            {paid ? <Link className="btn block" to={`/rental/${bk.id}`}>View rental →</Link>
              : bk.status !== 'ACCEPTED' ? <Notice tone="warn">This rental isn't ready for payment ({bk.status.toLowerCase()}).</Notice>
              : <button className="btn block" onClick={pay} disabled={busy}>{busy ? 'Opening checkout…' : 'Continue to Razorpay →'}</button>}
            <p className="small" style={{ textAlign: 'center' }}>Secure checkout powered by Razorpay.<br />Payment details are handled by the gateway.</p>
          </div>
          <Link className="btn ghost block" to={`/rental/${bk.id}`}>← Back to rental</Link>
        </aside>
      </div>
    </div>
  );
}
