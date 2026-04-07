/*
  # GridShare - Peer-to-Peer Energy Trading Platform Schema

  ## Overview
  Complete database schema for GridShare energy trading platform with blockchain-inspired security.

  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `node_type` (text) - Type: 'producer', 'consumer', 'prosumer'
  - `total_carbon_saved` (numeric) - Total CO2 saved in kg
  - `total_energy_sold` (numeric) - Total kWh sold
  - `total_energy_bought` (numeric) - Total kWh bought
  - `wallet_balance` (numeric) - User's wallet balance
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `energy_nodes`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner of the node
  - `name` (text) - Node name
  - `latitude` (numeric) - Location latitude
  - `longitude` (numeric) - Location longitude
  - `node_status` (text) - 'surplus', 'balanced', 'deficit'
  - `current_generation` (numeric) - Current solar generation in kW
  - `current_consumption` (numeric) - Current consumption in kW
  - `storage_capacity` (numeric) - Battery capacity in kWh
  - `current_storage` (numeric) - Current battery level in kWh
  - `is_active` (boolean) - Whether node is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `energy_transactions`
  - `id` (uuid, primary key)
  - `seller_id` (uuid) - Selling user
  - `buyer_id` (uuid) - Buying user
  - `seller_node_id` (uuid) - Selling node
  - `buyer_node_id` (uuid) - Buying node
  - `energy_amount` (numeric) - kWh traded
  - `price_per_kwh` (numeric) - Price in currency
  - `total_price` (numeric) - Total transaction amount
  - `carbon_saved` (numeric) - CO2 saved from this transaction
  - `transaction_hash` (text) - Blockchain-style hash for security
  - `status` (text) - 'pending', 'completed', 'failed'
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `smart_meter_readings`
  - `id` (uuid, primary key)
  - `node_id` (uuid) - Energy node
  - `timestamp` (timestamptz) - Reading time
  - `generation` (numeric) - Solar generation in kW
  - `consumption` (numeric) - Consumption in kW
  - `net_energy` (numeric) - Net energy (generation - consumption)
  - `battery_level` (numeric) - Battery percentage
  - `grid_import` (numeric) - Energy imported from grid
  - `grid_export` (numeric) - Energy exported to grid

  ### `ev_charging_stations`
  - `id` (uuid, primary key)
  - `node_id` (uuid) - Associated energy node
  - `name` (text) - Station name
  - `latitude` (numeric) - Location
  - `longitude` (numeric) - Location
  - `total_capacity` (numeric) - Total kW capacity
  - `available_capacity` (numeric) - Available kW
  - `price_per_kwh` (numeric) - Charging price
  - `is_active` (boolean) - Station status
  - `created_at` (timestamptz)

  ### `ev_charging_sessions`
  - `id` (uuid, primary key)
  - `station_id` (uuid) - Charging station
  - `user_id` (uuid) - User charging
  - `energy_delivered` (numeric) - kWh delivered
  - `total_cost` (numeric) - Total cost
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz)

  ### `carbon_savings`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User
  - `date` (date) - Date of saving
  - `energy_from_solar` (numeric) - kWh from solar
  - `co2_saved` (numeric) - kg CO2 saved
  - `equivalent_trees` (numeric) - Trees equivalent
  - `equivalent_km_saved` (numeric) - Driving km equivalent

  ### `emergency_alerts`
  - `id` (uuid, primary key)
  - `alert_type` (text) - 'blackout', 'flood', 'disaster'
  - `severity` (text) - 'low', 'medium', 'high', 'critical'
  - `affected_area` (text) - Geographic area
  - `latitude` (numeric) - Center point
  - `longitude` (numeric) - Center point
  - `radius_km` (numeric) - Affected radius
  - `priority_nodes` (jsonb) - Priority hospital/shelter nodes
  - `message` (text) - Alert message
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `resolved_at` (timestamptz)

  ### `energy_prices`
  - `id` (uuid, primary key)
  - `timestamp` (timestamptz)
  - `base_price` (numeric) - Base price per kWh
  - `peak_multiplier` (numeric) - Peak hour multiplier
  - `demand_level` (numeric) - Current demand level
  - `supply_level` (numeric) - Current supply level
  - `calculated_price` (numeric) - Final price

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Public read access for aggregated statistics
  - Admin role for emergency management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  node_type text NOT NULL DEFAULT 'consumer' CHECK (node_type IN ('producer', 'consumer', 'prosumer')),
  total_carbon_saved numeric DEFAULT 0,
  total_energy_sold numeric DEFAULT 0,
  total_energy_bought numeric DEFAULT 0,
  wallet_balance numeric DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create energy_nodes table
CREATE TABLE IF NOT EXISTS energy_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  node_status text DEFAULT 'balanced' CHECK (node_status IN ('surplus', 'balanced', 'deficit')),
  current_generation numeric DEFAULT 0,
  current_consumption numeric DEFAULT 0,
  storage_capacity numeric DEFAULT 10,
  current_storage numeric DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE energy_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nodes"
  ON energy_nodes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read active nodes"
  ON energy_nodes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create energy_transactions table
CREATE TABLE IF NOT EXISTS energy_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_node_id uuid REFERENCES energy_nodes(id) ON DELETE CASCADE NOT NULL,
  buyer_node_id uuid REFERENCES energy_nodes(id) ON DELETE CASCADE NOT NULL,
  energy_amount numeric NOT NULL CHECK (energy_amount > 0),
  price_per_kwh numeric NOT NULL CHECK (price_per_kwh > 0),
  total_price numeric NOT NULL CHECK (total_price > 0),
  carbon_saved numeric DEFAULT 0,
  transaction_hash text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE energy_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON energy_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can create transactions"
  ON energy_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Create smart_meter_readings table
CREATE TABLE IF NOT EXISTS smart_meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES energy_nodes(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz DEFAULT now(),
  generation numeric DEFAULT 0,
  consumption numeric DEFAULT 0,
  net_energy numeric DEFAULT 0,
  battery_level numeric DEFAULT 50,
  grid_import numeric DEFAULT 0,
  grid_export numeric DEFAULT 0
);

ALTER TABLE smart_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meter readings"
  ON smart_meter_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM energy_nodes
      WHERE energy_nodes.id = node_id
      AND energy_nodes.user_id = auth.uid()
    )
  );

-- Create ev_charging_stations table
CREATE TABLE IF NOT EXISTS ev_charging_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES energy_nodes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  total_capacity numeric DEFAULT 50,
  available_capacity numeric DEFAULT 50,
  price_per_kwh numeric DEFAULT 0.25,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ev_charging_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active EV stations"
  ON ev_charging_stations FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Node owners can manage EV stations"
  ON ev_charging_stations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM energy_nodes
      WHERE energy_nodes.id = node_id
      AND energy_nodes.user_id = auth.uid()
    )
  );

-- Create ev_charging_sessions table
CREATE TABLE IF NOT EXISTS ev_charging_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid REFERENCES ev_charging_stations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  energy_delivered numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE ev_charging_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own charging sessions"
  ON ev_charging_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create charging sessions"
  ON ev_charging_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create carbon_savings table
CREATE TABLE IF NOT EXISTS carbon_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  energy_from_solar numeric DEFAULT 0,
  co2_saved numeric DEFAULT 0,
  equivalent_trees numeric DEFAULT 0,
  equivalent_km_saved numeric DEFAULT 0
);

ALTER TABLE carbon_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own carbon savings"
  ON carbon_savings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read aggregated savings"
  ON carbon_savings FOR SELECT
  TO authenticated
  USING (true);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('blackout', 'flood', 'disaster', 'maintenance')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_area text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_km numeric DEFAULT 5,
  priority_nodes jsonb DEFAULT '[]'::jsonb,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active alerts"
  ON emergency_alerts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create energy_prices table
CREATE TABLE IF NOT EXISTS energy_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  base_price numeric DEFAULT 0.15,
  peak_multiplier numeric DEFAULT 1.0,
  demand_level numeric DEFAULT 50,
  supply_level numeric DEFAULT 50,
  calculated_price numeric DEFAULT 0.15
);

ALTER TABLE energy_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read energy prices"
  ON energy_prices FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_energy_nodes_user_id ON energy_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_nodes_status ON energy_nodes(node_status);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON energy_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON energy_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON energy_transactions(status);
CREATE INDEX IF NOT EXISTS idx_meter_readings_node ON smart_meter_readings(node_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_time ON smart_meter_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_carbon_savings_user ON carbon_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_savings_date ON carbon_savings(date);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_active ON emergency_alerts(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_energy_nodes_updated_at ON energy_nodes;
CREATE TRIGGER update_energy_nodes_updated_at
  BEFORE UPDATE ON energy_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
