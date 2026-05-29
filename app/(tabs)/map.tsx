import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Zap, Leaf, Battery, AlertTriangle } from 'lucide-react-native';

export default function MapScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Energy Map</Text>
        <Text style={styles.subtitle}>Interactive map available on mobile devices</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🌍 Web Preview Mode</Text>
        <Text style={styles.infoText}>
          The interactive map with real-time energy nodes is available when running on:
        </Text>
        <View style={styles.platformList}>
          <Text style={styles.platformItem}>📱 iOS (Expo Go)</Text>
          <Text style={styles.platformItem}>🤖 Android (Expo Go)</Text>
          <Text style={styles.platformItem}>📲 Physical device</Text>
        </View>
      </View>

      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Map Features (Mobile):</Text>
        <View style={styles.featureItem}>
          <Zap size={20} color="#10b981" />
          <Text style={styles.featureText}>Real-time energy nodes with color-coded status</Text>
        </View>
        <View style={styles.featureItem}>
          <Leaf size={20} color="#10b981" />
          <Text style={styles.featureText}>EV charging station locations</Text>
        </View>
        <View style={styles.featureItem}>
          <AlertTriangle size={20} color="#f59e0b" />
          <Text style={styles.featureText}>Emergency alerts and disaster mode</Text>
        </View>
        <View style={styles.featureItem}>
          <Battery size={20} color="#10b981" />
          <Text style={styles.featureText}>Add and manage your energy nodes</Text>
        </View>
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>📍 Node Status Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>🟢 Surplus - Producing excess energy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>🟡 Balanced - Production equals consumption</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>🔴 Deficit - Needs energy from grid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>🔵 EV Charging Station</Text>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#0a1929',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  infoCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  platformList: {
    marginTop: 8,
  },
  platformItem: {
    fontSize: 14,
    color: '#fff',
    paddingVertical: 4,
    marginBottom: 8,
  },
  featuresCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
  },
  legendCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
  },
});