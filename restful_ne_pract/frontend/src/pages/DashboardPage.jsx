import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [parkings, setParkings] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [parkingsRes, entriesRes] = await Promise.all([
          api.get('/api/parkings?limit=100'),
          api.get('/api/entries?status=active&limit=5'),
        ]);
        setParkings(parkingsRes.data.data || []);
        setActiveEntries(entriesRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate live capacity details
  const totalSpaces = parkings.reduce((sum, p) => sum + p.totalSpaces, 0);
  const availableSpaces = parkings.reduce((sum, p) => sum + p.availableSpaces, 0);
  const occupiedSpaces = totalSpaces - availableSpaces;
  const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

  // Circular gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (occupancyRate / 100) * circumference;

  const controlCards = [
    { to: '/parkings', title: 'Parking Grid', desc: 'Check zones and fee rates', icon: '🅿️', color: 'indigo' },
    { to: '/parkings/register', title: 'Register Parking', desc: 'Provision a new zone', icon: '➕', color: 'purple', show: isAdmin },
    { to: '/entries/new', title: 'Car Entry', desc: 'Log incoming automobile', icon: '🚗', color: 'emerald' },
    { to: '/entries/exit', title: 'Car Exit', desc: 'Process exit and generate bill', icon: '🚪', color: 'rose' },
    { to: '/reports/outgoing', title: 'Revenue Outgoing', desc: 'Analyze outgoing billing', icon: '💰', color: 'amber', show: isAdmin },
    { to: '/reports/entered', title: 'Entered Analytics', desc: 'Traffic flow audits', icon: '📈', color: 'cyan', show: isAdmin },
  ].filter((c) => c.show !== false);

  const handleDownloadTicket = async (id, ticketNo) => {
    try {
      const res = await api.get(`/api/entries/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${ticketNo}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download ticket: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-slate-800/80 p-8 shadow-xl shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-3 uppercase tracking-wider">
              {isAdmin ? '🛡️ Administration Control' : '🔑 Attendant Access'}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-slate-400 mt-1 max-w-xl">
              XWZ LTD car parking system monitoring Kigali zones. Provision parking spaces, generate real-time tickets, and process exits.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-black/30 border border-slate-800/60 px-4 py-2.5 rounded-xl self-start md:self-auto">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            LIVE OPERATION SYSTEM ACTIVE
          </div>
        </div>
      </div>

      {/* Main Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Occupancy circular gauge */}
        <div className="card flex flex-col items-center justify-center p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Real-Time Occupancy</h2>
          
          {loading ? (
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
          ) : (
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r={radius} className="stroke-slate-800 fill-none" strokeWidth="10" />
                <circle 
                  cx="72" 
                  cy="72" 
                  r={radius} 
                  className="stroke-indigo-500 fill-none transition-all duration-1000 ease-out" 
                  strokeWidth="10" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-extrabold text-white font-sans">{occupancyRate}%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Occupied</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-6 w-full text-center border-t border-slate-800/60 pt-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Free Spaces</p>
              <p className="text-xl font-bold text-emerald-400">{loading ? '...' : availableSpaces}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Spaces</p>
              <p className="text-xl font-bold text-slate-200">{loading ? '...' : totalSpaces}</p>
            </div>
          </div>
        </div>

        {/* Live Metrics Stats */}
        <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
          <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Parked Vehicles</span>
            <div className="my-4">
              <h3 className="text-4xl font-extrabold text-white">{loading ? '...' : occupiedSpaces}</h3>
              <p className="text-xs text-slate-500 mt-1">Active automobiles currently in parking lots</p>
            </div>
            <Link to="/entries" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-auto">
              Browse Active Grid →
            </Link>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Active Lots</span>
            <div className="my-4">
              <h3 className="text-4xl font-extrabold text-white">{loading ? '...' : parkings.length}</h3>
              <p className="text-xs text-slate-500 mt-1">Operational charging terminals configured</p>
            </div>
            <Link to="/parkings" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-auto">
              Configure Lots →
            </Link>
          </div>
        </div>

      </div>

      {/* Grid Menu of actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-300 mb-4">Operations Control Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {controlCards.map((card) => {
            const colors = {
              indigo: 'group-hover:border-indigo-500/30 group-hover:text-indigo-400 bg-indigo-500/10 text-indigo-400',
              purple: 'group-hover:border-purple-500/30 group-hover:text-purple-400 bg-purple-500/10 text-purple-400',
              emerald: 'group-hover:border-emerald-500/30 group-hover:text-emerald-400 bg-emerald-500/10 text-emerald-400',
              rose: 'group-hover:border-rose-500/30 group-hover:text-rose-400 bg-rose-500/10 text-rose-400',
              amber: 'group-hover:border-amber-500/30 group-hover:text-amber-400 bg-amber-500/10 text-amber-400',
              cyan: 'group-hover:border-cyan-500/30 group-hover:text-cyan-400 bg-cyan-500/10 text-cyan-400',
            };

            return (
              <Link 
                key={card.to} 
                to={card.to} 
                className="card border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all duration-300 group flex items-start gap-4 p-5"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${colors[card.color] || 'bg-slate-800'}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 group-hover:text-white transition">{card.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live active vehicles list */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Active Parkings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Vehicles currently logged and waiting for exit billing</p>
          </div>
          <Link to="/entries" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
            View All Entries
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading parking slots...</div>
        ) : activeEntries.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No vehicles currently parked. All slots vacant.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="py-3 px-4">Plate Number</th>
                  <th className="py-3 px-4">Ticket No.</th>
                  <th className="py-3 px-4">Parking Zone</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{entry.plateNumber}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-indigo-400">{entry.ticketNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{entry.parking?.name || entry.parkingCode}</div>
                      <div className="text-[10px] text-slate-500">{entry.parking?.location}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(entry.entryDateTime).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadTicket(entry.id, entry.ticketNumber)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold text-indigo-300 hover:text-indigo-200 transition flex items-center gap-1.5 ml-auto"
                      >
                        📥 Download Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
