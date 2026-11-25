import { useState } from 'react';
import { Admin } from '../../api';
import { Avatar, ErrorBox, Loading, Notice } from '../../components/ui';
import { useAsync } from '../../hooks';

export default function AdminVerifications() {
  const U = useAsync(() => Admin.users({ status: 'PENDING', size: 50 }), []);
  const [err, setErr] = useState('');
  if (U.loading) return <Loading />;
  if (U.error) return <ErrorBox error={U.error} onRetry={U.reload} />;
  const run = async (fn) => { setErr(''); try { await fn(); U.reload(); } catch (e) { setErr(e.message); } };
  const items = U.data.items.filter((u) => u.role === 'STUDENT');
  return (
    <>
      <div className="head"><h1>Verification queue</h1><p className="muted">Students waiting for approval. Those who uploaded a college ID can be checked here.</p></div>
      {err && <span className="err" role="alert">{err}</span>}
      {items.length === 0 && <Notice tone="green" title="Queue is clear.">No one is waiting for verification.</Notice>}
      <div className="stack">
        {items.map((u) => (
          <div key={u.id} className="card row">
            <Avatar name={u.name} src={u.profilePhotoUrl} />
            <div className="grow"><b>{u.name}</b><div className="muted">{u.email} · {u.collegeName}</div>
              {u.verificationDocUrl ? <a href={u.verificationDocUrl} target="_blank" rel="noreferrer">View uploaded college ID ↗</a> : <span className="small">No ID uploaded (email verification not completed).</span>}</div>
            <button className="btn sm" onClick={() => run(() => Admin.verifyUser(u.id))}>Verify</button>
            <button className="btn danger sm" onClick={() => { const r = window.prompt('Reason for rejecting (optional)'); if (r !== null) run(() => Admin.rejectUser(u.id, r)); }}>Reject</button>
          </div>
        ))}
      </div>
    </>
  );
}
