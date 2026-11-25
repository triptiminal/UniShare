import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import NotificationsBell from '../../components/NotificationsBell';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [['/admin', 'Dashboard', true], ['/admin/disputes', 'Disputes'], ['/admin/verifications', 'Verifications'], ['/admin/users', 'Users'], ['/admin/listings', 'Listings'], ['/admin/actions', 'Audit log']];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="logo" style={{ marginBottom: 14 }}><span className="logo-mark">U</span>Admin</Link>
        {ITEMS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>{label}</NavLink>)}
        <div style={{ marginTop: 'auto' }} className="stack sm"><span className="small">{user.name}</span>
          <button className="link" style={{ textAlign: 'left' }} onClick={async () => { await logout(); nav('/login'); }}>Sign out</button></div>
      </aside>
      <div>
        <div className="row" style={{ justifyContent: 'flex-end', padding: '14px 34px 0' }}><NotificationsBell /></div>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
