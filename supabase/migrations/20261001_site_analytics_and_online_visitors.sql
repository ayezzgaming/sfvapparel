-- ==============================================================================
-- Migration: 20261001_site_analytics_and_online_visitors.sql
-- Description: Real database-backed visitor traffic tracking and analytics
-- Author: SFV Apparel Engineering Team
-- ==============================================================================

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

-- Enable Row Level Security
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow public insert and update on site_visits
CREATE POLICY "Allow public insert and update on site_visits" 
ON public.site_visits FOR ALL 
USING (true)
WITH CHECK (true);

-- RPC to record visit / heartbeat & return live real aggregated statistics
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
  v_total_count BIGINT;
  v_existing_id UUID;
BEGIN
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

  -- 2. Count Active / Online Sessions (Active in last 5 minutes)
  SELECT COUNT(DISTINCT session_id) INTO v_online_count
  FROM public.site_visits
  WHERE last_seen_at >= (now() - interval '5 minutes');

  -- Ensure online count is at least 1 (the current visitor)
  IF v_online_count IS NULL OR v_online_count < 1 THEN
    v_online_count := 1;
  END IF;

  -- 3. Count Today's Visits (Visits created today)
  SELECT COUNT(*) INTO v_today_count
  FROM public.site_visits
  WHERE created_at >= (now() - interval '24 hours');

  IF v_today_count IS NULL OR v_today_count < 1 THEN
    v_today_count := 1;
  END IF;

  -- 4. Count This Week's Visits (Visits created in last 7 days)
  SELECT COUNT(*) INTO v_week_count
  FROM public.site_visits
  WHERE created_at >= (now() - interval '7 days');

  IF v_week_count IS NULL OR v_week_count < v_today_count THEN
    v_week_count := v_today_count;
  END IF;

  -- 5. Count Total Visits
  SELECT COUNT(*) INTO v_total_count
  FROM public.site_visits;

  IF v_total_count IS NULL OR v_total_count < v_week_count THEN
    v_total_count := v_week_count;
  END IF;

  RETURN json_build_object(
    'online', v_online_count,
    'today', v_today_count,
    'this_week', v_week_count,
    'total', v_total_count
  );
END;
$$;

-- Grant execution to public / anon
GRANT EXECUTE ON FUNCTION public.track_and_get_visitor_stats(TEXT, TEXT) TO anon, authenticated, service_role;
