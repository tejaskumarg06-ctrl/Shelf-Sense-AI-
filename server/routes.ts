import { Router, Request, Response } from 'express';
import { db } from './db';
import { evaluateStoreInventoryRisk, calculateDaysRemaining, offsetDateString } from './riskEngine';
import { generateStoreRecommendations } from './recommendations';
import { nebiusClient } from './nebiusClient';
import { Product, InventoryBatch, SalesRecord, WasteRecord, BatchRiskCalculation, Recommendation } from './types';

export const apiRouter = Router();

interface CachedRiskState {
  timestamp: number;
  data: {
    store: any;
    policy: any;
    products: Product[];
    batches: InventoryBatch[];
    sales: SalesRecord[];
    suppliers: any[];
    riskData: {
      batchRisks: BatchRiskCalculation[];
      demandSummaries: any;
      summary: any;
    };
    allRecs: Recommendation[];
  };
}

let riskCache: CachedRiskState | null = null;
const RISK_CACHE_TTL_MS = 2500;

export function invalidateRiskCache() {
  riskCache = null;
}

// Helper to compute fresh risk state and store recommendations with short in-memory cache
function getFreshRiskAndRecommendations(force = false) {
  const now = Date.now();
  if (!force && riskCache && now - riskCache.timestamp < RISK_CACHE_TTL_MS) {
    return riskCache.data;
  }

  const store = db.getStore();
  const policy = db.getPolicy();
  const products = db.getProducts();
  const batches = db.getBatches();
  const sales = db.getSales();
  const suppliers = db.getSuppliers();

  const riskData = evaluateStoreInventoryRisk(
    products,
    batches,
    sales,
    policy,
    store.timezone,
    store.openingDays
  );

  const freshRecs = generateStoreRecommendations(
    products,
    batches,
    suppliers,
    riskData.batchRisks,
    riskData.demandSummaries,
    policy
  );

  db.saveRecommendations(freshRecs);
  const allRecs = db.getRecommendations();

  const result = { store, policy, products, batches, sales, suppliers, riskData, allRecs };
  riskCache = { timestamp: now, data: result };
  return result;
}

// 1. DASHBOARD OVERVIEW
apiRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { store, policy, riskData, allRecs } = getFreshRiskAndRecommendations();
    const wasteRecords = db.getWasteRecords();

    // Actual recorded waste totals
    const totalRecordedWasteUnits = wasteRecords.reduce((acc, w) => acc + w.quantityWasted, 0);
    const totalRecordedWasteCost = wasteRecords.reduce((acc, w) => acc + w.totalCost, 0);

    // Briefing
    const briefing = await nebiusClient.generateDailyBriefing(
      store,
      policy,
      riskData.batchRisks,
      riskData.demandSummaries,
      riskData.summary
    );

    // Priority Queue: Urgent, Warning, Unknown Review
    const priorityQueue = riskData.batchRisks
      .filter((r) => r.priority !== 'normal')
      .slice(0, 15);

    // Pending Recommendations count
    const pendingRecsCount = allRecs.filter((r) => r.status === 'pending').length;

    res.json({
      success: true,
      data: {
        store,
        policy,
        summary: riskData.summary,
        recordedWaste: {
          totalUnits: totalRecordedWasteUnits,
          totalCost: totalRecordedWasteCost,
          recordsCount: wasteRecords.length
        },
        priorityQueue,
        pendingRecsCount,
        briefing
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// 2. PRODUCTS
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    res.json({ success: true, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      unit,
      barcode,
      supplierId,
      defaultPurchaseCost,
      defaultSellingPrice,
      minimumStockLevel,
      manualDemandEstimatePerDay,
      shelfLifeDays
    } = req.body;

    if (!name || !sku || !category || !unit) {
      return res.status(400).json({ success: false, error: 'Name, SKU, category, and unit are required.' });
    }

    if (defaultPurchaseCost < 0 || defaultSellingPrice < 0) {
      return res.status(400).json({ success: false, error: 'Costs and prices cannot be negative.' });
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category.trim(),
      unit: unit.trim(),
      barcode: barcode ? barcode.trim() : undefined,
      supplierId: supplierId || undefined,
      defaultPurchaseCost: Number(defaultPurchaseCost) || 0,
      defaultSellingPrice: Number(defaultSellingPrice) || 0,
      minimumStockLevel: Number(minimumStockLevel) || 5,
      status: 'active',
      manualDemandEstimatePerDay: manualDemandEstimatePerDay ? Number(manualDemandEstimatePerDay) : undefined,
      shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.addProduct(newProduct);
    invalidateRiskCache();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.updateProduct(id, req.body);
    invalidateRiskCache();
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. BATCHES
apiRouter.get('/batches', (req: Request, res: Response) => {
  try {
    const { riskData } = getFreshRiskAndRecommendations();
    res.json({ success: true, data: riskData.batchRisks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/batches', (req: Request, res: Response) => {
  try {
    const {
      productId,
      batchId,
      quantityReceived,
      quantityRemaining,
      receivedDate,
      isReceivedDateEstimated,
      labelDate,
      labelType,
      operationalCutoffDate,
      purchaseCostPerUnit,
      sellingPricePerUnit,
      storageLocation,
      supplierId,
      notes
    } = req.body;

    if (!productId || !batchId) {
      return res.status(400).json({ success: false, error: 'Product and Batch ID are required.' });
    }

    const qtyRec = Number(quantityReceived);
    const qtyRem = quantityRemaining !== undefined ? Number(quantityRemaining) : qtyRec;
    if (isNaN(qtyRec) || qtyRec <= 0 || isNaN(qtyRem) || qtyRem < 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be positive numbers.' });
    }

    const cost = Number(purchaseCostPerUnit);
    if (isNaN(cost) || cost < 0) {
      return res.status(400).json({ success: false, error: 'Purchase cost per unit cannot be negative.' });
    }

    const store = db.getStore();
    const policy = db.getPolicy();

    // Auto-calculate cutoff if labelDate provided and cutoff not specified
    let computedCutoff = operationalCutoffDate;
    if (!computedCutoff && labelDate && labelType !== 'unknown') {
      const offset = policy.operationalCutoffOffsetDays || 1;
      computedCutoff = offsetDateString(labelDate, offset);
    }

    const newBatch: InventoryBatch = {
      id: `batch_${Date.now()}`,
      productId,
      batchId: batchId.trim().toUpperCase(),
      quantityReceived: qtyRec,
      quantityRemaining: qtyRem,
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
      isReceivedDateEstimated: Boolean(isReceivedDateEstimated),
      labelDate: labelDate || undefined,
      labelType: labelType || 'unknown',
      operationalCutoffDate: computedCutoff || undefined,
      purchaseCostPerUnit: cost,
      sellingPricePerUnit: sellingPricePerUnit ? Number(sellingPricePerUnit) : undefined,
      storageLocation: storageLocation ? storageLocation.trim() : undefined,
      supplierId: supplierId || undefined,
      status: labelType === 'unknown' ? 'flagged_for_review' : 'active',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.addBatch(newBatch);
    invalidateRiskCache();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/batches/:id/adjust', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delta, reason, actionType } = req.body;

    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({ success: false, error: 'Delta number is required.' });
    }

    const validActionType = actionType || 'stock_adjusted';
    const updated = db.adjustBatchStock(id, Number(delta), reason || 'Manual inventory adjustment', validActionType);
    invalidateRiskCache();
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. RISK & RECOMMENDATIONS
apiRouter.get('/risk', (req: Request, res: Response) => {
  try {
    const { riskData } = getFreshRiskAndRecommendations();
    res.json({ success: true, data: riskData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/recommendations', (req: Request, res: Response) => {
  try {
    const { allRecs } = getFreshRiskAndRecommendations();
    res.json({ success: true, data: allRecs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/recommendations/:id/action', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'completed', 'dismissed', 'deferred'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid recommendation status' });
    }

    const updated = db.updateRecommendationStatus(id, status, reason);
    invalidateRiskCache();
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. SALES & WASTE
apiRouter.get('/sales', (req: Request, res: Response) => {
  try {
    const sales = db.getSales();
    res.json({ success: true, data: sales });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/sales', (req: Request, res: Response) => {
  try {
    const { productId, batchId, quantitySold, unitSellingPrice, saleDate, notes } = req.body;

    if (!productId || !quantitySold || Number(quantitySold) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid product and positive quantity required.' });
    }

    const newSale: SalesRecord = {
      id: `sale_${Date.now()}`,
      productId,
      batchId: batchId || undefined,
      quantitySold: Number(quantitySold),
      unitSellingPrice: Number(unitSellingPrice) || 0,
      saleDate: saleDate || new Date().toISOString().split('T')[0],
      transactionId: `TXN-${Date.now()}`,
      notes,
      createdAt: new Date().toISOString()
    };

    const saved = db.addSale(newSale);
    invalidateRiskCache();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/waste', (req: Request, res: Response) => {
  try {
    const waste = db.getWasteRecords();
    res.json({ success: true, data: waste });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/waste', (req: Request, res: Response) => {
  try {
    const { productId, batchId, quantityWasted, reason, notes } = req.body;

    if (!productId || !batchId || !quantityWasted || Number(quantityWasted) <= 0) {
      return res.status(400).json({ success: false, error: 'Product, batch, and positive quantity required.' });
    }

    const batch = db.getBatch(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found.' });
    }

    const qty = Number(quantityWasted);
    const unitCost = batch.purchaseCostPerUnit;
    const totalCost = Math.round(qty * unitCost * 100) / 100;

    const newWaste: WasteRecord = {
      id: `waste_${Date.now()}`,
      productId,
      batchId,
      quantityWasted: qty,
      unitCost,
      totalCost,
      reason: reason || 'expired_cutoff',
      recordedDate: new Date().toISOString().split('T')[0],
      notes,
      createdAt: new Date().toISOString()
    };

    const saved = db.addWasteRecord(newWaste);
    invalidateRiskCache();
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. CSV IMPORT & TEMPLATE
apiRouter.get('/csv-template', (req: Request, res: Response) => {
  const csvHeaders = 'product_name,sku,category,unit,batch_id,quantity,purchase_cost,selling_price,received_date,label_date,label_type,cutoff_date,location\n';
  const sampleRow1 = 'Amul Taaza Milk 1L,DAI-MILK-001,Dairy,carton,B-AMUL-IMP01,25,56.00,68.00,2026-10-15,2026-10-22,use_by,2026-10-21,Chiller Shelf 1\n';
  const sampleRow2 = 'Britannia Wheat Bread,BAK-BREAD-003,Bakery,packet,B-BRIT-IMP02,15,40.00,55.00,2026-10-16,2026-10-20,best_before,2026-10-19,Bakery Display\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="shelfsense_inventory_template.csv"');
  res.send(csvHeaders + sampleRow1 + sampleRow2);
});

apiRouter.post('/import-csv', (req: Request, res: Response) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ success: false, error: 'CSV content is required.' });
    }

    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: 'CSV must contain a header row and at least one data row.' });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s"-]/g, '_'));
    const rows = lines.slice(1);

    const parsedRows: any[] = [];
    const validationErrors: string[] = [];

    const existingBatches = db.getBatches();
    const existingBatchIds = new Set(existingBatches.map((b) => b.batchId.toLowerCase()));
    const seenImportBatchIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const lineIdx = i + 2;
      const values = rows[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));

      const rowObj: any = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = values[colIdx] || '';
      });

      // Validations
      const rowErrors: string[] = [];
      const prodName = rowObj.product_name || rowObj.product || '';
      const sku = rowObj.sku || '';
      const batchId = (rowObj.batch_id || rowObj.batch || '').toUpperCase();
      const qty = parseFloat(rowObj.quantity || rowObj.qty || '0');
      const cost = parseFloat(rowObj.purchase_cost || rowObj.cost || '0');
      const price = parseFloat(rowObj.selling_price || rowObj.price || '0');
      const labelDate = rowObj.label_date || rowObj.expiry_date || '';
      const labelType = (rowObj.label_type || 'best_before').toLowerCase();
      const cutoffDate = rowObj.cutoff_date || '';

      if (!prodName) rowErrors.push('Missing product_name');
      if (!sku) rowErrors.push('Missing SKU');
      if (!batchId) rowErrors.push('Missing batch_id');
      if (isNaN(qty) || qty <= 0) rowErrors.push(`Invalid quantity: ${rowObj.quantity}`);
      if (isNaN(cost) || cost < 0) rowErrors.push(`Invalid cost: ${rowObj.purchase_cost}`);
      if (isNaN(price) || price < 0) rowErrors.push(`Invalid price: ${rowObj.selling_price}`);

      // Check duplicates
      if (batchId) {
        if (existingBatchIds.has(batchId.toLowerCase())) {
          rowErrors.push(`Batch ID "${batchId}" already exists in system.`);
        }
        if (seenImportBatchIds.has(batchId.toLowerCase())) {
          rowErrors.push(`Duplicate Batch ID "${batchId}" found in import file.`);
        }
        seenImportBatchIds.add(batchId.toLowerCase());
      }

      // Date check
      if (labelDate && isNaN(Date.parse(labelDate))) {
        rowErrors.push(`Invalid date format for label_date: ${labelDate} (use YYYY-MM-DD)`);
      }

      parsedRows.push({
        rowNumber: lineIdx,
        raw: rowObj,
        productName: prodName,
        sku,
        category: rowObj.category || 'General Perishable',
        unit: rowObj.unit || 'unit',
        batchId,
        quantity: qty,
        purchaseCost: cost,
        sellingPrice: price,
        receivedDate: rowObj.received_date || new Date().toISOString().split('T')[0],
        labelDate: labelDate || undefined,
        labelType: ['use_by', 'best_before', 'expiry_date', 'unknown'].includes(labelType) ? labelType : 'best_before',
        operationalCutoffDate: cutoffDate || undefined,
        location: rowObj.location || undefined,
        errors: rowErrors,
        isValid: rowErrors.length === 0
      });

      if (rowErrors.length > 0) {
        validationErrors.push(`Row ${lineIdx}: ${rowErrors.join(', ')}`);
      }
    }

    res.json({
      success: true,
      data: {
        totalRows: parsedRows.length,
        validRowsCount: parsedRows.filter((r) => r.isValid).length,
        invalidRowsCount: parsedRows.filter((r) => !r.isValid).length,
        validationErrors,
        preview: parsedRows
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/import-csv/commit', (req: Request, res: Response) => {
  try {
    const { validRows } = req.body;
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid rows provided for import.' });
    }

    const importedBatches: InventoryBatch[] = [];
    const policy = db.getPolicy();

    for (const row of validRows) {
      // Find or create product
      let product = db.getProductBySku(row.sku);
      if (!product) {
        product = db.addProduct({
          id: `prod_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          sku: row.sku,
          name: row.productName,
          category: row.category || 'Imported Goods',
          unit: row.unit || 'unit',
          defaultPurchaseCost: row.purchaseCost,
          defaultSellingPrice: row.sellingPrice,
          minimumStockLevel: 5,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Calculate cutoff if missing
      let cutoff = row.operationalCutoffDate;
      if (!cutoff && row.labelDate && row.labelType !== 'unknown') {
        const offset = policy.operationalCutoffOffsetDays || 1;
        cutoff = offsetDateString(row.labelDate, offset);
      }

      const newBatch: InventoryBatch = {
        id: `batch_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        batchId: row.batchId,
        quantityReceived: row.quantity,
        quantityRemaining: row.quantity,
        receivedDate: row.receivedDate || new Date().toISOString().split('T')[0],
        isReceivedDateEstimated: false,
        labelDate: row.labelDate,
        labelType: row.labelType || 'best_before',
        operationalCutoffDate: cutoff,
        purchaseCostPerUnit: row.purchaseCost,
        sellingPricePerUnit: row.sellingPrice,
        storageLocation: row.location,
        status: row.labelType === 'unknown' ? 'flagged_for_review' : 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = db.addBatch(newBatch);
      importedBatches.push(saved);
    }

    invalidateRiskCache();
    res.json({
      success: true,
      message: `Successfully imported ${importedBatches.length} batch(es).`,
      count: importedBatches.length
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. ANALYTICS
apiRouter.get('/analytics', (req: Request, res: Response) => {
  try {
    const periodDays = parseInt((req.query.periodDays as string) || '14', 10);
    const { riskData, allRecs, products } = getFreshRiskAndRecommendations();
    const sales = db.getSales();
    const wasteRecords = db.getWasteRecords();

    // Filter by periodDays
    const todayStr = new Date().toISOString().split('T')[0];
    const cutoffDateStr = offsetDateString(todayStr, periodDays);

    const periodSales = periodDays > 0 ? sales.filter((s) => s.saleDate >= cutoffDateStr) : sales;
    const periodWaste = periodDays > 0 ? wasteRecords.filter((w) => w.recordedDate >= cutoffDateStr) : wasteRecords;

    // Sales over time (daily aggregated for requested period)
    const salesByDay: Record<string, { units: number; revenue: number }> = {};
    for (const s of periodSales) {
      if (!salesByDay[s.saleDate]) salesByDay[s.saleDate] = { units: 0, revenue: 0 };
      salesByDay[s.saleDate].units += s.quantitySold;
      salesByDay[s.saleDate].revenue += s.quantitySold * s.unitSellingPrice;
    }

    const salesTimeline = Object.entries(salesByDay)
      .map(([date, d]) => ({ date, units: d.units, revenue: Math.round(d.revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Waste by Category for requested period
    const prodMap = new Map(products.map((p) => [p.id, p]));
    const wasteByCategory: Record<string, { units: number; cost: number }> = {};
    for (const w of periodWaste) {
      const prod = prodMap.get(w.productId);
      const cat = prod?.category || 'Other';
      if (!wasteByCategory[cat]) wasteByCategory[cat] = { units: 0, cost: 0 };
      wasteByCategory[cat].units += w.quantityWasted;
      wasteByCategory[cat].cost += w.totalCost;
    }

    // Recommendation Completion Rates
    const recsByStatus = {
      pending: allRecs.filter((r) => r.status === 'pending').length,
      approved: allRecs.filter((r) => r.status === 'approved').length,
      completed: allRecs.filter((r) => r.status === 'completed').length,
      dismissed: allRecs.filter((r) => r.status === 'dismissed').length,
      deferred: allRecs.filter((r) => r.status === 'deferred').length
    };

    // Risk breakdown by priority
    const riskDistribution = {
      urgent: riskData.batchRisks.filter((r) => r.priority === 'urgent').length,
      warning: riskData.batchRisks.filter((r) => r.priority === 'warning').length,
      unknown_review: riskData.batchRisks.filter((r) => r.priority === 'unknown_review').length,
      past_cutoff: riskData.batchRisks.filter((r) => r.priority === 'past_cutoff').length,
      normal: riskData.batchRisks.filter((r) => r.priority === 'normal').length
    };

    res.json({
      success: true,
      data: {
        periodDays,
        salesTimeline,
        wasteByCategory,
        recsByStatus,
        riskDistribution,
        totalSalesUnits: periodSales.reduce((a, b) => a + b.quantitySold, 0),
        totalWasteUnits: periodWaste.reduce((a, b) => a + b.quantityWasted, 0),
        totalWasteCost: Math.round(periodWaste.reduce((a, b) => a + b.totalCost, 0) * 100) / 100
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POLICY & FORECASTS ENDPOINTS
apiRouter.get('/policy', (req: Request, res: Response) => {
  try {
    const policy = db.getPolicy();
    res.json({ success: true, data: policy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/forecasts', (req: Request, res: Response) => {
  try {
    const { riskData } = getFreshRiskAndRecommendations();
    res.json({ success: true, data: riskData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. SETTINGS & DEMO RESET
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const store = db.getStore();
    const policy = db.getPolicy();
    const aiStatus = nebiusClient.getStatus();

    res.json({
      success: true,
      data: { store, policy, aiStatus }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const { store, policy } = req.body;
    let updatedStore = db.getStore();
    let updatedPolicy = db.getPolicy();

    if (store) updatedStore = db.updateStore(store);
    if (policy) updatedPolicy = db.updatePolicy(policy);

    invalidateRiskCache();
    res.json({
      success: true,
      data: { store: updatedStore, policy: updatedPolicy }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/settings/reset-demo', (req: Request, res: Response) => {
  try {
    db.resetDemoData();
    invalidateRiskCache();
    res.json({ success: true, message: 'Demo dataset successfully re-initialized with fresh relative dates.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. AI STATUS & CHAT
apiRouter.get('/ai/status', (req: Request, res: Response) => {
  nebiusClient.refreshConfig();
  res.json({ success: true, data: nebiusClient.getStatus() });
});

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { question, conversationHistory } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required.' });
    }

    const { store, policy, riskData } = getFreshRiskAndRecommendations();

    const response = await nebiusClient.answerQuestion(
      question,
      store,
      policy,
      riskData.batchRisks,
      riskData.demandSummaries,
      conversationHistory || []
    );

    res.json({ success: true, data: response });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AUDIT LOGS
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = db.getActionLogs();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
