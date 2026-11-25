import { useEffect, useState } from 'react';
import { Listings, Saved } from '../api';
import ListingCard from '../components/ListingCard';
import { Empty, ErrorBox, Loading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { catLabel, CONDITIONS } from '../lib/format';

const SORTS = [['', 'Recommended'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated']];

export default function Explore() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [qInput, setQInput] = useState('');
  const [f, setF] = useState({ q: '', category: '', sort: '', condition: '', minPrice: '', maxPrice: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { Listings.categories().then(setCats).catch(() => {}); }, []);
  useEffect(() => { if (user) Saved.ids().then((ids) => setSaved(new Set(ids))).catch(() => {}); }, [user]);
  useEffect(() => {
    let off = false;
    setLoading(true); setError(null);
    Listings.search({ ...f, page, size: 12 })
      .then((r) => { if (off) return; setItems((prev) => (page === 0 ? r.items : [...prev, ...r.items])); setTotal(r.total); })
      .catch((e) => !off && setError(e))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [f, page]);

  const apply = (patch) => { setItems([]); setPage(0); setF((x) => ({ ...x, ...patch })); };
  const onSaved = (id, on) => setSaved((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
  const clear = () => { setQInput(''); apply({ q: '', category: '', condition: '', minPrice: '', maxPrice: '', sort: '' }); };

  return (
    <div className="stack" style={{ gap: 0 }}>
      <section className="hero">
        <div className="hero-l">
          <span className="eyebrow">Less buying. More living.</span>
          <h1>Big plans.<br />Little borrowing.</h1>
          <p className="muted">From last-minute projects to weekend plans.<br />Find what you need, from someone on campus.</p>
        </div>
        <div className="hero-r"><span className="hero-pill">Good things, shared.</span></div>
      </section>

      <form className="search" onSubmit={(e) => { e.preventDefault(); apply({ q: qInput }); }} role="search">
        <input className="input" placeholder="What do you need for your next big thing?" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search items" />
        <button className="btn">Search items</button>
        <button type="button" className="btn ghost" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>Filters</button>
      </form>

      {showFilters && (
        <div className="card grid4" style={{ marginBottom: 16 }}>
          <div className="field"><label>Condition</label>
            <select className="select" value={f.condition} onChange={(e) => apply({ condition: e.target.value })}>
              <option value="">Any</option>{CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <div className="field"><label>Min price / day</label><input className="input" type="number" min="0" value={f.minPrice} onChange={(e) => apply({ minPrice: e.target.value })} /></div>
          <div className="field"><label>Max price / day</label><input className="input" type="number" min="0" value={f.maxPrice} onChange={(e) => apply({ maxPrice: e.target.value })} /></div>
          <div className="field"><label>&nbsp;</label><button className="btn ghost" onClick={clear}>Clear filters</button></div>
        </div>
      )}

      <div className="pills" role="group" aria-label="Categories">
        <button className={`pill ${f.category === '' ? 'on' : ''}`} onClick={() => apply({ category: '' })}>All items</button>
        {cats.map((c) => <button key={c} className={`pill ${f.category === c ? 'on' : ''}`} onClick={() => apply({ category: c })}>{catLabel(c)}</button>)}
      </div>

      <div className="row between" style={{ marginBottom: 18 }}>
        <div><h2>A little of everything, nearby.</h2><p className="muted">Thoughtfully shared by students on your campus.</p></div>
        <label className="row muted">Sort by:
          <select className="select" style={{ width: 'auto' }} value={f.sort} onChange={(e) => apply({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
      </div>

      {error && <ErrorBox error={error} onRetry={() => apply({})} />}
      {!error && !loading && items.length === 0 && (
        <Empty title="No matches, just yet." action={<button className="btn ghost" onClick={clear}>Clear filters</button>}>
          {f.q ? `We couldn't find "${f.q}". ` : ''}Try a different search or remove your filters to see more items.
        </Empty>
      )}
      <div className="cards">{items.map((l) => <ListingCard key={l.id} l={l} saved={saved.has(l.id)} onSaved={onSaved} />)}</div>
      {loading && <Loading />}
      {!loading && items.length < total && <div style={{ textAlign: 'center', marginTop: 26 }}><button className="btn ghost" onClick={() => setPage(page + 1)}>Show more</button></div>}
    </div>
  );
}
