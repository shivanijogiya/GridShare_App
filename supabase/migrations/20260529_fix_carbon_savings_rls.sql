-- ============================================
-- Fix insecure RLS policy on carbon_savings
-- ============================================

-- Remove insecure policy that exposes all rows
DROP POLICY IF EXISTS "Public can read aggregated savings"
ON carbon_savings;

-- Remove existing user policy to avoid duplication conflicts
DROP POLICY IF EXISTS "Users can read own carbon savings"
ON carbon_savings;

-- Recreate secure user-scoped policy
CREATE POLICY "Users can read own carbon savings"
  ON carbon_savings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Optional aggregated analytics view
-- ============================================

CREATE OR REPLACE VIEW public_carbon_savings_stats AS
SELECT
  date,
  SUM(co2_saved) AS total_co2_saved,
  SUM(energy_from_solar) AS total_solar_energy,
  COUNT(DISTINCT user_id) AS active_users
FROM carbon_savings
GROUP BY date;

-- Allow authenticated users to read aggregated statistics
GRANT SELECT ON public_carbon_savings_stats TO authenticated;