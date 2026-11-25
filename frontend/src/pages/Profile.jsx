import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from '../api';
import ImageUploader from '../components/ImageUploader';
import { Avatar, Chip, Field, Notice } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, reload, logout } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', yearOfStudy: user.yearOfStudy || '', branch: user.branch || '', bio: user.bio || '', profilePhotoUrl: user.profilePhotoUrl || '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    try { await Users.update(f); await reload(); setMsg('Saved. Your profile is up to date.'); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const vs = user.verificationStatus;

  return (
    <div className="stack">
      <div className="head"><span className="eyebrow">Profile &amp; settings</span><h1>A little about you.</h1></div>
      <div className="grid2">
        <form className="card stack" onSubmit={save}>
          <h2>Personal information</h2>
          <div className="row"><Avatar name={f.name} src={f.profilePhotoUrl} size={72} /><div style={{ width: 240 }}><ImageUploader folder="profiles" compact label="Change photo" onUploaded={(url) => setF((x) => ({ ...x, profilePhotoUrl: url }))} /></div></div>
          <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} required /></Field>
          <Field label="Email address" hint="Your college email can't be changed."><input className="input" value={user.email} disabled /></Field>
          <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Year of study"><input className="input" value={f.yearOfStudy} onChange={set('yearOfStudy')} placeholder="3rd Year" /></Field>
            <Field label="Branch"><input className="input" value={f.branch} onChange={set('branch')} placeholder="CSE" /></Field>
          </div>
          <Field label="About you"><textarea className="textarea" value={f.bio} onChange={set('bio')} maxLength={500} /></Field>
          {msg && <span style={{ color: 'var(--grn-ink)' }} role="status">{msg}</span>}
          {err && <span className="err" role="alert">{err}</span>}
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes →'}</button>
        </form>
        <aside className="stack">
          <div className="card stack">
            <div className="row between"><h2>College verification</h2><Chip tone={vs === 'VERIFIED' ? 'ok' : vs === 'REJECTED' ? 'bad' : 'warn'}>{vs === 'VERIFIED' ? 'Verified' : vs === 'REJECTED' ? 'Rejected' : 'Pending'}</Chip></div>
            <p className="muted">{user.collegeName} · {user.campus}</p>
            {vs !== 'VERIFIED' && <Link className="btn" to="/verify">Verify now</Link>}
            <div className="kv"><span>Rating</span><span>{user.ratingCount ? `${Number(user.ratingAvg).toFixed(1)} ★ (${user.ratingCount})` : 'No ratings yet'}</span></div>
            <Link to={`/u/${user.id}`}>View my public profile →</Link>
          </div>
          <Notice tone="lav" title="One account. Both sides of sharing.">Rent what you need and lend what you don't.</Notice>
          <button className="btn ghost" onClick={async () => { await logout(); nav('/'); }}>Sign out</button>
        </aside>
      </div>
    </div>
  );
}
