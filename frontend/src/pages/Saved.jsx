import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Saved as SavedApi } from '../api';
import ListingCard from '../components/ListingCard';
import { Empty, ErrorBox, Loading } from '../components/ui';
import { useAsync } from '../hooks';

export default function Saved() {
  const S = useAsync(() => SavedApi.list(), []);
  const [removed, setRemoved] = useState(new Set());
  if (S.loading) return <Loading />;
  if (S.error) return <ErrorBox error={S.error} onRetry={S.reload} />;
  const items = S.data.filter((l) => !removed.has(l.id));
  return (
    <div className="stack">
      <div className="head"><span className="eyebrow">Saved items</span><h1>Good things, bookmarked.</h1></div>
      {items.length === 0 && <Empty title="No saved items yet." action={<Link className="btn" to="/">Explore items</Link>}>Tap the heart on an item to keep it here.</Empty>}
      <div className="cards">{items.map((l) => <ListingCard key={l.id} l={l} saved onSaved={(id) => setRemoved((r) => new Set(r).add(id))} />)}</div>
    </div>
  );
}
