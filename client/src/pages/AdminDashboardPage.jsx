import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/common/Layout.jsx';

export default function AdminDashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });
  const [savingId, setSavingId] = useState(null);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/admin/content');
      setItems(data.data || []);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Unable to load uploaded content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this content?');
    if (!confirmed) return;

    try {
      await api.delete(`/admin/content/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Content deleted.');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Unable to delete content.');
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      description: item.description || '',
      category: item.category,
    });
  };

  const handleEditSubmit = async (event, id) => {
    event.preventDefault();
    setSavingId(id);

    try {
      const { data } = await api.put(`/admin/content/${id}`, editForm);
      setItems((prev) => prev.map((item) => (item.id === id ? data.data : item)));
      setEditingId(null);
      toast.success('Content updated.');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Unable to update content.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Layout title="Admin Dashboard">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-8 text-red-200">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">No uploaded content yet</h2>
          <p className="mt-2 text-slate-300">Upload a video, PDF, or HTML resource to manage it here.</p>
          <Link to="/admin/upload" className="mt-5 inline-block rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
            Upload content
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">{item.type}</span>
                <span className="text-sm text-slate-400">{item.category}</span>
              </div>
              {editingId === item.id ? (
                <form onSubmit={(event) => handleEditSubmit(event, item.id)} className="mt-4 space-y-3">
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    placeholder="Title"
                    required
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    placeholder="Description"
                    rows={3}
                  />
                  <input
                    value={editForm.category}
                    onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    placeholder="Category"
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingId === item.id} className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                      {savingId === item.id ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-slate-300">{item.description || 'No description provided.'}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEditing(item)} className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-300 hover:bg-red-950">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
