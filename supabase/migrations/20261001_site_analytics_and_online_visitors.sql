-- ==============================================================================
-- Migration: 20261001_site_analytics_and_online_visitors.sql
-- Description: Real database-backed visitor traffic tracking with real-time presence
--              and configurable starting base visits (starts at 5,698).
-- Author: SFV Apparel Engineering Team
-- ==============================================================================

-- 1. Table for analytics settings (e.g. baseline counter offset)
CREATE TABLE IF NOT EXISTS public.site_analytics_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  base_total_visits BIGINT NOT NULL DEFAULT 5698,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert initial baseline 5698 if not already present
INSERT INTO public.site_analytics_settings (id, base_total_visits)
VALUES ('default', 5698)
ON CONFLICT (id) DO UPDATE SET base_total_visits = GREATEST(site_analytics_settings.base_total_visits, 5698);

-- Enable RLS on site_analytics_settings
ALTER TABLE public.site_analytics_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read site_analytics_settings"
ON public.site_analytics_settings FOR SELECT
USING (true);

-- 2. Table for real site visits and heartbeat presence
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  page_path TEXT DEFAULT '/',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for speedy lookups and time-range filtering
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_last_seen_at ON public.site_visits(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at);

-- Enable Row Level Security on site_visits
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert and update on site_visits" ON public.site_visits;
CREATE POLICY "Allow public insert and update on site_visits" 
ON public.site_visits FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Stored RPC function for atomic track & instant aggregate calculation
CREATE OR REPLACE FUNCTION public.track_and_get_visitor_stats(
  p_session_id TEXT,
  p_page_path TEXT DEFAULT '/'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_online_count BIGINT;
  v_today_count BIGINT;
  v_week_count BIGINT;
  v_total_raw_count BIGINT;
  v_base_offset BIGINT := 5698;
  v_total_final BIGINT;
  v_existing_id UUID;
BEGIN
  -- Validate session_id
  IF p_session_id IS NULL OR trim(p_session_id) = '' THEN
    p_session_id := 'anon_' || floor(random() * 10000000)::text;
  END IF;

  -- 1. Check if session exists in the last 24 hours to update last_seen_at, else insert new visit record
  SELECT id INTO v_existing_id
  FROM public.site_visits
  WHERE session_id = p_session_id
    AND created_at >= (now() - interval '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.site_visits
    SET last_seen_at = now(),
        page_path = COALESCE(p_page_path, page_path)
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.site_visits (session_id, page_path, created_at, last_seen_at)
    VALUES (p_session_id, COALESCE(p_page_path, '/'), now(), now());
  END IF;

  -- 2. Fetch baseline offset
  SELECT base_total_visits INTO v_base_offset
  FROM public.site_analytics_settings
  WHERE id = 'default'
  LIMIT 1;

  IF v_base_offset IS NULL THEN
    v_base_offset := 5698;
  END IF;

  -- 3. Count Active / Online Sessions (Active within last 3 minutes for sharp realtime tracking)
  SELECT COUNT(DISTINCT session_id) INTO v_online_count
  FROM public.site_visits
  WHERE last_seen_at >= (now() - interval '3 minutes');

  IF v_online_count IS NULL OR v_online_count < 1 THEN
    v_online_count := 1;
  END IF;

  -- 4. Count Today's Unique Visits (Visits created in last 24h)
  SELECT COUNT(DISTINCT session_id) INTO v_today_count
  FROM public.site_visits
  WHERE created_at >= (now() - interval '24 hours');

  IF v_today_count IS NULL OR v_today_count < 1 THEN
    v_today_count := 1;
  END IF;

  -- 5. Count This Week's Unique Visits (Visits created in last 7 days)
  SELECT COUNT(DISTINCT session_id) INTO v_week_count
  FROM public.site_visits
  WHERE created_at >= (now() - interval '7 days');

  IF v_week_count IS NULL OR v_week_count < v_today_count THEN
    v_week_count := v_today_count;
  END IF;

  -- 6. Count Total Unique Visits from site_visits + baseline offset
  SELECT COUNT(DISTINCT session_id) INTO v_total_raw_count
  FROM public.site_visits;

  IF v_total_raw_count IS NULL THEN
    v_total_raw_count := 0;
  END IF;

  v_total_final := v_base_offset + v_total_raw_count;

  RETURN json_build_object(
    'online', v_online_count,
    'today', v_today_count,
    'this_week', v_week_count,
    'total', v_total_final
  );
END;
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.track_and_get_visitor_stats(TEXT, TEXT) TO anon, authenticated, service_role;
