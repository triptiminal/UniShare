import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Listings } from '../api';
import ImageUploader from '../components/ImageUploader';
import { Chip, ErrorBox, Field, Loading, Notice, Photo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { catLabel, CONDITIONS, money } from '../lib/format';

const EMPTY = { title: '', description: '', category: '', subcategory: '', condition: 'LIKE_NEW', pricePerDay: '', depositAmount: '', campus: '', included: '', photos: [], status: 'ACTIVE' };

export default function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ ...EMPTY, campus: user.campus || '' });
  const [loading, setLoading] = useState(editing);
  const [loadErr, setLoadErr] = useState(null);
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { Listings.categories().then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (!editing) return;
    Listings.get(id).then((l) => {
      setF({ title: l.title, description: l.description || '', category: l.category, subcategory: l.subcategory || '', condition: l.condition,
        pricePerDay: String(l.pricePerDay), depositAmount: String(l.depositAmount), campus: l.campus || '', included: (l.includedItems || []).join(', '),
        photos: l.photos || [], status: l.status });
    }).catch(setLoadErr).finally(() => setLoading(false));
  }, [id, editing]);

  if (loading) return <Loading />;
  if (loadErr) return <ErrorBox error={loadErr} />;

  const validate = () => {
    const e = {};
    if (!f.title.trim()) e.title = 'Give your item a name.';
    if (!f.description.trim()) e.description = 'Add a short description.';
    if (!f.category) e.category = 'Choose a category.';
    if (!(Number(f.pricePerDay) > 0)) e.pricePerDay = 'Enter a rental charge greater than ₹0.';
    if (f.depositAmount === '' || Number(f.depositAmount) < 0) e.depositAmount = 'Enter a deposit (0 or more).';
    if (!f.campus.trim()) e.campus = 'Add your campus.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e); setErr('');
    if (Object.keys(e).length) return;
    setBusy(true);
    const body = {
      title: f.title.trim(), description: f.description.trim(), category: f.category, subcategory: f.subcategory.trim() || null,
      condition: f.condition, photos: f.photos, pricePerDay: Number(f.pricePerDay), depositAmount: Number(f.depositAmount),
      campus: f.campus.trim(), includedItems: f.included.split(',').map((s) => s.trim()).filter(Boolean), attributes: {},
    };
    try {
      if (editing) {
        await Listings.update(id, body);
        if (f.status === 'ACTIVE' || f.status === 'INACTIVE') await Listings.setStatus(id, f.status);
      } else {
        await Listings.create(body);
      }
      nav('/my-listings');
    } catch (ex) { setErr(ex.message); setErrors(ex.fieldErrors || {}); } finally { setBusy(false); }
  };

  const unverified = user.verificationStatus !== 'VERIFIED';
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="head">
        <span className="eyebrow">{editing ? 'Your listing, kept up to date' : 'Your unused. Someone else\'s just right.'}</span>
        <h1>{editing ? 'A small update. A better share.' : 'Give your shelf a second life.'}</h1>
        <p className="muted">{editing ? 'Keep your description, rental charge, and availability accurate.' : 'A few thoughtful details are all it takes to start sharing.'}</p>
      </div>
      {unverified && <Notice tone="warn" title="Verify your college first">You need to be verified to publish a listing. <Link to="/verify">Verify now</Link></Notice>}
      <div className="grid2">
        <div className="card stack">
          <h2>01 · The essentials</h2>
          <div className="grid3" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <Field label="Item name *" error={errors.title}><input className={`input ${errors.title ? 'invalid' : ''}`} value={f.title} onChange={set('title')} placeholder="Scientific calculator" /></Field>
            <Field label="Category *" error={errors.category}>
              <select className={`select ${errors.category ? 'invalid' : ''}`} value={f.category} onChange={set('category')}>
                <option value="">Select</option>{cats.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Type (optional)"><input className="input" value={f.subcategory} onChange={set('subcategory')} placeholder="e.g. Calculator, Laptop" /></Field>
            <Field label="Condition *"><select className="select" value={f.condition} onChange={set('condition')}>{CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          </div>
          <Field label="Description *" error={errors.description} hint="Be clear about condition and what's included.">
            <textarea className={`textarea ${errors.description ? 'invalid' : ''}`} value={f.description} onChange={set('description')} />
          </Field>
          <Field label="What's included (comma separated)"><input className="input" value={f.included} onChange={set('included')} placeholder="Kit lens, 32 GB memory card, carry bag" /></Field>
          <div className="field"><label>Photos</label>
            <div className="row wrap">
              {f.photos.map((p, i) => (
                <div key={p} className="stack sm" style={{ width: 110 }}>
                  <Photo src={p} alt={`Photo ${i + 1}`} className="thumb" />
                  <button type="button" className="link small" onClick={() => setF({ ...f, photos: f.photos.filter((x) => x !== p) })}>{i === 0 ? 'Cover · remove' : 'Remove'}</button>
                </div>
              ))}
              <div style={{ width: 220 }}><ImageUploader folder="listings" compact onUploaded={(url) => setF((x) => ({ ...x, photos: [...x.photos, url] }))} /></div>
            </div>
            <span className="small">Clear photos help others know what to expect.</span>
          </div>
          <hr className="hr" />
          <h2>02 · Price &amp; availability</h2>
          <div className="grid3">
            <Field label="Rental charge per day (₹) *" error={errors.pricePerDay}><input className={`input ${errors.pricePerDay ? 'invalid' : ''}`} type="number" min="0" step="1" value={f.pricePerDay} onChange={set('pricePerDay')} /></Field>
            <Field label="Refundable deposit (₹) *" error={errors.depositAmount} hint="Held until the return check."><input className={`input ${errors.depositAmount ? 'invalid' : ''}`} type="number" min="0" step="1" value={f.depositAmount} onChange={set('depositAmount')} /></Field>
            <Field label="Campus *" error={errors.campus}><input className={`input ${errors.campus ? 'invalid' : ''}`} value={f.campus} onChange={set('campus')} /></Field>
          </div>
          {editing && (
            <Field label="Availability *" hint="Not ready to lend? Mark it not available to stop new rental requests.">
              <select className="select" value={f.status} onChange={set('status')}><option value="ACTIVE">Available for requests</option><option value="INACTIVE">Not available</option></select>
            </Field>
          )}
        </div>
        <aside className="stack">
          <div className="card stack sm">
            <span className="eyebrow">{editing ? 'Live listing preview' : 'Your listing, at a glance'}</span>
            <Photo src={f.photos[0]} alt={f.title || 'Your item'} className="detail-img" />
            <span className="eyebrow">{f.category ? catLabel(f.category) : 'Category'}</span>
            <h2>{f.title || 'Item name'}</h2>
            <div className="row between"><span className="price"><b>{money(f.pricePerDay)}</b><span className="muted">/ day</span></span><Chip tone={f.status === 'ACTIVE' ? 'ok' : 'neutral'}>{f.status === 'ACTIVE' ? 'Available' : 'Not available'}</Chip></div>
          </div>
          <Notice tone="green" title="A good listing feels like a good intro.">✓ Honest condition, clear photos<br />✓ A fair daily rental charge<br />✓ Availability you can keep up to date</Notice>
          {err && <span className="err" role="alert">{err}</span>}
          <div className="row"><Link to="/my-listings" className="btn ghost">{editing ? 'Discard changes' : 'Cancel'}</Link><button className="btn grow" disabled={busy || unverified}>{busy ? 'Saving…' : editing ? 'Save changes →' : 'Publish listing →'}</button></div>
          <span className="small">* Required fields. You can edit your listing later.</span>
        </aside>
      </div>
    </form>
  );
}
