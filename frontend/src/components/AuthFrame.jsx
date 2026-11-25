import { Link } from 'react-router-dom';

export default function AuthFrame({ lines, topLink, children }) {
  return (
    <div className="auth">
      <div className="auth-l">
        <Link to="/" className="logo"><span className="logo-mark" style={{ background: '#6F5A8A' }}>U</span>UniShare</Link>
        <div className="stack">
          <span className="eyebrow" style={{ color: '#D6C9E6' }}>A little sharing. A lot of possibility.</span>
          <h1>{lines[0]}<br />{lines[1]}</h1>
          <p style={{ color: '#D9D2E2', lineHeight: 1.6 }}>Borrow the things you need. Lend the things you love.<br />Make everyday student life a little lighter.</p>
        </div>
        <div className="auth-art"><span>Good things deserve to be shared.</span></div>
        <span className="small" style={{ color: '#BDB2CC' }}>Medi-Caps University · Indore</span>
      </div>
      <div className="auth-r">
        <div className="row between"><Link to="/">← Back to explore</Link><span className="muted">{topLink.text} <Link to={topLink.to}><b>{topLink.label}</b></Link></span></div>
        {children}
      </div>
    </div>
  );
}
