import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, X, Zap, MapPin as MapPinIcon, TriangleAlert as AlertTriangle } from 'lucide-react-native';

type EnergyNode = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  node_status: 'surplus' | 'balanced' | 'deficit';
  current_generation: number;
  current_consumption: number;
  current_storage: number;
  storage_capacity: number;
  is_active: boolean;
};

type EVStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  available_capacity: number;
  total_capacity: number;
  price_per_kwh: number;
};

type EmergencyAlert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  latitude: number;
  longitude: number;
  radius_km: number;
};

export default function MapScreen() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<EnergyNode[]>([]);
  const [evStations, setEVStations] = useState<EVStation[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchNodes();
    fetchEVStations();
    fetchAlerts();

    const interval = setInterval(() => {
      simulateEnergyChanges();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNodes = async () => {
    const { data } = await supabase
      .from('energy_nodes')
      .select('*')
      .eq('is_active', true);
    if (data) setNodes(data);
  };

  const fetchEVStations = async () => {
    const { data } = await supabase
      .from('ev_charging_stations')
      .select('*')
      .eq('is_active', true);
    if (data) setEVStations(data);
  };

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('is_active', true);
    if (data) setAlerts(data);
  };

  const simulateEnergyChanges = async () => {
    const updates = nodes.map(node => {
      const generation = Math.random() * 10;
      const consumption = Math.random() * 8;
      const netEnergy = generation - consumption;

      let status: 'surplus' | 'balanced' | 'deficit' = 'balanced';
      if (netEnergy > 2) status = 'surplus';
      else if (netEnergy < -2) status = 'deficit';

      return {
        id: node.id,
        current_generation: generation,
        current_consumption: consumption,
        node_status: status,
      };
    });

    for (const update of updates) {
      await supabase
        .from('energy_nodes')
        .update({
          current_generation: update.current_generation,
          current_consumption: update.current_consumption,
          node_status: update.node_status,
        })
        .eq('id', update.id);
    }

    await fetchNodes();
  };

  const handleAddNode = async () => {
    if (!newNodeName.trim() || !user) {
      Alert.alert('Error', 'Please enter a node name');
      return;
    }

    const randomLat = mapRegion.latitude + (Math.random() - 0.5) * 0.02;
    const randomLng = mapRegion.longitude + (Math.random() - 0.5) * 0.02;

    const { error } = await supabase.from('energy_nodes').insert({
      user_id: user.id,
      name: newNodeName,
      latitude: randomLat,
      longitude: randomLng,
      node_status: 'balanced',
      current_generation: Math.random() * 10,
      current_consumption: Math.random() * 8,
      storage_capacity: 10,
      current_storage: 5,
      is_active: true,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Energy node created successfully!');
      setNewNodeName('');
      setShowAddNode(false);
      fetchNodes();
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'surplus':
        return '#10b981';
      case 'balanced':
        return '#f59e0b';
      case 'deficit':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={mapRegion}
        onRegionChangeComplete={setMapRegion}
      >
        {nodes.map((node) => (
          <Marker
            key={node.id}
            coordinate={{
              latitude: node.latitude,
              longitude: node.longitude,
            }}
            pinColor={getMarkerColor(node.node_status)}
            onPress={() => setSelectedNode(node)}
          />
        ))}

        {evStations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            pinColor="#3b82f6"
          />
        ))}
      </MapView>

      {alerts.length > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.alertText}>
            {alerts[0].message}
          </Text>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Surplus</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Balanced</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Deficit</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>EV Station</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddNode(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={!!selectedNode}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedNode?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedNode(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={[
              styles.statusBadge,
              { backgroundColor: getMarkerColor(selectedNode?.node_status || 'balanced') + '20' }
            ]}>
              <Text style={[styles.statusText, { color: getMarkerColor(selectedNode?.node_status || 'balanced') }]}>
                {selectedNode?.node_status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Zap size={20} color="#10b981" />
                <Text style={styles.statValue}>{selectedNode?.current_generation.toFixed(1)}</Text>
                <Text style={styles.statLabel}>kW Generated</Text>
              </View>
              <View style={styles.statCard}>
                <Zap size={20} color="#f59e0b" />
                <Text style={styles.statValue}>{selectedNode?.current_consumption.toFixed(1)}</Text>
                <Text style={styles.statLabel}>kW Consumed</Text>
              </View>
            </View>

            <View style={styles.storageInfo}>
              <Text style={styles.storageLabel}>Battery Storage</Text>
              <View style={styles.storageBar}>
                <View
                  style={[
                    styles.storageProgress,
                    {
                      width: `${((selectedNode?.current_storage || 0) / (selectedNode?.storage_capacity || 1)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.storageText}>
                {selectedNode?.current_storage.toFixed(1)} / {selectedNode?.storage_capacity.toFixed(1)} kWh
              </Text>
            </View>

            <View style={styles.locationInfo}>
              <MapPinIcon size={16} color="#64748b" />
              <Text style={styles.locationText}>
                {selectedNode?.latitude.toFixed(4)}, {selectedNode?.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddNode}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddNode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Energy Node</Text>
              <TouchableOpacity onPress={() => setShowAddNode(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Node Name (e.g., Home Solar)"
              placeholderTextColor="#64748b"
              value={newNodeName}
              onChangeText={setNewNodeName}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNode}
            >
              <Text style={styles.addButtonText}>Create Node</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
  },
  alertBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  storageInfo: {
    gap: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  storageText: {
    fontSize: 12,
    color: '#64748b',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
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
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
