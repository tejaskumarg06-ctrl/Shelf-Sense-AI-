import {
  DashboardData,
  Product,
  InventoryBatch,
  BatchRiskCalculation,
  Recommendation,
  SalesRecord,
  WasteRecord,
  AnalyticsData,
  Store,
  StorePolicy,
  ActionLog
} from '../types';

// Use environment variable for API base, fallback to /api for local dev
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data.data;
}

export const api = {
  getDashboard: () => fetchJson<DashboardData>('/dashboard'),

  getProducts: () => fetchJson<Product[]>('/products'),
  createProduct: (payload: Partial<Product>) =>
    fetchJson<Product>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    fetchJson<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getBatches: () => fetchJson<BatchRiskCalculation[]>('/batches'),
  createBatch: (payload: any) =>
    fetchJson<InventoryBatch>('/batches', { method: 'POST', body: JSON.stringify(payload) }),
  adjustBatch: (id: string, delta: number, reason: string, actionType?: string) =>
    fetchJson<InventoryBatch>(`/batches/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason, actionType })
    }),

  getRisk: () => fetchJson<{ batchRisks: BatchRiskCalculation[]; summary: any }>('/risk'),

  getRecommendations: () => fetchJson<Recommendation[]>('/recommendations'),
  handleRecommendationAction: (id: string, status: 'approved' | 'completed' | 'dismissed' | 'deferred', reason?: string) =>
    fetchJson<Recommendation>(`/recommendations/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ status, reason })
    }),

  getSales: () => fetchJson<SalesRecord[]>('/sales'),
  recordSale: (payload: { productId: string; batchId?: string; quantitySold: number; unitSellingPrice: number; notes?: string }) =>
    fetchJson<SalesRecord>('/sales', { method: 'POST', body: JSON.stringify(payload) }),

  getWaste: () => fetchJson<WasteRecord[]>('/waste'),
  recordWaste: (payload: { productId: string; batchId: string; quantityWasted: number; reason: string; notes?: string }) =>
    fetchJson<WasteRecord>('/waste', { method: 'POST', body: JSON.stringify(payload) }),

  importCsv: (csvText: string) =>
    fetchJson<{
      totalRows: number;
      validRowsCount: number;
      invalidRowsCount: number;
      validationErrors: string[];
      preview: any[];
    }>('/import-csv', { method: 'POST', body: JSON.stringify({ csvText }) }),

  commitCsvImport: (validRows: any[]) =>
    fetchJson<{ message: string; count: number }>('/import-csv/commit', {
      method: 'POST',
      body: JSON.stringify({ validRows })
    }),

  getCsvTemplateUrl: () => `${API_BASE}/csv-template`,

  getAnalytics: (periodDays: number = 14) =>
    fetchJson<AnalyticsData>(`/analytics?periodDays=${periodDays}`),

  getSettings: () => fetchJson<{ store: Store; policy: StorePolicy; aiStatus: any }>('/settings'),
  updateSettings: (payload: { store?: Partial<Store>; policy?: Partial<StorePolicy> }) =>
    fetchJson<{ store: Store; policy: StorePolicy }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  resetDemoData: () =>
    fetchJson<{ message: string }>('/settings/reset-demo', { method: 'POST' }),

  getAiStatus: () => fetchJson<{ isConfigured: boolean; model: string; baseUrl: string; statusMessage: string }>('/ai/status'),
  sendAiChat: (question: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []) =>
    fetchJson<{
      answer: string;
      isAiGenerated: boolean;
      modelUsed?: string;
      referencedBatches: string[];
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question, conversationHistory })
    }),

  getAuditLogs: () => fetchJson<ActionLog[]>('/audit-logs')
};
