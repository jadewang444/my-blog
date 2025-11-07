-- Complete setup for privacy-friendly analytics
-- Run this entire file in Supabase SQL Editor

-- Drop old table if it exists
DROP TABLE IF EXISTS pageviews_old CASCADE;
DROP TABLE IF EXISTS pageviews CASCADE;
DROP VIEW IF EXISTS pageviews_by_path CASCADE;

-- Raw pageview details (privacy-friendly)
CREATE TABLE pageviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path         TEXT NOT NULL,
  referrer     TEXT,
  user_agent   TEXT,
  country      TEXT,
  country_code TEXT,
  city         TEXT,
  ip_mask      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_pageviews_path ON pageviews(path);
CREATE INDEX idx_pageviews_created_at ON pageviews(created_at);

-- Enable Row Level Security
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can INSERT only
CREATE POLICY p_pageviews_insert_anon
ON pageviews FOR INSERT
TO anon
WITH CHECK (
  char_length(path) <= 512
  AND (referrer IS NULL OR char_length(referrer) <= 512)
  AND (user_agent IS NULL OR char_length(user_agent) <= 512)
  AND (country IS NULL OR char_length(country) <= 100)
  AND (city IS NULL OR char_length(city) <= 100)
  AND (country_code IS NULL OR char_length(country_code) <= 10)
  AND (ip_mask IS NULL OR char_length(ip_mask) <= 64)
);

-- Policy: Anonymous users CANNOT read raw table
CREATE POLICY p_pageviews_select_anon
ON pageviews FOR SELECT
TO anon
USING (false);

-- Service role can do everything
CREATE POLICY p_pageviews_service_all
ON pageviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public aggregated view (no PII, no details)
CREATE VIEW pageviews_by_path AS
SELECT
  path,
  COUNT(*)::BIGINT AS views,
  MAX(created_at) AS last_seen
FROM pageviews
GROUP BY path
ORDER BY views DESC;

-- Grant SELECT on view to anon
GRANT SELECT ON pageviews_by_path TO anon;
GRANT SELECT ON pageviews_by_path TO authenticated;