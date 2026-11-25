import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Colleges } from '../api';
import AuthFrame from '../components/AuthFrame';
import { Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', collegeId: '' });
  const [err, setErr] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    Colleges.list().then((c) => { setColleges(c); if (c.length === 1) setF((x) => ({ ...x, collegeId: String(c[0].id) })); }).catch((e) => setErr(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setFields({});
    if (f.password !== f.confirm) { setFields({ confirm: 'Passwords do not match.' }); return; }
    setBusy(true);
    try {
      await register({ name: f.name, email: f.email, password: f.password, collegeId: Number(f.collegeId) });
      nav('/verify', { replace: true });
    } catch (ex) { setErr(ex.message); setFields(ex.fieldErrors || {}); } finally { setBusy(false); }
  };

  return (
    <AuthFrame lines={['Your campus.', 'A world to share.']} topLink={{ text: 'Already sharing?', label: 'Sign in', to: '/login' }}>
      <form className="stack" onSubmit={submit}>
        <span className="eyebrow">Make room for more</span>
        <h1>Join your campus circle.</h1>
        <p className="muted">A simpler way to rent, lend, and connect.</p>
        <Field label="Full name" error={fields.name}><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="College email address" error={fields.email} hint="Only your college email can be used to join."><input className="input" type="email" required value={f.email} onChange={set('email')} placeholder="you@medicaps.ac.in" autoComplete="email" /></Field>
        <Field label="College" error={fields.collegeId}>
          <select className="select" required value={f.collegeId} onChange={set('collegeId')}>
            <option value="">Select your college</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Password" error={fields.password} hint="Use at least 8 characters."><input className="input" type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={fields.confirm}><input className="input" type="password" required value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        {err && <span className="err" role="alert">{err}</span>}
        <button className="btn block" disabled={busy}>{busy ? 'Creating account…' : 'Create account →'}</button>
        <p className="muted" style={{ textAlign: 'center' }}>Share thoughtfully, respect others' belongings, and keep your campus community a welcoming place.</p>
      </form>
    </AuthFrame>
  );
}
