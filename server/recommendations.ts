import {
  Product,
  InventoryBatch,
  Supplier,
  StorePolicy,
  Recommendation,
  BatchRiskCalculation,
  ProductDemandSummary
} from './types';
import { evaluateReplenishment } from './purchasingEngine';
import { evaluateBatchMarkdown } from './pricingEngine';

export function generateStoreRecommendations(
  products: Product[],
  batches: InventoryBatch[],
  suppliers: Supplier[],
  risks: BatchRiskCalculation[],
  demandSummaries: Record<string, ProductDemandSummary>,
  policy: StorePolicy
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  // 1. STOCK ROTATION RECOMMENDATIONS (Category A)
  // Check products that have multiple active batches
  for (const product of products) {
    const productRisks = risks.filter((r) => r.productId === product.id && r.priority !== 'past_cutoff');
    if (productRisks.length > 1) {
      const earliestBatch = productRisks.find((r) => r.fefoRank === 1);
      const newerBatches = productRisks.filter((r) => r.fefoRank > 1);

      if (earliestBatch && earliestBatch.estimatedAtRiskUnits > 0) {
        recommendations.push({
          id: `rec_rot_${earliestBatch.batchId}`,
          productId: product.id,
          batchId: earliestBatch.batchId,
          type: 'stock_rotation',
          title: `Prioritize Shelf Placement: ${product.name} (Batch ${earliestBatch.batchCode})`,
          summary: `Batch ${earliestBatch.batchCode} has earliest cutoff (${earliestBatch.operationalCutoffDate}) with ${earliestBatch.estimatedAtRiskUnits} estimated at-risk units.`,
          reason: `Customer demand should naturally encounter Batch ${earliestBatch.batchCode} at the front of the display, keeping ${newerBatches.map((b) => b.batchCode).join(', ')} in the rear (FEFO). Respects customer preference without forcing.`,
          evidence: {
            quantityAvailable: earliestBatch.quantityRemaining,
            operationalCutoff: earliestBatch.operationalCutoffDate,
            daysRemaining: earliestBatch.daysRemaining ?? 0,
            forecastDemand: earliestBatch.forecastDemandBeforeCutoff,
            estimatedAtRiskQty: earliestBatch.estimatedAtRiskUnits,
            potentialCostExposure: earliestBatch.potentialCostExposure,
            affectedBatchIds: [earliestBatch.batchId, ...newerBatches.map((b) => b.batchId)]
          },
          expectedBenefit: `Helps sell remaining ${earliestBatch.quantityRemaining} units naturally before cutoff, protecting up to ₹${earliestBatch.potentialCostExposure.toFixed(2)} in stock cost.`,
          uncertaintyNotes: 'Customers are free to pick any batch; shelf placement encourages older batch visibility without restricting choice.',
          policyComplianceNote: 'Complies with FEFO Stock Rotation standard.',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // 2. DEMAND-AWARE PURCHASING RECOMMENDATIONS (Category B)
  for (const product of products) {
    const demand = demandSummaries[product.id];
    if (!demand || demand.confidence === 'insufficient') continue;

    const supplier = product.supplierId ? supplierMap.get(product.supplierId) : undefined;
    const replenishment = evaluateReplenishment(product, batches, demand, supplier, policy);

    if (replenishment.isOrderNeeded) {
      recommendations.push({
        id: `rec_order_${product.id}`,
        productId: product.id,
        type: 'purchasing',
        title: `Recommended Replenishment: ${product.name}`,
        summary: `Order ${replenishment.finalRecommendedOrderQty} ${product.unit}(s) from ${replenishment.supplierName || 'supplier'}.`,
        reason: replenishment.explanation,
        evidence: {
          quantityAvailable: replenishment.eligibleCurrentStock,
          forecastDemand: replenishment.forecastDemandInHorizon,
          proposedOrderQty: replenishment.finalRecommendedOrderQty,
          supplierLeadTime: replenishment.leadTimeDays,
          safetyStockUnits: replenishment.safetyStockUnits,
          potentialCostExposure: replenishment.estimatedOrderCost
        },
        expectedBenefit: `Maintains continuous availability over the next ${replenishment.planningHorizonDays} days while preventing surplus over-ordering.`,
        uncertaintyNotes: `Forecast based on ${demand.observationsCount} sales days (moving average). Lead time assumed at ${replenishment.leadTimeDays} day(s).`,
        policyComplianceNote: 'Requires manual shopkeeper confirmation before ordering; ShelfSense never auto-places purchase orders.',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // 3. MARKDOWN REVIEWS (Category C)
  for (const risk of risks) {
    if (risk.estimatedAtRiskUnits > 0 && risk.daysRemaining !== null && risk.daysRemaining > 0 && risk.daysRemaining <= 4) {
      const product = products.find((p) => p.id === risk.productId);
      const batch = batches.find((b) => b.id === risk.batchId);
      if (!product || !batch) continue;

      const evalResult = evaluateBatchMarkdown(product, batch, risk, policy, 15);

      if (evalResult.canMarkdown) {
        recommendations.push({
          id: `rec_md_${batch.id}`,
          productId: product.id,
          batchId: batch.id,
          type: 'markdown_review',
          title: `Pre-Cutoff Markdown Review: ${product.name} (${batch.batchId})`,
          summary: `Review optional ${evalResult.suggestedMarkdownPct}% discount (from ₹${evalResult.currentSellingPrice} to ₹${evalResult.suggestedPrice.toFixed(2)}).`,
          reason: evalResult.reason,
          evidence: {
            quantityAvailable: batch.quantityRemaining,
            operationalCutoff: batch.operationalCutoffDate,
            daysRemaining: risk.daysRemaining,
            estimatedAtRiskQty: risk.estimatedAtRiskUnits,
            costPerUnit: evalResult.purchaseCostPerUnit,
            standardSellingPrice: evalResult.currentSellingPrice,
            proposedPrice: evalResult.suggestedPrice,
            minPriceFloor: evalResult.minPriceFloor,
            potentialCostExposure: risk.potentialCostExposure,
            marginPct: evalResult.estimatedMarginAtSuggestedPricePct
          },
          expectedBenefit: `Estimated recovery of ₹${evalResult.financialSimulation.projectedRevenueAtMarkdown.toFixed(2)} revenue, retaining ${evalResult.estimatedMarginAtSuggestedPricePct}% gross margin above the ${policy.minimumGrossMarginPct}% floor.`,
          uncertaintyNotes: 'Price elasticity is estimated; customer pickup will depend on daily store footfall.',
          policyComplianceNote: 'Complies with minimum gross margin floor. Cannot be applied without explicit owner confirmation.',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Floor violation notice: explain why discount is disallowed
        recommendations.push({
          id: `rec_floor_violation_${batch.id}`,
          productId: product.id,
          batchId: batch.id,
          type: 'markdown_review',
          title: `Margin Floor Alert: ${product.name} (${batch.batchId})`,
          summary: `Markdown disallowed: Proposed discount would violate store's ${policy.minimumGrossMarginPct}% gross margin floor.`,
          reason: evalResult.policyViolationNote || evalResult.reason,
          evidence: {
            quantityAvailable: batch.quantityRemaining,
            operationalCutoff: batch.operationalCutoffDate,
            costPerUnit: evalResult.purchaseCostPerUnit,
            standardSellingPrice: evalResult.currentSellingPrice,
            minPriceFloor: evalResult.minPriceFloor,
            proposedPrice: evalResult.currentSellingPrice
          },
          expectedBenefit: 'Protects store margins by preventing unprofitable discount sales.',
          uncertaintyNotes: 'Surplus may need supplier return or inventory write-off if unsold.',
          policyComplianceNote: 'Enforcing Store Policy: Minimum Gross Margin Floor constraint.',
          status: 'dismissed', // Automatically marked as policy non-compliant
          dismissalReason: 'Violates minimum gross margin floor constraint',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // 4. SUPPLIER RETURN / EXCHANGE OPTIONS (Category D)
  for (const risk of risks) {
    if (risk.estimatedAtRiskUnits > 0 && risk.daysRemaining !== null && risk.daysRemaining >= 1 && risk.daysRemaining <= 3) {
      const batch = batches.find((b) => b.id === risk.batchId);
      if (!batch || !batch.supplierId) continue;
      const supplier = supplierMap.get(batch.supplierId);

      if (supplier && supplier.allowsReturns && risk.daysRemaining >= supplier.returnWindowDaysBeforeCutoff) {
        recommendations.push({
          id: `rec_supp_${batch.id}`,
          productId: risk.productId,
          batchId: batch.id,
          type: 'supplier_return',
          title: `Supplier Credit Exchange Notice: ${risk.productName}`,
          summary: `${supplier.name} allows credit exchange if flagged ${supplier.returnWindowDaysBeforeCutoff} day(s) before cutoff.`,
          reason: `Batch ${batch.batchId} has ${risk.estimatedAtRiskUnits} estimated at-risk units with cutoff in ${risk.daysRemaining} days. Supplier return window is currently OPEN.`,
          evidence: {
            quantityAvailable: batch.quantityRemaining,
            estimatedAtRiskQty: risk.estimatedAtRiskUnits,
            potentialCostExposure: risk.potentialCostExposure,
            operationalCutoff: batch.operationalCutoffDate,
            daysRemaining: risk.daysRemaining,
            supplierReturnWindowDays: supplier.returnWindowDaysBeforeCutoff
          },
          expectedBenefit: `Recover up to ₹${risk.potentialCostExposure.toFixed(2)} in supplier credit note or product swap before the return window closes.`,
          uncertaintyNotes: 'Subject to supplier distributor route timings and packaging integrity inspection.',
          policyComplianceNote: 'Contractual supplier return policy check.',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // 5. RESPONSIBLE SURPLUS HANDLING / DONATION REVIEW (Category E)
  for (const risk of risks) {
    if (risk.estimatedAtRiskUnits > 0 && risk.daysRemaining !== null && risk.daysRemaining === 1) {
      const batch = batches.find((b) => b.id === risk.batchId);
      if (!batch) continue;

      recommendations.push({
        id: `rec_don_${batch.id}`,
        productId: risk.productId,
        batchId: batch.id,
        type: 'donation_review',
        title: `Pre-Cutoff Donation Review: ${risk.productName}`,
        summary: `Review ${risk.estimatedAtRiskUnits} units for local food partner or community donation today.`,
        reason: `Batch ${batch.batchId} reaches operational sell-through cutoff tomorrow. Food is unexpired and safe today, but will not sell through at current store velocity.`,
        evidence: {
          quantityAvailable: batch.quantityRemaining,
          estimatedAtRiskQty: risk.estimatedAtRiskUnits,
          operationalCutoff: batch.operationalCutoffDate,
          daysRemaining: risk.daysRemaining,
          potentialCostExposure: risk.potentialCostExposure
        },
        expectedBenefit: 'Prevents landfill food waste and supports community welfare while food is safe and wholesome.',
        uncertaintyNotes: 'Owner must verify physical packaging seal, chilling temperature, and recipient partner eligibility.',
        policyComplianceNote: 'Operating Rule 2: Donation must occur BEFORE operational cutoff; expired food is strictly ineligible.',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  return recommendations;
}
