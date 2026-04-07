import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Zap, TrendingUp, Leaf, Battery, TriangleAlert as AlertTriangle } from 'lucide-react-native';

type Profile = {
  full_name: string;
  node_type: string;
  total_carbon_saved: number;
  total_energy_sold: number;
  total_energy_bought: number;
  wallet_balance: number;
};

type EnergyNode = {
  id: string;
  name: string;
  node_status: string;
  current_generation: number;
  current_consumption: number;
  current_storage: number;
  storage_capacity: number;
};

type CarbonSaving = {
  co2_saved: number;
  equivalent_trees: number;
  equivalent_km_saved: number;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nodes, setNodes] = useState<EnergyNode[]>([]);
  const [todayCarbon, setTodayCarbon] = useState<CarbonSaving | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [energyPrice, setEnergyPrice] = useState(0.15);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, nodesRes, carbonRes, priceRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('energy_nodes').select('*').eq('user_id', user.id),
      supabase.from('carbon_savings').select('*').eq('user_id', user.id).eq('date', new Date().toISOString().split('T')[0]).single(),
      supabase.from('energy_prices').select('*').order('timestamp', { ascending: false }).limit(1).single(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (nodesRes.data) setNodes(nodesRes.data);
    if (carbonRes.data) setTodayCarbon(carbonRes.data);
    if (priceRes.data) setEnergyPrice(priceRes.data.calculated_price);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const totalGeneration = nodes.reduce((sum, node) => sum + node.current_generation, 0);
  const totalConsumption = nodes.reduce((sum, node) => sum + node.current_consumption, 0);
  const netEnergy = totalGeneration - totalConsumption;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>${profile?.wallet_balance.toFixed(2) || '0.00'}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Energy Sold</Text>
            <Text style={styles.balanceItemValue}>{profile?.total_energy_sold.toFixed(1) || '0'} kWh</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Energy Bought</Text>
            <Text style={styles.balanceItemValue}>{profile?.total_energy_bought.toFixed(1) || '0'} kWh</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Energy Flow</Text>
        <View style={styles.energyGrid}>
          <View style={[styles.energyCard, styles.energyGeneration]}>
            <Zap size={24} color="#10b981" />
            <Text style={styles.energyCardValue}>{totalGeneration.toFixed(1)}</Text>
            <Text style={styles.energyCardLabel}>kW Generated</Text>
          </View>
          <View style={[styles.energyCard, styles.energyConsumption]}>
            <TrendingUp size={24} color="#f59e0b" />
            <Text style={styles.energyCardValue}>{totalConsumption.toFixed(1)}</Text>
            <Text style={styles.energyCardLabel}>kW Consumed</Text>
          </View>
          <View style={[styles.energyCard, netEnergy >= 0 ? styles.energySurplus : styles.energyDeficit]}>
            <Battery size={24} color={netEnergy >= 0 ? '#10b981' : '#ef4444'} />
            <Text style={styles.energyCardValue}>{Math.abs(netEnergy).toFixed(1)}</Text>
            <Text style={styles.energyCardLabel}>{netEnergy >= 0 ? 'Surplus' : 'Deficit'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Impact</Text>
        <View style={styles.carbonCard}>
          <View style={styles.carbonHeader}>
            <Leaf size={32} color="#10b981" />
            <View style={styles.carbonMain}>
              <Text style={styles.carbonValue}>{todayCarbon?.co2_saved.toFixed(1) || '0'} kg</Text>
              <Text style={styles.carbonLabel}>CO₂ Saved Today</Text>
            </View>
          </View>
          <View style={styles.carbonDetails}>
            <View style={styles.carbonDetail}>
              <Text style={styles.carbonDetailLabel}>🌳 Trees Planted</Text>
              <Text style={styles.carbonDetailValue}>{todayCarbon?.equivalent_trees.toFixed(0) || '0'}</Text>
            </View>
            <View style={styles.carbonDetail}>
              <Text style={styles.carbonDetailLabel}>🚗 km Not Driven</Text>
              <Text style={styles.carbonDetailValue}>{todayCarbon?.equivalent_km_saved.toFixed(0) || '0'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Nodes</Text>
        {nodes.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#64748b" />
            <Text style={styles.emptyText}>No energy nodes yet</Text>
            <Text style={styles.emptySubtext}>Create your first node on the Map tab</Text>
          </View>
        ) : (
          nodes.map(node => (
            <View key={node.id} style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <Text style={styles.nodeName}>{node.name}</Text>
                <View style={[
                  styles.statusBadge,
                  node.node_status === 'surplus' && styles.statusSurplus,
                  node.node_status === 'balanced' && styles.statusBalanced,
                  node.node_status === 'deficit' && styles.statusDeficit,
                ]}>
                  <Text style={styles.statusText}>{node.node_status}</Text>
                </View>
              </View>
              <View style={styles.nodeStats}>
                <View style={styles.nodeStat}>
                  <Text style={styles.nodeStatLabel}>Generation</Text>
                  <Text style={styles.nodeStatValue}>{node.current_generation.toFixed(1)} kW</Text>
                </View>
                <View style={styles.nodeStat}>
                  <Text style={styles.nodeStatLabel}>Consumption</Text>
                  <Text style={styles.nodeStatValue}>{node.current_consumption.toFixed(1)} kW</Text>
                </View>
                <View style={styles.nodeStat}>
                  <Text style={styles.nodeStatLabel}>Storage</Text>
                  <Text style={styles.nodeStatValue}>
                    {node.current_storage.toFixed(1)}/{node.storage_capacity.toFixed(1)} kWh
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Price</Text>
        <View style={styles.priceCard}>
          <Text style={styles.priceValue}>${energyPrice.toFixed(3)}</Text>
          <Text style={styles.priceLabel}>per kWh</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  balanceCard: {
    margin: 20,
    marginTop: 10,
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  energyGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  energyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  energyGeneration: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  energyConsumption: {
    backgroundColor: '#f59e0b20',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  energySurplus: {
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  energyDeficit: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  energyCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  energyCardLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  carbonCard: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  carbonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  carbonMain: {
    flex: 1,
  },
  carbonValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
  },
  carbonLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  carbonDetails: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  carbonDetail: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
  },
  carbonDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  carbonDetailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  nodeCard: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSurplus: {
    backgroundColor: '#10b98120',
  },
  statusBalanced: {
    backgroundColor: '#3b82f620',
  },
  statusDeficit: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  nodeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  nodeStat: {
    flex: 1,
  },
  nodeStatLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  nodeStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  priceCard: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  priceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
