import {
  Product,
  InventoryBatch,
  Supplier,
  StorePolicy,
  ProductDemandSummary
} from './types';

export interface PurchasingSuggestion {
  productId: string;
  productName: string;
  sku: string;
  supplierId?: string;
  supplierName?: string;
  leadTimeDays: number;
  reviewPeriodDays: number;
  planningHorizonDays: number;
  dailyDemandEstimate: number;
  confidence: string;
  forecastDemandInHorizon: number;
  safetyStockUnits: number;
  eligibleCurrentStock: number;
  incomingConfirmedStock: number;
  calculatedDeficit: number;
  supplierMoq: number;
  finalRecommendedOrderQty: number;
  estimatedOrderCost: number;
  isOrderNeeded: boolean;
  explanation: string;
  formulaBreakdown: {
    horizonDemand: number;
    safetyStock: number;
    availableStock: number;
    deficit: number;
    moqAdjustment: number;
  };
}

export function evaluateReplenishment(
  product: Product,
  batches: InventoryBatch[],
  demand: ProductDemandSummary,
  supplier: Supplier | undefined,
  policy: StorePolicy,
  incomingStock: number = 0
): PurchasingSuggestion {
  const leadTimeDays = supplier ? supplier.leadTimeDays : 1;
  const reviewPeriodDays = policy.reviewPeriodDays || 3;
  const planningHorizonDays = leadTimeDays + reviewPeriodDays;
  const supplierMoq = supplier ? supplier.minimumOrderQuantity : 1;

  // Calculate eligible active unexpired stock
  const eligibleBatches = batches.filter(
    (b) =>
      b.productId === product.id &&
      b.status !== 'depleted' &&
      b.status !== 'quarantined' &&
      b.status !== 'past_cutoff' &&
      b.quantityRemaining > 0
  );
  const eligibleCurrentStock = eligibleBatches.reduce((acc, b) => acc + b.quantityRemaining, 0);

  const dailyDemand = demand.dailyDemandEstimate;
  const forecastDemandInHorizon = Math.round(dailyDemand * planningHorizonDays * 10) / 10;
  const safetyStockUnits = Math.round(dailyDemand * (policy.defaultSafetyStockDays || 2) * 10) / 10;

  // Formula: deficit = forecastDemandInHorizon + safetyStock - eligibleStock - incomingStock
  const requiredStock = forecastDemandInHorizon + safetyStockUnits;
  const netDeficit = Math.max(0, Math.round((requiredStock - eligibleCurrentStock - incomingStock) * 10) / 10);

  let finalRecommendedOrderQty = 0;
  let moqAdjustment = 0;

  if (netDeficit > 0 && dailyDemand > 0) {
    if (supplierMoq > 1 && netDeficit < supplierMoq) {
      finalRecommendedOrderQty = supplierMoq;
      moqAdjustment = supplierMoq - netDeficit;
    } else if (supplierMoq > 1) {
      // Round up to nearest multiple of MOQ if bulk packing
      finalRecommendedOrderQty = Math.ceil(netDeficit / supplierMoq) * supplierMoq;
      moqAdjustment = finalRecommendedOrderQty - netDeficit;
    } else {
      finalRecommendedOrderQty = Math.ceil(netDeficit);
    }
  }

  const estimatedOrderCost = Math.round(finalRecommendedOrderQty * product.defaultPurchaseCost * 100) / 100;
  const isOrderNeeded = finalRecommendedOrderQty > 0;

  let explanation = '';
  if (demand.confidence === 'insufficient') {
    explanation = `Zero sales history recorded for ${product.name}. Automatic replenishment is paused to avoid premature overstocking. Verify demand manually before ordering.`;
  } else if (!isOrderNeeded) {
    explanation = `Current eligible stock (${eligibleCurrentStock} units) is sufficient to cover expected demand (${forecastDemandInHorizon} units) and safety buffer (${safetyStockUnits} units) across the ${planningHorizonDays}-day planning horizon. No replenishment needed today.`;
  } else {
    explanation = `Replenishment recommendation: Order ${finalRecommendedOrderQty} ${product.unit}(s). Covers projected ${planningHorizonDays}-day horizon demand (${forecastDemandInHorizon} units) + safety stock (${safetyStockUnits} units) minus available inventory (${eligibleCurrentStock} units).`;
    if (moqAdjustment > 0) {
      explanation += ` Adjusted up to meet supplier MOQ (${supplierMoq} units).`;
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    supplierId: supplier?.id,
    supplierName: supplier?.name,
    leadTimeDays,
    reviewPeriodDays,
    planningHorizonDays,
    dailyDemandEstimate: dailyDemand,
    confidence: demand.confidence,
    forecastDemandInHorizon,
    safetyStockUnits,
    eligibleCurrentStock,
    incomingConfirmedStock: incomingStock,
    calculatedDeficit: netDeficit,
    supplierMoq,
    finalRecommendedOrderQty,
    estimatedOrderCost,
    isOrderNeeded,
    explanation,
    formulaBreakdown: {
      horizonDemand: forecastDemandInHorizon,
      safetyStock: safetyStockUnits,
      availableStock: eligibleCurrentStock,
      deficit: netDeficit,
      moqAdjustment
    }
  };
}
