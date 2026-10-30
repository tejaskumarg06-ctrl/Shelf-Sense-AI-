import fs from 'fs';
import path from 'path';
import {
  Store,
  StorePolicy,
  Supplier,
  Product,
  InventoryBatch,
  SalesRecord,
  WasteRecord,
  Recommendation,
  ActionLog
} from './types';
import {
  initialStore,
  initialPolicy,
  initialSuppliers,
  initialProducts,
  initialBatches,
  generateSeedSales,
  initialWasteRecords,
  initialActionLogs
} from './seedData';

interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  store: Store;
  policy: StorePolicy;
  suppliers: Supplier[];
  products: Product[];
  batches: InventoryBatch[];
  sales: SalesRecord[];
  wasteRecords: WasteRecord[];
  recommendations: Recommendation[];
  actionLogs: ActionLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'shelfsense.db.json');

class DatabaseService {
  private data: DatabaseSchema;
  private isLoaded = false;
  private writeTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.getDefaultDataset();
    this.init();
  }

  private getDefaultDataset(): DatabaseSchema {
    return {
      version: 1,
      lastUpdated: new Date().toISOString(),
      store: { ...initialStore },
      policy: { ...initialPolicy },
      suppliers: [...initialSuppliers],
      products: [...initialProducts],
      batches: [...initialBatches],
      sales: generateSeedSales(),
      wasteRecords: [...initialWasteRecords],
      recommendations: [],
      actionLogs: [...initialActionLogs]
    };
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.products && parsed.batches) {
          this.data = parsed;
          this.isLoaded = true;

          // Check if active batches have all elapsed past their cutoff
          const activeBatches = this.data.batches.filter((b) => b.status === 'active');
          const today = new Date().toISOString().split('T')[0];
          const hasFutureBatches = activeBatches.some((b) => b.operationalCutoffDate && b.operationalCutoffDate >= today);
          if (activeBatches.length > 0 && !hasFutureBatches) {
            console.log('[DB] Stored batches have all elapsed past cutoff; refreshing demo dataset to relative dates.');
            this.resetDemoData();
          }
          return;
        }
      }

      // Initialize with fresh seed data
      this.data = this.getDefaultDataset();
      this.persistSync();
      this.isLoaded = true;
    } catch (err) {
      console.error('[DB] Failed to load DB file, initializing in-memory fallback:', err);
      this.data = this.getDefaultDataset();
      this.isLoaded = true;
    }
  }

  private persistSync() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Persist error:', err);
    }
  }

  private schedulePersist() {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.writeTimeout = setTimeout(() => {
      this.persistSync();
      this.writeTimeout = null;
    }, 150);
  }

  public resetDemoData(): DatabaseSchema {
    this.data = this.getDefaultDataset();
    this.persistSync();
    this.logAction({
      actionType: 'policy_updated',
      reason: 'Demo dataset reset to initial state with fresh relative dates',
      userConfirmed: true
    });
    return this.data;
  }

  // --- Store & Policy ---
  public getStore(): Store {
    return { ...this.data.store };
  }

  public updateStore(updates: Partial<Store>): Store {
    this.data.store = { ...this.data.store, ...updates };
    this.schedulePersist();
    this.logAction({
      actionType: 'policy_updated',
      newValue: updates,
      reason: 'Updated store profile details',
      userConfirmed: true
    });
    return this.getStore();
  }

  public getPolicy(): StorePolicy {
    return { ...this.data.policy };
  }

  public updatePolicy(updates: Partial<StorePolicy>): StorePolicy {
    const prev = { ...this.data.policy };
    this.data.policy = { ...this.data.policy, ...updates };
    this.schedulePersist();
    this.logAction({
      actionType: 'policy_updated',
      previousValue: prev,
      newValue: updates,
      reason: 'Updated inventory risk policies and threshold parameters',
      userConfirmed: true
    });
    return this.getPolicy();
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return [...this.data.suppliers];
  }

  public getSupplier(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id === id);
  }

  public addSupplier(supplier: Supplier): Supplier {
    this.data.suppliers.push(supplier);
    this.schedulePersist();
    return supplier;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.data.products];
  }

  public getProduct(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public getProductBySku(sku: string): Product | undefined {
    return this.data.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  }

  public addProduct(product: Product): Product {
    if (this.getProductBySku(product.sku)) {
      throw new Error(`Product with SKU "${product.sku}" already exists`);
    }
    if (product.defaultPurchaseCost < 0 || product.defaultSellingPrice < 0) {
      throw new Error('Purchase cost and selling price cannot be negative');
    }
    this.data.products.push(product);
    this.schedulePersist();
    this.logAction({
      actionType: 'batch_created',
      productId: product.id,
      newValue: { name: product.name, sku: product.sku },
      reason: `Added new product catalog item "${product.name}"`,
      userConfirmed: true
    });
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Product with ID "${id}" not found`);
    }
    if (updates.defaultPurchaseCost !== undefined && updates.defaultPurchaseCost < 0) {
      throw new Error('Purchase cost cannot be negative');
    }
    if (updates.defaultSellingPrice !== undefined && updates.defaultSellingPrice < 0) {
      throw new Error('Selling price cannot be negative');
    }
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.schedulePersist();
    return this.data.products[idx];
  }

  // --- Batches ---
  public getBatches(): InventoryBatch[] {
    return [...this.data.batches];
  }

  public getBatch(id: string): InventoryBatch | undefined {
    return this.data.batches.find((b) => b.id === id || b.batchId === id);
  }

  public getBatchesForProduct(productId: string): InventoryBatch[] {
    return this.data.batches.filter((b) => b.productId === productId);
  }

  public addBatch(batch: InventoryBatch): InventoryBatch {
    const product = this.getProduct(batch.productId);
    if (!product) {
      throw new Error(`Cannot add batch: Product with ID "${batch.productId}" does not exist`);
    }
    if (batch.quantityReceived <= 0 || batch.quantityRemaining < 0) {
      throw new Error('Received quantity must be positive and remaining quantity cannot be negative');
    }
    if (batch.purchaseCostPerUnit < 0) {
      throw new Error('Purchase cost per unit cannot be negative');
    }

    // Check unique batchId
    const existing = this.data.batches.find((b) => b.batchId.toLowerCase() === batch.batchId.toLowerCase());
    if (existing) {
      throw new Error(`Batch ID "${batch.batchId}" already exists. Batch identifiers must be unique.`);
    }

    this.data.batches.push(batch);
    this.schedulePersist();
    this.logAction({
      actionType: 'batch_created',
      productId: batch.productId,
      batchId: batch.id,
      newValue: {
        batchId: batch.batchId,
        quantity: batch.quantityRemaining,
        cutoff: batch.operationalCutoffDate
      },
      reason: `Created batch ${batch.batchId} with ${batch.quantityRemaining} units`,
      userConfirmed: true
    });
    return batch;
  }

  public updateBatch(id: string, updates: Partial<InventoryBatch>): InventoryBatch {
    const idx = this.data.batches.findIndex((b) => b.id === id || b.batchId === id);
    if (idx === -1) {
      throw new Error(`Batch with ID "${id}" not found`);
    }
    if (updates.quantityRemaining !== undefined && updates.quantityRemaining < 0) {
      throw new Error('Remaining quantity cannot be negative');
    }
    const prev = { ...this.data.batches[idx] };
    this.data.batches[idx] = {
      ...this.data.batches[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.schedulePersist();

    this.logAction({
      actionType: 'stock_adjusted',
      productId: this.data.batches[idx].productId,
      batchId: this.data.batches[idx].id,
      previousValue: prev,
      newValue: updates,
      reason: 'Batch record updated',
      userConfirmed: true
    });

    return this.data.batches[idx];
  }

  public adjustBatchStock(
    id: string,
    delta: number,
    reason: string,
    actionType: 'stock_adjusted' | 'stock_received' | 'units_sold' | 'waste_recorded'
  ): InventoryBatch {
    const batch = this.getBatch(id);
    if (!batch) {
      throw new Error(`Batch "${id}" not found`);
    }
    const newQty = batch.quantityRemaining + delta;
    if (newQty < 0) {
      throw new Error(`Cannot adjust stock: resulting quantity (${newQty}) would be negative`);
    }

    const prevQty = batch.quantityRemaining;
    const updatedStatus = newQty === 0 ? 'depleted' : batch.status;

    const updated = this.updateBatch(batch.id, {
      quantityRemaining: newQty,
      status: updatedStatus
    });

    this.logAction({
      actionType: actionType,
      productId: batch.productId,
      batchId: batch.id,
      previousValue: { quantityRemaining: prevQty },
      newValue: { quantityRemaining: newQty, delta },
      reason: reason || `Stock adjusted by ${delta > 0 ? '+' : ''}${delta}`,
      userConfirmed: true
    });

    return updated;
  }

  // --- Sales ---
  public getSales(): SalesRecord[] {
    return [...this.data.sales];
  }

  public addSale(sale: SalesRecord): SalesRecord {
    if (sale.quantitySold <= 0) {
      throw new Error('Sale quantity must be positive');
    }
    const product = this.getProduct(sale.productId);
    if (!product) {
      throw new Error(`Product "${sale.productId}" not found`);
    }

    this.data.sales.push(sale);

    // If batch specified, deduct stock
    if (sale.batchId) {
      const batch = this.getBatch(sale.batchId);
      if (batch) {
        this.adjustBatchStock(
          batch.id,
          -sale.quantitySold,
          `Recorded sale of ${sale.quantitySold} units`,
          'units_sold'
        );
      }
    }

    this.schedulePersist();
    return sale;
  }

  // --- Waste Records ---
  public getWasteRecords(): WasteRecord[] {
    return [...this.data.wasteRecords];
  }

  public addWasteRecord(record: WasteRecord): WasteRecord {
    if (record.quantityWasted <= 0) {
      throw new Error('Waste quantity must be greater than zero');
    }
    const batch = this.getBatch(record.batchId);
    if (batch) {
      this.adjustBatchStock(
        batch.id,
        -record.quantityWasted,
        `Recorded waste: ${record.reason} (${record.quantityWasted} units)`,
        'waste_recorded'
      );
    }

    this.data.wasteRecords.push(record);
    this.schedulePersist();

    this.logAction({
      actionType: 'waste_recorded',
      productId: record.productId,
      batchId: record.batchId,
      newValue: record,
      reason: `Recorded waste of ${record.quantityWasted} units (${record.reason})`,
      userConfirmed: true
    });

    return record;
  }

  // --- Recommendations ---
  public getRecommendations(): Recommendation[] {
    return [...this.data.recommendations];
  }

  public getRecommendation(id: string): Recommendation | undefined {
    return this.data.recommendations.find((r) => r.id === id);
  }

  public saveRecommendations(recs: Recommendation[]) {
    // Preserve existing status if recommendation already existed
    let hasChanged = false;
    const prevMap = new Map(this.data.recommendations.map((r) => [r.id, r]));

    if (this.data.recommendations.length !== recs.length) {
      hasChanged = true;
    }

    const updated: Recommendation[] = [];
    for (const rec of recs) {
      const existing = prevMap.get(rec.id);
      if (existing && existing.status !== 'pending') {
        updated.push(existing);
      } else {
        if (!existing || existing.summary !== rec.summary || existing.title !== rec.title) {
          hasChanged = true;
        }
        updated.push(rec);
      }
    }
    this.data.recommendations = updated;
    if (hasChanged) {
      this.schedulePersist();
    }
  }

  public updateRecommendationStatus(
    id: string,
    status: Recommendation['status'],
    reason?: string
  ): Recommendation {
    const idx = this.data.recommendations.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Recommendation "${id}" not found`);
    }

    const prev = { ...this.data.recommendations[idx] };
    this.data.recommendations[idx] = {
      ...this.data.recommendations[idx],
      status: status,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionTaken: status === 'completed' || status === 'approved' ? reason : undefined,
      dismissalReason: status === 'dismissed' ? reason : undefined
    };

    let logActionType: ActionLog['actionType'] = 'recommendation_completed';
    if (status === 'approved') logActionType = 'recommendation_approved';
    if (status === 'dismissed') logActionType = 'recommendation_dismissed';
    if (status === 'deferred') logActionType = 'recommendation_deferred';

    this.logAction({
      actionType: logActionType,
      recommendationId: id,
      productId: prev.productId,
      batchId: prev.batchId,
      previousValue: { status: prev.status },
      newValue: { status, reason },
      reason: reason || `Recommendation marked as ${status}`,
      userConfirmed: true
    });

    this.schedulePersist();
    return this.data.recommendations[idx];
  }

  // --- Audit Trail ---
  public getActionLogs(): ActionLog[] {
    return [...this.data.actionLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public logAction(log: Omit<ActionLog, 'id' | 'timestamp'>): ActionLog {
    const entry: ActionLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.actionLogs.unshift(entry);
    // Keep max 500 audit entries
    if (this.data.actionLogs.length > 500) {
      this.data.actionLogs.length = 500;
    }
    this.schedulePersist();
    return entry;
  }
}

export const db = new DatabaseService();
