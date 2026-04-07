export type NodeType = 'producer' | 'consumer' | 'prosumer';
export type NodeStatus = 'surplus' | 'balanced' | 'deficit';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type AlertType = 'blackout' | 'flood' | 'disaster' | 'maintenance';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  node_type: NodeType;
  total_carbon_saved: number;
  total_energy_sold: number;
  total_energy_bought: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface EnergyNode {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  node_status: NodeStatus;
  current_generation: number;
  current_consumption: number;
  storage_capacity: number;
  current_storage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnergyTransaction {
  id: string;
  seller_id: string;
  buyer_id: string;
  seller_node_id: string;
  buyer_node_id: string;
  energy_amount: number;
  price_per_kwh: number;
  total_price: number;
  carbon_saved: number;
  transaction_hash: string;
  status: TransactionStatus;
  created_at: string;
  completed_at?: string;
}

export interface SmartMeterReading {
  id: string;
  node_id: string;
  timestamp: string;
  generation: number;
  consumption: number;
  net_energy: number;
  battery_level: number;
  grid_import: number;
  grid_export: number;
}

export interface EVChargingStation {
  id: string;
  node_id: string;
  name: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  available_capacity: number;
  price_per_kwh: number;
  is_active: boolean;
  created_at: string;
}

export interface EVChargingSession {
  id: string;
  station_id: string;
  user_id: string;
  energy_delivered: number;
  total_cost: number;
  started_at: string;
  ended_at?: string;
}

export interface CarbonSaving {
  id: string;
  user_id: string;
  date: string;
  energy_from_solar: number;
  co2_saved: number;
  equivalent_trees: number;
  equivalent_km_saved: number;
}

export interface EmergencyAlert {
  id: string;
  alert_type: AlertType;
  severity: Severity;
  affected_area: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  priority_nodes: any[];
  message: string;
  is_active: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface EnergyPrice {
  id: string;
  timestamp: string;
  base_price: number;
  peak_multiplier: number;
  demand_level: number;
  supply_level: number;
  calculated_price: number;
}
