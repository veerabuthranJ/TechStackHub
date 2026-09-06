import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/common/Layout.jsx';

export default function ContentViewerPage() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [viewerError, setViewerError] = useState('');
  const [videoError, setVideoError] = useState('');

  const openPdfInNewTab = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = content?.fileName || `${content?.title || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    let objectUrl = '';

    const load = async () => {
      try {
        const { data } = await api.get(`/content/${id}`);
        setContent(data.data);

        if (data.data.type === 'PDF') {
          const response = await api.get(`/content/${id}/view`, { responseType: 'blob' });
          objectUrl = URL.createObjectURL(response.data);
          setPdfUrl(objectUrl);
        }
      } catch (error) {
        console.error(error);
        setViewerError(error.response?.data?.message || 'This content could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (loading) {
    return <Layout title="Content"><div className="rounded-xl bg-slate-900 p-8 text-slate-300">Loading content...</div></Layout>;
  }

  if (!content) {
    return <Layout title="Content"><div className="rounded-xl bg-slate-900 p-8 text-red-300">Content could not be loaded.</div></Layout>;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <Layout title={content.title}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-400">{content.type} • {content.category}</p>
        {content.type === 'VIDEO' && (
          <div className="mr-auto w-full max-w-4xl">
            {videoError && <p className="mb-3 rounded-md bg-red-950/40 p-3 text-sm text-red-200">{videoError}</p>}
            <video
              controls
              playsInline
              crossOrigin="use-credentials"
              className="w-full rounded-lg bg-black"
              src={`${apiBase}/content/${id}/stream`}
              onError={() => setVideoError('The video could not be loaded. Please refresh and try again.')}
            />
            <p className="mt-2 text-sm text-slate-400">Use the fullscreen control in the video player to expand the video.</p>
          </div>
        )}
        {content.type === 'PDF' && (
          <div className="max-h-[75vh] overflow-auto rounded-lg bg-white p-4">
            {viewerError ? (
              <p className="text-red-600">{viewerError}</p>
            ) : pdfUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={openPdfInNewTab}
                  className="text-left font-medium text-cyan-700 underline hover:text-cyan-900"
                >
                  {content.fileName || `${content.title}.pdf`}
                </button>
                <button
                  type="button"
                  onClick={downloadPdf}
                  className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400"
                >
                  Download PDF
                </button>
              </div>
            ) : (
              <p className="text-slate-600">Loading PDF...</p>
            )}
          </div>
        )}
        {content.type === 'HTML' && (
          <iframe title={content.title} sandbox="allow-scripts allow-same-origin" className="h-[70vh] w-full rounded-lg border border-slate-700 bg-white" src={`${apiBase}/content/${id}/view`} />
        )}
      </div>
    </Layout>
  );
}
