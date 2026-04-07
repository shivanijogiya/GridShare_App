/*
  # Seed Initial Data for GridShare

  ## Overview
  Adds initial energy pricing data and sample configurations
  
  ## Data
  - Initial energy prices with dynamic pricing formula
  - Sample EV charging stations (to be added by users)
*/

-- Insert initial energy price
INSERT INTO energy_prices (base_price, peak_multiplier, demand_level, supply_level, calculated_price)
VALUES (0.15, 1.0, 50, 50, 0.15);

-- Insert a few more price points to show variation
INSERT INTO energy_prices (
  timestamp,
  base_price,
  peak_multiplier,
  demand_level,
  supply_level,
  calculated_price
)
VALUES
  (now() - interval '1 hour', 0.15, 1.2, 70, 45, 0.18),
  (now() - interval '2 hours', 0.15, 0.9, 40, 60, 0.135),
  (now() - interval '3 hours', 0.15, 1.1, 65, 50, 0.165);
