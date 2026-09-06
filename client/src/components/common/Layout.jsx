import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:flex md:flex-col">
        <div className="mb-8 text-xl font-semibold">Secure Portal</div>
        <nav className="space-y-3 text-sm text-slate-300">
          <Link to="/dashboard" className="block rounded-md px-3 py-2 hover:bg-slate-800">Dashboard</Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin" className="block rounded-md px-3 py-2 hover:bg-slate-800">Admin</Link>
              <Link to="/admin/upload" className="block rounded-md px-3 py-2 hover:bg-slate-800">Upload</Link>
            </>
          )}
        </nav>
        <div className="mt-auto rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm">
          <div className="font-medium">{user?.name}</div>
          <div className="text-slate-400">{user?.role}</div>
          <button onClick={logout} className="mt-3 w-full rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">Logout</button>
        </div>
      </aside>

      <main className="md:ml-64 p-6 md:p-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Portal</p>
            <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
