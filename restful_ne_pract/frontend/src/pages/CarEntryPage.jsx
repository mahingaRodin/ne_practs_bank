import { useEffect, useState } from 'react';
import api from '../api/client';

export default function CarEntryPage() {
  const [parkings, setParkings] = useState([]);
  const [form, setForm] = useState({ plateNumber: '', parkingCode: '' });
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/parkings', { params: { limit: 100 } })
      .then((res) => setParkings(res.data.data.filter((p) => p.availableSpaces > 0)))
      .catch(() => {});
  }, [ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTicket(null);
    setEntry(null);
    setLoading(true);
    try {
      const res = await api.post('/api/entries', {
        ...form,
        plateNumber: form.plateNumber.trim().toUpperCase()
      });
      setTicket(res.data.data.ticket);
      setEntry(res.data.data.entry);
      setForm({ plateNumber: '', parkingCode: '' });
    } catch (err) {
      setError(err.message || 'Failed to log entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!entry) return;
    try {
      const res = await api.get(`/api/entries/${entry.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${ticket.ticketNumber}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Car Entry</h1>
        <p className="text-slate-400 text-sm mt-1">Register incoming automobiles and generate printable tickets</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {ticket && (
        <div className="card border-l-4 border-l-indigo-500 relative overflow-hidden bg-slate-900/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-bold text-indigo-400 text-lg flex items-center gap-1.5">
              <span>🎫</span> Parking Ticket Generated
            </h3>
            <button
              onClick={handleDownloadTicket}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-lg transition flex items-center gap-1"
            >
              📥 Download Ticket File
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-sans border-t border-slate-800/80 pt-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Ticket Code</p>
              <p className="font-mono font-bold text-indigo-400">{ticket.ticketNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Plate Number</p>
              <p className="font-mono font-bold text-white">{ticket.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Parking Zone</p>
              <p className="font-bold text-slate-200">{ticket.parkingName} ({ticket.parkingCode})</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Entry DateTime</p>
              <p className="font-bold text-slate-200">{new Date(ticket.entryDateTime).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 uppercase font-semibold">Charge Fee Rates</p>
              <p className="font-bold text-emerald-400">{ticket.feePerHour.toLocaleString()} RWF / Hour</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label-field">Plate Number</label>
          <input 
            className="input-field font-mono font-bold uppercase" 
            placeholder="RAB 123 A" 
            value={form.plateNumber} 
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} 
            required 
          />
        </div>
        <div>
          <label className="label-field">Parking Lot Terminal</label>
          <select 
            className="input-field cursor-pointer bg-slate-900" 
            value={form.parkingCode} 
            onChange={(e) => setForm({ ...form, parkingCode: e.target.value })} 
            required
          >
            <option value="">Choose active slot zone...</option>
            {parkings.map((p) => (
              <option key={p.code} value={p.code} className="bg-slate-950 text-slate-100">
                {p.code} — {p.name} ({p.availableSpaces} spaces free, {p.feePerHour} RWF/hr)
              </option>
            ))}
          </select>
        </div>
        
        <button type="submit" className="btn-primary !w-auto px-8" disabled={loading}>
          {loading ? 'Logging Entry...' : 'Register Car Entry'}
        </button>
      </form>
    </div>
  );
}
