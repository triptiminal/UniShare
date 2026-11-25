import { Link } from 'react-router-dom';
import { Admin } from '../../api';
import { ErrorBox, Loading, Notice, Photo } from '../../components/ui';
import { useAsync } from '../../hooks';
import { fmtDate, money } from '../../lib/format';

export default function AdminDisputes() {
  const D = useAsync(() => Admin.disputes(), []);
  if (D.loading) return <Loading />;
  if (D.error) return <ErrorBox error={D.error} onRetry={D.reload} />;
  return (
    <>
      <div className="head"><h1>Disputes</h1><p className="muted">Damage claims the renter disagrees with. Review the evidence and decide.</p></div>
      {D.data.length === 0 && <Notice tone="green" title="No open disputes.">Nice and quiet.</Notice>}
      <div className="stack">
        {D.data.map((b) => (
          <Link key={b.id} to={`/admin/disputes/${b.id}`} className="card row" style={{ color: 'inherit' }}>
            <Photo src={b.listingPhoto} alt={b.listingTitle} className="thumb" />
            <div className="grow"><b>{b.listingTitle}</b><div className="muted">{b.code} · {b.owner.name} (lender) vs {b.renter.name} (renter)</div></div>
            <div style={{ textAlign: 'right' }}><b>{money(b.settlement?.claimedAmount)} claimed</b><div className="small">Returned {fmtDate(b.returnedAt)}</div></div>
          </Link>
        ))}
      </div>
    </>
  );
}
