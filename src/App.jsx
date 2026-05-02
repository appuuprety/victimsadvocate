import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { isAdmin } from './lib/helpers'
import PublicPortal from './components/PublicPortal'
import AdminLogin from './components/AdminLogin'
import AdminPanel from './components/AdminPanel'
import ShareModal from './components/ShareModal'

export default function App() {
  const [session, setSession] = useState(null)
  const [brochures, setBrochures] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareTarget, setShareTarget] = useState(null)
  const admin = isAdmin()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('brochures').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: cats }, { data: bros }]) => {
      setCategories(cats || [])
      setBrochures(bros || [])
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Georgia, serif',
      flexDirection: 'column',
      gap: 16,
      color: '#1B4D8E',
      background: '#FAFAF7',
      colorScheme: 'light',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid #E8E6DE',
        borderTopColor: '#1B4D8E',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: 16, color: '#6B6866' }}>Loading resources…</span>
    </div>
  )

  return (
    <>
      {shareTarget && (
        <ShareModal
          brochure={shareTarget}
          onClose={() => setShareTarget(null)}
          lang="en"
        />
      )}
      {admin
        ? session
          ? <AdminPanel
              brochures={brochures}
              setBrochures={setBrochures}
              categories={categories}
              setCategories={setCategories}
              onLogout={handleLogout}
              onShare={setShareTarget}
            />
          : <AdminLogin onLogin={() => {}} />
        : <PublicPortal
            brochures={brochures}
            categories={categories}
            onShare={setShareTarget}
          />
      }
    </>
  )
}
