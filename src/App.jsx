import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import { C } from './tokens.js'

// Pages
import HomePage        from './pages/HomePage.jsx'
import ProductPage     from './pages/ProductPage.jsx'
import HowItWorksPage  from './pages/HowItWorksPage.jsx'
import PricingPage     from './pages/PricingPage.jsx'
import AboutPage       from './pages/AboutPage.jsx'
import AuthPage        from './pages/AuthPage.jsx'
import ResetPassword   from './components/auth/ResetPassword.jsx'
import AppPage         from './pages/AppPage.jsx'
import InsightsPage    from './pages/InsightsPage.jsx'
import SurveyPage      from './pages/SurveyPage.jsx'
import NotFoundPage    from './pages/NotFoundPage.jsx'

export const ADMIN_EMAIL = 'charlzillion@gmail.com'

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
  </div>
)

// Guard — redirects to /auth if not logged in
function PrivateRoute({ user, children }) {
  if (user === undefined) return <Loader />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return <Loader />

  return (
    <Routes>
      {/* ── Public site ── */}
      <Route path="/"              element={<HomePage     user={user} />} />
      <Route path="/product"       element={<ProductPage  user={user} />} />
      <Route path="/how-it-works"  element={<HowItWorksPage user={user} />} />
      <Route path="/pricing"       element={<PricingPage  user={user} />} />
      <Route path="/about"         element={<AboutPage    user={user} />} />

      {/* ── Auth ── */}
      <Route path="/auth"          element={user ? <Navigate to="/app" replace /> : <AuthPage onAuth={setUser} />} />
      <Route path="/auth/reset"    element={<ResetPassword />} />
      <Route path="/auth/callback" element={<Loader />} />

      {/* ── Survey (public) ── */}
      <Route path="/survey/:slug"  element={<SurveyPage />} />

      {/* ── Platform (private) ── */}
      <Route path="/app"           element={<PrivateRoute user={user}><AppPage user={user} setUser={setUser} /></PrivateRoute>} />
      <Route path="/app/setup"     element={<PrivateRoute user={user}><AppPage user={user} setUser={setUser} tab="setup" /></PrivateRoute>} />
      <Route path="/app/insights/:campaignId" element={<PrivateRoute user={user}><InsightsPage user={user} setUser={setUser} /></PrivateRoute>} />
      <Route path="/app/admin"     element={<PrivateRoute user={user}><AppPage user={user} setUser={setUser} tab="admin" /></PrivateRoute>} />

      {/* ── 404 ── */}
      <Route path="*"              element={<NotFoundPage />} />
    </Routes>
  )
}
