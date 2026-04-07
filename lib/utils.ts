export const calculateDynamicPrice = (basePrice: number, demand: number, supply: number): number => {
  const demandSupplyRatio = demand / supply;
  return basePrice * demandSupplyRatio;
};

export const calculateCarbonSaved = (energyKWh: number): number => {
  return energyKWh * 0.4;
};

export const calculateTreesEquivalent = (co2Kg: number): number => {
  return co2Kg / 21;
};

export const calculateKmEquivalent = (co2Kg: number): number => {
  return co2Kg * 5;
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

export const formatEnergy = (energyKWh: number): string => {
  if (energyKWh >= 1000) {
    return `${(energyKWh / 1000).toFixed(2)} MWh`;
  }
  return `${energyKWh.toFixed(2)} kWh`;
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const getNodeStatusColor = (status: 'surplus' | 'balanced' | 'deficit'): string => {
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

export const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f59e0b';
    case 'medium':
      return '#3b82f6';
    case 'low':
      return '#10b981';
    default:
      return '#64748b';
  }
};
