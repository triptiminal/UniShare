import { useState } from 'react';
import { Admin } from '../../api';
import { Chip, ErrorBox, Loading } from '../../components/ui';
import { useAsync } from '../../hooks';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const U = useAsync(() => Admin.users({ q: term, status, size: 50 }), [term, status]);
  const [err, setErr] = useState('');
  const run = async (fn) => { setErr(''); try { await fn(); U.reload(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <div className="head"><h1>Users</h1><p className="muted">Search students, suspend or restore accounts.</p></div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setTerm(q); }}>
        <input className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <select className="select" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Verification status">
          <option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option></select>
        <button className="btn">Search</button>
      </form>
      {err && <span className="err" role="alert">{err}</span>}
      {U.loading ? <Loading /> : U.error ? <ErrorBox error={U.error} onRetry={U.reload} /> : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="tbl"><thead><tr><th>User</th><th>College</th><th>Verification</th><th>Rating</th><th /></tr></thead>
            <tbody>{U.data.items.map((u) => (
              <tr key={u.id}><td><b>{u.name}</b><div className="small">{u.email}</div></td><td>{u.collegeName || '—'}</td>
                <td><Chip tone={u.verificationStatus === 'VERIFIED' ? 'ok' : u.verificationStatus === 'REJECTED' ? 'bad' : 'warn'}>{u.verificationStatus.toLowerCase()}</Chip>{u.suspended && <> <Chip tone="bad">suspended</Chip></>}</td>
                <td>{u.ratingCount ? `${Number(u.ratingAvg).toFixed(1)} ★ (${u.ratingCount})` : '—'}</td>
                <td style={{ textAlign: 'right' }}>{u.role === 'ADMIN' ? <span className="small">Admin</span> : u.suspended
                  ? <button className="btn ghost sm" onClick={() => run(() => Admin.unsuspend(u.id))}>Restore</button>
                  : <button className="btn danger sm" onClick={() => { const r = window.prompt('Reason for suspending (optional)'); if (r !== null) run(() => Admin.suspend(u.id, r)); }}>Suspend</button>}</td></tr>))}</tbody></table>
        </div>)}
    </>
  );
}
