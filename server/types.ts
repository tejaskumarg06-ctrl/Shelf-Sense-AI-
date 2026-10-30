export type DateLabelType = 'use_by' | 'best_before' | 'expiry_date' | 'unknown';

export type BatchStatus = 'active' | 'depleted' | 'past_cutoff' | 'quarantined' | 'flagged_for_review';

export type ProductStatus = 'active' | 'discontinued' | 'seasonal';

export type PriorityLevel = 'urgent' | 'warning' | 'normal' | 'past_cutoff' | 'unknown_review';

export type RecommendationType = 
  | 'stock_rotation'
  | 'purchasing'
  | 'markdown_review'
  | 'supplier_return'
  | 'donation_review';

export type RecommendationStatus = 'pending' | 'approved' | 'completed' | 'dismissed' | 'deferred';

export type ForecastConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface Store {
  id: string;
  name: string;
  address: string;
  locale: string;           // e.g. 'en-IN'
  currency: string;         // e.g. 'INR'
  currencySymbol: string;   // e.g. '₹'
  timezone: string;         // e.g. 'Asia/Kolkata'
  openingDays: number[];    // 0=Sun, 1=Mon, ..., 6=Sat
  operatingHours: string;
}

export interface StorePolicy {
  warningWindowDays: number;         // e.g. 5 days: batches within 5 days flagged as warning
  urgentWindowDays: number;          // e.g. 2 days: batches within 2 days flagged as urgent
  operationalCutoffOffsetDays: number;// e.g. 1 day: cutoff is 1 day before printed label date
  minimumGrossMarginPct: number;     // e.g. 15%: discount price floor constraint
  defaultSafetyStockDays: number;    // e.g. 2 days of demand buffer
  reviewPeriodDays: number;          // e.g. 3 days ordering interval
  fefoEnabled: boolean;              // prioritize earliest cutoff for rotation and sale
  autoFlagUnknownDates: boolean;     // flag any batch with unknown date for human review
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadTimeDays: number;              // delivery lead time in days
  minimumOrderQuantity: number;      // MOQ
  allowsReturns: boolean;            // return / exchange agreement
  returnWindowDaysBeforeCutoff: number; // e.g. 3 days before cutoff
  notes: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;                      // 'unit', 'kg', 'packet', 'liter', 'carton'
  barcode?: string;
  supplierId?: string;
  defaultPurchaseCost: number;       // ₹ cost price
  defaultSellingPrice: number;       // ₹ retail price
  minimumStockLevel: number;         // reorder threshold
  status: ProductStatus;
  manualDemandEstimatePerDay?: number;// fallback if 0 sales history
  shelfLifeDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  batchId: string;                   // unique batch identifier, e.g. "B-2026-MILK-01"
  quantityReceived: number;
  quantityRemaining: number;
  receivedDate: string;              // ISO date YYYY-MM-DD
  isReceivedDateEstimated: boolean;
  labelDate?: string;                // ISO date YYYY-MM-DD
  labelType: DateLabelType;
  operationalCutoffDate?: string;    // ISO date YYYY-MM-DD
  purchaseCostPerUnit: number;       // specific to batch
  sellingPricePerUnit?: number;      // current active selling price (or markdown)
  storageLocation?: string;          // e.g. "Chiller Rack 2", "Front Dairy Display"
  supplierId?: string;
  supplierReference?: string;
  status: BatchStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesRecord {
  id: string;
  productId: string;
  batchId?: string;                  // traceable where available
  quantitySold: number;
  unitSellingPrice: number;
  saleDate: string;                  // ISO date YYYY-MM-DD
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface WasteRecord {
  id: string;
  productId: string;
  batchId: string;
  quantityWasted: number;
  unitCost: number;
  totalCost: number;
  reason: 'expired_cutoff' | 'damaged' | 'spoiled' | 'other';
  recordedDate: string;              // ISO date YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  productId: string;
  batchId?: string;
  type: RecommendationType;
  title: string;
  summary: string;
  reason: string;
  evidence: {
    quantityAvailable: number;
    daysRemaining?: number;
    operationalCutoff?: string;
    forecastDemand?: number;
    estimatedAtRiskQty?: number;
    potentialCostExposure?: number;
    costPerUnit?: number;
    standardSellingPrice?: number;
    proposedPrice?: number;
    minPriceFloor?: number;
    proposedOrderQty?: number;
    supplierLeadTime?: number;
    safetyStockUnits?: number;
    affectedBatchIds?: string[];
    [key: string]: any;
  };
  expectedBenefit: string;
  uncertaintyNotes: string;
  policyComplianceNote: string;
  status: RecommendationStatus;
  actionTaken?: string;
  dismissalReason?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionLog {
  id: string;
  actionType: 
    | 'recommendation_approved'
    | 'recommendation_completed'
    | 'recommendation_dismissed'
    | 'recommendation_deferred'
    | 'stock_adjusted'
    | 'stock_received'
    | 'units_sold'
    | 'waste_recorded'
    | 'price_updated'
    | 'batch_created'
    | 'policy_updated';
  productId?: string;
  batchId?: string;
  recommendationId?: string;
  previousValue?: any;
  newValue?: any;
  reason: string;
  userConfirmed: boolean;
  timestamp: string;
}

// Calculated Risk Output for a Batch
export interface BatchRiskCalculation {
  batchId: string;
  batchCode: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  quantityRemaining: number;
  purchaseCostPerUnit: number;
  sellingPricePerUnit: number;
  storageLocation?: string;
  labelDate?: string;
  labelType: DateLabelType;
  operationalCutoffDate?: string;
  daysRemaining: number | null;      // null if date is unknown
  priority: PriorityLevel;
  forecastDemandBeforeCutoff: number;
  estimatedAtRiskUnits: number;
  potentialCostExposure: number;
  confidence: ForecastConfidence;
  fefoRank: number;
  totalEligibleBatchesForProduct: number;
  explanation: string;
  calculationAssumptions: string[];
  lastCalculatedAt: string;
  recommendedActionSnippet: string;
}

// Calculated Product Demand Baseline
export interface ProductDemandSummary {
  productId: string;
  productName: string;
  dailyDemandEstimate: number;       // average units per store-open day
  confidence: ForecastConfidence;
  observationsCount: number;         // number of sales days tracked
  salesHistorySum: number;
  source: 'recorded_history_moving_avg' | 'manual_owner_estimate' | 'insufficient_data';
  dayOfWeekMultipliers?: Record<number, number>; // 0=Sun, 1=Mon, etc.
}

// Today's Briefing summary structure
export interface StoreBriefing {
  generatedAt: string;
  batchesNeedingReviewCount: number;
  urgentBatchesCount: number;
  estimatedAtRiskUnitsTotal: number;
  potentialCostExposureTotal: number;
  upcomingCutoffsCount: number;
  topPriorityItems: Array<{
    productName: string;
    batchCode: string;
    daysRemaining: number | null;
    atRiskUnits: number;
    costExposure: number;
    recommendedAction: string;
  }>;
  summaryText: string;
  isAiEnhanced: boolean;
  aiModelUsed?: string;
}
