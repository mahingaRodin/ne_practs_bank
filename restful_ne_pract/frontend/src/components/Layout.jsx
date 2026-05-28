import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'parking_attendant'] },
  { to: '/parkings', label: 'Parkings', icon: '🅿️', roles: ['admin', 'parking_attendant'] },
  { to: '/parkings/register', label: 'Register Parking', icon: '➕', roles: ['admin'] },
  { to: '/entries/new', label: 'Car Entry', icon: '🚗', roles: ['admin', 'parking_attendant'] },
  { to: '/entries/exit', label: 'Car Exit', icon: '🚪', roles: ['admin', 'parking_attendant'] },
  { to: '/entries', label: 'All Entries', icon: '📋', roles: ['admin', 'parking_attendant'] },
  { to: '/reports/outgoing', label: 'Outgoing Report', icon: '💰', roles: ['admin'] },
  { to: '/reports/entered', label: 'Entered Report', icon: '📈', roles: ['admin'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-lg">P</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">XWZ Parking</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 mt-auto">
          <div className="text-sm mb-2">
            <p className="font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {isAdmin ? 'Admin' : 'Attendant'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
