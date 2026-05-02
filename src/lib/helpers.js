import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function getCategoryBg(id) {
  const m = {
    housing: '#E1F5EE',
    legal: '#E6F1FB',
    counseling: '#EEEDFE',
    financial: '#EAF3DE',
    safety: '#FAECE7',
    children: '#FBEAF0',
    medical: '#E6F1FB',
    emergency: '#FCEBEB',
  }
  return m[id] || '#F5F3EE'
}

export function buildShareLink(b) {
  return `${window.location.origin}/brochures/${b.id}`
}

export function emailBrochure(b, email = '') {
  const link = b.link_url || buildShareLink(b)
  const s = encodeURIComponent(`Resource: ${b.title}`)
  const body = encodeURIComponent(
    `Hello,\n\nI wanted to share this resource with you:\n\n${b.title}\n${b.description || ''}\n\nLink: ${link}\n\nShared by your victim advocate.`
  )
  window.open(`mailto:${email}?subject=${s}&body=${body}`, '_blank')
}

export function textBrochure(b, phone = '') {
  const link = b.link_url || buildShareLink(b)
  const msg = encodeURIComponent(`Resource from your advocate: "${b.title}" — ${link}`)
  window.open(`sms:${phone}?body=${msg}`, '_blank')
}

export async function logShare(id, method) {
  await supabase.from('share_logs').insert({ brochure_id: id, method })
}

export function isAdmin() {
  return window.location.pathname.startsWith('/admin')
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}
