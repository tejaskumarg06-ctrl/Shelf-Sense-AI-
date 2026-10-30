import {
  Product,
  InventoryBatch,
  SalesRecord,
  StorePolicy,
  BatchRiskCalculation,
  ProductDemandSummary,
  PriorityLevel,
  ForecastConfidence
} from './types';

/**
 * Offsets a YYYY-MM-DD date string by a number of calendar days without timezone drift.
 * Uses UTC date math to guarantee safe calendar day arithmetic in any server environment.
 */
export function offsetDateString(dateStr: string, offsetDays: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;

  const utc = new Date(Date.UTC(y, m, d));
  utc.setUTCDate(utc.getUTCDate() - offsetDays);
  const resYear = utc.getUTCFullYear();
  const resMonth = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(utc.getUTCDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Calculates calendar days difference between today and targetDate in specified timezone.
 * Uses integer day math in local timezone to prevent fractional timezone drift.
 */
export function calculateDaysRemaining(
  targetDateStr: string | undefined,
  timezone: string = 'Asia/Kolkata',
  referenceDate?: Date
): number | null {
  if (!targetDateStr) return null;

  // Validate format YYYY-MM-DD
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return null;

  const targetYear = parseInt(parts[0], 10);
  const targetMonth = parseInt(parts[1], 10) - 1;
  const targetDay = parseInt(parts[2], 10);

  if (isNaN(targetYear) || isNaN(targetMonth) || isNaN(targetDay)) return null;

  const now = referenceDate || new Date();

  // Get current date parts in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const formattedParts = formatter.formatToParts(now);
  let curYear = now.getFullYear();
  let curMonth = now.getMonth();
  let curDay = now.getDate();

  for (const part of formattedParts) {
    if (part.type === 'year') curYear = parseInt(part.value, 10);
    if (part.type === 'month') curMonth = parseInt(part.value, 10) - 1;
    if (part.type === 'day') curDay = parseInt(part.value, 10);
  }

  // Create UTC midnight dates to compute exact calendar difference
  const utcCurrent = Date.UTC(curYear, curMonth, curDay);
  const utcTarget = Date.UTC(targetYear, targetMonth, targetDay);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((utcTarget - utcCurrent) / MS_PER_DAY);

  return diffDays;
}

/**
 * Evaluates baseline daily demand from historical sales records.
 * Avoids inflated precision and labels confidence transparently.
 */
export function calculateProductDemand(
  product: Product,
  sales: SalesRecord[],
  storeOpeningDays: number[] = [0, 1, 2, 3, 4, 5, 6],
  windowDays: number = 14
): ProductDemandSummary {
  const productSales = sales.filter((s) => s.productId === product.id);

  if (productSales.length === 0) {
    if (product.manualDemandEstimatePerDay !== undefined && product.manualDemandEstimatePerDay > 0) {
      return {
        productId: product.id,
        productName: product.name,
        dailyDemandEstimate: product.manualDemandEstimatePerDay,
        confidence: 'low',
        observationsCount: 0,
        salesHistorySum: 0,
        source: 'manual_owner_estimate'
      };
    }

    return {
      productId: product.id,
      productName: product.name,
      dailyDemandEstimate: 0,
      confidence: 'insufficient',
      observationsCount: 0,
      salesHistorySum: 0,
      source: 'insufficient_data'
    };
  }

  // Group sales by date
  const salesByDate: Record<string, number> = {};
  for (const s of productSales) {
    salesByDate[s.saleDate] = (salesByDate[s.saleDate] || 0) + s.quantitySold;
  }

  const uniqueDays = Object.keys(salesByDate);
  const observationsCount = uniqueDays.length;
  const totalUnits = Object.values(salesByDate).reduce((acc, v) => acc + v, 0);

  // Calculate moving average over the observed window
  const dailyAverage = totalUnits / Math.max(1, observationsCount);

  // Confidence classification
  let confidence: ForecastConfidence = 'low';
  if (observationsCount >= 12) {
    confidence = 'high';
  } else if (observationsCount >= 5) {
    confidence = 'medium';
  }

  // Day of week multipliers if sufficient data (at least 7 observations)
  let dayOfWeekMultipliers: Record<number, number> | undefined = undefined;
  if (observationsCount >= 7) {
    const dowTotals: Record<number, { sum: number; count: number }> = {};
    for (const [dateStr, units] of Object.entries(salesByDate)) {
      const dow = new Date(dateStr).getDay();
      if (!dowTotals[dow]) dowTotals[dow] = { sum: 0, count: 0 };
      dowTotals[dow].sum += units;
      dowTotals[dow].count += 1;
    }
    dayOfWeekMultipliers = {};
    for (let d = 0; d < 7; d++) {
      if (dowTotals[d] && dowTotals[d].count > 0 && dailyAverage > 0) {
        const dowAvg = dowTotals[d].sum / dowTotals[d].count;
        dayOfWeekMultipliers[d] = Math.max(0.5, Math.min(2.0, dowAvg / dailyAverage));
      } else {
        dayOfWeekMultipliers[d] = 1.0;
      }
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    dailyDemandEstimate: Math.round(dailyAverage * 10) / 10,
    confidence,
    observationsCount,
    salesHistorySum: totalUnits,
    source: 'recorded_history_moving_avg',
    dayOfWeekMultipliers
  };
}

/**
 * Multi-batch FEFO Demand Simulation.
 * Critical Rule: Demand is NOT double-counted across batches.
 * Batches are sorted by earliest operational cutoff, and simulated demand consumes
 * stock from the earliest eligible unexpired batch day by day.
 */
export function simulateFefoAndCalculateRisk(
  product: Product,
  batches: InventoryBatch[],
  demandSummary: ProductDemandSummary,
  policy: StorePolicy,
  timezone: string = 'Asia/Kolkata',
  storeOpeningDays: number[] = [0, 1, 2, 3, 4, 5, 6]
): BatchRiskCalculation[] {
  const now = new Date();
  const results: BatchRiskCalculation[] = [];

  // Filter batches for this product
  const productBatches = batches.filter((b) => b.productId === product.id);

  if (productBatches.length === 0) {
    return [];
  }

  // Identify batches with missing or unverified cutoff dates
  const unknownBatches: InventoryBatch[] = [];
  const pastCutoffBatches: InventoryBatch[] = [];
  const eligibleBatches: InventoryBatch[] = [];

  for (const b of productBatches) {
    if (b.status === 'depleted' || b.quantityRemaining <= 0) {
      continue; // Skip already depleted batches
    }

    if (b.status === 'flagged_for_review' || b.labelType === 'unknown' || !b.operationalCutoffDate) {
      unknownBatches.push(b);
      continue;
    }

    const days = calculateDaysRemaining(b.operationalCutoffDate, timezone, now);
    if (days === null) {
      unknownBatches.push(b);
    } else if (days < 0) {
      pastCutoffBatches.push(b);
    } else {
      eligibleBatches.push(b);
    }
  }

  // 1. Process UNKNOWN / UNVERIFIED batches
  for (const b of unknownBatches) {
    results.push({
      batchId: b.id,
      batchCode: b.batchId,
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      quantityRemaining: b.quantityRemaining,
      purchaseCostPerUnit: b.purchaseCostPerUnit,
      sellingPricePerUnit: b.sellingPricePerUnit || product.defaultSellingPrice,
      storageLocation: b.storageLocation,
      labelDate: b.labelDate,
      labelType: b.labelType,
      operationalCutoffDate: b.operationalCutoffDate,
      daysRemaining: null,
      priority: 'unknown_review',
      forecastDemandBeforeCutoff: 0,
      estimatedAtRiskUnits: b.quantityRemaining,
      potentialCostExposure: Math.round(b.quantityRemaining * b.purchaseCostPerUnit * 100) / 100,
      confidence: 'insufficient',
      fefoRank: 999,
      totalEligibleBatchesForProduct: eligibleBatches.length,
      explanation: `Date label is unverified or damaged. ShelfSense strictly flags unknown dates for shopkeeper inspection rather than guessing food safety status.`,
      calculationAssumptions: ['Safety rule: Unknown date cannot be assigned operational cutoff automatically'],
      lastCalculatedAt: now.toISOString(),
      recommendedActionSnippet: 'Inspect physical date label or verify supplier delivery invoice'
    });
  }

  // 2. Process PAST CUTOFF batches
  for (const b of pastCutoffBatches) {
    const days = calculateDaysRemaining(b.operationalCutoffDate, timezone, now) || -1;
    results.push({
      batchId: b.id,
      batchCode: b.batchId,
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      quantityRemaining: b.quantityRemaining,
      purchaseCostPerUnit: b.purchaseCostPerUnit,
      sellingPricePerUnit: b.sellingPricePerUnit || product.defaultSellingPrice,
      storageLocation: b.storageLocation,
      labelDate: b.labelDate,
      labelType: b.labelType,
      operationalCutoffDate: b.operationalCutoffDate,
      daysRemaining: days,
      priority: 'past_cutoff',
      forecastDemandBeforeCutoff: 0,
      estimatedAtRiskUnits: b.quantityRemaining,
      potentialCostExposure: Math.round(b.quantityRemaining * b.purchaseCostPerUnit * 100) / 100,
      confidence: 'high',
      fefoRank: 0,
      totalEligibleBatchesForProduct: eligibleBatches.length,
      explanation: `Batch reached operational sell-through cutoff ${Math.abs(days)} day(s) ago. Under store policy, this stock must never be offered for retail sale.`,
      calculationAssumptions: ['Operating rule 1: Zero retail demand allocated past cutoff'],
      lastCalculatedAt: now.toISOString(),
      recommendedActionSnippet: 'Remove from shelf immediately; record disposal or supplier claim'
    });
  }

  // 3. Process ELIGIBLE ACTIVE batches via FEFO simulation
  // Sort by earliest operational cutoff, then by earliest received date
  eligibleBatches.sort((a, b) => {
    const dateA = a.operationalCutoffDate || '9999-12-31';
    const dateB = b.operationalCutoffDate || '9999-12-31';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.receivedDate.localeCompare(b.receivedDate);
  });

  // Setup simulation state
  interface SimBatchState {
    batch: InventoryBatch;
    initialQty: number;
    remainingQty: number;
    cutoffDays: number;
    unitsAllocated: number;
    fefoRank: number;
  }

  const simBatches: SimBatchState[] = eligibleBatches.map((b, index) => {
    const cutoffDays = calculateDaysRemaining(b.operationalCutoffDate, timezone, now) ?? 0;
    return {
      batch: b,
      initialQty: b.quantityRemaining,
      remainingQty: b.quantityRemaining,
      cutoffDays: Math.max(0, cutoffDays),
      unitsAllocated: 0,
      fefoRank: index + 1
    };
  });

  // Maximum days horizon is the latest cutoff among eligible batches (capped at 60 days)
  const maxHorizon = Math.min(
    60,
    simBatches.reduce((max, sb) => Math.max(max, sb.cutoffDays), 0)
  );

  // Day-by-day simulation from day 0 (today) to maxHorizon
  for (let day = 0; day <= maxHorizon; day++) {
    // Determine weekday
    const simDate = new Date(now);
    simDate.setDate(simDate.getDate() + day);
    const dayOfWeek = simDate.getDay();

    // Check store opening
    const isStoreOpen = storeOpeningDays.includes(dayOfWeek);
    let dailyDemand = 0;

    if (isStoreOpen && demandSummary.dailyDemandEstimate > 0) {
      const multiplier = demandSummary.dayOfWeekMultipliers
        ? demandSummary.dayOfWeekMultipliers[dayOfWeek] || 1.0
        : 1.0;
      dailyDemand = demandSummary.dailyDemandEstimate * multiplier;
    }

    // Allocate daily demand to the earliest active batch whose cutoff has NOT passed on this day
    let demandToFulfill = dailyDemand;

    for (const sb of simBatches) {
      if (demandToFulfill <= 0) break;

      // Batch is eligible to sell on days before cutoff
      if (day < sb.cutoffDays && sb.remainingQty > 0) {
        const canTake = Math.min(sb.remainingQty, demandToFulfill);
        sb.remainingQty -= canTake;
        sb.unitsAllocated += canTake;
        demandToFulfill -= canTake;
      }
    }
  }

  // Compile calculated risk results for each eligible batch
  for (const sb of simBatches) {
    const b = sb.batch;
    const daysRemaining = sb.cutoffDays;
    const forecastUnitsBeforeCutoff = Math.round(sb.unitsAllocated * 10) / 10;
    const estimatedAtRiskUnits = Math.max(0, Math.round(sb.remainingQty * 10) / 10);
    const potentialCostExposure = Math.round(estimatedAtRiskUnits * b.purchaseCostPerUnit * 100) / 100;

    // Determine priority
    let priority: PriorityLevel = 'normal';
    if (daysRemaining <= policy.urgentWindowDays) {
      priority = estimatedAtRiskUnits > 0 ? 'urgent' : 'warning';
    } else if (daysRemaining <= policy.warningWindowDays) {
      priority = estimatedAtRiskUnits > 0 ? 'warning' : 'normal';
    } else if (estimatedAtRiskUnits > 0 && daysRemaining <= 10) {
      priority = 'warning';
    }

    // Explanations grounded in exact numbers
    let explanation = '';
    const assumptions: string[] = [
      `FEFO Priority #${sb.fefoRank} of ${eligibleBatches.length} active batch(es)`,
      `Daily demand rate: ${demandSummary.dailyDemandEstimate} units/day (${demandSummary.source})`,
      `Operational sell-through cutoff in ${daysRemaining} day(s)`
    ];

    if (demandSummary.confidence === 'insufficient') {
      explanation = `${b.quantityRemaining} ${product.unit}(s) available. No sales history exists to forecast sell-through before cutoff in ${daysRemaining} day(s). Stock demand is unconfirmed.`;
      assumptions.push('Zero sales records: Forecast precision withheld to prevent misleading claims');
    } else if (estimatedAtRiskUnits === 0) {
      explanation = `${b.quantityRemaining} ${product.unit}(s) available. Forecast demand (${forecastUnitsBeforeCutoff} units) covers available stock before the cutoff in ${daysRemaining} day(s). Expected surplus is 0.`;
      assumptions.push('Stock expected to sell out normally prior to cutoff');
    } else {
      explanation = `${b.quantityRemaining} ${product.unit}(s) available. Based on the daily sales estimate (${demandSummary.dailyDemandEstimate}/day), approximately ${forecastUnitsBeforeCutoff} unit(s) may sell before cutoff. Estimated ${estimatedAtRiskUnits} ${product.unit}(s) may remain unsold at cutoff.`;
      assumptions.push(`Potential cost exposure: ₹${potentialCostExposure.toFixed(2)} (at ₹${b.purchaseCostPerUnit} purchase cost/unit)`);
    }

    let actionSnippet = 'Maintain standard FEFO rotation';
    if (priority === 'urgent' && estimatedAtRiskUnits > 0) {
      actionSnippet = 'Prioritize front-shelf rotation or review permitted markdown';
    } else if (priority === 'warning' && estimatedAtRiskUnits > 0) {
      actionSnippet = 'Verify shelf positioning; check supplier return window';
    } else if (sb.fefoRank > 1) {
      actionSnippet = 'Keep behind earlier batch to maintain First-Expired First-Out';
    }

    results.push({
      batchId: b.id,
      batchCode: b.batchId,
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      quantityRemaining: b.quantityRemaining,
      purchaseCostPerUnit: b.purchaseCostPerUnit,
      sellingPricePerUnit: b.sellingPricePerUnit || product.defaultSellingPrice,
      storageLocation: b.storageLocation,
      labelDate: b.labelDate,
      labelType: b.labelType,
      operationalCutoffDate: b.operationalCutoffDate,
      daysRemaining,
      priority,
      forecastDemandBeforeCutoff: forecastUnitsBeforeCutoff,
      estimatedAtRiskUnits,
      potentialCostExposure,
      confidence: demandSummary.confidence,
      fefoRank: sb.fefoRank,
      totalEligibleBatchesForProduct: eligibleBatches.length,
      explanation,
      calculationAssumptions: assumptions,
      lastCalculatedAt: now.toISOString(),
      recommendedActionSnippet: actionSnippet
    });
  }

  return results;
}

/**
 * Runs full store risk evaluation across all products and batches.
 */
export function evaluateStoreInventoryRisk(
  products: Product[],
  batches: InventoryBatch[],
  sales: SalesRecord[],
  policy: StorePolicy,
  timezone: string = 'Asia/Kolkata',
  storeOpeningDays: number[] = [0, 1, 2, 3, 4, 5, 6]
): {
  batchRisks: BatchRiskCalculation[];
  demandSummaries: Record<string, ProductDemandSummary>;
  summary: {
    batchesNeedingReview: number;
    urgentBatches: number;
    estimatedAtRiskUnitsTotal: number;
    potentialCostExposureTotal: number;
    upcomingCutoffsCount: number;
  };
} {
  const batchRisks: BatchRiskCalculation[] = [];
  const demandSummaries: Record<string, ProductDemandSummary> = {};

  for (const product of products) {
    const demand = calculateProductDemand(product, sales, storeOpeningDays);
    demandSummaries[product.id] = demand;

    const risks = simulateFefoAndCalculateRisk(
      product,
      batches,
      demand,
      policy,
      timezone,
      storeOpeningDays
    );
    batchRisks.push(...risks);
  }

  // Sort batches by urgency: urgent first, then warning, then unknown_review, then past_cutoff, then normal
  const priorityWeight: Record<PriorityLevel, number> = {
    urgent: 1,
    warning: 2,
    unknown_review: 3,
    past_cutoff: 4,
    normal: 5
  };

  batchRisks.sort((a, b) => {
    const wDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (wDiff !== 0) return wDiff;
    const daysA = a.daysRemaining !== null ? a.daysRemaining : 999;
    const daysB = b.daysRemaining !== null ? b.daysRemaining : 999;
    return daysA - daysB;
  });

  const batchesNeedingReview = batchRisks.filter(
    (b) => b.priority === 'urgent' || b.priority === 'warning' || b.priority === 'unknown_review'
  ).length;

  const urgentBatches = batchRisks.filter((b) => b.priority === 'urgent').length;

  const estimatedAtRiskUnitsTotal = Math.round(
    batchRisks.reduce((acc, b) => acc + (b.estimatedAtRiskUnits || 0), 0) * 10
  ) / 10;

  const potentialCostExposureTotal = Math.round(
    batchRisks.reduce((acc, b) => acc + (b.potentialCostExposure || 0), 0) * 100
  ) / 100;

  const upcomingCutoffsCount = batchRisks.filter(
    (b) => b.daysRemaining !== null && b.daysRemaining >= 0 && b.daysRemaining <= policy.warningWindowDays
  ).length;

  return {
    batchRisks,
    demandSummaries,
    summary: {
      batchesNeedingReview,
      urgentBatches,
      estimatedAtRiskUnitsTotal,
      potentialCostExposureTotal,
      upcomingCutoffsCount
    }
  };
}
