import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.104.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Mirrors the non-English codes in src/lib/translations.js LANGS. Kept as an
// explicit allow-list so this endpoint can't be used to inject arbitrary
// language strings into the translation prompt.
const LANG_NAMES: Record<string, string> = {
  es: 'Spanish',
  vi: 'Vietnamese',
  zh: 'Simplified Chinese',
  ar: 'Arabic',
  ru: 'Russian',
  tl: 'Tagalog',
  ne: 'Nepali',
  hi: 'Hindi',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function extractJson(text: string): { title: string; description: string } | null {
  // Gemini's JSON response mode should return clean JSON, but strip a code
  // fence defensively in case a future model revision adds one anyway.
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (typeof parsed.title === 'string' && typeof parsed.description === 'string') return parsed
    return null
  } catch {
    return null
  }
}

const GEMINI_MODEL = 'gemini-3.1-flash-lite'

async function translate(title: string, description: string, langName: string) {
  const hasDescription = description.trim().length > 0

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: {
            text: [
              `You translate resource listings for a nonprofit victim-advocacy site into ${langName}.`,
              'Keep the tone warm, clear, and simple. Preserve any phone numbers, URLs, and proper nouns unchanged.',
              'Respond with ONLY a JSON object of the exact form {"title": "...", "description": "..."} — no extra commentary.',
              'If no description is given, do not invent one — return "description": "" unchanged.',
            ].join(' '),
          },
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Title: ${title}\n\nDescription: ${hasDescription ? description : '(no description provided)'}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') throw new Error('Unexpected Gemini response shape')

  const parsed = extractJson(text)
  if (!parsed) throw new Error('Could not parse translated JSON from model response')

  // Belt-and-suspenders: never let the model's output introduce description
  // text for a brochure that doesn't have one, regardless of prompt compliance.
  if (!hasDescription) parsed.description = ''
  return parsed
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    let payload: any
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const brochureId = String(payload.brochureId || '').trim()
    const lang = String(payload.lang || '').trim()

    if (!brochureId) return json({ error: 'Missing brochureId' }, 400)
    const langName = LANG_NAMES[lang]
    if (!langName) return json({ error: `Unsupported language: ${lang}` }, 400)

    const { data: brochure, error: fetchError } = await service
      .from('brochures')
      .select('title, description, translations')
      .eq('id', brochureId)
      .single()

    if (fetchError || !brochure) return json({ error: 'Brochure not found' }, 404)

    const existing = brochure.translations?.[lang]
    if (existing?.title) return json({ title: existing.title, description: existing.description, cached: true })

    const translated = await translate(brochure.title || '', brochure.description || '', langName)

    const nextTranslations = {
      ...(brochure.translations || {}),
      [lang]: { ...translated, translated_at: new Date().toISOString() },
    }

    const { error: updateError } = await service
      .from('brochures')
      .update({ translations: nextTranslations })
      .eq('id', brochureId)

    if (updateError) throw updateError

    return json({ title: translated.title, description: translated.description, cached: false })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
