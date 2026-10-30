export * from '../../server/types';

export interface DashboardData {
  store: import('../../server/types').Store;
  policy: import('../../server/types').StorePolicy;
  summary: {
    batchesNeedingReview: number;
    urgentBatches: number;
    estimatedAtRiskUnitsTotal: number;
    potentialCostExposureTotal: number;
    upcomingCutoffsCount: number;
  };
  recordedWaste: {
    totalUnits: number;
    totalCost: number;
    recordsCount: number;
  };
  priorityQueue: import('../../server/types').BatchRiskCalculation[];
  pendingRecsCount: number;
  briefing: import('../../server/types').StoreBriefing;
}

export interface AnalyticsData {
  periodDays: number;
  salesTimeline: Array<{ date: string; units: number; revenue: number }>;
  wasteByCategory: Record<string, { units: number; cost: number }>;
  recsByStatus: Record<string, number>;
  riskDistribution: Record<string, number>;
  totalSalesUnits: number;
  totalWasteUnits: number;
  totalWasteCost: number;
}
