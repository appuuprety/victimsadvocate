import { useState, useEffect, useRef } from 'react'
import { Btn, PUBLIC_COLORS } from './ui'
import { CategoryMark, ContactIcon, CategoryIcon } from './icons'
import ColoradoLogo from './ColoradoLogo'
import BrochureCard from './BrochureCard'
import { supabase } from '../supabaseClient'
import { getCategoryBg, useIsMobile, useTextSize } from '../lib/helpers'
import { T, CAT_LABELS, LANGS } from '../lib/translations'
import { publicWikiSections } from '../lib/productGuide'

function quickExit() {
  window.open('', '_self')
  window.close()
  window.setTimeout(() => {
    window.location.replace('https://www.google.com/')
  }, 80)
}

function QuickExitButton({ compact = false }) {
  return (
    <button
      type="button"
      onClick={quickExit}
      className="public-quick-exit"
      aria-label="Quick exit"
      title="Quick exit"
      style={{
        minHeight: compact ? 36 : 40,
        padding: compact ? '8px 12px' : '9px 14px',
        borderRadius: 8,
        border: '1px solid #8A1F1F',
        background: '#A32D2D',
        color: '#FFFFFF',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: compact ? 12 : 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      Quick exit
    </button>
  )
}

function PhoneLink({ phone, children, style }) {
  const tel = String(phone).replace(/[^\d+]/g, '')
  return (
    <a
      href={`tel:${tel}`}
      style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, fontWeight: 700, ...style }}
      aria-label={`Call ${children || phone}`}
    >
      {children || phone}
    </a>
  )
}

function PublicMenuDrawer({ page, setPage, lang, setLang, t, onClose, search, setSearch, onSearchSubmit }) {
  const navGroups = [
    {
      title: 'Browse',
      items: [
        ['home', t.nav_home, 'H'],
        ['resources', t.nav_resources, 'R'],
        ['contact', t.nav_contact, 'C'],
        ['wiki', 'Wiki', 'W'],
      ],
    },
  ]

  function goPage(id) {
    setPage(id)
    onClose()
  }

  function goAdmin() {
    onClose()
    window.location.assign('/admin')
  }

  function submitMenuSearch(event) {
    event.preventDefault()
    onSearchSubmit()
    onClose()
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 24, 43, .38)',
          border: 'none',
          zIndex: 180,
          cursor: 'default',
        }}
      />
      <aside
        aria-label="Site menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(390px, 88vw)',
          background: '#FFFFFF',
          boxShadow: '-18px 0 42px rgba(9, 20, 38, .28)',
          zIndex: 190,
          display: 'flex',
          flexDirection: 'column',
          color: '#3A2E27',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 18px 14px',
          borderBottom: '1px solid #EFE3D3',
          background: '#FBF6EE',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <ColoradoLogo size={42} label={t.footer_role} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#8F4128' }}>Colorado Victim Resources</div>
              <div style={{ color: '#7A6A5D', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.tagline}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="public-drawer-close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #EFE3D3',
              background: '#fff',
              color: '#B5563A',
              cursor: 'pointer',
              fontSize: 20,
              flex: '0 0 auto',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 14, overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '8px 0 18px' }}>
            <div style={{
              color: '#948578',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '0 8px 8px',
            }}>
              Find Resources
            </div>
            <form onSubmit={submitMenuSearch} style={{ position: 'relative', padding: '0 8px' }}>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={t.search_placeholder}
                aria-label="Search resources"
                style={{
                  width: '100%',
                  minHeight: 44,
                  border: '1px solid #EFE3D3',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  color: '#3A2E27',
                  fontSize: 16,
                  fontFamily: 'Georgia, serif',
                  padding: '10px 44px 10px 12px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                aria-label="Search resources"
                className="public-search-submit"
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 32,
                  height: 32,
                  border: 'none',
                  background: 'transparent',
                  color: '#8F4128',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ⌕
              </button>
            </form>
          </div>

          {navGroups.map(group => (
            <div key={group.title} style={{ padding: '8px 0 14px' }}>
              <div style={{
                color: '#948578',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                padding: '0 8px 8px',
              }}>
                {group.title}
              </div>
              {group.items.map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goPage(id)}
                  className={`public-drawer-row${page === id ? ' active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: page === id ? '1px solid #F3DDD3' : '1px solid transparent',
                    borderRadius: 8,
                    background: page === id ? '#F3DDD3' : 'transparent',
                    padding: '10px',
                    color: page === id ? '#8F4128' : '#3A2E27',
                    fontFamily: 'Georgia, serif',
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true" style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: page === id ? '#B5563A' : '#FBF6EE',
                    color: page === id ? '#fff' : '#B5563A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flex: '0 0 auto',
                  }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #EFE3D3', padding: 14, background: '#FBF6EE', display: 'grid', gap: 10 }}>
          <QuickExitButton compact />
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, color: '#948578', fontSize: 12, fontWeight: 700 }}>
            Language
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              aria-label="Select language"
              style={{
                width: 150,
                padding: '7px 28px 7px 10px',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#3A2E27',
                border: '1px solid #EFE3D3',
                fontSize: 16,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%23B5563A' stroke-width='2'%3E%3Cpolyline points='1,1 6,7 11,1'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 9px center',
              }}
            >
              {LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={goAdmin}
            className="public-admin-row"
            style={{
              width: '100%',
              border: '1px solid #F3DDD3',
              borderRadius: 8,
              background: '#F3DDD3',
              color: '#8F4128',
              padding: '10px 12px',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            Admin
          </button>
        </div>
      </aside>
    </>
  )
}

function MobileNav({ page, setPage, lang, setLang, t, search, setSearch, doSearch }) {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      background: '#FBF6EE',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid #EFE3D3',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        height: 60,
      }}>
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0, flex: 1 }} onClick={() => { setPage('home'); setOpen(false) }}>
          <ColoradoLogo size={32} label={t.footer_role} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#8F4128', fontWeight: 700, fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Colorado Victim Resources
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextSizeToggle compact tone="light" />
          <QuickExitButton compact />
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            style={{
              background: '#FFFFFF',
              border: '1px solid #EFE3D3', borderRadius: 8, color: '#8F4128', cursor: 'pointer',
              fontSize: 20, width: 40, height: 40, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <PublicMenuDrawer page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} onClose={() => setOpen(false)} search={search} setSearch={setSearch} onSearchSubmit={doSearch} />
      )}
    </header>
  )
}

function TextSizeToggle({ compact, tone = 'dark' }) {
  const [size, setSize] = useTextSize()
  const sizes = [['sm', 'A', 13, 'Default text size'], ['lg', 'A', 18, 'Larger text']]
  const light = tone === 'light'
  const menu = tone === 'menu'
  return (
    <div role="group" aria-label="Text size" style={{
      display: 'inline-flex', borderRadius: 8, overflow: 'hidden',
      border: light ? '1px solid #EFE3D3' : menu ? '1px solid rgba(255,255,255,.65)' : '1px solid rgba(255,255,255,.3)',
      marginLeft: compact ? 0 : 8,
    }}>
      {sizes.map(([key, letter, fs, label]) => (
        <button
          key={key}
          onClick={() => setSize(key)}
          className="public-header-control"
          aria-label={label}
          aria-pressed={size === key}
          style={{
            padding: compact ? '6px 12px' : '6px 14px',
            background: size === key ? (light ? '#F3DDD3' : menu ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.25)') : 'transparent',
            border: 'none', color: light ? '#8F4128' : '#fff', cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontWeight: size === key ? 700 : 400,
            fontSize: fs, lineHeight: 1, minHeight: compact ? 32 : 36,
          }}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}

function DesktopNav({ page, setPage, lang, setLang, t, search, setSearch, doSearch }) {
  const [open, setOpen] = useState(false)

  return (
    <header style={{ background: '#FBF6EE', padding: '0 32px', borderBottom: '1px solid #EFE3D3' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setPage('home')}>
          <ColoradoLogo size={44} label={t.footer_role} />
          <div>
            <div style={{ color: '#8F4128', fontWeight: 700, fontSize: 17 }}>Colorado Victim Resources</div>
            <div style={{ color: '#948578', fontSize: 11 }}>{t.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TextSizeToggle compact tone="light" />
          <QuickExitButton />
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            style={{
              background: '#FFFFFF',
              border: '1px solid #EFE3D3',
              borderRadius: 8,
              color: '#8F4128',
              cursor: 'pointer',
              fontSize: 20,
              width: 42,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <PublicMenuDrawer page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} onClose={() => setOpen(false)} search={search} setSearch={setSearch} onSearchSubmit={doSearch} />
      )}
    </header>
  )
}

function GlobalSearch({ value, onChange, placeholder, onSearch }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span aria-hidden="true" style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 22, pointerEvents: 'none', color: '#3A2E27',
      }}>⌕</span>
      <input
        aria-label="Search resources"
        role="searchbox"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch && onSearch()}
        placeholder={placeholder}
        aria-label="Search resources"
        role="searchbox"
        style={{
          width: '100%',
          padding: '14px 14px 14px 42px',
          borderRadius: 0,
          border: '1px solid #EFE3D3',
          fontSize: 16,
          fontFamily: 'Georgia, serif',
          background: '#FFFFFF',
          color: '#3A2E27',
          outline: 'none',
          boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = '#8F4128' }}
        onBlur={e => { e.target.style.borderColor = '#EFE3D3' }}
      />
    </div>
  )
}

function PublicWikiView({ isMobile }) {
  return (
    <main id="main-content" aria-label="Wiki" style={{ maxWidth: 960, margin: '0 auto', padding: `${isMobile ? 32 : 56}px ${isMobile ? 16 : 32}px`, background: '#FFFFFF' }}>
      <h1 style={{ fontSize: isMobile ? 28 : 36, margin: '0 0 8px', color: '#8F4128' }}>Wiki</h1>
      <p style={{ color: PUBLIC_COLORS.textSecondary, fontSize: 16, lineHeight: 1.7, margin: '0 0 28px' }}>
        A plain-language guide to the public resource site and the admin tools used to keep it current.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        {publicWikiSections.map(section => (
          <section key={section.title} style={{ background: '#FFFFFF', border: '1px solid #EFE3D3', borderRadius: 12, padding: 20 }}>
            <h2 style={{ margin: '0 0 12px', color: PUBLIC_COLORS.textPrimary, fontSize: 20 }}>{section.title}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: PUBLIC_COLORS.textSecondary, fontSize: 15, lineHeight: 1.7 }}>
              {section.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <div style={{ marginTop: 20, background: '#FFF8E8', border: '1px solid #E7C46A', borderRadius: 12, padding: 18, color: '#704E00', fontSize: 14, lineHeight: 1.6 }}>
        This site is for resource navigation. It is not an emergency reporting tool. For immediate danger, call <PhoneLink phone="911">911</PhoneLink>.
      </div>
    </main>
  )
}

export default function PublicPortal({ brochures, categories, onShare, setBrochures }) {
  const [lang, setLang] = useState('en')
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState('home')
  const [selected, setSelected] = useState(new Set())
  const isMobile = useIsMobile()
  const t = T[lang]
  const pendingTranslations = useRef(new Set())

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [page])

  // Lazily translates a card's title/description into `targetLang` via the
  // translate-brochure edge function, then caches the result both in Supabase
  // (server-side, for future visitors) and in local state (for this session).
  async function ensureTranslation(brochureId, targetLang) {
    if (targetLang === 'en' || !setBrochures) return
    const brochure = brochures.find(b => b.id === brochureId)
    if (brochure?.translations?.[targetLang]) return
    const key = `${brochureId}:${targetLang}`
    if (pendingTranslations.current.has(key)) return
    pendingTranslations.current.add(key)
    try {
      const { data, error } = await supabase.functions.invoke('translate-brochure', {
        body: { brochureId, lang: targetLang },
      })
      if (!error && data?.title) {
        setBrochures(prev => prev.map(b => b.id === brochureId
          ? { ...b, translations: { ...(b.translations || {}), [targetLang]: { title: data.title, description: data.description } } }
          : b))
      }
    } catch {
      // Network/edge-function failure — card just keeps showing the English fallback.
    } finally {
      pendingTranslations.current.delete(key)
    }
  }

  useEffect(() => {
    const isRTL = LANGS.find(l => l.code === lang)?.rtl
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else if (next.size < 5) { next.add(id) }
      return next
    })
  }

  function shareSelected() {
    const picks = brochures.filter(b => selected.has(b.id))
    onShare(picks)
    setSelected(new Set())
  }

  const filtered = brochures.filter(b => {
    const matchCat = activeCat === 'all' || b.category_id === activeCat
    const q = search.toLowerCase()
    return matchCat && (!q || b.title.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q) || (b.tags || []).some(tag => tag.toLowerCase().includes(q)))
  })

  function doSearch() {
    if (search.trim()) setPage('resources')
  }

  const px = isMobile ? 16 : 32

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#FBF6EE', minHeight: '100vh', colorScheme: 'light' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        ::placeholder { color: rgba(31,41,51,0.55) !important; }
        * { box-sizing: border-box; }
        .skip-link {
          position: absolute; left: -9999px; top: 8px; z-index: 9999;
          background: #B5563A; color: #fff; padding: 10px 16px; border-radius: 8px;
          font-weight: 600; text-decoration: none;
        }
        .skip-link:focus { left: 8px; }
        .public-drawer-row:hover,
        .public-admin-row:hover {
          background: #FBF6EE !important;
          border-color: #EFE3D3 !important;
        }
        .public-drawer-row.active:hover {
          background: #F3DDD3 !important;
          border-color: #F3DDD3 !important;
        }
        .public-drawer-row:focus-visible,
        .public-admin-row:focus-visible,
        .public-drawer-close:focus-visible,
        .public-search-submit:focus-visible,
        .public-quick-exit:focus-visible,
        .public-header-control:focus-visible {
          outline: 3px solid #8F4128;
          outline-offset: 2px;
        }
      `}</style>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {isMobile
        ? <MobileNav page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} search={search} setSearch={setSearch} doSearch={doSearch} />
        : <DesktopNav page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} search={search} setSearch={setSearch} doSearch={doSearch} />
      }

      {/* ─── HOME ─── */}
      {page === 'home' && <main id="main-content" aria-label="Home">
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(180deg, #FBF0DA 0%, #FBF6EE 58%, #FFFFFF 100%)',
          padding: isMobile ? '48px 16px 40px' : '72px 32px 64px',
          borderBottom: '1px solid #EFE3D3',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              background: '#FBF6EE',
              border: '1px solid #EFE3D3',
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: 12,
              color: '#8F4128',
              marginBottom: 16,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {t.hero_label}
            </div>
            <h1 style={{
              color: '#8F4128',
              fontSize: isMobile ? 28 : 40,
              fontWeight: 700,
              margin: '0 0 14px',
              lineHeight: 1.25,
            }}>
              {t.hero_title}
            </h1>
            <p style={{
              color: '#7A6A5D',
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.7,
              margin: '0 0 28px',
            }}>
              {t.hero_sub}
            </p>
            {/* Global search bar */}
            <div style={{ marginBottom: 24 }}>
              <GlobalSearch
                value={search}
                onChange={setSearch}
                placeholder={t.search_placeholder}
                onSearch={doSearch}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Btn onClick={() => { doSearch(); if (!search.trim()) setPage('resources') }} style={{
                background: PUBLIC_COLORS.primary,
                color: '#FFFFFF',
                padding: isMobile ? '12px 20px' : '12px 28px',
                fontSize: 15,
                flex: isMobile ? 1 : 'none',
              }}>
                {t.browse}
              </Btn>
              <Btn onClick={() => setPage('contact')} variant="ghost" style={{
                borderColor: PUBLIC_COLORS.secondary,
                color: PUBLIC_COLORS.secondary,
                padding: isMobile ? '12px 20px' : '12px 28px',
                fontSize: 15,
                flex: isMobile ? 1 : 'none',
              }}>
                {t.speak}
              </Btn>
            </div>
          </div>
        </section>

        {/* Emergency banner */}
        <div style={{ background: '#A32D2D', padding: '12px 16px' }}>
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            textAlign: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 13 : 14 }}>{t.danger}</span>
            <span style={{ color: 'rgba(255,255,255,.9)', fontSize: isMobile ? 12 : 14 }}>{t.danger_detail}</span>
          </div>
        </div>

        {/* Categories */}
        <section style={{ padding: `${isMobile ? 36 : 56}px ${px}px`, maxWidth: 1100, margin: '0 auto', background: '#FFFFFF' }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: '0 0 6px', color: PUBLIC_COLORS.textPrimary }}>{t.categories}</h2>
          <p style={{ color: PUBLIC_COLORS.textSecondary, margin: '0 0 24px', fontSize: 15 }}>{t.categories_sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {categories.map(cat => {
              const count = brochures.filter(b => b.category_id === cat.id).length
              const label = CAT_LABELS[lang]?.[cat.id] || cat.label
              return (
                <div
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setPage('resources') }}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #EFE3D3',
                    padding: isMobile ? 16 : 20,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE3D3'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <CategoryMark id={cat.id} emoji={cat.icon} size={isMobile ? 18 : 20} tile bg={getCategoryBg(cat.id)} color={cat.color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: PUBLIC_COLORS.textPrimary, marginBottom: 4, lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: PUBLIC_COLORS.textMuted }}>{count} {lang === 'es' ? 'recurso' : 'resource'}{count !== 1 ? 's' : ''}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Featured */}
        {brochures.filter(b => b.featured).length > 0 && (
          <section style={{ padding: `0 ${px}px ${isMobile ? 40 : 56}px`, maxWidth: 1100, margin: '0 auto', background: '#FFFFFF' }}>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: '0 0 6px', color: PUBLIC_COLORS.textPrimary }}>{t.featured}</h2>
            <p style={{ color: PUBLIC_COLORS.textSecondary, margin: '0 0 24px', fontSize: 15 }}>{t.featured_sub}</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {brochures.filter(b => b.featured).map(b => (
                <BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang} selected={selected} onSelect={toggleSelect} onNeedTranslation={ensureTranslation} palette={PUBLIC_COLORS} useLineIcons />
              ))}
            </div>
          </section>
        )}
      </main>}

      {/* ─── RESOURCES ─── */}
      {page === 'resources' && (
        <main id="main-content" aria-label="Resources" style={{ maxWidth: 1100, margin: '0 auto', padding: `32px ${px}px`, background: '#FFFFFF' }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, margin: '0 0 6px', color: PUBLIC_COLORS.textPrimary }}>{t.all_resources}</h2>
          <p style={{ color: PUBLIC_COLORS.textSecondary, margin: '0 0 20px' }}>{t.resources_label(filtered.length)}</p>

          {/* Search */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #EFE3D3',
            borderRadius: 0,
            padding: 16,
            marginBottom: 20,
          }}>
            <GlobalSearch
              value={search}
              onChange={setSearch}
              placeholder={t.search_placeholder}
            />
          </div>

          {/* Category filters — horizontal scroll on mobile */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {[{ id: 'all', label: t.all, icon: '', color: PUBLIC_COLORS.primary }, ...categories].map(cat => {
              const label = cat.id !== 'all' ? (CAT_LABELS[lang]?.[cat.id] || cat.label) : cat.label
              const isActive = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    fontFamily: 'Georgia, serif',
                    borderColor: isActive ? (cat.color || PUBLIC_COLORS.primary) : '#EFE3D3',
                    background: isActive ? getCategoryBg(cat.id) : '#FFFFFF',
                    color: isActive ? (cat.color || PUBLIC_COLORS.primary) : PUBLIC_COLORS.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minHeight: 38,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.icon && <span style={{ marginRight: 5, verticalAlign: -2, display: 'inline-block' }}><CategoryMark id={cat.id} emoji={cat.icon} size={13} color={isActive ? (cat.color || PUBLIC_COLORS.primary) : PUBLIC_COLORS.textSecondary} /></span>}{label}
                </button>
              )
            })}
          </div>

          {filtered.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: PUBLIC_COLORS.textSecondary }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>{t.no_results}</div>
                <button onClick={() => { setSearch(''); setActiveCat('all') }} style={{
                  marginTop: 16, background: 'none', border: 'none', color: PUBLIC_COLORS.primary,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline',
                }}>
                  Clear filters
                </button>
              </div>
            )
            : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filtered.map(b => <BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang} selected={selected} onSelect={toggleSelect} onNeedTranslation={ensureTranslation} palette={PUBLIC_COLORS} useLineIcons />)}
              </div>
            )
          }
        </main>
      )}

      {/* ─── CONTACT ─── */}
      {page === 'contact' && (
        <main id="main-content" aria-label="Contact" style={{ maxWidth: 800, margin: '0 auto', padding: `${isMobile ? 36 : 56}px ${px}px`, background: '#FFFFFF' }}>
          <h2 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, margin: '0 0 8px', color: PUBLIC_COLORS.textPrimary }}>{t.contact_heading}</h2>
          <p style={{ color: PUBLIC_COLORS.textSecondary, margin: '0 0 32px', fontSize: 16, lineHeight: 1.7 }}>
            {t.contact_hours_note}
          </p>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { kind: 'phone', label: t.contact_after_hours, detail: '303-441-4444', phone: '303-441-4444', note: t.contact_after_hours_note },
              { kind: 'building', label: t.contact_office, detail: '303-926-2841', phone: '303-926-2841', note: t.contact_office_note },
              { kind: 'mail', label: t.contact_email, detail: 'victimservices@erieco.gov', note: t.contact_email_note },
              { kind: 'legal', label: t.contact_victim_rights, detail: '303-239-4497', phone: '303-239-4497', note: t.contact_victim_rights_note },
            ].map(c => (
              <div key={c.label} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EFE3D3', padding: isMobile ? 16 : 20 }}>
                <div style={{ marginBottom: 10 }}><ContactIcon kind={c.kind} size={18} tile bg={PUBLIC_COLORS.pageBg} color={PUBLIC_COLORS.primary} /></div>
                <div style={{ fontWeight: 700, fontSize: 11, color: PUBLIC_COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: PUBLIC_COLORS.textPrimary, marginBottom: 4 }}>
                  {c.phone ? <PhoneLink phone={c.phone} style={{ color: PUBLIC_COLORS.primary }}>{c.detail}</PhoneLink> : c.detail}
                </div>
                <div style={{ fontSize: 12, color: PUBLIC_COLORS.textMuted }}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* Victim Rights Act */}
          <div style={{ background: '#F3DDD3', borderRadius: 16, padding: 22, borderLeft: `4px solid ${PUBLIC_COLORS.primary}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 10px', color: PUBLIC_COLORS.primaryDark, fontSize: 16 }}>{t.vra_title}</h3>
            <p style={{ margin: '0 0 12px', color: PUBLIC_COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              {t.vra_intro}{' '}
              <a href="https://dcj.colorado.gov/dcj-offices/victims-programs/crime-victim-rights-act-vra" target="_blank" rel="noopener noreferrer" style={{ color: PUBLIC_COLORS.primary, fontWeight: 600 }}>
                {t.vra_act_name}
              </a>.
            </p>
            <p style={{ margin: '0 0 12px', color: PUBLIC_COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              {t.vra_advisory}
            </p>
            <p style={{ margin: '0 0 12px', color: PUBLIC_COLORS.primaryDark, fontSize: 14, lineHeight: 1.7, fontWeight: 600 }}>
              {t.vra_dept_name}<br />
              700 Kipling Street, Suite 1000, Denver, CO 80215-5865<br />
              📞 <PhoneLink phone="303-239-4497" style={{ color: PUBLIC_COLORS.primaryDark }}>303-239-4497</PhoneLink>
            </p>
            <p style={{ margin: 0, color: PUBLIC_COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              {t.vra_additional_resource}{' '}
              <a href="https://www.colorado.gov/dcj" target="_blank" rel="noopener noreferrer" style={{ color: PUBLIC_COLORS.primary, fontWeight: 600 }}>
                {t.vra_link2_text}
              </a>
            </p>
          </div>

          {/* Privacy note */}
          <div style={{ background: '#FBF6EE', borderRadius: 16, padding: 22, borderLeft: `4px solid #EFE3D3` }}>
            <h3 style={{ margin: '0 0 8px', color: PUBLIC_COLORS.textPrimary, fontSize: 16 }}>{t.privacy_title}</h3>
            <p style={{ margin: 0, color: PUBLIC_COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{t.privacy_body}</p>
          </div>
        </main>
      )}

      {page === 'wiki' && <PublicWikiView isMobile={isMobile} />}

      {/* Floating multi-share bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: PUBLIC_COLORS.primary, color: '#fff', borderRadius: 100,
          padding: isMobile ? '12px 16px' : '14px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)', zIndex: 200,
          fontFamily: 'Georgia, serif', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selected.size} of 5 selected
          </span>
          <button onClick={() => setSelected(new Set())} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff',
            borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}>
            Clear
          </button>
          <button onClick={shareSelected} style={{
            background: '#C9962C', border: 'none', color: '#3A2E27',
            borderRadius: 20, padding: '8px 18px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}>
            Share {selected.size} Resource{selected.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: PUBLIC_COLORS.cardBg, marginTop: 48, borderTop: `1px solid ${PUBLIC_COLORS.border}` }}>
        {/* Main footer content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 20px 24px' : '40px 32px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: isMobile ? 28 : 40 }}>

            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <ColoradoLogo size={36} label={t.footer_role} />
                <div>
                  <div style={{ color: PUBLIC_COLORS.primaryDark, fontWeight: 700, fontSize: 16 }}>Colorado Victim Resources</div>
                  <div style={{ color: PUBLIC_COLORS.textMuted, fontSize: 12 }}>{t.footer_role}</div>
                </div>
              </div>
              <p style={{ color: PUBLIC_COLORS.textMuted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{t.footer_tag}</p>
            </div>

            {/* Contact column */}
            <div>
              <div style={{ color: PUBLIC_COLORS.primaryDark, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{t.nav_contact}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { kind: 'phone', label: t.contact_after_hours, phone: '303-441-4444' },
                  { kind: 'building', label: t.contact_office, phone: '303-926-2841' },
                  { kind: 'mail', label: t.contact_email, text: 'victimservices@erieco.gov' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: PUBLIC_COLORS.textSecondary }}>
                    <ContactIcon kind={row.kind} size={14} color={PUBLIC_COLORS.textMuted} />
                    <span>
                      {row.label}: {row.phone
                        ? <PhoneLink phone={row.phone} style={{ color: PUBLIC_COLORS.primaryDark }}>{row.phone}</PhoneLink>
                        : row.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency column */}
            <div>
              <div style={{ color: PUBLIC_COLORS.danger, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{t.footer_emergency_heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { id: 'emergency', label: t.footer_emergency_heading, phone: '911', color: PUBLIC_COLORS.danger },
                  { id: 'safety', label: t.footer_dv_hotline, phone: '1-800-799-7233', color: PUBLIC_COLORS.primaryDark },
                  { id: 'legal', label: t.contact_victim_rights, phone: '303-239-4497', color: PUBLIC_COLORS.primaryDark },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: PUBLIC_COLORS.textSecondary }}>
                    <CategoryIcon id={row.id} size={14} color={row.color} />
                    <span>{row.label}: <PhoneLink phone={row.phone} style={{ color: row.color }}>{row.phone}</PhoneLink></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div style={{ borderTop: `1px solid ${PUBLIC_COLORS.border}`, padding: isMobile ? '14px 20px' : '14px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ color: PUBLIC_COLORS.textMuted, fontSize: 12 }}>
              © {new Date().getFullYear()} Colorado Victim Resources. {t.footer_rights}
            </div>
            <div style={{ color: PUBLIC_COLORS.textMuted, fontSize: 12 }}>
              {t.contact_hours_note}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
