import { useState } from 'react'
import { Btn, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'
import BrochureCard from './BrochureCard'
import { getCategoryBg, useIsMobile } from '../lib/helpers'
import { T, CAT_LABELS } from '../lib/translations'

function MobileNav({ page, setPage, lang, setLang, t }) {
  const [open, setOpen] = useState(false)
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1B3A6B 0%, #1B4D8E 100%)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        height: 60,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => { setPage('home'); setOpen(false) }}>
          <ColoradoLogo size={36} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Colorado Victim Resources</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{t.tagline}</div>
          </div>
        </div>
        {/* Right side: lang + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
            {['en', 'es'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 10px',
                background: lang === l ? 'rgba(255,255,255,0.25)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: lang === l ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                minHeight: 32,
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {/* Dropdown menu */}
      {open && (
        <div style={{ background: '#0F2D5E', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[['home', t.nav_home, '🏠'], ['resources', t.nav_resources, '📋'], ['contact', t.nav_contact, '💬']].map(([id, label, icon]) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false) }} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '14px 20px',
              background: page === id ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 15,
              fontFamily: 'Georgia, serif',
              cursor: 'pointer',
              textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <span aria-hidden="true">{icon}</span>{label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function DesktopNav({ page, setPage, lang, setLang, t }) {
  return (
    <header style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #1B4D8E 100%)', padding: '0 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setPage('home')}>
          <ColoradoLogo size={44} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Colorado Victim Resources</div>
            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 11 }}>{t.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[['home', t.nav_home], ['resources', t.nav_resources], ['contact', t.nav_contact]].map(([id, label]) => (
              <button key={id} onClick={() => setPage(id)} style={{
                background: page === id ? 'rgba(255,255,255,.15)' : 'transparent',
                border: 'none', color: '#fff', padding: '6px 16px', borderRadius: 8,
                fontSize: 14, fontWeight: page === id ? 600 : 400, cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>
                {label}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,.3)', marginLeft: 8 }}>
            {['en', 'es'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '6px 14px',
                background: lang === l ? 'rgba(255,255,255,.25)' : 'transparent',
                border: 'none', color: '#fff', fontWeight: lang === l ? 700 : 400,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

function GlobalSearch({ value, onChange, placeholder, onSearch }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span aria-hidden="true" style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, pointerEvents: 'none',
      }}>🔍</span>
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
          borderRadius: 14,
          border: '2px solid rgba(255,255,255,0.3)',
          fontSize: 16,
          fontFamily: 'Georgia, serif',
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
        onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.22)'; e.target.style.borderColor = 'rgba(255,255,255,0.6)' }}
        onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(255,255,255,0.3)' }}
      />
    </div>
  )
}

export default function PublicPortal({ brochures, categories, onShare }) {
  const [lang, setLang] = useState('en')
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState('home')
  const [selected, setSelected] = useState(new Set())
  const isMobile = useIsMobile()
  const t = T[lang]

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
    <div style={{ fontFamily: 'Georgia, serif', background: '#FAFAF7', minHeight: '100vh', colorScheme: 'light' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        ::placeholder { color: rgba(255,255,255,0.6) !important; }
        * { box-sizing: border-box; }
        .skip-link {
          position: absolute; left: -9999px; top: 8px; z-index: 9999;
          background: #003DA5; color: #fff; padding: 10px 16px; border-radius: 8px;
          font-weight: 600; text-decoration: none;
        }
        .skip-link:focus { left: 8px; }
      `}</style>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {isMobile
        ? <MobileNav page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} />
        : <DesktopNav page={page} setPage={setPage} lang={lang} setLang={setLang} t={t} />
      }

      {/* ─── HOME ─── */}
      {page === 'home' && <main id="main-content" aria-label="Home">
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(160deg, #0F2D5E 0%, #1B4D8E 60%, #2563A8 100%)',
          padding: isMobile ? '48px 16px 40px' : '72px 32px 64px',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,.14)',
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: 12,
              color: 'rgba(255,255,255,.9)',
              marginBottom: 16,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {t.hero_label}
            </div>
            <h1 style={{
              color: '#fff',
              fontSize: isMobile ? 28 : 40,
              fontWeight: 700,
              margin: '0 0 14px',
              lineHeight: 1.25,
            }}>
              {t.hero_title}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,.85)',
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
                background: '#fff',
                color: COLORS.primary,
                padding: isMobile ? '12px 20px' : '12px 28px',
                fontSize: 15,
                flex: isMobile ? 1 : 'none',
              }}>
                {t.browse}
              </Btn>
              <Btn onClick={() => setPage('contact')} variant="ghost" style={{
                borderColor: 'rgba(255,255,255,.5)',
                color: '#fff',
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
        <section style={{ padding: `${isMobile ? 36 : 56}px ${px}px`, maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: '0 0 6px', color: COLORS.textPrimary }}>{t.categories}</h2>
          <p style={{ color: COLORS.textSecondary, margin: '0 0 24px', fontSize: 15 }}>{t.categories_sub}</p>
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
                    border: '1px solid #E8E6DE',
                    padding: isMobile ? 16 : 20,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E6DE'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ fontSize: isMobile ? 24 : 28, marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: COLORS.textPrimary, marginBottom: 4, lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{count} {lang === 'es' ? 'recurso' : 'resource'}{count !== 1 ? 's' : ''}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Featured */}
        {brochures.filter(b => b.featured).length > 0 && (
          <section style={{ padding: `0 ${px}px ${isMobile ? 40 : 56}px`, maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: '0 0 6px', color: COLORS.textPrimary }}>{t.featured}</h2>
            <p style={{ color: COLORS.textSecondary, margin: '0 0 24px', fontSize: 15 }}>{t.featured_sub}</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {brochures.filter(b => b.featured).map(b => (
                <BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang} selected={selected} onSelect={toggleSelect} />
              ))}
            </div>
          </section>
        )}
      </main>}

      {/* ─── RESOURCES ─── */}
      {page === 'resources' && (
        <main id="main-content" aria-label="Resources" style={{ maxWidth: 1100, margin: '0 auto', padding: `32px ${px}px` }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, margin: '0 0 6px', color: COLORS.textPrimary }}>{t.all_resources}</h2>
          <p style={{ color: COLORS.textSecondary, margin: '0 0 20px' }}>{t.resources_label(filtered.length)}</p>

          {/* Search */}
          <div style={{
            background: COLORS.primary,
            borderRadius: 16,
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
            {[{ id: 'all', label: t.all, icon: '', color: COLORS.primary }, ...categories].map(cat => {
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
                    borderColor: isActive ? (cat.color || COLORS.primary) : '#E8E6DE',
                    background: isActive ? getCategoryBg(cat.id) : '#FFFFFF',
                    color: isActive ? (cat.color || COLORS.primary) : COLORS.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minHeight: 38,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.icon} {label}
                </button>
              )
            })}
          </div>

          {filtered.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.textSecondary }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>{t.no_results}</div>
                <button onClick={() => { setSearch(''); setActiveCat('all') }} style={{
                  marginTop: 16, background: 'none', border: 'none', color: COLORS.primary,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif', textDecoration: 'underline',
                }}>
                  Clear filters
                </button>
              </div>
            )
            : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filtered.map(b => <BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang} selected={selected} onSelect={toggleSelect} />)}
              </div>
            )
          }
        </main>
      )}

      {/* ─── CONTACT ─── */}
      {page === 'contact' && (
        <main id="main-content" aria-label="Contact" style={{ maxWidth: 800, margin: '0 auto', padding: `${isMobile ? 36 : 56}px ${px}px` }}>
          <h2 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, margin: '0 0 8px', color: COLORS.textPrimary }}>Victim Services</h2>
          <p style={{ color: COLORS.textSecondary, margin: '0 0 32px', fontSize: 16, lineHeight: 1.7 }}>
            Services are available seven days a week, 24 hours a day.
          </p>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { icon: '📞', label: 'After Hours', detail: '303-441-4444', note: '7 days, 24 hours' },
              { icon: '🏢', label: 'Office', detail: '303-926-2841', note: 'Mon–Fri, 8am–5pm' },
              { icon: '✉️', label: 'Email', detail: 'victimservices@erieco.gov', note: 'Victim Services' },
              { icon: '⚖️', label: 'Victim Rights', detail: '303-239-4497', note: 'CO Dept of Public Safety' },
            ].map(c => (
              <div key={c.label} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E6DE', padding: isMobile ? 16 : 20 }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: COLORS.textPrimary, marginBottom: 4 }}>{c.detail}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* Victim Rights Act */}
          <div style={{ background: '#EEF4FB', borderRadius: 16, padding: 22, borderLeft: `4px solid ${COLORS.primary}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 10px', color: COLORS.primaryDark, fontSize: 16 }}>Ensuring Rights — Colorado Victim Rights Act</h3>
            <p style={{ margin: '0 0 12px', color: COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              The work of Victim Services is based on the{' '}
              <a href="https://dcj.colorado.gov/dcj-offices/victims-programs/crime-victim-rights-act-vra" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontWeight: 600 }}>
                Colorado Victim Rights Act
              </a>.
            </p>
            <p style={{ margin: '0 0 12px', color: COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              If you feel unable to address your concerns at the local level, you may request assistance from the Crime Victim Services Advisory Board by contacting the Victim Rights Act Specialist at:
            </p>
            <p style={{ margin: '0 0 12px', color: COLORS.primaryDark, fontSize: 14, lineHeight: 1.7, fontWeight: 600 }}>
              Colorado Department of Public Safety, Division of Criminal Justice<br />
              700 Kipling Street, Suite 1000, Denver, CO 80215-5865<br />
              📞 303-239-4497
            </p>
            <p style={{ margin: 0, color: COLORS.primary, fontSize: 14, lineHeight: 1.7 }}>
              Additional resource:{' '}
              <a href="https://www.colorado.gov/dcj" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontWeight: 600 }}>
                Division of Criminal Justice Office for Victims' Programs
              </a>
            </p>
          </div>

          {/* Privacy note */}
          <div style={{ background: '#F5F3EE', borderRadius: 16, padding: 22, borderLeft: `4px solid #C8C6BE` }}>
            <h3 style={{ margin: '0 0 8px', color: COLORS.textPrimary, fontSize: 16 }}>{t.privacy_title}</h3>
            <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}>{t.privacy_body}</p>
          </div>
        </main>
      )}

      {/* Floating multi-share bar */}
      {selected.size > 0 && (
        <div role="region" aria-label="Selected resources" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#FFFFFF', borderTop: `1px solid ${COLORS.border}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          padding: '12px 16px', zIndex: 100,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: 1100, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: 600 }}>
              {selected.size} of 5 selected
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn small variant="ghost" onClick={clearSelection}>Clear</Btn>
              <Btn small variant="warm" onClick={shareSelected} aria-label={`Share ${selected.size} selected resources`}>
                Share {selected.size} Resource{selected.size !== 1 ? 's' : ''}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Floating multi-share bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: COLORS.primary, color: '#fff', borderRadius: 100,
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
            background: '#FFC726', border: 'none', color: '#002882',
            borderRadius: 20, padding: '8px 18px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}>
            Share {selected.size} Resource{selected.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: '#002882', marginTop: 48 }}>
        {/* Main footer content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 20px 24px' : '40px 32px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: isMobile ? 28 : 40 }}>

            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <ColoradoLogo size={36} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Colorado Victim Resources</div>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>Volunteer Victim Advocate</div>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{t.footer_tag}</p>
            </div>

            {/* Contact column */}
            <div>
              <div style={{ color: '#FFC726', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Contact</div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 2 }}>
                <div>📞 After Hours: 303-441-4444</div>
                <div>🏢 Office: 303-926-2841</div>
                <div>✉️ victimservices@erieco.gov</div>
              </div>
            </div>

            {/* Emergency column */}
            <div>
              <div style={{ color: '#FFC726', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Emergency</div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 2 }}>
                <div>🚨 Emergency: 911</div>
                <div>💜 DV Hotline: 1-800-799-7233</div>
                <div>⚖️ Victim Rights: 303-239-4497</div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: isMobile ? '14px 20px' : '14px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
              © {new Date().getFullYear()} Colorado Victim Resources. All rights reserved.
            </div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
              Services available 7 days a week, 24 hours a day.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
