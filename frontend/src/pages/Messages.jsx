import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookings, Chat } from '../api';
import { Avatar, ErrorBox, Loading, Notice, Photo, StatusChip } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks';
import { connectChat } from '../lib/chat';
import { fmtDate, fmtRange, fmtTime, money } from '../lib/format';

function Thread({ booking }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(null);
  const [loading, setLoading] = useState(true);
  const end = useRef(null);
  const other = booking.owner.id === user.id ? booking.renter : booking.owner;

  const merge = useCallback((incoming) => setMsgs((cur) => {
    const map = new Map(cur.map((m) => [m.id, m]));
    [].concat(incoming).forEach((m) => map.set(m.id, m));
    return [...map.values()].sort((a, b) => a.id - b.id);
  }), []);

  useEffect(() => {
    let off = false;
    setMsgs([]); setLoading(true); setFailed(null);
    const load = () => Chat.history(booking.id).then((h) => !off && merge(h)).catch(() => {}).finally(() => !off && setLoading(false));
    load();
    const poll = setInterval(load, 20000);              // safety net if the WebSocket drops
    const stop = connectChat(booking.id, merge, setLive); // live updates over STOMP
    return () => { off = true; clearInterval(poll); stop(); };
  }, [booking.id, merge]);

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async (content) => {
    setFailed(null);
    try { merge(await Chat.send(booking.id, content)); setText(''); }
    catch { setFailed(content); }
  };
  const submit = (e) => { e.preventDefault(); if (text.trim()) send(text.trim()); };

  return (
    <>
      <div className="row" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <Avatar name={other.name} src={other.profilePhotoUrl} size={44} />
        <div><b>{other.name}</b><div className="small">{booking.owner.id === user.id ? 'Renter' : 'Lender'} · {booking.listingTitle} {live ? '· live' : ''}</div></div>
      </div>
      <div className="msgs" aria-live="polite">
        {loading && <Loading />}
        {!loading && msgs.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Say hello and agree on pickup and return.</p>}
        {msgs.length > 0 && <span className="small" style={{ textAlign: 'center' }}>{fmtDate(msgs[0].sentAt).toUpperCase()}</span>}
        {msgs.map((m) => {
          const me = m.senderId === user.id;
          return (<div key={m.id} style={{ display: 'contents' }}><div className={`bub ${me ? 'me' : ''}`}>{m.content}</div><div className={`bubmeta ${me ? 'me' : ''}`}>{me ? 'You' : m.senderName.split(' ')[0]} · {fmtTime(m.sentAt)}</div></div>);
        })}
        {failed && <div className="stack sm" style={{ alignSelf: 'flex-end', alignItems: 'flex-end' }}><div className="bub me" style={{ opacity: 0.6 }}>{failed}</div>
          <span className="err">Not sent · Connection interrupted</span><button className="btn ghost sm" onClick={() => send(failed)}>Retry message</button></div>}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={submit}>
        <input className="input" placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Write a message" />
        <button className="btn" disabled={!text.trim()}>Send ↑</button>
      </form>
    </>
  );
}

export default function Messages() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const C = useAsync(async () => {
    const [a, b] = await Promise.all([Bookings.list({ role: 'renter' }), Bookings.list({ role: 'owner' })]);
    const all = [...a, ...b].filter((x) => !['DECLINED', 'CANCELLED'].includes(x.status)).sort((x, y) => y.id - x.id).slice(0, 20);
    return Promise.all(all.map(async (x) => { try { const h = await Chat.history(x.id); return { ...x, last: h[h.length - 1] }; } catch { return x; } }));
  }, []);

  if (C.loading) return <Loading />;
  if (C.error) return <ErrorBox error={C.error} onRetry={C.reload} />;
  const convs = C.data.filter((c) => !q || c.listingTitle.toLowerCase().includes(q.toLowerCase()) || (c.owner.id === user.id ? c.renter : c.owner).name.toLowerCase().includes(q.toLowerCase()));
  const active = (bookingId && C.data.find((c) => String(c.id) === bookingId)) || convs[0];

  return (
    <div className="stack">
      <div className="head"><span className="eyebrow">Good sharing starts with a hello</span><h1>Make the handover feel easy.</h1><p className="muted">Your conversations, all in one place. Only rental participants can see these messages.</p></div>
      {C.data.length === 0 ? (
        <Notice tone="lav" title="No conversations yet.">Chat opens as soon as you send or receive a rental request. <Link to="/">Explore items</Link></Notice>
      ) : (
        <div className="chat">
          <div className="side">
            <div style={{ padding: 18 }}><h2>Conversations</h2><input className="input" style={{ marginTop: 12 }} placeholder="Search conversations…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" /></div>
            <div style={{ overflow: 'auto' }}>
              {convs.map((c) => {
                const o = c.owner.id === user.id ? c.renter : c.owner;
                return (
                  <a key={c.id} href={`/messages/${c.id}`} onClick={(e) => { e.preventDefault(); nav(`/messages/${c.id}`); }} className={`conv ${active && active.id === c.id ? 'on' : ''}`}>
                    <div className="row between"><b>{o.name}</b>{c.last && <span className="small">{fmtTime(c.last.sentAt)}</span>}</div>
                    <span className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0 }}>{c.listingTitle}</span>
                    <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last ? c.last.content : 'No messages yet'}</span>
                  </a>
                );
              })}
            </div>
            <p className="small" style={{ padding: 18, marginTop: 'auto' }}>Private by design.<br />Made for better conversations.</p>
          </div>
          <div>{active ? <Thread key={active.id} booking={active} /> : <p className="muted" style={{ padding: 30 }}>No conversation matches your search.</p>}</div>
          {active && (
            <div className="info">
              <span className="eyebrow">Your rental</span>
              <Photo src={active.listingPhoto} alt={active.listingTitle} className="detail-img" />
              <h2>{active.listingTitle}</h2><span className="muted">{fmtRange(active.startDate, active.endDate)} · {active.days} days</span>
              <hr className="hr" />
              <div className="kv"><span>Request status</span><StatusChip status={active.status} /></div>
              <div className="kv"><span>Payment status</span><span>{active.paidAt ? 'Paid' : 'Not paid'}</span></div>
              <div className="total"><b>Rental total</b><b>{money(active.total)}</b></div>
              <Link className="btn block" to={active.status === 'ACCEPTED' && active.renter.id === user.id ? `/rental/${active.id}/pay` : `/rental/${active.id}`}>{active.status === 'ACCEPTED' && active.renter.id === user.id ? 'View rental & pay →' : 'View rental →'}</Link>
              <Notice tone="green" title="Keep it on campus.">Agree on a convenient public spot and check the item together before you head off.</Notice>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
