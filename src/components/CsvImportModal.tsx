import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
  Table,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

interface CsvImportModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleValidate = async () => {
    if (!csvText.trim()) {
      setErrorMessage('Please paste or upload CSV text first.');
      return;
    }

    setIsValidating(true);
    setErrorMessage('');
    try {
      const res = await api.importCsv(csvText);
      setParsedData(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'CSV validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setErrorMessage('');
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    if (!parsedData || !parsedData.preview) return;

    const validRows = parsedData.preview.filter((r: any) => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('There are no valid rows to import.');
      return;
    }

    setIsCommitting(true);
    setErrorMessage('');
    try {
      const res = await api.commitCsvImport(validRows);
      onSuccess(res.count);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to commit CSV records.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleLoadSampleData = () => {
    const sample = `product_name,sku,category,unit,batch_id,quantity,purchase_cost,selling_price,received_date,label_date,label_type,cutoff_date,location
Nandini Full Cream Milk 500ml,DAI-MILK-010,Dairy,packet,B-NAN-M501,30,26.00,32.00,2026-10-16,2026-10-21,use_by,2026-10-20,Chiller Shelf 1
Modern Multigrain Bread,BAK-BREAD-011,Bakery,packet,B-MOD-B101,20,35.00,48.00,2026-10-17,2026-10-22,best_before,2026-10-21,Bread Rack Front
Milky Mist Greek Yogurt Blueberry,DAI-YOGURT-012,Dairy,cup,B-MM-GY02,15,42.00,60.00,2026-10-14,2026-10-26,best_before,2026-10-25,Specialty Cooler`;
    setCsvText(sample);
    setParsedData(null);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#CBD8D1] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#E2E8E2] flex items-center justify-between bg-[#FAFBF9] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0F4F1] border border-[#CBD8D1] flex items-center justify-center text-[#163D32]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18231F]">
                Import Inventory Batches (CSV)
              </h3>
              <p className="text-xs text-[#6B8579]">
                Preview, validate fields, check duplicates, and commit verified records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B8579] hover:text-[#18231F] hover:bg-[#E2E8E2] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C65353] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F8F4] p-3 rounded-xl border border-[#E2E8E2]">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#163D32] bg-white hover:bg-[#F0F4F1] border border-[#CBD8D1] rounded-lg shadow-xs transition-colors">
                <FileText className="w-3.5 h-3.5 text-[#4E8068]" />
                <span>Choose File (.csv)</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSampleData}
                className="px-3 py-1.5 text-xs font-medium text-[#4E8068] hover:text-[#163D32] hover:underline"
              >
                Load Sample Perishables Data
              </button>
            </div>

            <a
              href={api.getCsvTemplateUrl()}
              download="shelfsense_inventory_template.csv"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#163D32] hover:underline"
            >
              <Download className="w-3.5 h-3.5 text-[#4E8068]" />
              <span>Download CSV Template</span>
            </a>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-semibold text-[#18231F] mb-1.5">
              Paste or Edit CSV Contents:
            </label>
            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setParsedData(null);
              }}
              placeholder={`product_name,sku,category,unit,batch_id,quantity,purchase_cost,selling_price,received_date,label_date,label_type,cutoff_date,location\nAmul Taaza Milk 1L,DAI-MILK-001,Dairy,carton,B-AMUL-IMP01,25,56.00,68.00,2026-10-15,2026-10-22,use_by,2026-10-21,Chiller Shelf 1`}
              rows={6}
              className="w-full p-3 font-mono text-xs border border-[#CBD8D1] rounded-xl focus:outline-hidden focus:border-[#163D32] bg-[#FAFBF9]"
            />
          </div>

          {/* Validation Trigger Button */}
          {!parsedData && (
            <div className="flex justify-end">
              <button
                onClick={handleValidate}
                disabled={isValidating || !csvText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D99A37]" />
                    <span>Validate &amp; Preview Rows</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview & Validation Results Table */}
          {parsedData && (
            <div className="space-y-4 pt-2 border-t border-[#E2E8E2]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#18231F]">
                    Total Rows: <strong>{parsedData.totalRows}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {parsedData.validRowsCount} Valid
                  </span>
                  {parsedData.invalidRowsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#C65353] font-semibold border border-red-200">
                      {parsedData.invalidRowsCount} Errors
                    </span>
                  )}
                </div>

                <button
                  onClick={handleValidate}
                  className="text-xs text-[#4E8068] hover:underline"
                >
                  Re-validate
                </button>
              </div>

              {parsedData.validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-[#C65353] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Row Validation Failures:
                  </div>
                  <ul className="pl-4 list-disc text-[#A84444] space-y-0.5 max-h-24 overflow-y-auto">
                    {parsedData.validationErrors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Rows Table */}
              <div className="max-h-60 overflow-y-auto border border-[#E2E8E2] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F7F8F4] text-[10px] uppercase font-semibold text-[#6B8579] sticky top-0">
                    <tr>
                      <th className="p-2 border-b">Row</th>
                      <th className="p-2 border-b">Product</th>
                      <th className="p-2 border-b">SKU</th>
                      <th className="p-2 border-b">Batch ID</th>
                      <th className="p-2 border-b">Qty</th>
                      <th className="p-2 border-b">Cost</th>
                      <th className="p-2 border-b">Cutoff</th>
                      <th className="p-2 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]">
                    {parsedData.preview.map((r: any, idx: number) => (
                      <tr
                        key={idx}
                        className={r.isValid ? 'hover:bg-[#FAFBF9]' : 'bg-red-50/40 text-red-900'}
                      >
                        <td className="p-2 font-mono text-[#6B8579]">{r.rowNumber}</td>
                        <td className="p-2 font-medium">{r.productName || '—'}</td>
                        <td className="p-2 font-mono">{r.sku || '—'}</td>
                        <td className="p-2 font-mono font-semibold">{r.batchId || '—'}</td>
                        <td className="p-2">{r.quantity} {r.unit}</td>
                        <td className="p-2 font-mono">₹{r.purchaseCost}</td>
                        <td className="p-2 font-mono">{r.operationalCutoffDate || r.labelDate || 'Auto'}</td>
                        <td className="p-2">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          ) : (
                            <span className="text-[#C65353] font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 md:p-6 border-t border-[#E2E8E2] bg-[#FAFBF9] rounded-b-2xl flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#6B8579] hover:bg-[#E2E8E2] rounded-lg transition-colors"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              onClick={handleCommit}
              disabled={isCommitting || parsedData.validRowsCount === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#163D32] hover:bg-[#205244] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing Batches...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D99A37]" />
                  <span>Confirm Import ({parsedData.validRowsCount} Batches)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
