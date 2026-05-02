-- Tighten RLS on brands table
--
-- Current state before this migration:
--   - anyone_can_read_brands  (authenticated, filter 'true') -- too permissive
--   - public_read_brands      (anon+authenticated, filter 'true') -- too permissive
--   - brands_select           (owner OR super-admin) -- redundant with brands_all
--   - brands_all              (ALL ops, owner OR super-admin)
--
-- New design:
--   1. Brand owner (or super-admin) has full access to their own brands
--   2. Anyone (anon or authenticated) can read brands that have at least
--      one active or completed campaign (so respondents can see brand info
--      when filling out surveys).
--   3. Draft/pending-payment brands are private to the owner.

-- 1. Drop existing brands policies (if present)
DROP POLICY IF EXISTS anyone_can_read_brands ON brands;
DROP POLICY IF EXISTS public_read_brands ON brands;
DROP POLICY IF EXISTS brands_select ON brands;
DROP POLICY IF EXISTS brands_all ON brands;

-- 2. Owner + super-admin: full access to their own brands
CREATE POLICY brands_owner_full ON brands FOR ALL
  USING (
    user_id = auth.uid()
    OR auth.uid() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::uuid
  )
  WITH CHECK (
    user_id = auth.uid()
    OR auth.uid() = '4a05e9c5-005b-4dba-8160-5b3354c5df37'::uuid
  );

-- 3. Public read: brands that have at least one active or completed campaign
CREATE POLICY brands_public_read_when_active ON brands FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.brand_id = brands.id
        AND campaigns.status IN ('active', 'completed')
    )
  );

-- 4. Cleanup: drop redundant campaigns_select policy
-- (campaigns_all already covers SELECT for owner/super-admin)
DROP POLICY IF EXISTS campaigns_select ON campaigns;

-- 5. Allow anonymous reads of active campaigns (for respondent survey flow)
-- Currently anyone_can_read_active_campaigns is for authenticated only;
-- but anonymous respondents need to read active campaigns too,
-- and brands_public_read_when_active depends on this via EXISTS subquery.
DROP POLICY IF EXISTS anyone_can_read_active_campaigns ON campaigns;

CREATE POLICY anyone_can_read_active_campaigns ON campaigns FOR SELECT
  TO anon, authenticated
  USING (status IN ('active', 'completed'));
