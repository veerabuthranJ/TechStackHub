import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Layout from '../components/common/Layout.jsx';

const allowedTypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/mpeg',
  'application/pdf',
  'text/html',
  'application/xhtml+xml',
];
const allowedExtensions = ['.mp4', '.webm', '.mov', '.ogv', '.mpeg', '.mpg', '.pdf', '.html', '.htm'];

export default function UploadPage() {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    if (!allowedTypes.includes(file.type) && !allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError('Supported files: MP4, WebM, MOV, OGV, MPEG, PDF, and HTML.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('file', file);

      await api.post('/admin/content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setError(`Uploading: ${percentage}%`);
          }
        },
      });

      toast.success('Content uploaded successfully');
      setForm({ title: '', description: '', category: '' });
      setFile(null);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Content">
      <form onSubmit={handleSubmit} className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" required />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" required rows={4} />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" required />
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setError('');
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Choose file
          </button>
          {file && <p className="text-sm text-slate-300">Selected: {file.name}</p>}
          {!file && <p className="text-sm text-slate-400">No file selected. Video, PDF, and HTML files are supported.</p>}
          {error && <p className="text-sm text-cyan-300">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
