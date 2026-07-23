alter table public.brochures
  add column if not exists translations jsonb not null default '{}'::jsonb;

comment on column public.brochures.translations is
  'Cache of machine-translated {title, description, translated_at} keyed by language code, e.g. {"es": {"title": "...", "description": "...", "translated_at": "..."}}. Cleared on every title/description edit; regenerated lazily by the translate-brochure edge function.';
