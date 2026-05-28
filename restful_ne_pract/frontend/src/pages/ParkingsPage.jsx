import { useEffect, useState } from 'react';
import api from '../api/client';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';

export default function ParkingsPage() {
  const [parkings, setParkings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchParkings = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await api.get('/api/parkings', { params: { page: p, limit: 10, search: q || undefined } });
      setParkings(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParkings(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchParkings(1, search);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Available Parkings</h1>
          <p className="text-muted text-sm mt-1">View parking locations, spaces, and fees</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="input-field !w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">Search</button>
        </form>
      </div>

      <Alert message={error} onClose={() => setError('')} />

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center text-muted py-8">Loading...</p>
        ) : parkings.length === 0 ? (
          <p className="text-center text-muted py-8">No parkings found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-muted">
                <th className="pb-3 pr-4 font-medium">Code</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Available</th>
                <th className="pb-3 pr-4 font-medium">Total</th>
                <th className="pb-3 font-medium">Fee/Hr (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {parkings.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 pr-4 font-mono font-medium text-primary">{p.code}</td>
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4 text-muted">{p.location}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.availableSpaces > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.availableSpaces}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{p.totalSpaces}</td>
                  <td className="py-3 font-medium">{p.feePerHour.toLocaleString()}</td>
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
