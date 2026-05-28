import { useState } from 'react';
import api from '../api/client';
import Pagination from '../components/Pagination';

export default function OutgoingReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [dates, setDates] = useState({ startDate: monthAgo, endDate: today });
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchReport = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/reports/outgoing', { params: { ...dates, page: p, limit: 10 } });
      setEntries(res.data.data);
      setSummary(res.data.summary);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/api/reports/outgoing/download', {
        params: dates,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outgoing_report_${dates.startDate}_to_${dates.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Outgoing Cars Report</h1>
        <p className="text-slate-400 text-sm mt-1">Audit outgoing automobile metrics and revenue by date ranges</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="label-field">Start Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={dates.startDate} 
            onChange={(e) => setDates({ ...dates, startDate: e.target.value })} 
            required 
          />
        </div>
        <div>
          <label className="label-field">End Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={dates.endDate} 
            onChange={(e) => setDates({ ...dates, endDate: e.target.value })} 
            required 
          />
        </div>
        <div className="flex gap-2">
          <button 
            type="submit" 
            className="flex-1 h-11 px-4 bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white rounded-xl shadow-lg transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Generate Report'}
          </button>
          
          <button 
            type="button" 
            onClick={handleDownloadCsv}
            className="h-11 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 font-bold text-sm text-indigo-400 hover:text-indigo-300 rounded-xl transition flex items-center justify-center gap-1.5"
            title="Download CSV Report"
            disabled={loading}
          >
            📥 <span className="hidden md:inline">Download CSV</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card border-l-4 border-l-emerald-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Revenue Charged</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{summary.totalAmountCharged.toLocaleString()} RWF</p>
          </div>
          <div className="card border-l-4 border-l-indigo-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Outgoing Records</p>
            <p className="text-3xl font-extrabold text-white mt-2">{summary.totalRecords}</p>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="py-3 px-4">Plate</th>
                  <th className="py-3 px-4">Parking Zone</th>
                  <th className="py-3 px-4">Entry DateTime</th>
                  <th className="py-3 px-4">Exit DateTime</th>
                  <th className="py-3 px-4 text-right">Charged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{e.plateNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{e.parking?.name || e.parkingCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{new Date(e.entryDateTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{new Date(e.exitDateTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400 text-right">{e.chargedAmount.toLocaleString()} RWF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 border-t border-slate-800/60 pt-4">
            <Pagination pagination={pagination} onPageChange={(p) => { setPage(p); fetchReport(p); }} />
          </div>
        </div>
      )}
    </div>
  );
}
