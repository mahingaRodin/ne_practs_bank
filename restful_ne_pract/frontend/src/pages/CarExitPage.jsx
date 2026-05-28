import { useState } from 'react';
import api from '../api/client';

export default function CarExitPage() {
  const [form, setForm] = useState({ ticketNumber: '', plateNumber: '', parkingCode: '' });
  const [searchBy, setSearchBy] = useState('ticket');
  const [error, setError] = useState('');
  const [bill, setBill] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBill(null);
    setEntry(null);
    setLoading(true);
    try {
      const payload = searchBy === 'ticket'
        ? { ticketNumber: form.ticketNumber.trim().toUpperCase() }
        : { 
            plateNumber: form.plateNumber.trim().toUpperCase(), 
            parkingCode: form.parkingCode.trim().toUpperCase() || undefined 
          };
      const res = await api.post('/api/entries/exit', payload);
      setBill(res.data.data.bill);
      setEntry(res.data.data.entry);
    } catch (err) {
      setError(err.message || 'Exit logging failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBill = async () => {
    if (!entry) return;
    try {
      const res = await api.get(`/api/entries/${entry.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${bill.ticketNumber}.txt`);
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Car Exit</h1>
        <p className="text-slate-400 text-sm mt-1">Process automobile exits, calculate parked duration, and generate bills</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {bill && (
        <div className="card border-l-4 border-l-rose-500 relative overflow-hidden bg-slate-900/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-bold text-rose-400 text-lg flex items-center gap-1.5">
              <span>🧾</span> Parking Bill & Receipt
            </h3>
            <button
              onClick={handleDownloadBill}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white rounded-lg transition flex items-center gap-1"
            >
              📥 Download Bill File
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-sans border-t border-slate-800/80 pt-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Ticket Code</p>
              <p className="font-mono font-bold text-indigo-400">{bill.ticketNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Plate Number</p>
              <p className="font-mono font-bold text-white">{bill.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Zone Parking</p>
              <p className="font-bold text-slate-200">{bill.parkingName} ({bill.parkingCode})</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Duration Parked</p>
              <p className="font-bold text-slate-200">{bill.hoursParked} Hour(s)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Entry Time</p>
              <p className="font-bold text-slate-300">{new Date(bill.entryDateTime).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Exit Time</p>
              <p className="font-bold text-slate-300">{new Date(bill.exitDateTime).toLocaleString()}</p>
            </div>
            <div className="col-span-2 border-t border-slate-800/60 pt-3 flex justify-between items-center">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Charge Billing:</span>
              <span className="text-xl font-extrabold text-rose-400">{bill.chargedAmount.toLocaleString()} RWF</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="flex gap-6 border-b border-slate-800 pb-3">
          <label className="flex items-center gap-2.5 text-xs uppercase tracking-wider font-bold text-slate-400 cursor-pointer">
            <input 
              type="radio" 
              name="searchType"
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              checked={searchBy === 'ticket'} 
              onChange={() => setSearchBy('ticket')} 
            />
            Scan Ticket Code
          </label>
          <label className="flex items-center gap-2.5 text-xs uppercase tracking-wider font-bold text-slate-400 cursor-pointer">
            <input 
              type="radio" 
              name="searchType"
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              checked={searchBy === 'plate'} 
              onChange={() => setSearchBy('plate')} 
            />
            Scan Plate Number
          </label>
        </div>

        {searchBy === 'ticket' ? (
          <div>
            <label className="label-field">Ticket Number</label>
            <input 
              className="input-field font-mono font-bold uppercase" 
              placeholder="TKT-XXXXXX" 
              value={form.ticketNumber} 
              onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })} 
              required 
            />
          </div>
        ) : (
          <div className="space-y-4">
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
              <label className="label-field">Parking Zone Code (optional)</label>
              <input 
                className="input-field font-mono uppercase" 
                placeholder="KGL-01" 
                value={form.parkingCode} 
                onChange={(e) => setForm({ ...form, parkingCode: e.target.value })} 
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary !w-auto px-8" disabled={loading}>
          {loading ? 'Processing Exit...' : 'Log Vehicle Exit'}
        </button>
      </form>
    </div>
  );
}
