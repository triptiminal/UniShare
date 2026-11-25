import { Admin } from '../../api';
import { ErrorBox, Loading } from '../../components/ui';
import { useAsync } from '../../hooks';
import { fmtDateTime } from '../../lib/format';

export default function AdminActions() {
  const A = useAsync(() => Admin.actions(), []);
  if (A.loading) return <Loading />;
  if (A.error) return <ErrorBox error={A.error} onRetry={A.reload} />;
  return (
    <>
      <div className="head"><h1>Audit log</h1><p className="muted">Every admin decision, with who made it and when.</p></div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="tbl"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Notes</th></tr></thead>
          <tbody>{A.data.map((a) => <tr key={a.id}><td>{fmtDateTime(a.at)}</td><td>{a.admin}</td><td><b>{a.actionType}</b></td><td>{a.targetType} #{a.targetId}</td><td>{a.notes}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}
