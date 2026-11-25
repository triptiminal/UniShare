import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthFrame from '../components/AuthFrame';
import { Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const u = await login(email, pw);
      nav(u.role === 'ADMIN' ? '/admin' : loc.state?.from?.pathname || '/', { replace: true });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <AuthFrame lines={['More possibilities.', 'Fewer purchases.']} topLink={{ text: 'New to UniShare?', label: 'Join the community', to: '/register' }}>
      <form className="stack" onSubmit={submit}>
        <span className="eyebrow">Welcome to your campus circle</span>
        <h1>Good to have you back.</h1>
        <p className="muted">Sign in to pick up where you left off.</p>
        <Field label="Email address"><input className="input" type="email" required autoComplete="email" placeholder="you@medicaps.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password">
          <div className="row"><input className="input" type={show ? 'text' : 'password'} required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" className="btn ghost sm" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div>
        </Field>
        {err && <span className="err" role="alert">{err}</span>}
        <button className="btn block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>
        <p className="muted" style={{ textAlign: 'center' }}>Your listings, requests, and conversations are waiting.</p>
        <div className="notice green"><b>One account. Both sides of sharing.</b>Rent what you need and lend what you don't.</div>
      </form>
    </AuthFrame>
  );
}
