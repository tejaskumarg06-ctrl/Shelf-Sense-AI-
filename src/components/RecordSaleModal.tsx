import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product, InventoryBatch } from '../types';
import { api } from '../api/client';

interface RecordSaleModalProps {
  products: Product[];
  batches: InventoryBatch[];
  preselectedBatchId?: string;
  preselectedProductId?: string;
  onClose: () => void;
  onSuccess: () => void;
  currencySymbol?: string;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  products,
  batches,
  preselectedBatchId,
  preselectedProductId,
  onClose,
  onSuccess,
  currencySymbol = '₹'
}) => {
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || (products[0]?.id || ''));
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || '');
  const [quantity, setQuantity] = useState('1');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // When product changes, update price and batch options
  useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setSellingPrice(String(prod.defaultSellingPrice));
    }
  }, [selectedProductId, products]);

  const getDbId = (b: any): string => (b ? (b.batchId || b.id || '') : '');
  const getDisplayCode = (b: any): string => (b ? (b.batchCode || b.batchId || '') : '');

  const productBatches = batches.filter(
    (b: any) => b.productId === selectedProductId && b.status !== 'depleted' && b.quantityRemaining > 0
  );

  const selectedBatch = batches.find((b: any) => {
    const dbId = b.batchId || b.id;
    const code = b.batchCode || b.batchId;
    return dbId === selectedBatchId || code === selectedBatchId;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    const price = parseFloat(sellingPrice);

    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Please enter a valid positive quantity.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setErrorMessage('Please enter a valid selling price.');
      return;
    }

    if (selectedBatchId) {
      if (selectedBatch && qty > selectedBatch.quantityRemaining) {
        setErrorMessage(`Cannot sell ${qty} units: batch only has ${selectedBatch.quantityRemaining} units remaining.`);
        return;
      }
    }

    const resolvedBatchDbId = selectedBatch ? getDbId(selectedBatch) : (selectedBatchId || undefined);

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await api.recordSale({
        productId: selectedProductId,
        batchId: resolvedBatchDbId,
        quantitySold: qty,
        unitSellingPrice: price,
        notes: notes.trim() || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#CBD8D1] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#E2E8E2] flex items-center justify-between bg-[#FAFBF9] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#163D32] flex items-center justify-center text-[#D99A37]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#18231F]">Record Units Sold</h3>
              <p className="text-xs text-[#6B8579]">Deducts stock and updates sales history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#6B8579] hover:text-[#18231F] rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C65353] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#18231F] mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedBatchId('');
              }}
              className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32] bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18231F] mb-1">
              Select Batch (Optional — auto-deducts from batch if chosen)
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32] bg-white"
            >
              <option value="">General sale (Product level)</option>
              {productBatches.map((b) => (
                <option key={getDbId(b)} value={getDbId(b)}>
                  Batch {getDisplayCode(b)} — {b.quantityRemaining} remaining (Cutoff: {b.operationalCutoffDate || 'None'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18231F] mb-1">
                Quantity Sold ({selectedProduct?.unit || 'unit'})
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#18231F] mb-1">
                Unit Selling Price ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18231F] mb-1">Sale Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Counter POS checkout"
              className="w-full p-2.5 text-xs border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2E8E2] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#6B8579] hover:bg-[#F0F4F1] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D99A37]" />
              <span>Record Sale</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
