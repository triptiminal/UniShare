import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookings } from '../api';
import { Avatar, ErrorBox, Loading, Notice, Photo, StatusChip } from '../components/ui';
import { useAsync } from '../hooks';
import { fmtRange, money, STATUS } from '../lib/format';

export default function Requests() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'outgoing' ? 'outgoing' : 'incoming';
  const sel = sp.get('sel');
  const [filter, setFilter] = useState('');
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const R = useAsync(async () => {
    const [i, o] = await Promise.all([Bookings.list({ role: 'owner' }), Bookings.list({ role: 'renter' })]);
    return { incoming: i, outgoing: o };
  }, []);
  if (R.loading) return <Loading />;
  if (R.error) return <ErrorBox error={R.error} onRetry={R.reload} />;

  const list = R.data[tab].filter((b) => !filter || b.status === filter);
  const current = list.find((b) => String(b.id) === sel) || list[0];
  const open = (id) => { setDeclining(false); setErr(''); setSp({ tab, sel: String(id) }); };
  const act = async (fn) => { setBusy(true); setErr(''); try { await fn(); setDeclining(false); R.reload(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const pendingIncoming = R.data.incoming.filter((b) => b.status === 'REQUESTED').length;
  const openOutgoing = R.data.outgoing.filter((b) => ['REQUESTED', 'ACCEPTED'].includes(b.status)).length;
  const other = (b) => (tab === 'incoming' ? b.renter : b.owner);

  return (
    <div className="stack">
      <div className="head"><span className="eyebrow">{tab === 'incoming' ? 'Keep good things moving' : 'Your next good find'}</span>
        <h1>{tab === 'incoming' ? 'Every request is a new connection.' : 'A little closer to what you need.'}</h1>
        <p className="muted">{tab === 'incoming' ? "Review incoming requests, or keep an eye on the things you'd like to borrow." : 'Follow your requests from a hopeful hello to a confirmed rental.'}</p></div>
      <div className="tabs">
        <button className={tab === 'incoming' ? 'on' : ''} onClick={() => setSp({ tab: 'incoming' })}>Incoming requests <span className="chip lav">{pendingIncoming}</span></button>
        <button className={tab === 'outgoing' ? 'on' : ''} onClick={() => setSp({ tab: 'outgoing' })}>Outgoing requests <span className="chip lav">{openOutgoing}</span></button>
      </div>
      <div className="grid2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="row between" style={{ padding: 20 }}><b style={{ fontSize: 17 }}>{tab === 'incoming' ? 'All requests' : 'Current requests'}</b>
            <label className="row muted">Status:
              <select className="select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select></label></div>
          {list.length === 0 ? <p className="muted" style={{ padding: 20 }}>No requests here yet.</p> : (
            <table className="tbl"><thead><tr><th>Item &amp; {tab === 'incoming' ? 'renter' : 'lender'}</th><th>Rental dates</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>{list.map((b) => (
                <tr key={b.id} className={`click ${current && current.id === b.id ? 'sel' : ''}`} onClick={() => open(b.id)}>
                  <td><div className="row"><Photo src={b.listingPhoto} alt={b.listingTitle} className="thumb" /><div><b>{b.listingTitle}</b><div className="small">{other(b).name}</div></div></div></td>
                  <td>{fmtRange(b.startDate, b.endDate)}<div className="small">{b.days} day{b.days > 1 ? 's' : ''}</div></td>
                  <td><b>{money(b.total)}</b></td><td><StatusChip status={b.status} /></td>
                </tr>))}</tbody></table>)}
        </div>
        {current && (
          <aside className="card stack">
            <div className="row between"><span className="small">Request {current.code}</span><StatusChip status={current.status} /></div>
            <Photo src={current.listingPhoto} alt={current.listingTitle} className="detail-img" />
            <div className="row"><Avatar name={other(current).name} src={other(current).profilePhotoUrl} /><div><h2 style={{ fontSize: 24 }}>{current.listingTitle}</h2><span className="muted">{tab === 'incoming' ? 'Requested by' : 'Lent by'} {other(current).name}</span></div></div>
            <hr className="hr" />
            <div className="kv"><span>Rental period</span><span>{fmtRange(current.startDate, current.endDate)}</span></div>
            <div className="kv"><span>Rental charge</span><span>{money(current.rentalPrice)} · {current.days} days</span></div>
            <div className="kv"><span>Refundable deposit</span><span>{money(current.depositAmount)}</span></div>
            <div className="total"><b>Total rental</b><b>{money(current.rentalPrice)}</b></div>
            {err && <span className="err" role="alert">{err}</span>}
            {tab === 'incoming' && current.status === 'REQUESTED' && (
              <>
                <Notice tone="green" title="A quick check makes a better handover.">Check your item's availability before accepting. Payment is available only after you accept.</Notice>
                <button className="btn block" disabled={busy} onClick={() => act(() => Bookings.accept(current.id))}>Accept request</button>
                {declining ? (
                  <div className="stack sm"><input className="input" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <button className="btn danger block" disabled={busy} onClick={() => act(() => Bookings.decline(current.id, reason))}>Confirm decline</button></div>
                ) : <button className="btn ghost block" onClick={() => setDeclining(true)}>Decline</button>}
              </>
            )}
            {tab === 'outgoing' && current.status === 'ACCEPTED' && (
              <><Notice tone="green" title={`A yes from ${current.owner.name.split(' ')[0]}.`}>Your request is accepted. You can now pay securely.</Notice>
                <Link className="btn block" to={`/rental/${current.id}/pay`}>Review &amp; pay {money(current.total)} →</Link></>
            )}
            {tab === 'outgoing' && current.status === 'REQUESTED' && <p className="small">Pending requests can't proceed to payment until the lender accepts.</p>}
            {['REQUESTED', 'ACCEPTED'].includes(current.status) && tab === 'outgoing' && <button className="btn ghost block" disabled={busy} onClick={() => act(() => Bookings.cancel(current.id))}>Cancel request</button>}
            <div className="row"><Link className="btn ghost grow" to={`/rental/${current.id}`}>Open rental</Link>
              {!['DECLINED', 'CANCELLED'].includes(current.status) && <Link className="btn ghost grow" to={`/messages/${current.id}`}>Message {tab === 'incoming' ? 'renter' : 'lender'}</Link>}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
