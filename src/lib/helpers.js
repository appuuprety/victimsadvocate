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

// lib/helpers.js  — find emailBrochure and replace it with:
export function emailBrochure(brochure, email) {
  const link = brochure.link_url || buildShareLink(brochure)
  const subject = encodeURIComponent(`Resource: ${brochure.title}`)
  const body = encodeURIComponent(
    `A resource has been shared with you:\n\n${brochure.title}\n\n${link}`
  )
  window.open(`mailto:${email}?subject=${subject}&body=${body}`)
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

const TEXT_SIZE_KEY = 'cvr-text-size'
export const TEXT_SIZES = { sm: 1, lg: 1.25 }

export function useTextSize() {
  const [size, setSize] = useState(() => {
    const stored = localStorage.getItem(TEXT_SIZE_KEY)
    return stored && TEXT_SIZES[stored] ? stored : 'sm'
  })
  useEffect(() => {
    document.documentElement.style.fontSize = `${TEXT_SIZES[size] * 100}%`
    document.documentElement.style.zoom = TEXT_SIZES[size]
    localStorage.setItem(TEXT_SIZE_KEY, size)
  }, [size])
  return [size, setSize]
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
