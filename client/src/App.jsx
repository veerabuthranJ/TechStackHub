import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ContentViewerPage from './pages/ContentViewerPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import AdminRoute from './routes/AdminRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-full border border-slate-700 bg-slate-900 px-6 py-3 text-sm">
          Loading portal...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/content/:id" element={<ContentViewerPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/upload" element={<UploadPage />} />
      </Route>
    </Routes>
  )
}

export default App
