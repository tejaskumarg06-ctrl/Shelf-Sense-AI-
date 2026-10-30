import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store as StoreIcon,
  ShieldCheck,
  Cpu,
  RotateCcw,
  History,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { Store, StorePolicy, ActionLog } from '../types';
import { api } from '../api/client';
import { RippleButton } from '@/components/ui/ripple-button';
import { ConfirmModal, Toast, ToastContainer } from '@/components/ui/modal';

interface SettingsPageProps {
  store: Store;
  policy: StorePolicy;
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  store: initialStore,
  policy: initialPolicy,
  onRefreshAll
}) => {
  const [storeForm, setStoreForm] = useState<Store>(initialStore);
  const [policyForm, setPolicyForm] = useState<StorePolicy>(initialPolicy);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<ActionLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    setStoreForm(initialStore);
    setPolicyForm(initialPolicy);
  }, [initialStore, initialPolicy]);

  useEffect(() => {
    api.getAiStatus().then(setAiStatus).catch(console.error);
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        store: storeForm,
        policy: policyForm
      });
      setSaveSuccess(true);
      showToast('Settings and store policies updated successfully. Risk engine recalculated.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings.');
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    setShowResetConfirm(true);
  };

  const confirmResetDemo = async () => {
    setIsResettingDemo(true);
    setShowResetConfirm(false);
    try {
      await api.resetDemoData();
      onRefreshAll();
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
      showToast('Demo dataset has been reset successfully with fresh relative dates.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setIsResettingDemo(false);
    }
  };

  return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#18231F] tracking-tight">
              Store Policies & Configuration
            </h2>
            <p className="text-xs md:text-sm text-[#4E8068] mt-0.5">
              Configure risk warning windows, gross margin floors, timezone, and Nebius Token Factory connection.
            </p>
          </div>

          <RippleButton
            onClick={handleResetDemo}
            disabled={isResettingDemo}
            variant="outline"
            size="sm"
            rippleColor="#163D32"
            className="self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResettingDemo ? 'animate-spin' : ''}`} />
            <span>Reset Sample Demo Data</span>
          </RippleButton>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings and store policies updated successfully. Risk engine recalculated.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#C65353] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAEFEA]">
            <StoreIcon className="w-5 h-5 text-[#163D32]" />
            <h3 className="font-bold text-sm text-[#18231F]">Store Profile &amp; Localization</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#18231F] mb-1">Store Name</label>
              <input
                type="text"
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">Physical Address</label>
              <input
                type="text"
                value={storeForm.address}
                onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg focus:outline-hidden focus:border-[#163D32]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">Currency Code &amp; Symbol</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={storeForm.currency}
                  onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })}
                  placeholder="INR"
                  className="w-2/3 p-2.5 border border-[#CBD8D1] rounded-lg font-mono"
                  required
                />
                <input
                  type="text"
                  value={storeForm.currencySymbol}
                  onChange={(e) => setStoreForm({ ...storeForm, currencySymbol: e.target.value })}
                  placeholder="₹"
                  className="w-1/3 p-2.5 border border-[#CBD8D1] rounded-lg font-mono text-center"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">Timezone (Prevents Day Shift Bugs)</label>
              <input
                type="text"
                value={storeForm.timezone}
                onChange={(e) => setStoreForm({ ...storeForm, timezone: e.target.value })}
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Operating Risk & Markdown Policies */}
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAEFEA]">
            <ShieldCheck className="w-5 h-5 text-[#163D32]" />
            <h3 className="font-bold text-sm text-[#18231F]">Operating Risk &amp; Margin Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Warning Window (Days before cutoff)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={policyForm.warningWindowDays}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, warningWindowDays: parseInt(e.target.value, 10) || 5 })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg"
                required
              />
              <p className="text-[11px] text-[#6B8579] mt-0.5">
                Batches reaching cutoff within this number of days are flagged as Warning.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Urgent Review Window (Days before cutoff)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={policyForm.urgentWindowDays}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, urgentWindowDays: parseInt(e.target.value, 10) || 2 })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg"
                required
              />
              <p className="text-[11px] text-[#6B8579] mt-0.5">
                Batches reaching cutoff within this window receive critical priority alerts.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Operational Cutoff Buffer (Days before label date)
              </label>
              <input
                type="number"
                min="0"
                max="7"
                value={policyForm.operationalCutoffOffsetDays}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    operationalCutoffOffsetDays: parseInt(e.target.value, 10) || 1
                  })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg"
                required
              />
              <p className="text-[11px] text-[#6B8579] mt-0.5">
                Configures sell-through cutoff 1 day before label date as food safety cushion.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Minimum Gross Margin Floor (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={policyForm.minimumGrossMarginPct}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    minimumGrossMarginPct: parseFloat(e.target.value) || 15
                  })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg font-mono"
                required
              />
              <p className="text-[11px] text-[#6B8579] mt-0.5">
                Discounts that would price below Cost / (1 - Margin%) are rejected under policy.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Safety Stock Buffer (Days of Demand)
              </label>
              <input
                type="number"
                min="0"
                max="14"
                value={policyForm.defaultSafetyStockDays}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    defaultSafetyStockDays: parseInt(e.target.value, 10) || 2
                  })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18231F] mb-1">
                Review Period (Days between supplier orders)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={policyForm.reviewPeriodDays}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    reviewPeriodDays: parseInt(e.target.value, 10) || 3
                  })
                }
                className="w-full p-2.5 border border-[#CBD8D1] rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Save button */}
                <div className="flex justify-end">
                  <RippleButton
                    type="submit"
                    disabled={isSaving}
                    variant="default"
                    size="default"
                    rippleColor="#D99A37"
                  >
                    <Save className="w-4 h-4 text-[#D99A37]" />
                    <span>{isSaving ? 'Saving Changes...' : 'Save Store Policies'}</span>
                  </RippleButton>
                </div>
              </form>

              {/* AI Assistant & Model Configuration Panel */}
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 shadow-xs space-y-4 card-animate-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFEA]">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-5 h-5 text-[#163D32]" />
                    <div>
                      <h3 className="font-bold text-sm text-[#18231F]">ShelfSense AI & Large Language Model</h3>
                      <p className="text-[11px] text-[#6B8579]">Google Gemini 3.8 Flash, Multi-Turn Co-Pilot & Retail Intelligence</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Active AI Co-Pilot
                  </span>
                </div>

                <div className="text-xs space-y-3 bg-[#FAFBF9] border border-[#E2E8E2] rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#18231F]">Provider / Engine:</span>
                      <span className="font-mono ml-2 text-[#4E8068]">{aiStatus?.baseUrl || 'https://generativelanguage.googleapis.com'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#18231F]">Model:</span>
                      <span className="font-mono ml-2 text-[#163D32] font-bold">{aiStatus?.model || 'gemini-3.8-flash'}</span>
                    </div>
                  </div>

                  <div className="text-[#6B8579] leading-relaxed pt-2 border-t border-[#EAEFEA]">
                    {aiStatus?.statusMessage}
                  </div>

                  <div className="p-3 bg-[#F0F4F1] rounded-md text-[11px] text-[#245244] leading-relaxed">
                    <strong>Intelligent Conversational Co-Pilot:</strong> ShelfSense AI is powered by Google Gemini 3.8 Flash and an adaptive retail domain engine. You can chat naturally with it—just like ChatGPT and Gemini—about batch cutoffs, margin-safe dynamic markdowns, FEFO demand simulations, and grocery waste reduction strategies.
                  </div>
                </div>
              </div>

              {/* Audit Trail Log */}
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 shadow-xs space-y-4 card-animate-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEFEA]">
                  <div className="flex items-center gap-2.5">
                    <History className="w-5 h-5 text-[#163D32]" />
                    <div>
                      <h3 className="font-bold text-sm text-[#18231F]">Store Action Audit Trail</h3>
                      <p className="text-[11px] text-[#6B8579]">
                        Immutable historical record of shopkeeper confirmations, stock adjustments, and approvals.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#6B8579]">
                    {auditLogs.length} events logged
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-[#EAEFEA] text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#18231F] flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#F0F4F1] text-[#163D32] border border-[#CBD8D1]">
                            {log.actionType.replace(/_/g, ' ')}
                          </span>
                          <span>{log.reason}</span>
                        </div>
                        {log.newValue && (
                          <div className="text-[11px] text-[#6B8579] font-mono mt-0.5">
                            {JSON.stringify(log.newValue)}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#6B8579] whitespace-nowrap shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: storeForm.timezone })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Modal for Reset Demo */}
              <ConfirmModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmResetDemo}
                title="Reset Sample Demo Data"
                message="This will re-seed realistic sample batches, sales, and waste records aligned relative to today. This action cannot be undone."
                confirmText="Reset Demo Data"
                cancelText="Cancel"
                variant="warning"
                isLoading={isResettingDemo}
              />

              {/* Toast Container */}
              <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            </div>
          );
        };
