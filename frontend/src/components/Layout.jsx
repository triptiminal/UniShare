import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';

const LINKS = [['/', 'Explore', true], ['/dashboard', 'Dashboard'], ['/requests', 'Requests'], ['/messages', 'Messages']];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unverified = user && user.role === 'STUDENT' && user.verificationStatus !== 'VERIFIED';
  const out = async () => { setMenu(false); await logout(); nav('/'); };

  return (
    <div className="shell">
      <header className="top">
        <div className="top-in">
          <Link to="/" className="logo"><span className="logo-mark">U</span>UniShare</Link>
          <span className="college">{user?.collegeName || 'Medi-Caps University'}</span>
          <nav className="links" aria-label="Main">
            {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>{label}</NavLink>)}
          </nav>
          <div className="top-right" ref={ref} style={{ marginLeft: 'auto' }}>
            {user ? (
              <>
                <NotificationsBell />
                <Link to="/listings/new" className="btn sm">+ List an item</Link>
                <button className="link" style={{ color: 'var(--ink)' }} onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu}>{user.name} ▾</button>
                {menu && (
                  <div className="menu" role="menu" onClick={() => setMenu(false)}>
                    <Link to="/profile">Profile and settings</Link>
                    <Link to="/my-listings">My listings</Link>
                    <Link to="/payments">Payments and history</Link>
                    <Link to="/saved">Saved items</Link>
                    {user.role === 'ADMIN' && <Link to="/admin">Admin panel</Link>}
                    <button onClick={out}>Sign out</button>
                  </div>
                )}
              </>
            ) : (
              <><Link to="/login" className="btn ghost sm">Sign in</Link><Link to="/register" className="btn sm">Join the community</Link></>
            )}
          </div>
        </div>
      </header>
      {unverified && (
        <div className="banner">
          {user.verificationStatus === 'REJECTED' ? 'Your verification was rejected. ' : 'Verify your college to list and rent items. '}
          <Link to="/verify">Verify now</Link>
        </div>
      )}
      <main className="page"><Outlet /></main>
      <footer><span>Borrow what you need. Share what you love.</span><span>Made for campus life · UniShare</span></footer>
      <nav className="bottom" aria-label="Mobile">
        {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>{label}</NavLink>)}
      </nav>
    </div>
  );
}
