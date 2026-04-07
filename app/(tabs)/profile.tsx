import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { User, Leaf, Zap, TrendingUp, LogOut, TriangleAlert as AlertTriangle, Power } from 'lucide-react-native';

type Profile = {
  full_name: string;
  email: string;
  node_type: string;
  total_carbon_saved: number;
  total_energy_sold: number;
  total_energy_bought: number;
  wallet_balance: number;
};

type EmergencyAlert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_active: boolean;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchAlerts();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('is_active', true);

    if (data) {
      setActiveAlerts(data);
      setEmergencyMode(data.length > 0);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleEmergencyToggle = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Activate Emergency Mode',
        'This will create a test emergency alert. In a real scenario, this would prioritize energy distribution to hospitals and shelters.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              const { error } = await supabase
                .from('emergency_alerts')
                .insert({
                  alert_type: 'disaster',
                  severity: 'high',
                  affected_area: 'Test Area',
                  latitude: 37.78825,
                  longitude: -122.4324,
                  radius_km: 10,
                  message: 'Emergency mode activated: Prioritizing critical infrastructure',
                  is_active: true,
                });

              if (!error) {
                setEmergencyMode(true);
                fetchAlerts();
                Alert.alert('Success', 'Emergency mode activated');
              }
            },
          },
        ]
      );
    } else {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({ is_active: false, resolved_at: new Date().toISOString() })
        .eq('is_active', true);

      if (!error) {
        setEmergencyMode(false);
        setActiveAlerts([]);
        Alert.alert('Success', 'Emergency mode deactivated');
      }
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'producer':
        return 'Energy Producer';
      case 'consumer':
        return 'Energy Consumer';
      case 'prosumer':
        return 'Prosumer';
      default:
        return type;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#10b981" />
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{getNodeTypeLabel(profile?.node_type || '')}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Leaf size={24} color="#10b981" />
          <Text style={styles.statValue}>{profile?.total_carbon_saved.toFixed(1) || '0'}</Text>
          <Text style={styles.statLabel}>kg CO₂ Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{profile?.total_energy_sold.toFixed(1) || '0'}</Text>
          <Text style={styles.statLabel}>kWh Sold</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{profile?.total_energy_bought.toFixed(1) || '0'}</Text>
          <Text style={styles.statLabel}>kWh Bought</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Mode</Text>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIcon}>
              <AlertTriangle size={24} color={emergencyMode ? '#ef4444' : '#64748b'} />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyTitle}>
                {emergencyMode ? 'Emergency Active' : 'Emergency Mode'}
              </Text>
              <Text style={styles.emergencyDescription}>
                {emergencyMode
                  ? 'Critical infrastructure is being prioritized'
                  : 'Prioritize hospitals and shelters during disasters'
                }
              </Text>
            </View>
            <Switch
              value={emergencyMode}
              onValueChange={handleEmergencyToggle}
              trackColor={{ false: '#334155', true: '#ef444460' }}
              thumbColor={emergencyMode ? '#ef4444' : '#94a3b8'}
            />
          </View>

          {activeAlerts.length > 0 && (
            <View style={styles.alertsList}>
              {activeAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={[
                    styles.severityBadge,
                    alert.severity === 'critical' && styles.severityCritical,
                    alert.severity === 'high' && styles.severityHigh,
                    alert.severity === 'medium' && styles.severityMedium,
                  ]}>
                    <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertType}>{alert.alert_type}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.emergencyFeatures}>
            <Text style={styles.featuresTitle}>During Emergency:</Text>
            <View style={styles.feature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Energy redirected to hospitals and emergency shelters
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Real-time blackout prediction and prevention
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Automatic load balancing across the grid
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EV Charging</Text>
        <View style={styles.infoCard}>
          <Power size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Electric Vehicle Support</Text>
            <Text style={styles.infoText}>
              Connect your EV to the GridShare network for clean, affordable charging from solar-powered nodes.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About GridShare</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            GridShare is a decentralized peer-to-peer energy trading platform that enables buildings with solar panels to sell excess energy directly to neighboring buildings.
          </Text>
          <Text style={styles.aboutText}>
            By using blockchain-inspired security and smart meter technology, we're creating a sustainable energy future where everyone can participate in the clean energy revolution.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GridShare v1.0</Text>
        <Text style={styles.footerSubtext}>Sustainable Energy for Everyone</Text>
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
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10b981',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  typeBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#10b98120',
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
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
  emergencyCard: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emergencyDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  alertsList: {
    marginTop: 16,
    gap: 12,
  },
  alertItem: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  severityCritical: {
    backgroundColor: '#ef444420',
  },
  severityHigh: {
    backgroundColor: '#f59e0b20',
  },
  severityMedium: {
    backgroundColor: '#3b82f620',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  alertMessage: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  emergencyFeatures: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureBullet: {
    color: '#10b981',
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  aboutCard: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: 20,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
});
