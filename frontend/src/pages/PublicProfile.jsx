import { useParams } from 'react-router-dom';
import { Users } from '../api';
import { Avatar, Chip, ErrorBox, Loading } from '../components/ui';
import { useAsync } from '../hooks';
import NotFound from './NotFound';

export default function PublicProfile() {
  const { id } = useParams();
  const P = useAsync(() => Users.profile(id), [id]);
  if (P.loading) return <Loading />;
  if (P.error?.status === 404) return <NotFound title="We couldn't find that person." />;
  if (P.error) return <ErrorBox error={P.error} onRetry={P.reload} />;
  const { user: u, bio, collegeName, activeListings, completedAsOwner, completedAsRenter } = P.data;
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="card row" style={{ gap: 22 }}>
        <Avatar name={u.name} src={u.profilePhotoUrl} size={92} />
        <div className="stack sm"><h1>{u.name}</h1><span className="muted">{[u.yearOfStudy, u.branch].filter(Boolean).join(', ') || 'Student'} · {collegeName}</span>
          <div className="row">{u.verified && <Chip tone="ok">Verified student</Chip>}<span className="muted">{Number(u.ratingAvg) > 0 ? `${Number(u.ratingAvg).toFixed(1)} ★` : 'No ratings yet'}</span></div></div>
      </div>
      <div className="grid3">
        <div className="stat"><span className="muted">Active listings</span><b>{activeListings}</b></div>
        <div className="stat"><span className="muted">Lent out</span><b>{completedAsOwner}</b></div>
        <div className="stat"><span className="muted">Borrowed</span><b>{completedAsRenter}</b></div>
      </div>
      {bio && <div className="card stack sm"><h2>About</h2><p>{bio}</p></div>}
    </div>
  );
}
