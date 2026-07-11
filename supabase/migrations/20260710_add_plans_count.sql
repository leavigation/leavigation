-- Explorer tier: track how many leave plans a user has created
ALTER TABLE users ADD COLUMN IF NOT EXISTS plans_count integer NOT NULL DEFAULT 0;

-- Backfill from existing plan rows
UPDATE users u
SET plans_count = sub.cnt
FROM (
  SELECT user_id, COUNT(*)::integer AS cnt
  FROM plans
  GROUP BY user_id
) sub
WHERE u.id = sub.user_id;

-- If test accounts were incorrectly incremented during testing, reset with:
-- UPDATE users SET plans_count = 0 WHERE clerk_id = '<your-test-clerk-id>';
-- Or resync all users from actual plan rows:
-- UPDATE users u SET plans_count = COALESCE(sub.cnt, 0)
-- FROM (SELECT user_id, COUNT(*)::integer AS cnt FROM plans GROUP BY user_id) sub
-- WHERE u.id = sub.user_id;
