import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  ShieldCheck,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, InventoryBatch, BatchRiskCalculation } from '../types';
import { api } from '../api/client';
import { ConnoisseurStackInteractor, MenuItem } from '../components/ui/connoisseur-stack-interactor';

interface InventoryPageProps {
  products: Product[];
  batches: BatchRiskCalculation[];
  onRefresh: () => void;
  onSelectBatch: (batch: BatchRiskCalculation) => void;
  onOpenCsvImport: () => void;
  currencySymbol?: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  batches,
  onRefresh,
  onSelectBatch,
  onOpenCsvImport,
  currencySymbol = '₹'
}) => {
  const [activeView, setActiveView] = useState<'batches' | 'products'>('batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Add Product Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    category: 'Dairy & Milk',
    unit: 'carton',
    defaultPurchaseCost: '',
    defaultSellingPrice: '',
    minimumStockLevel: '10'
  });

  // Add Batch Modal State
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    productId: '',
    batchId: '',
    quantityReceived: '',
    purchaseCostPerUnit: '',
    labelDate: '',
    labelType: 'use_by',
    storageLocation: 'Dairy Chiller'
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategory === 'all' ||
      b.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(b.category.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'urgent' && b.priority === 'urgent') ||
      (selectedStatus === 'warning' && b.priority === 'warning') ||
      (selectedStatus === 'at_risk' && b.estimatedAtRiskUnits > 0);

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(p.category.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: prodForm.name,
        sku: prodForm.sku,
        category: prodForm.category,
        unit: prodForm.unit,
        defaultPurchaseCost: parseFloat(prodForm.defaultPurchaseCost) || 0,
        defaultSellingPrice: parseFloat(prodForm.defaultSellingPrice) || 0,
        minimumStockLevel: parseInt(prodForm.minimumStockLevel, 10) || 5
      });
      setShowAddProduct(false);
      setProdForm({
        name: '',
        sku: '',
        category: 'Dairy & Milk',
        unit: 'carton',
        defaultPurchaseCost: '',
        defaultSellingPrice: '',
        minimumStockLevel: '10'
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetProdId = batchForm.productId || products[0]?.id;
      const targetProd = products.find((p) => p.id === targetProdId);
      const parsedCost = parseFloat(batchForm.purchaseCostPerUnit);
      const finalCost = !isNaN(parsedCost) && parsedCost >= 0
        ? parsedCost
        : (targetProd ? targetProd.defaultPurchaseCost : 0);

      await api.createBatch({
        productId: targetProdId,
        batchId: batchForm.batchId.trim(),
        quantityReceived: parseInt(batchForm.quantityReceived, 10),
        purchaseCostPerUnit: finalCost,
        labelDate: batchForm.labelDate || undefined,
        labelType: batchForm.labelType,
        storageLocation: batchForm.storageLocation
      });
      setShowAddBatch(false);
      setBatchForm({
        productId: '',
        batchId: '',
        quantityReceived: '',
        purchaseCostPerUnit: '',
        labelDate: '',
        labelType: 'use_by',
        storageLocation: 'Dairy Chiller'
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create batch');
    }
  };

  const inventoryCategoryItems: MenuItem[] = [
    {
      num: "01",
      name: "Dairy Chiller",
      clipId: "clip-original",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
    },
    {
      num: "02",
      name: "Fresh Produce",
      clipId: "clip-hexagons",
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
    },
    {
      num: "03",
      name: "Artisan Bakery",
      clipId: "clip-pixels",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with Google Pop Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
            <h2 className="text-xl md:text-2xl font-black text-[#14231E] tracking-tight">
              Batch-Level Inventory Management
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#3D765E] mt-1">
            Maintain distinct batches, monitor separate cutoffs, track actual costs, and avoid mixed-stock ambiguity.
          </p>
        </div>

        {/* Buttons with Glowing Button Animation and Google Pop Physics */}
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 17 }}
            onClick={() => {
              const defaultProd = products[0];
              setBatchForm({
                productId: defaultProd?.id || '',
                batchId: '',
                quantityReceived: '',
                purchaseCostPerUnit: defaultProd ? String(defaultProd.defaultPurchaseCost) : '',
                labelDate: '',
                labelType: 'use_by',
                storageLocation: 'Dairy Chiller'
              });
              setShowAddBatch(true);
            }}
            className="glowing-btn-animation inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#0D2E24] via-[#164E3D] to-[#10B981] hover:from-[#164E3D] hover:to-[#059669] rounded-xl shadow-lg border border-[#10B981]/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Add Batch</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
            onClick={() => setShowAddProduct(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0D2E24] bg-white hover:bg-[#EAEFEA] border border-[#CBD8D1] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#10B981]" />
            <span>New Product</span>
          </motion.button>
        </div>
      </div>

      {/* GSAP Connoisseur Stack SVG Vector Interactor */}
      <ConnoisseurStackInteractor
        items={inventoryCategoryItems}
        onSelectCategory={(catName) => {
          if (catName.includes("Dairy")) setSelectedCategory("Dairy & Milk");
          else if (catName.includes("Produce")) setSelectedCategory("Produce");
          else if (catName.includes("Bakery")) setSelectedCategory("Bakery");
        }}
      />

      {/* View Switcher and Search/Filters Bar with Google Button Animations */}
      <div className="bg-white border border-[#D9E4DD] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs with Google Pop Animation */}
          <div className="flex items-center gap-1 bg-[#F4F7F4] p-1 rounded-xl border border-[#D9E4DD] self-start">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              onClick={() => setActiveView('batches')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'batches'
                  ? 'bg-white text-[#0D2E24] shadow-xs border border-[#D9E4DD]'
                  : 'text-[#5A7E70] hover:text-[#14231E]'
              }`}
            >
              Inventory Batches ({batches.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              onClick={() => setActiveView('products')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'products'
                  ? 'bg-white text-[#0D2E24] shadow-xs border border-[#D9E4DD]'
                  : 'text-[#5A7E70] hover:text-[#14231E]'
              }`}
            >
              Master Catalog ({products.length})
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              onClick={onOpenCsvImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0D2E24] bg-[#F4F7F4] hover:bg-[#EAEFEA] border border-[#CBD8D1] rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Import CSV</span>
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              href={api.getCsvTemplateUrl()}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#3D765E] hover:text-[#0D2E24] bg-white border border-[#D9E4DD] rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Template</span>
            </motion.a>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#EAEFEA]">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#5A7E70] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or batch ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-white text-[#14231E]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {activeView === 'batches' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-white text-[#14231E]"
              >
                <option value="all">All Risk Statuses</option>
                <option value="urgent">Urgent Only (≤ 2d)</option>
                <option value="warning">Warning Only (≤ 5d)</option>
                <option value="at_risk">Estimated At-Risk &gt; 0</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Batches Table View with Pop Animation Stickers */}
      {activeView === 'batches' && (
        <div className="bg-white border border-[#D9E4DD] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#D9E4DD] text-[11px] font-bold uppercase tracking-wider text-[#5A7E70]">
                  <th className="py-3.5 px-4">Batch ID</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Unit Cost</th>
                  <th className="py-3.5 px-4">Retail Price</th>
                  <th className="py-3.5 px-4">Label Date</th>
                  <th className="py-3.5 px-4">Sell Cutoff</th>
                  <th className="py-3.5 px-4">Days Left</th>
                  <th className="py-3.5 px-4">Est. At-Risk</th>
                  <th className="py-3.5 px-4">Storage Location</th>
                  <th className="py-3.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {filteredBatches.map((b) => (
                  <motion.tr
                    key={b.batchId}
                    onClick={() => onSelectBatch(b)}
                    whileHover={{ scale: 1.006, backgroundColor: '#F8FAF8' }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      {/* Pop Animation on Sticker Name */}
                      <motion.span
                        whileHover={{ scale: 1.12, rotate: -2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="inline-block font-mono font-bold text-[#0D2E24] bg-[#EAEFEA] px-2.5 py-0.5 rounded-lg border border-[#D9E4DD] shadow-2xs group-hover:border-[#10B981]/50 group-hover:bg-emerald-50 transition-colors"
                      >
                        {b.batchCode}
                      </motion.span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#14231E]">
                      <div className="font-bold text-[#14231E] group-hover:text-[#0D2E24] transition-colors">{b.productName}</div>
                      <div className="text-[10px] text-[#5A7E70] flex items-center gap-1 mt-0.5">
                        <Tag className="w-2.5 h-2.5 text-[#10B981]" />
                        <span>{b.category}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#14231E]">
                      {b.quantityRemaining} <span className="font-normal text-xs text-[#5A7E70]">{b.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#5A7E70]">
                      {currencySymbol}{b.purchaseCostPerUnit}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-[#14231E]">
                      {currencySymbol}{b.sellingPricePerUnit}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#5A7E70]">
                      {b.labelDate || 'Damaged/Missing'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-[#3D765E]">
                      {b.operationalCutoffDate || 'Unverified'}
                    </td>

                    <td className="py-3.5 px-4">
                      {b.daysRemaining !== null ? (
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 450, damping: 15 }}
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md ${
                            b.daysRemaining <= 2
                              ? 'text-[#E11D48] bg-rose-50 border border-rose-200'
                              : b.daysRemaining <= 5
                              ? 'text-[#F59E0B] bg-amber-50 border border-amber-200'
                              : 'text-[#14231E] bg-[#F4F7F4]'
                          }`}
                        >
                          {b.daysRemaining === 0
                            ? 'Today'
                            : b.daysRemaining < 0
                            ? 'Past cutoff'
                            : `${b.daysRemaining}d`}
                        </motion.span>
                      ) : (
                        <span className="text-purple-700 font-bold text-[11px] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          Review
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {b.estimatedAtRiskUnits > 0 ? (
                        <motion.span
                          whileHover={{ scale: 1.12 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          className="inline-block font-bold text-[#E11D48] bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200 shadow-2xs"
                        >
                          {b.estimatedAtRiskUnits} {b.unit}
                        </motion.span>
                      ) : (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          0
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#5A7E70] truncate max-w-[130px]">
                      {b.storageLocation || 'Main Shelf'}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <motion.div
                        whileHover={{ scale: 1.15, x: 2 }}
                        className="w-7 h-7 rounded-lg bg-[#F4F7F4] group-hover:bg-[#0D2E24] group-hover:text-white text-[#0D2E24] flex items-center justify-center ml-auto transition-colors shadow-2xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Master Catalog Products View with Pop Stickers */}
      {activeView === 'products' && (
        <div className="bg-white border border-[#D9E4DD] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#D9E4DD] text-[11px] font-bold uppercase tracking-wider text-[#5A7E70]">
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Default Cost</th>
                  <th className="py-3.5 px-4">Default Price</th>
                  <th className="py-3.5 px-4">Min. Stock</th>
                  <th className="py-3.5 px-4">Active Batches</th>
                  <th className="py-3.5 px-4">Total Stock</th>
                  <th className="py-3.5 px-4">Expected Shelf Life</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {filteredProducts.map((p) => {
                  const productBatches = batches.filter((b) => b.productId === p.id);
                  const totalStock = productBatches.reduce((acc, b) => acc + b.quantityRemaining, 0);

                  return (
                    <motion.tr
                      key={p.id}
                      whileHover={{ scale: 1.005, backgroundColor: '#F8FAF8' }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className="transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <motion.span
                          whileHover={{ scale: 1.1, rotate: -2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          className="inline-block font-mono font-bold text-[#0D2E24] bg-[#F4F7F4] px-2.5 py-0.5 rounded-lg border border-[#D9E4DD]"
                        >
                          {p.sku}
                        </motion.span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#14231E]">{p.name}</td>
                      <td className="py-3.5 px-4 text-[#3D765E] font-medium">{p.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[#5A7E70]">
                        {currencySymbol}{p.defaultPurchaseCost}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#14231E]">
                        {currencySymbol}{p.defaultSellingPrice}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A7E70]">
                        {p.minimumStockLevel} {p.unit}s
                      </td>
                      <td className="py-3.5 px-4">
                        <motion.span
                          whileHover={{ scale: 1.08 }}
                          className="inline-block font-bold text-[#0D2E24] bg-[#EAEFEA] px-2.5 py-0.5 rounded-md border border-[#D9E4DD]"
                        >
                          {productBatches.length} batch(es)
                        </motion.span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            totalStock <= p.minimumStockLevel
                              ? 'text-[#E11D48] bg-rose-50 border border-rose-200'
                              : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {totalStock} {p.unit}s
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#5A7E70] font-mono">
                        {p.shelfLifeDays ? `${p.shelfLifeDays} days` : 'Variable'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal with Google Pop Animation */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D9E4DD] p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E4DD]">
                <h3 className="text-base font-bold text-[#14231E] flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10B981]">
                    <Plus className="w-4 h-4" />
                  </div>
                  Add Master Catalog Product
                </h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="w-7 h-7 rounded-full bg-[#F4F7F4] hover:bg-[#EAEFEA] flex items-center justify-center text-[#14231E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#14231E] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amul Taaza Toned Milk (1L)"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DAI-MILK-001"
                      value={prodForm.sku}
                      onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="Dairy & Milk"
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="carton / packet"
                      value={prodForm.unit}
                      onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Cost ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="54.00"
                      value={prodForm.defaultPurchaseCost}
                      onChange={(e) => setProdForm({ ...prodForm, defaultPurchaseCost: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Price ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="66.00"
                      value={prodForm.defaultSellingPrice}
                      onChange={(e) => setProdForm({ ...prodForm, defaultSellingPrice: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#14231E] mb-1">Safety Stock Threshold</label>
                  <input
                    type="number"
                    value={prodForm.minimumStockLevel}
                    onChange={(e) => setProdForm({ ...prodForm, minimumStockLevel: e.target.value })}
                    className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                  />
                </div>

                <div className="pt-3 border-t border-[#D9E4DD] flex justify-end gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-3.5 py-2 rounded-xl border border-[#CBD8D1] text-[#14231E] hover:bg-[#F4F7F4] cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0D2E24] to-[#164E3D] hover:to-[#10B981] text-white font-bold shadow-md cursor-pointer"
                  >
                    Create Product
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Batch Modal with Google Pop Animation */}
      <AnimatePresence>
        {showAddBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D9E4DD] p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D9E4DD]">
                <h3 className="text-base font-bold text-[#14231E] flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10B981]">
                    <Layers className="w-4 h-4" />
                  </div>
                  Receive New Specific Batch
                </h3>
                <button
                  onClick={() => setShowAddBatch(false)}
                  className="w-7 h-7 rounded-full bg-[#F4F7F4] hover:bg-[#EAEFEA] flex items-center justify-center text-[#14231E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#14231E] mb-1">Select Catalog Product *</label>
                  <select
                    value={batchForm.productId}
                    onChange={(e) => {
                      const chosen = products.find((p) => p.id === e.target.value);
                      setBatchForm({
                        ...batchForm,
                        productId: e.target.value,
                        purchaseCostPerUnit: chosen ? String(chosen.defaultPurchaseCost) : ''
                      });
                    }}
                    className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-white font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Batch Code / Lot *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-OCT-28A"
                      value={batchForm.batchId}
                      onChange={(e) => setBatchForm({ ...batchForm, batchId: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Quantity Received *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 25"
                      value={batchForm.quantityReceived}
                      onChange={(e) => setBatchForm({ ...batchForm, quantityReceived: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Unit Purchase Cost ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Default catalog cost"
                      value={batchForm.purchaseCostPerUnit}
                      onChange={(e) => setBatchForm({ ...batchForm, purchaseCostPerUnit: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Date Format Label Type</label>
                    <select
                      value={batchForm.labelType}
                      onChange={(e) => setBatchForm({ ...batchForm, labelType: e.target.value as any })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-white font-medium"
                    >
                      <option value="use_by">Use By (Strict Expiry)</option>
                      <option value="best_before">Best Before</option>
                      <option value="expiry_date">Expiry Date</option>
                      <option value="unknown">Unknown / Needs Inspection</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Printed Label Date</label>
                    <input
                      type="date"
                      value={batchForm.labelDate}
                      onChange={(e) => setBatchForm({ ...batchForm, labelDate: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                    <span className="text-[10px] text-[#5A7E70] mt-0.5 block">
                      Operational cutoff calculated automatically via policy offset.
                    </span>
                  </div>
                  <div>
                    <label className="block font-bold text-[#14231E] mb-1">Storage Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Dairy Chiller A3"
                      value={batchForm.storageLocation}
                      onChange={(e) => setBatchForm({ ...batchForm, storageLocation: e.target.value })}
                      className="w-full p-2.5 border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#0D2E24] bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D9E4DD] flex justify-end gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setShowAddBatch(false)}
                    className="px-3.5 py-2 rounded-xl border border-[#CBD8D1] text-[#14231E] hover:bg-[#F4F7F4] cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0D2E24] to-[#164E3D] hover:to-[#10B981] text-white font-bold shadow-md cursor-pointer"
                  >
                    Record Batch
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
