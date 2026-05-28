import { useEffect, useState } from 'react';
import api from '../api/client';
import Pagination from '../components/Pagination';

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/entries', { params: { page, limit: 10, status: status || undefined } })
      .then((res) => {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  const handleDownloadReceipt = async (id, ticketNo) => {
    try {
      const res = await api.get(`/api/entries/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${ticketNo}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Car Entries Grid</h1>
          <p className="text-slate-400 text-sm mt-1">Audit log of all registered incoming and outgoing vehicles</p>
        </div>
        <select 
          className="input-field !w-auto cursor-pointer bg-slate-900" 
          value={status} 
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active (Parked)</option>
          <option value="completed">Completed (Exited)</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading parking slots...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No car entry logs matched this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Plate</th>
                  <th className="py-3 px-4">Parking Zone</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4">Exit</th>
                  <th className="py-3 px-4">Charged</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-semibold text-indigo-400">{e.ticketNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{e.plateNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-300">{e.parking?.name || e.parkingCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{new Date(e.entryDateTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{e.exitDateTime ? new Date(e.exitDateTime).toLocaleString() : '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{e.chargedAmount > 0 ? `${e.chargedAmount.toLocaleString()} RWF` : '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${e.exitDateTime ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {e.exitDateTime ? 'Exited' : 'Parked'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(e.id, e.ticketNumber)}
                        className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold text-indigo-300 hover:text-indigo-200 transition inline-flex items-center gap-1"
                        title="Download Thermal Receipt"
                      >
                        📥 Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 border-t border-slate-800/60 pt-4">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
