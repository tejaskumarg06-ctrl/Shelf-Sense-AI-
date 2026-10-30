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

// Helper to compute ISO dates relative to "today" in store timezone
export function getRelativeDate(daysOffset: number, timezone: string = 'Asia/Kolkata'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayInTz = formatter.format(new Date());
  const parts = todayInTz.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const utc = new Date(Date.UTC(y, m, d));
  utc.setUTCDate(utc.getUTCDate() + daysOffset);
  const resYear = utc.getUTCFullYear();
  const resMonth = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(utc.getUTCDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

export const initialStore: Store = {
  id: 'store_001',
  name: 'Krishna Provision & Perishables Store',
  address: '14th Main Rd, Indiranagar, Bengaluru, Karnataka 560038',
  locale: 'en-IN',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  openingDays: [1, 2, 3, 4, 5, 6, 0], // Open 7 days a week
  operatingHours: '07:00 - 22:00'
};

export const initialPolicy: StorePolicy = {
  warningWindowDays: 5,           // flag if cutoff is within 5 days
  urgentWindowDays: 2,            // flag as urgent if cutoff is <= 2 days
  operationalCutoffOffsetDays: 1, // cutoff is 1 day before label date for food safety cushion
  minimumGrossMarginPct: 15,      // 15% floor constraint on markdowns
  defaultSafetyStockDays: 2,      // 2 days demand safety buffer
  reviewPeriodDays: 3,            // 3 days review cycle
  fefoEnabled: true,
  autoFlagUnknownDates: true
};

export const initialSuppliers: Supplier[] = [
  {
    id: 'supp_amul',
    name: 'Karnataka Milk Federation / Amul Direct Depo',
    contactPerson: 'Ramesh Gowda',
    phone: '+91 98450 12345',
    email: 'orders@kmf-bangalore.in',
    leadTimeDays: 1,
    minimumOrderQuantity: 20,
    allowsReturns: false,
    returnWindowDaysBeforeCutoff: 0,
    notes: 'Daily early morning delivery at 05:30 AM. Strictly no returns on fresh pasteurized milk.'
  },
  {
    id: 'supp_mother_dairy',
    name: 'Mother Dairy Fresh Logistics',
    contactPerson: 'Suresh Kumar',
    phone: '+91 98860 67890',
    email: 'supply@motherdairy-south.com',
    leadTimeDays: 1,
    minimumOrderQuantity: 15,
    allowsReturns: true,
    returnWindowDaysBeforeCutoff: 2,
    notes: 'Allows credit note exchange on curd/dahi if flagged 48 hours before cutoff.'
  },
  {
    id: 'supp_britannia',
    name: 'Britannia Foods City Distributor',
    contactPerson: 'Anand Verma',
    phone: '+91 97410 54321',
    email: 'orders@britannia-distrib.com',
    leadTimeDays: 1,
    minimumOrderQuantity: 24,
    allowsReturns: true,
    returnWindowDaysBeforeCutoff: 1,
    notes: 'Allows full credit swap on unsold packaged whole wheat bread 24 hours prior to cutoff.'
  },
  {
    id: 'supp_heritage',
    name: 'Heritage Foods Regional Dairy',
    contactPerson: 'Venkatesh Rao',
    phone: '+91 99000 88776',
    email: 'sales@heritagefoods.in',
    leadTimeDays: 2,
    minimumOrderQuantity: 10,
    allowsReturns: false,
    returnWindowDaysBeforeCutoff: 0,
    notes: 'Cold chain delivery every 2 days. Paneer and curd packs.'
  },
  {
    id: 'supp_epigamia',
    name: 'Drums Food International (Epigamia)',
    contactPerson: 'Pooja Hegde',
    phone: '+91 98200 11223',
    email: 'retail@epigamia.com',
    leadTimeDays: 2,
    minimumOrderQuantity: 12,
    allowsReturns: false,
    returnWindowDaysBeforeCutoff: 0,
    notes: 'Gourmet yogurts and dairy snacks. High margin perishable lines.'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod_milk_amul',
    sku: 'DAI-MILK-001',
    name: 'Amul Taaza Homogenised Toned Milk (1L)',
    category: 'Dairy & Milk',
    unit: 'carton',
    barcode: '8901262010053',
    supplierId: 'supp_amul',
    defaultPurchaseCost: 56.00,
    defaultSellingPrice: 68.00,
    minimumStockLevel: 25,
    status: 'active',
    shelfLifeDays: 4,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_dahi_mother',
    sku: 'DAI-CURD-002',
    name: 'Mother Dairy Classic Dahi / Curd (400g)',
    category: 'Dairy & Milk',
    unit: 'tub',
    barcode: '8901648001234',
    supplierId: 'supp_mother_dairy',
    defaultPurchaseCost: 38.00,
    defaultSellingPrice: 50.00,
    minimumStockLevel: 12,
    status: 'active',
    shelfLifeDays: 6,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_bread_britannia',
    sku: 'BAK-BREAD-003',
    name: 'Britannia 100% Whole Wheat Bread (400g)',
    category: 'Bakery',
    unit: 'packet',
    barcode: '8901063131012',
    supplierId: 'supp_britannia',
    defaultPurchaseCost: 40.00,
    defaultSellingPrice: 55.00,
    minimumStockLevel: 15,
    status: 'active',
    shelfLifeDays: 5,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_paneer_heritage',
    sku: 'DAI-PANEER-004',
    name: 'Heritage Fresh Malai Paneer (200g)',
    category: 'Dairy & Milk',
    unit: 'packet',
    barcode: '8906008510452',
    supplierId: 'supp_heritage',
    defaultPurchaseCost: 88.00,
    defaultSellingPrice: 115.00,
    minimumStockLevel: 8,
    status: 'active',
    shelfLifeDays: 7,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_paneer_local',
    sku: 'DAI-PANEER-005',
    name: 'Local Organic Farmhouse Paneer (200g)',
    category: 'Dairy & Milk',
    unit: 'packet',
    barcode: '8900000000001',
    defaultPurchaseCost: 75.00,
    defaultSellingPrice: 100.00,
    minimumStockLevel: 5,
    status: 'active',
    shelfLifeDays: 5,
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_mango_alphonso',
    sku: 'FRU-MANGO-006',
    name: 'Ratnagiri Alphonso Mangoes Grade-A (1kg Box)',
    category: 'Fresh Produce',
    unit: 'box',
    barcode: '8909988776655',
    defaultPurchaseCost: 450.00,
    defaultSellingPrice: 650.00,
    minimumStockLevel: 4,
    status: 'active',
    manualDemandEstimatePerDay: 2.0, // Manual owner estimate for seasonal produce!
    shelfLifeDays: 6,
    createdAt: getRelativeDate(-2),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_yogurt_epigamia',
    sku: 'DAI-YOGURT-007',
    name: 'Epigamia Greek Yogurt Strawberry (120g)',
    category: 'Dairy & Milk',
    unit: 'cup',
    barcode: '8906073120198',
    supplierId: 'supp_epigamia',
    defaultPurchaseCost: 45.00,
    defaultSellingPrice: 65.00,
    minimumStockLevel: 10,
    status: 'active',
    shelfLifeDays: 14,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_eggs_country',
    sku: 'EGG-COUNTRY-008',
    name: 'Country Free-Range Brown Eggs (Pack of 6)',
    category: 'Poultry & Eggs',
    unit: 'pack',
    barcode: '8907766554433',
    defaultPurchaseCost: 62.00,
    defaultSellingPrice: 70.00,
    minimumStockLevel: 8,
    status: 'active',
    shelfLifeDays: 10,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  },
  {
    id: 'prod_ghee_nandini',
    sku: 'GRO-GHEE-009',
    name: 'Nandini Pure Cow Ghee (500ml Pet Jar)',
    category: 'Pantry Staples',
    unit: 'jar',
    barcode: '8901262020083',
    defaultPurchaseCost: 310.00,
    defaultSellingPrice: 350.00,
    minimumStockLevel: 12,
    status: 'active',
    shelfLifeDays: 270,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0)
  }
];

export const initialBatches: InventoryBatch[] = [
  // Product 1: Milk Batch 1 (Near cutoff, surplus at risk)
  {
    id: 'batch_m101',
    productId: 'prod_milk_amul',
    batchId: 'B-AMUL-M101',
    quantityReceived: 40,
    quantityRemaining: 20,
    receivedDate: getRelativeDate(-3),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(3),
    labelType: 'use_by',
    operationalCutoffDate: getRelativeDate(2), // 2 days remaining!
    purchaseCostPerUnit: 56.00,
    sellingPricePerUnit: 68.00,
    storageLocation: 'Dairy Chiller - Shelf 1 (Front)',
    supplierId: 'supp_amul',
    status: 'active',
    notes: 'First delivery of week. Needs priority sale before fresher M102 batch.',
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(0)
  },
  // Product 1: Milk Batch 2 (Fresh batch)
  {
    id: 'batch_m102',
    productId: 'prod_milk_amul',
    batchId: 'B-AMUL-M102',
    quantityReceived: 35,
    quantityRemaining: 32,
    receivedDate: getRelativeDate(0),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(9),
    labelType: 'use_by',
    operationalCutoffDate: getRelativeDate(8), // 8 days remaining
    purchaseCostPerUnit: 56.00,
    sellingPricePerUnit: 68.00,
    storageLocation: 'Dairy Chiller - Shelf 2 (Back)',
    supplierId: 'supp_amul',
    status: 'active',
    notes: 'Received this morning. Keep behind M101 in accordance with FEFO.',
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0)
  },

  // Product 2: Mother Dairy Dahi (Urgent cutoff tomorrow)
  {
    id: 'batch_d204',
    productId: 'prod_dahi_mother',
    batchId: 'B-MD-D204',
    quantityReceived: 25,
    quantityRemaining: 15,
    receivedDate: getRelativeDate(-4),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(2),
    labelType: 'use_by',
    operationalCutoffDate: getRelativeDate(1), // 1 day remaining!
    purchaseCostPerUnit: 38.00,
    sellingPricePerUnit: 50.00,
    storageLocation: 'Refrigerated Display Case A',
    supplierId: 'supp_mother_dairy',
    status: 'active',
    notes: 'Cutoff tomorrow. Review exchange agreement or markdown.',
    createdAt: getRelativeDate(-4),
    updatedAt: getRelativeDate(0)
  },

  // Product 3: Britannia Bread (Daily high turnover, 2 days cutoff)
  {
    id: 'batch_b301',
    productId: 'prod_bread_britannia',
    batchId: 'B-BRIT-B301',
    quantityReceived: 30,
    quantityRemaining: 16,
    receivedDate: getRelativeDate(-2),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(3),
    labelType: 'best_before',
    operationalCutoffDate: getRelativeDate(2),
    purchaseCostPerUnit: 40.00,
    sellingPricePerUnit: 55.00,
    storageLocation: 'Bakery Rack Eye-Level',
    supplierId: 'supp_britannia',
    status: 'active',
    notes: 'Supplier allows exchange if notified 24h prior.',
    createdAt: getRelativeDate(-2),
    updatedAt: getRelativeDate(0)
  },

  // Product 4: Heritage Paneer (Slow sales rate, risk of excess stock)
  {
    id: 'batch_p401',
    productId: 'prod_paneer_heritage',
    batchId: 'B-HER-P401',
    quantityReceived: 18,
    quantityRemaining: 13,
    receivedDate: getRelativeDate(-3),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(4),
    labelType: 'use_by',
    operationalCutoffDate: getRelativeDate(3), // 3 days remaining
    purchaseCostPerUnit: 88.00,
    sellingPricePerUnit: 115.00,
    storageLocation: 'Dairy Chiller - Shelf 3',
    supplierId: 'supp_heritage',
    status: 'active',
    notes: 'High unit cost item. Daily demand is ~2 packs. Risk of 7-8 packs remaining.',
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(0)
  },

  // Product 5: Local Organic Paneer (UNKNOWN DATE - Must be flagged for human review)
  {
    id: 'batch_unk001',
    productId: 'prod_paneer_local',
    batchId: 'B-LOC-UNK01',
    quantityReceived: 8,
    quantityRemaining: 8,
    receivedDate: getRelativeDate(-1),
    isReceivedDateEstimated: false,
    labelDate: undefined, // Smudged label!
    labelType: 'unknown',
    operationalCutoffDate: undefined,
    purchaseCostPerUnit: 75.00,
    sellingPricePerUnit: 100.00,
    storageLocation: 'Organic Counter Chiller',
    status: 'flagged_for_review',
    notes: 'Printed label smudged during transit. Safety status unverified. Flagged for shopkeeper inspection.',
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(0)
  },

  // Product 6: Alphonso Mangoes (Manual estimate, seasonal produce)
  {
    id: 'batch_mgo501',
    productId: 'prod_mango_alphonso',
    batchId: 'B-MGO-501',
    quantityReceived: 12,
    quantityRemaining: 9,
    receivedDate: getRelativeDate(-1),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(5),
    labelType: 'best_before',
    operationalCutoffDate: getRelativeDate(4),
    purchaseCostPerUnit: 450.00,
    sellingPricePerUnit: 650.00,
    storageLocation: 'Front Produce Fruit Table',
    status: 'active',
    notes: 'Freshly arrived from Ratnagiri. Owner manual estimate: 2 boxes/day.',
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(0)
  },

  // Product 7: Epigamia Yogurt (Markdown review candidate with margin cushion)
  {
    id: 'batch_gy601',
    productId: 'prod_yogurt_epigamia',
    batchId: 'B-EPI-GY601',
    quantityReceived: 24,
    quantityRemaining: 16,
    receivedDate: getRelativeDate(-7),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(4),
    labelType: 'best_before',
    operationalCutoffDate: getRelativeDate(3),
    purchaseCostPerUnit: 45.00,
    sellingPricePerUnit: 65.00,
    storageLocation: 'Specialty Dairy Rack 1',
    supplierId: 'supp_epigamia',
    status: 'active',
    notes: 'Good candidate for 15% markdown (₹55) to accelerate sell-through before cutoff.',
    createdAt: getRelativeDate(-7),
    updatedAt: getRelativeDate(0)
  },

  // Product 8: Country Eggs (Margin floor test case)
  {
    id: 'batch_eg701',
    productId: 'prod_eggs_country',
    batchId: 'B-EGG-701',
    quantityReceived: 20,
    quantityRemaining: 14,
    receivedDate: getRelativeDate(-5),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(4),
    labelType: 'best_before',
    operationalCutoffDate: getRelativeDate(3),
    purchaseCostPerUnit: 62.00,
    sellingPricePerUnit: 70.00,
    storageLocation: 'Poultry Shelf Top',
    status: 'active',
    notes: 'Narrow margin item (cost ₹62, retail ₹70). Cannot be discounted below ₹72.94 to maintain 15% margin.',
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(0)
  },

  // Product 9: Nandini Ghee (Long shelf life, 0 risk)
  {
    id: 'batch_ghee801',
    productId: 'prod_ghee_nandini',
    batchId: 'B-GHEE-801',
    quantityReceived: 24,
    quantityRemaining: 21,
    receivedDate: getRelativeDate(-15),
    isReceivedDateEstimated: false,
    labelDate: getRelativeDate(255),
    labelType: 'best_before',
    operationalCutoffDate: getRelativeDate(250),
    purchaseCostPerUnit: 310.00,
    sellingPricePerUnit: 350.00,
    storageLocation: 'Ghee & Oils Aisle 2',
    status: 'active',
    notes: 'Standard stable shelf stock.',
    createdAt: getRelativeDate(-15),
    updatedAt: getRelativeDate(0)
  }
];

// Generate 14 days of realistic sales history for active products
export function generateSeedSales(): SalesRecord[] {
  const records: SalesRecord[] = [];
  let recordId = 1;

  // Daily expected sales ranges for products:
  // Amul Milk: ~4-6 units/day
  // Mother Dairy Dahi: ~3-5 units/day
  // Britannia Bread: ~8-12 units/day
  // Heritage Paneer: ~1-3 units/day
  // Epigamia Yogurt: ~2-3 units/day
  // Country Eggs: ~2-4 units/day
  // Nandini Ghee: ~0-1 units/day (occasional)

  const productDailySalesConfig: Record<string, { min: number; max: number; price: number; batchId?: string }> = {
    prod_milk_amul: { min: 4, max: 6, price: 68.00, batchId: 'batch_m101' },
    prod_dahi_mother: { min: 3, max: 5, price: 50.00, batchId: 'batch_d204' },
    prod_bread_britannia: { min: 8, max: 12, price: 55.00, batchId: 'batch_b301' },
    prod_paneer_heritage: { min: 1, max: 3, price: 115.00, batchId: 'batch_p401' },
    prod_yogurt_epigamia: { min: 2, max: 3, price: 65.00, batchId: 'batch_gy601' },
    prod_eggs_country: { min: 2, max: 4, price: 70.00, batchId: 'batch_eg701' },
    prod_ghee_nandini: { min: 0, max: 1, price: 350.00, batchId: 'batch_ghee801' }
  };

  // Seed sales over the last 14 days (days -14 to -1)
  for (let dayOffset = -14; dayOffset <= -1; dayOffset++) {
    const saleDate = getRelativeDate(dayOffset);
    // Determine weekday multiplier (e.g. Sat & Sun have slightly higher sales)
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + dayOffset);
    const dayOfWeek = dateObj.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;

    for (const [prodId, config] of Object.entries(productDailySalesConfig)) {
      // Deterministic pseudo-random generation based on dayOffset and product string
      const seedVal = Math.abs((dayOffset * 17) + prodId.charCodeAt(5) * 31);
      const baseUnits = config.min + (seedVal % (config.max - config.min + 1));
      const units = Math.max(1, Math.round(baseUnits * weekendMultiplier));

      if (units > 0) {
        records.push({
          id: `sale_${recordId++}`,
          productId: prodId,
          batchId: config.batchId,
          quantitySold: units,
          unitSellingPrice: config.price,
          saleDate: saleDate,
          transactionId: `TXN-POS-${saleDate.replace(/-/g, '')}-${recordId}`,
          createdAt: saleDate
        });
      }
    }
  }

  return records;
}

// Recorded waste history (real historical data)
export const initialWasteRecords: WasteRecord[] = [
  {
    id: 'waste_001',
    productId: 'prod_milk_amul',
    batchId: 'B-AMUL-M098',
    quantityWasted: 4,
    unitCost: 56.00,
    totalCost: 224.00,
    reason: 'expired_cutoff',
    recordedDate: getRelativeDate(-7),
    notes: 'Past cutoff sell-through limit. Removed from shelf and disposed.',
    createdAt: getRelativeDate(-7)
  },
  {
    id: 'waste_002',
    productId: 'prod_bread_britannia',
    batchId: 'B-BRIT-B288',
    quantityWasted: 2,
    unitCost: 40.00,
    totalCost: 80.00,
    reason: 'damaged',
    recordedDate: getRelativeDate(-11),
    notes: 'Packet crushed during customer shelf handling.',
    createdAt: getRelativeDate(-11)
  },
  {
    id: 'waste_003',
    productId: 'prod_paneer_heritage',
    batchId: 'B-HER-P390',
    quantityWasted: 3,
    unitCost: 88.00,
    totalCost: 264.00,
    reason: 'expired_cutoff',
    recordedDate: getRelativeDate(-14),
    notes: 'Slow weekday sales led to unsold packs past operational cutoff.',
    createdAt: getRelativeDate(-14)
  }
];

// Initial audit action logs
export const initialActionLogs: ActionLog[] = [
  {
    id: 'act_001',
    actionType: 'batch_created',
    productId: 'prod_milk_amul',
    batchId: 'batch_m102',
    newValue: { quantity: 35, cutoff: getRelativeDate(8) },
    reason: 'Stock received from daily morning dairy delivery',
    userConfirmed: true,
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 'act_002',
    actionType: 'stock_adjusted',
    productId: 'prod_paneer_local',
    batchId: 'batch_unk001',
    reason: 'Flagged for human inspection due to illegible label date',
    userConfirmed: true,
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  }
];
