import {
  Product,
  InventoryBatch,
  StorePolicy,
  BatchRiskCalculation
} from './types';

export interface MarkdownEvaluation {
  batchId: string;
  batchCode: string;
  productId: string;
  productName: string;
  purchaseCostPerUnit: number;
  currentSellingPrice: number;
  minGrossMarginPct: number;
  minPriceFloor: number;
  isCompliant: boolean;
  canMarkdown: boolean;
  suggestedMarkdownPct: number;
  suggestedPrice: number;
  estimatedMarginAtSuggestedPricePct: number;
  reason: string;
  policyViolationNote?: string;
  financialSimulation: {
    unitsAtRisk: number;
    potentialLossWithoutAction: number;
    projectedRevenueAtMarkdown: number;
    netBenefitEstimate: number;
  };
}

/**
 * Evaluates whether a pre-cutoff markdown is feasible and policy-compliant.
 * Rules:
 * 1. Never recommend markdown on past-cutoff stock.
 * 2. Calculate minimum price floor = purchaseCost / (1 - minGrossMarginPct / 100).
 * 3. Proposed discount must not breach price floor.
 */
export function evaluateBatchMarkdown(
  product: Product,
  batch: InventoryBatch,
  risk: BatchRiskCalculation,
  policy: StorePolicy,
  proposedDiscountPct: number = 15
): MarkdownEvaluation {
  const purchaseCost = batch.purchaseCostPerUnit || product.defaultPurchaseCost;
  const currentSellingPrice = batch.sellingPricePerUnit || product.defaultSellingPrice;
  const minMarginPct = policy.minimumGrossMarginPct || 15;

  // Price floor formula:
  // Margin % = ((Price - Cost) / Price) * 100 >= minMarginPct
  // Price * (1 - minMarginPct / 100) >= Cost
  // Price Floor = Cost / (1 - minMarginPct / 100)
  const marginDecimal = minMarginPct / 100;
  const minPriceFloor = Math.round((purchaseCost / (1 - marginDecimal)) * 100) / 100;

  // Check past cutoff
  if (risk.daysRemaining !== null && risk.daysRemaining < 0) {
    return {
      batchId: batch.id,
      batchCode: batch.batchId,
      productId: product.id,
      productName: product.name,
      purchaseCostPerUnit: purchaseCost,
      currentSellingPrice,
      minGrossMarginPct: minMarginPct,
      minPriceFloor,
      isCompliant: false,
      canMarkdown: false,
      suggestedMarkdownPct: 0,
      suggestedPrice: currentSellingPrice,
      estimatedMarginAtSuggestedPricePct: 0,
      reason: 'Batch is past operational cutoff. Under food-safety operating rules, past-cutoff items must NEVER be discounted or sold.',
      policyViolationNote: 'Rule 1 Violation: Cannot sell past configured cutoff',
      financialSimulation: {
        unitsAtRisk: batch.quantityRemaining,
        potentialLossWithoutAction: Math.round(batch.quantityRemaining * purchaseCost * 100) / 100,
        projectedRevenueAtMarkdown: 0,
        netBenefitEstimate: 0
      }
    };
  }

  // Calculate proposed price
  const discountMultiplier = (100 - proposedDiscountPct) / 100;
  const rawDiscountedPrice = Math.round(currentSellingPrice * discountMultiplier * 100) / 100;

  // Check if raw discounted price violates minimum price floor
  const isCompliant = rawDiscountedPrice >= minPriceFloor;

  // If compliant, use proposed discount; if non-compliant, can we offer a smaller discount down to the floor?
  let canMarkdown = true;
  let finalPrice = rawDiscountedPrice;
  let effectiveDiscountPct = proposedDiscountPct;
  let policyViolationNote: string | undefined = undefined;

  if (!isCompliant) {
    if (currentSellingPrice > minPriceFloor) {
      // Can discount only up to the floor
      finalPrice = minPriceFloor;
      effectiveDiscountPct = Math.round(((currentSellingPrice - minPriceFloor) / currentSellingPrice) * 100);
      policyViolationNote = `Proposed ${proposedDiscountPct}% markdown (₹${rawDiscountedPrice.toFixed(2)}) breached store's ${minMarginPct}% gross margin floor (₹${minPriceFloor.toFixed(2)}). Capped at floor price.`;
    } else {
      // Current selling price is already at or below floor! Cannot discount at all!
      canMarkdown = false;
      finalPrice = currentSellingPrice;
      effectiveDiscountPct = 0;
      policyViolationNote = `Current price ₹${currentSellingPrice} is already at or below the minimum margin floor of ₹${minPriceFloor.toFixed(2)} based on ₹${purchaseCost} cost. No further discount permitted under policy.`;
    }
  }

  const marginAtFinalPrice = finalPrice > 0 ? Math.round(((finalPrice - purchaseCost) / finalPrice) * 1000) / 10 : 0;
  const unitsAtRisk = risk.estimatedAtRiskUnits || 0;
  const potentialLoss = Math.round(unitsAtRisk * purchaseCost * 100) / 100;
  // Financial simulation: assume 75% of at-risk units sell with markdown before cutoff
  const estimatedSellThroughUnits = Math.round(unitsAtRisk * 0.75);
  const projectedRevenueAtMarkdown = Math.round(estimatedSellThroughUnits * finalPrice * 100) / 100;
  const netBenefitEstimate = Math.round((projectedRevenueAtMarkdown - (estimatedSellThroughUnits * purchaseCost)) * 100) / 100;

  let reason = '';
  if (!canMarkdown) {
    reason = `Markdown rejected: Batch purchase cost is ₹${purchaseCost} and retail is ₹${currentSellingPrice}. To preserve configured ${minMarginPct}% gross margin, price cannot go below ₹${minPriceFloor.toFixed(2)}.`;
  } else {
    reason = `Evaluated pre-cutoff markdown of ${effectiveDiscountPct}% to ₹${finalPrice.toFixed(2)}/unit. Preserves a ${marginAtFinalPrice}% margin (above the ${minMarginPct}% minimum policy floor).`;
  }

  return {
    batchId: batch.id,
    batchCode: batch.batchId,
    productId: product.id,
    productName: product.name,
    purchaseCostPerUnit: purchaseCost,
    currentSellingPrice,
    minGrossMarginPct: minMarginPct,
    minPriceFloor,
    isCompliant,
    canMarkdown,
    suggestedMarkdownPct: effectiveDiscountPct,
    suggestedPrice: finalPrice,
    estimatedMarginAtSuggestedPricePct: marginAtFinalPrice,
    reason,
    policyViolationNote,
    financialSimulation: {
      unitsAtRisk,
      potentialLossWithoutAction: potentialLoss,
      projectedRevenueAtMarkdown,
      netBenefitEstimate
    }
  };
}
