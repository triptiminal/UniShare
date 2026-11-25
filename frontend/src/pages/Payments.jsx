import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookings, Payments as PayApi } from '../api';
import { Chip, ErrorBox, Loading } from '../components/ui';
import { useAsync } from '../hooks';
import { fmtDate, money } from '../lib/format';

const KIND = { PAYMENT: ['Verified', 'ok'], REFUND: ['Refunded', 'lav'], EARNING: ['Earned', 'ok'] };

export default function Payments() {
  const P = useAsync(async () => {
    const [tx, a, b] = await Promise.all([PayApi.transactions(), Bookings.list({ role: 'renter' }), Bookings.list({ role: 'owner' })]);
    const byCode = {};
    [...a, ...b].forEach((x) => { byCode[x.code] = x.id; });
    return { tx, byCode };
  }, []);
  const [tab, setTab] = useState('made');
  const [selIdx, setSelIdx] = useState(0);
  if (P.loading) return <Loading />;
  if (P.error) return <ErrorBox error={P.error} onRetry={P.reload} />;

  const { tx, byCode } = P.data;
  const made = tx.filter((t) => t.kind !== 'EARNING');
  const received = tx.filter((t) => t.kind === 'EARNING');
  const rows = tab === 'made' ? made : received;
  const sel = rows[selIdx] || rows[0];
  const sum = (arr) => arr.reduce((s, t) => s + Number(t.amount), 0);
  const paid = Math.abs(sum(tx.filter((t) => t.kind === 'PAYMENT')));

  return (
    <div className="stack">
      <div className="head"><span className="eyebrow">Payments &amp; history</span><h1>Every share, accounted for.</h1><p className="muted">A clear record of your rental payments, deposit refunds and earnings.</p></div>
      <div className="grid3">
        <div className="stat hl"><span className="muted">Paid for rentals</span><b>{money(paid)}</b><span className="small">{tx.filter((t) => t.kind === 'PAYMENT').length} verified payments</span></div>
        <div className="stat"><span className="muted">Earned from sharing</span><b>{money(sum(received))}</b><span className="small">From completed rentals</span></div>
        <div className="stat"><span className="muted">Deposits refunded</span><b>{money(sum(tx.filter((t) => t.kind === 'REFUND')))}</b><span className="small">Sent back through Razorpay</span></div>
      </div>
      <div className="tabs"><button className={tab === 'made' ? 'on' : ''} onClick={() => { setTab('made'); setSelIdx(0); }}>Payments made</button>
        <button className={tab === 'received' ? 'on' : ''} onClick={() => { setTab('received'); setSelIdx(0); }}>Payments received</button></div>
      <div className="grid2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: 20, fontFamily: 'DM Sans', fontWeight: 600 }}>{tab === 'made' ? 'Payments and refunds' : 'Earnings from completed rentals'}</h3>
          {rows.length === 0 ? <p className="muted" style={{ padding: 20 }}>Nothing here yet.</p> : (
            <table className="tbl"><thead><tr><th>Rental</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{rows.map((t, i) => (
                <tr key={`${t.kind}-${t.bookingCode}-${i}`} className={`click ${sel === t ? 'sel' : ''}`} onClick={() => setSelIdx(i)}>
                  <td><b>{t.label}</b></td><td>{fmtDate(t.date)}</td>
                  <td><b style={{ color: Number(t.amount) < 0 ? 'var(--ink)' : 'var(--grn-ink)' }}>{Number(t.amount) < 0 ? '− ' : '+ '}{money(Math.abs(t.amount))}</b></td>
                  <td><Chip tone={KIND[t.kind][1]}>{KIND[t.kind][0]}</Chip></td></tr>))}</tbody></table>)}
        </div>
        {sel && (
          <aside className="card stack">
            <span className="eyebrow">Payment details</span>
            <div className="row between"><h1>{money(Math.abs(sel.amount))}</h1><Chip tone={KIND[sel.kind][1]}>{KIND[sel.kind][0]}</Chip></div>
            <p className="muted">{sel.label}</p><hr className="hr" />
            <div className="kv"><span>Reference</span><span>{sel.bookingCode}</span></div>
            <div className="kv"><span>Date</span><span>{fmtDate(sel.date)}</span></div>
            <div className="kv"><span>Gateway</span><span>{sel.kind === 'EARNING' ? 'UniShare' : 'Razorpay'}</span></div>
            <p className="small" style={{ color: 'var(--grn-ink)' }}>Payment outcome confirmed after verification.</p>
            {byCode[sel.bookingCode] && <Link className="btn block" to={`/rental/${byCode[sel.bookingCode]}`}>View rental →</Link>}
          </aside>
        )}
      </div>
      <div className="notice green"><b>A status you can trust.</b>Only verified payments count towards your paid total. Failed or cancelled checkout attempts are never counted as successful payments.</div>
    </div>
  );
}
