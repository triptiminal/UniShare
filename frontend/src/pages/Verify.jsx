import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Verify as VerifyApi } from '../api';
import ImageUploader from '../components/ImageUploader';
import { Chip, Notice } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Verify() {
  const { user, reload } = useAuth();
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cool, setCool] = useState(0);
  const [idSent, setIdSent] = useState(false);

  useEffect(() => { if (cool <= 0) return undefined; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  if (user.verificationStatus === 'VERIFIED') {
    return (
      <div className="stack" style={{ maxWidth: 560 }}>
        <span className="eyebrow">All set</span><h1>You're verified.</h1>
        <Notice tone="green" title="Verified Medi-Caps student">You can now list items and send rental requests.</Notice>
        <div className="row"><Link to="/" className="btn">Explore items</Link><Link to="/listings/new" className="btn ghost">List an item</Link></div>
      </div>
    );
  }

  const send = async () => {
    setBusy(true); setErr(''); setMsg('');
    try { await VerifyApi.sendOtp(); setSent(true); setCool(45); setMsg(`We sent a code to ${user.email}. It expires in 10 minutes.`); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await VerifyApi.confirm(code); await reload(); nav('/', { replace: true }); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const submitId = async (url) => { await VerifyApi.submitId(url); setIdSent(true); await reload(); };

  return (
    <div className="grid2">
      <div className="stack">
        <span className="eyebrow">One quick step</span>
        <h1>Verify your campus.</h1>
        <p className="muted">Only Medi-Caps students can rent and lend on UniShare.</p>
        <div className="card stack" style={{ maxWidth: 560 }}>
          <div className="row between"><h2>Enter your 6-digit code</h2><Chip tone="warn">{user.verificationStatus === 'REJECTED' ? 'Rejected' : 'Verification pending'}</Chip></div>
          {!sent ? (
            <>
              <p className="muted">We'll email a code to {user.email}.</p>
              <button className="btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send me a code'}</button>
            </>
          ) : (
            <form className="stack" onSubmit={confirm}>
              <p className="muted">{msg}</p>
              <input className="input otp" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="6-digit code" placeholder="••••••" />
              <button className="btn" disabled={busy || code.length !== 6}>Verify and continue</button>
              <button type="button" className="link" disabled={cool > 0 || busy} onClick={send}>{cool > 0 ? `Resend code in 0:${String(cool).padStart(2, '0')}` : 'Resend code'}</button>
            </form>
          )}
          {err && <span className="err" role="alert">{err}</span>}
          <hr className="hr" />
          <p className="muted">No access to your college email?</p>
          {idSent ? <Notice tone="green" title="ID submitted">An admin will review it, usually within a day.</Notice>
                  : <ImageUploader folder="verification" label="Upload your college ID instead" onUploaded={submitId} />}
        </div>
      </div>
      <div className="stack">
        <Notice tone="lav" title="Why we verify.">✓ Rent and lend only with real students<br />✓ A verified badge on your profile<br />✓ Safer deposits for everyone</Notice>
        <Notice tone="green">You can browse without verifying. Listing and renting unlock once you are verified.</Notice>
      </div>
    </div>
  );
}
