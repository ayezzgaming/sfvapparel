-- ============================================
-- Migration: Add WhatsApp Reminder Sent-At Flags
-- File: 20260925_add_reminder_sent_flags.sql
-- Purpose: Prevent infinite re-sending of WA notifications
-- Run this in Supabase SQL Editor
-- ============================================

-- Add sent-at tracking columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS deposit_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS balance_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN orders.deposit_reminder_sent_at IS 'Timestamp when deposit payment reminder was sent via WhatsApp. NULL = never sent.';
COMMENT ON COLUMN orders.balance_reminder_sent_at IS 'Timestamp when balance (50%) payment reminder was sent via WhatsApp. NULL = never sent.';
COMMENT ON COLUMN orders.review_sent_at IS 'Timestamp when post-delivery review request was sent via WhatsApp. NULL = never sent.';
COMMENT ON COLUMN orders.reminder_count IS 'Total number of WhatsApp reminders sent for this order. Max should be 3.';

-- Index for efficient cron queries (only query unsent orders)
CREATE INDEX IF NOT EXISTS idx_orders_deposit_reminder 
  ON orders(deposit_reminder_sent_at) 
  WHERE deposit_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_balance_reminder 
  ON orders(balance_reminder_sent_at) 
  WHERE balance_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_review_sent 
  ON orders(review_sent_at) 
  WHERE review_sent_at IS NULL;

-- Index on status + payment_status for cron filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
  ON orders(status, payment_status);

-- ============================================
-- Verify migration worked:
-- ============================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name IN ('deposit_reminder_sent_at','balance_reminder_sent_at','review_sent_at','reminder_count');
