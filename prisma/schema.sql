-- Migration: PTT Alertor Schema
-- Created: 2026-03-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Clerk, but we track plan/subscription metadata)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  line_id VARCHAR(255),
  discord_webhook VARCHAR(500),
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'light', 'pro', 'enterprise')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Stripe columns if they don't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_customer_id') THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
  END IF;
END$$;

-- Boards reference table
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  alias VARCHAR(100),
  category VARCHAR(50),
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  board_name VARCHAR(50) NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]', -- [{text: "keyword", logic: "AND|OR"}]
  notify_line BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT true,
  notify_discord BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  check_interval INTEGER DEFAULT 300, -- seconds, tier-dependent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert logs table
CREATE TABLE IF NOT EXISTS alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url VARCHAR(500) NOT NULL,
  article_author VARCHAR(50),
  article_time TIMESTAMPTZ,
  matched_keywords JSONB NOT NULL DEFAULT '[]',
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  notification_channel VARCHAR(20) -- 'line' | 'email' | 'discord'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_board ON subscriptions(board_name);
CREATE INDEX IF NOT EXISTS idx_alert_logs_subscription ON alert_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_time ON alert_logs(notified_at DESC);

-- Seed popular boards
INSERT INTO boards (name, alias, category) VALUES
  ('Stock', '股板', 'finance'),
  ('Tech_Job', '科技業板', 'career'),
  ('Soft_Job', '軟工板', 'career'),
  ('Gossiping', '八卦板', 'social'),
  ('NBA', 'NBA板', 'sports'),
  ('Baseball', '棒球板', 'sports'),
  ('Movie', '電影板', 'entertainment'),
  ('TechNews', '科技板', 'news'),
  ('Crypto', '加密貨幣', 'finance'),
  ('MobileComm', '手機板', 'tech')
ON CONFLICT (name) DO NOTHING;
