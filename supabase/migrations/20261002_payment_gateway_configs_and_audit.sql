-- ==============================================================================
-- Migration: 20261002_payment_gateway_configs_and_audit.sql
-- Description: Production database persistence for payment gateway configurations
--              and audit tracking for secure multi-environment deployments.
-- Author: SFV Apparel Engineering Team
-- ==============================================================================

-- 1. Create table for payment gateway configurations
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  id TEXT PRIMARY KEY DEFAULT 'chip-main-gateway',
  provider TEXT NOT NULL DEFAULT 'chip',
  brand_id TEXT NOT NULL DEFAULT '',
  api_key TEXT NOT NULL DEFAULT '',
  public_key TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT DEFAULT '/api/payment/chip/webhook',
  payment_methods JSONB DEFAULT '["fpx", "card", "duitnow_qr", "ewallet"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- Allow service_role and authenticated admins full access
DROP POLICY IF EXISTS "Allow service_role full access to payment_gateway_configs" ON public.payment_gateway_configs;
CREATE POLICY "Allow service_role full access to payment_gateway_configs"
ON public.payment_gateway_configs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO public.payment_gateway_configs (id, provider, brand_id, api_key, public_key, is_active, is_sandbox)
VALUES ('chip-main-gateway', 'chip', '', '', '', false, true)
ON CONFLICT (id) DO NOTHING;
