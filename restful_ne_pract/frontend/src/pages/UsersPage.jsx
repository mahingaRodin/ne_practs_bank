import { useEffect, useState } from 'react';
import api from '../api/client';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/auth/users', { params: { page, limit: 10 } })
      .then((res) => {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Registered Users</h1>
      <p className="text-muted text-sm mb-6">All system users</p>

      <Alert message={error} onClose={() => setError('')} />

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center text-muted py-8">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-muted">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4">{u.id}</td>
                  <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Attendant'}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
