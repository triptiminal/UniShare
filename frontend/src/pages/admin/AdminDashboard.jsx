import { Link } from 'react-router-dom';
import { Admin } from '../../api';
import { ErrorBox, Loading } from '../../components/ui';
import { useAsync } from '../../hooks';
import { money, STATUS } from '../../lib/format';

export default function AdminDashboard() {
  const S = useAsync(() => Admin.stats(), []);
  if (S.loading) return <Loading />;
  if (S.error) return <ErrorBox error={S.error} onRetry={S.reload} />;
  const s = S.data;
  const card = (label, value, to) => <Link to={to || '#'} className="stat" style={{ color: 'inherit' }}><span className="muted">{label}</span><b>{value}</b></Link>;
  return (
    <>
      <div className="head"><h1>Platform overview</h1><p className="muted">Health of the campus marketplace at a glance.</p></div>
      <div className="grid4">
        {card('Students', s.students)}
        {card('Pending verifications', s.pendingVerifications, '/admin/verifications')}
        {card('Open disputes', s.openDisputes, '/admin/disputes')}
        {card('Flagged listings', s.flaggedListings, '/admin/listings')}
        {card('Listings', s.listings, '/admin/listings')}
        {card('Settled rent volume', money(s.settledRentVolume))}
        {card('Platform fees earned', money(s.platformFeesEarned))}
      </div>
      <div className="card stack"><h2>Bookings by status</h2>
        <div className="grid4">{Object.entries(s.bookingsByStatus).map(([k, v]) => <div key={k} className="kv"><span>{STATUS[k]?.label || k}</span><b>{v}</b></div>)}</div></div>
    </>
  );
}
