import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto-js';
import { ArrowUpRight, ArrowDownLeft, X, Leaf, TrendingUp } from 'lucide-react-native';

type EnergyNode = {
  id: string;
  name: string;
  node_status: string;
  current_generation: number;
  current_consumption: number;
};

type Transaction = {
  id: string;
  seller_id: string;
  buyer_id: string;
  energy_amount: number;
  price_per_kwh: number;
  total_price: number;
  carbon_saved: number;
  status: string;
  created_at: string;
  seller_node_id: string;
  buyer_node_id: string;
};

type AvailableListing = {
  node: EnergyNode;
  userId: string;
  userName: string;
  availableEnergy: number;
};

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [myNodes, setMyNodes] = useState<EnergyNode[]>([]);
  const [availableNodes, setAvailableNodes] = useState<AvailableListing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AvailableListing | null>(null);
  const [energyAmount, setEnergyAmount] = useState('');
  const [selectedBuyerNode, setSelectedBuyerNode] = useState<EnergyNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0.15);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    await Promise.all([
      fetchMyNodes(),
      fetchAvailableNodes(),
      fetchTransactions(),
      fetchCurrentPrice(),
      fetchLeaderboard(),
    ]);
  };

  const fetchMyNodes = async () => {
    const { data } = await supabase
      .from('energy_nodes')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_active', true);
    if (data) setMyNodes(data);
  };

  const fetchAvailableNodes = async () => {
    const { data: nodesData } = await supabase
      .from('energy_nodes')
      .select('*, profiles!inner(user_id, full_name)')
      .eq('is_active', true)
      .eq('node_status', 'surplus')
      .neq('user_id', user?.id);

    if (nodesData) {
      const listings: AvailableListing[] = nodesData.map((node: any) => ({
        node,
        userId: node.profiles.user_id,
        userName: node.profiles.full_name,
        availableEnergy: node.current_generation - node.current_consumption,
      }));
      setAvailableNodes(listings);
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('energy_transactions')
      .select('*')
      .or(`seller_id.eq.${user?.id},buyer_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
  };

  const fetchCurrentPrice = async () => {
    const { data } = await supabase
      .from('energy_prices')
      .select('calculated_price')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    if (data) setCurrentPrice(data.calculated_price);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, total_carbon_saved')
      .order('total_carbon_saved', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleBuyEnergy = async () => {
    if (!energyAmount || !selectedListing || !selectedBuyerNode || !user) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(energyAmount);
    if (amount <= 0 || amount > selectedListing.availableEnergy) {
      Alert.alert('Error', 'Invalid energy amount');
      return;
    }

    setLoading(true);

    const totalPrice = amount * currentPrice;
    const carbonSaved = amount * 0.4;

    const transactionData = {
      seller_id: selectedListing.userId,
      buyer_id: user.id,
      seller_node_id: selectedListing.node.id,
      buyer_node_id: selectedBuyerNode.id,
      energy_amount: amount,
      price_per_kwh: currentPrice,
      total_price: totalPrice,
      carbon_saved: carbonSaved,
      transaction_hash: crypto.SHA256(`${Date.now()}-${user.id}-${amount}`).toString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
    };

    const { error: txError } = await supabase
      .from('energy_transactions')
      .insert(transactionData);

    if (!txError) {
      await supabase
        .from('profiles')
        .update({
          total_energy_bought: supabase.rpc('increment', { x: amount }),
          total_carbon_saved: supabase.rpc('increment', { x: carbonSaved }),
          wallet_balance: supabase.rpc('decrement', { x: totalPrice }),
        })
        .eq('user_id', user.id);

      await supabase
        .from('profiles')
        .update({
          total_energy_sold: supabase.rpc('increment', { x: amount }),
          wallet_balance: supabase.rpc('increment', { x: totalPrice }),
        })
        .eq('user_id', selectedListing.userId);

      const today = new Date().toISOString().split('T')[0];
      const { data: existingCarbon } = await supabase
        .from('carbon_savings')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existingCarbon) {
        await supabase
          .from('carbon_savings')
          .update({
            energy_from_solar: existingCarbon.energy_from_solar + amount,
            co2_saved: existingCarbon.co2_saved + carbonSaved,
            equivalent_trees: existingCarbon.equivalent_trees + (carbonSaved / 21),
            equivalent_km_saved: existingCarbon.equivalent_km_saved + (carbonSaved * 5),
          })
          .eq('id', existingCarbon.id);
      } else {
        await supabase.from('carbon_savings').insert({
          user_id: user.id,
          date: today,
          energy_from_solar: amount,
          co2_saved: carbonSaved,
          equivalent_trees: carbonSaved / 21,
          equivalent_km_saved: carbonSaved * 5,
        });
      }

      Alert.alert('Success', `Transaction completed! You saved ${carbonSaved.toFixed(2)} kg CO₂`);
      setShowBuyModal(false);
      setEnergyAmount('');
      setSelectedListing(null);
      fetchData();
    } else {
      Alert.alert('Error', txError.message);
    }

    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Energy Trading</Text>
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => setShowLeaderboard(true)}
        >
          <TrendingUp size={20} color="#10b981" />
          <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Current Market Price</Text>
        <Text style={styles.priceValue}>${currentPrice.toFixed(3)} / kWh</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Energy</Text>
        {availableNodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No energy available for purchase</Text>
          </View>
        ) : (
          availableNodes.map((listing, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listingCard}
              onPress={() => {
                setSelectedListing(listing);
                setShowBuyModal(true);
              }}
            >
              <View style={styles.listingHeader}>
                <Text style={styles.listingName}>{listing.node.name}</Text>
                <Text style={styles.listingUser}>{listing.userName}</Text>
              </View>
              <View style={styles.listingStats}>
                <View style={styles.listingStat}>
                  <Text style={styles.listingStatLabel}>Available</Text>
                  <Text style={styles.listingStatValue}>{listing.availableEnergy.toFixed(1)} kWh</Text>
                </View>
                <View style={styles.listingStat}>
                  <Text style={styles.listingStatLabel}>Price</Text>
                  <Text style={styles.listingStatValue}>${(listing.availableEnergy * currentPrice).toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                {tx.seller_id === user?.id ? (
                  <ArrowUpRight size={24} color="#10b981" />
                ) : (
                  <ArrowDownLeft size={24} color="#f59e0b" />
                )}
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.seller_id === user?.id ? 'Sold' : 'Bought'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.transactionEnergy}>{tx.energy_amount.toFixed(1)} kWh</Text>
                  <Text style={styles.transactionPrice}>${tx.total_price.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.carbonBadge}>
                <Leaf size={16} color="#10b981" />
                <Text style={styles.carbonText}>{tx.carbon_saved.toFixed(2)} kg CO₂ saved</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={showBuyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Energy</Text>
              <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedListing && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>From: {selectedListing.userName}</Text>
                <Text style={styles.modalValue}>Available: {selectedListing.availableEnergy.toFixed(1)} kWh</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Your Node</Text>
              <ScrollView horizontal style={styles.nodeSelector} showsHorizontalScrollIndicator={false}>
                {myNodes.map((node) => (
                  <TouchableOpacity
                    key={node.id}
                    style={[
                      styles.nodePill,
                      selectedBuyerNode?.id === node.id && styles.nodePillSelected,
                    ]}
                    onPress={() => setSelectedBuyerNode(node)}
                  >
                    <Text style={[
                      styles.nodePillText,
                      selectedBuyerNode?.id === node.id && styles.nodePillTextSelected,
                    ]}>
                      {node.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Energy Amount (kWh)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor="#64748b"
                value={energyAmount}
                onChangeText={setEnergyAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {energyAmount && parseFloat(energyAmount) > 0 && (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Price</Text>
                  <Text style={styles.summaryValue}>
                    ${(parseFloat(energyAmount) * currentPrice).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CO₂ Saved</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    {(parseFloat(energyAmount) * 0.4).toFixed(2)} kg
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.buyButton, loading && styles.buyButtonDisabled]}
              onPress={handleBuyEnergy}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buyButtonText}>Complete Purchase</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLeaderboard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Eco Contributors</Text>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.leaderboardList}>
              {leaderboard.map((user, index) => (
                <View key={index} style={styles.leaderboardItem}>
                  <View style={styles.leaderboardRank}>
                    <Text style={styles.leaderboardRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{user.full_name}</Text>
                    <View style={styles.leaderboardCarbon}>
                      <Leaf size={14} color="#10b981" />
                      <Text style={styles.leaderboardCarbonText}>
                        {user.total_carbon_saved.toFixed(1)} kg CO₂
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  leaderboardButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  priceCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8,
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  listingCard: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  listingHeader: {
    marginBottom: 12,
  },
  listingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listingUser: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  listingStats: {
    flexDirection: 'row',
    gap: 16,
  },
  listingStat: {
    flex: 1,
  },
  listingStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  listingStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
  },
  transactionCard: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionEnergy: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  transactionPrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  carbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  carbonText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modalInfo: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  nodeSelector: {
    flexDirection: 'row',
  },
  nodePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334155',
    marginRight: 8,
  },
  nodePillSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
  },
  nodePillText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  nodePillTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summary: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buyButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardList: {
    maxHeight: 400,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 12,
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  leaderboardCarbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  leaderboardCarbonText: {
    fontSize: 14,
    color: '#10b981',
  },
});
