import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/common/Layout.jsx';

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (type) params.set('type', type);
        if (category) params.set('category', category);

        const { data } = await api.get(`/content?${params.toString()}`);
        setItems(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, type, category]);

  return (
    <Layout title="Content Library">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
          <option value="">All types</option>
          <option value="VIDEO">Video</option>
          <option value="PDF">PDF</option>
          <option value="HTML">HTML</option>
        </select>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center text-slate-300">
          No content available.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} to={`/content/${item.id}`} className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-cyan-500">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-400">
                <span>{item.type}</span>
                <span>{item.category}</span>
              </div>
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 line-clamp-3 text-slate-300">{item.description}</p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
