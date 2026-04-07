# GridShare - Peer-to-Peer Energy Trading Platform

A comprehensive blockchain-inspired platform for decentralized energy trading, enabling buildings with solar panels to sell excess energy directly to neighboring buildings.

## Features

### Core Functionality
- **User Authentication**: Secure email/password authentication with Supabase
- **Energy Node Management**: Create and manage solar energy nodes with real-time monitoring
- **Smart Meter Simulation**: Real-time energy generation and consumption tracking
- **P2P Energy Trading**: Buy and sell energy directly between users
- **Dynamic Pricing**: AI-based pricing model using demand/supply ratios

### Dashboard
- Real-time energy flow visualization
- Wallet balance and transaction history
- Energy generation vs consumption metrics
- Battery storage monitoring
- Current market price display

### Interactive Map
- Visual representation of all energy nodes
- Color-coded status indicators:
  - 🟢 Green: Surplus (producing more than consuming)
  - 🟡 Yellow: Balanced
  - 🔴 Red: Deficit (consuming more than producing)
  - 🔵 Blue: EV Charging Stations
- Real-time smart meter simulation
- Add new energy nodes
- View node details and statistics

### Energy Trading
- Browse available energy from surplus nodes
- Purchase energy with transparent pricing
- Transaction history with carbon savings
- Automatic carbon footprint calculation
- Top eco contributors leaderboard

### Carbon Footprint Tracking
- Real-time CO₂ savings calculation
- Equivalent metrics:
  - Trees planted
  - Kilometers not driven
- Daily carbon savings tracking
- Cumulative environmental impact

### EV Charging Integration
- Connect electric vehicles to the GridShare network
- Find nearby charging stations
- Solar-powered charging options
- Track charging sessions and costs

### Emergency/Disaster Mode
- Priority energy routing to critical infrastructure
- Hospital and emergency shelter prioritization
- Blackout prediction and prevention
- Real-time emergency alerts
- Automatic load balancing

## Technical Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router with tabs
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: react-native-maps
- **State Management**: React Context API
- **Security**: Blockchain-inspired transaction hashing
- **Real-time Updates**: Supabase Realtime subscriptions

## Database Schema

### Tables
- `profiles` - User profiles with energy statistics
- `energy_nodes` - Solar panel installations
- `energy_transactions` - P2P energy trades
- `smart_meter_readings` - Real-time energy data
- `ev_charging_stations` - EV charging locations
- `ev_charging_sessions` - Charging history
- `carbon_savings` - Environmental impact tracking
- `emergency_alerts` - Disaster management
- `energy_prices` - Dynamic pricing data

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public read access for aggregated statistics
- Secure transaction hashing

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - The `.env` file is already configured with Supabase credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Create an account:
   - Choose your role: Producer, Consumer, or Prosumer
   - Start trading clean energy!

## Usage

### For Energy Producers
1. Create an energy node on the Map tab
2. Monitor your solar generation on the Dashboard
3. Automatically sell surplus energy to nearby consumers
4. Track your earnings and carbon impact

### For Energy Consumers
1. Browse available energy on the Trade tab
2. Purchase energy from nearby producers
3. Save money and reduce carbon footprint
4. View your environmental impact

### For Prosumers
1. Both produce and consume energy
2. Sell surplus when generating more than needed
3. Buy energy when consumption exceeds generation
4. Optimize your energy balance

## Pricing Model

Dynamic pricing based on supply and demand:
```
price = base_price × (demand / supply)
```

Factors affecting price:
- Time of day (peak vs off-peak)
- Weather conditions (solar output)
- Historical demand trends
- Current grid supply

## Carbon Savings

Every transaction automatically calculates:
- CO₂ emissions saved (0.4 kg per kWh)
- Equivalent trees planted (1 tree per 21 kg CO₂)
- Equivalent driving distance saved (5 km per kg CO₂)

## Emergency Mode

In disaster scenarios:
- Energy is redirected to hospitals and shelters
- Critical infrastructure receives priority
- Load balancing prevents blackouts
- Real-time alerts keep users informed

## Building for Production

### Web
```bash
npm run build:web
```

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Security Features

- Blockchain-inspired transaction hashing
- Row-level security on all database operations
- Secure authentication with JWT tokens
- Encrypted data transmission
- No storage of sensitive payment information

## Environmental Impact

GridShare promotes:
- Clean energy adoption
- Reduced carbon emissions
- Efficient energy distribution
- Community-driven sustainability
- Transparent environmental tracking

## License

MIT License - See LICENSE file for details

## Support

For support and questions, please visit our documentation or contact support.

---

**GridShare** - Sustainable Energy for Everyone 🌱⚡
