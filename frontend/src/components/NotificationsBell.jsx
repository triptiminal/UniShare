import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notifications } from '../api';
import { useAuth } from '../context/AuthContext';
import { fmtDateTime } from '../lib/format';

export default function NotificationsBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const loadCount = useCallback(() => Notifications.unread().then((r) => setCount(r.count)).catch(() => {}), []);
  useEffect(() => {
    if (!user) return undefined;
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [user, loadCount]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = async () => {
    const o = !open;
    setOpen(o);
    if (o) { try { setList(await Notifications.list()); } catch { /* ignore */ } }
  };
  const go = async (n) => {
    if (!n.seen) await Notifications.read(n.id).catch(() => {});
    setOpen(false);
    loadCount();
    if (n.bookingId) nav(user.role === 'ADMIN' ? `/admin/disputes/${n.bookingId}` : `/rental/${n.bookingId}`);
    else nav(user.role === 'ADMIN' ? '/admin/verifications' : '/profile');
  };
  const readAll = async () => { await Notifications.readAll().catch(() => {}); setCount(0); setList((l) => l.map((n) => ({ ...n, seen: true }))); };

  return (
    <div ref={ref}>
      <button className="bell" onClick={toggle} aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
        🔔{count > 0 && <i>{count > 9 ? '9+' : count}</i>}
      </button>
      {open && (
        <div className="menu" style={{ width: 340, maxHeight: 420, overflow: 'auto' }}>
          <div className="row between" style={{ padding: '8px 12px' }}>
            <b>Notifications</b><button className="link" onClick={readAll}>Mark all read</button>
          </div>
          {list.length === 0 && <p className="muted" style={{ padding: 12 }}>Nothing yet. Good things take a moment.</p>}
          {list.map((n) => (
            <button key={n.id} className={`notif ${n.seen ? '' : 'unseen'}`} onClick={() => go(n)}>
              <span style={{ fontSize: 14 }}>{n.message}</span><span className="small">{fmtDateTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
