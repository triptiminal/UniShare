import { useRef, useState } from 'react';
import { Uploads } from '../api';

/**
 * Uploads straight to Cloudinary using a signature from our backend, then returns the image URL.
 * If Cloudinary is not configured on the backend yet (cloud name empty), it falls back to pasting an image link.
 */
export default function ImageUploader({ folder = 'listings', onUploaded, label = 'Add a photo', compact = false }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState(false);
  const [url, setUrl] = useState('');
  const input = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const sig = await Uploads.signature(folder);
      if (!sig.cloudName) { setManual(true); throw new Error('Image hosting is not set up yet. Paste an image link instead.'); }
      const fd = new FormData();
      fd.append('file', file); fd.append('api_key', sig.apiKey); fd.append('timestamp', sig.timestamp);
      fd.append('folder', sig.folder); fd.append('signature', sig.signature);
      const r = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Upload failed');
      await onUploaded(d.secure_url);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const addUrl = async () => {
    if (!/^https:\/\//.test(url)) { setErr('Enter a link starting with https://'); return; }
    setBusy(true); setErr('');
    try { await onUploaded(url); setUrl(''); setManual(false); } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="stack sm" style={{ width: '100%' }}>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      <button type="button" className="drop" style={compact ? { minHeight: 90 } : undefined} onClick={() => input.current.click()} disabled={busy}>
        <span aria-hidden="true">⬆</span>{busy ? 'Uploading…' : label}
      </button>
      {!manual && <button type="button" className="link small" onClick={() => setManual(true)}>Or paste an image link</button>}
      {manual && (
        <div className="row">
          <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Image link" />
          <button type="button" className="btn sm" onClick={addUrl} disabled={busy}>Add</button>
        </div>
      )}
      {err && <span className="err">{err}</span>}
    </div>
  );
}
