import React, { useState, useEffect } from 'react';
import {
  Navigation,
  NavTab
} from './components/Navigation';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { RiskActionsPage } from './pages/RiskActionsPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import { BatchDetailModal } from './components/BatchDetailModal';
import { CsvImportModal } from './components/CsvImportModal';
import { RecordSaleModal } from './components/RecordSaleModal';
import { RecordWasteModal } from './components/RecordWasteModal';
import { api } from './api/client';
import {
  DashboardData,
  Product,
  BatchRiskCalculation,
  Recommendation,
  InventoryBatch
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<BatchRiskCalculation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<BatchRiskCalculation | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [modalBatchId, setModalBatchId] = useState<string | undefined>(undefined);
  const [modalProductId, setModalProductId] = useState<string | undefined>(undefined);

  // Assistant initial query
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  const loadAllData = async () => {
    try {
      const [dash, prods, bts, recs, ai] = await Promise.all([
        api.getDashboard(),
        api.getProducts(),
        api.getBatches(),
        api.getRecommendations(),
        api.getAiStatus()
      ]);
      setDashboardData(dash);
      setProducts(prods);
      setBatches(bts);
      setRecommendations(recs);
      setAiStatus(ai);
    } catch (err) {
      console.error('[ShelfSense] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleOpenSaleModal = (batchId?: string, productId?: string) => {
    setModalBatchId(batchId);
    setModalProductId(productId);
    setShowSaleModal(true);
  };

  const handleOpenWasteModal = (batchId?: string, productId?: string) => {
    setModalBatchId(batchId);
    setModalProductId(productId);
    setShowWasteModal(true);
  };

  const handleAskAiAboutBatch = (batchCode: string, productName: string) => {
    setAssistantInitialQuery(`Why is batch ${batchCode} (${productName}) at risk and what action is recommended?`);
    setActiveTab('assistant');
  };

  const handleRecommendationAction = async (
    id: string,
    status: 'approved' | 'completed' | 'dismissed' | 'deferred',
    reason?: string
  ) => {
    await api.handleRecommendationAction(id, status, reason);
    await loadAllData();
  };

  const currencySymbol = dashboardData?.store?.currencySymbol || '₹';

  return (
    <div className="flex min-h-screen bg-[#F7F8F4] text-[#18231F]">
      {/* Desktop Navigation Sidebar & Mobile Drawer */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        urgentCount={dashboardData?.summary?.urgentBatches || 0}
        pendingRecsCount={dashboardData?.pendingRecsCount || 0}
        aiConfigured={Boolean(aiStatus?.isConfigured)}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          store={dashboardData?.store}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenRecordSale={() => handleOpenSaleModal()}
          onOpenRecordWaste={() => handleOpenWasteModal()}
          onOpenCsvImport={() => setShowCsvModal(true)}
          aiConfigured={Boolean(aiStatus?.isConfigured)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewPage
              data={dashboardData}
              isLoading={isLoading}
              onRefresh={loadAllData}
              onSelectBatch={(batch) => setSelectedBatchForModal(batch)}
              onNavigateToRiskActions={() => setActiveTab('risk_actions')}
              onNavigateToAssistant={() => setActiveTab('assistant')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              products={products}
              batches={batches}
              onRefresh={loadAllData}
              onSelectBatch={(batch) => setSelectedBatchForModal(batch)}
              onOpenCsvImport={() => setShowCsvModal(true)}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === 'risk_actions' && (
            <RiskActionsPage
              recommendations={recommendations}
              batches={batches}
              policy={dashboardData?.policy || ({} as any)}
              onAction={handleRecommendationAction}
              onSelectBatch={(batch) => setSelectedBatchForModal(batch)}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === 'forecasts' && (
            <ForecastsPage currencySymbol={currencySymbol} />
          )}

          {activeTab === 'assistant' && (
            <AssistantPage
              currencySymbol={currencySymbol}
              initialQuestion={assistantInitialQuery}
              onSelectBatchCode={(code) => {
                const found = batches.find((b) => b.batchCode === code);
                if (found) setSelectedBatchForModal(found);
              }}
            />
          )}

          {activeTab === 'settings' && dashboardData && (
            <SettingsPage
              store={dashboardData.store}
              policy={dashboardData.policy}
              onRefreshAll={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Deep Inspection Modal */}
      {selectedBatchForModal && (
        <BatchDetailModal
          batch={selectedBatchForModal}
          onClose={() => setSelectedBatchForModal(null)}
          onAskAiAboutBatch={handleAskAiAboutBatch}
          onOpenRecordSale={(batchId, productId) => handleOpenSaleModal(batchId, productId)}
          onOpenRecordWaste={(batchId, productId) => handleOpenWasteModal(batchId, productId)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <CsvImportModal
          onClose={() => setShowCsvModal(false)}
          onSuccess={(count) => {
            alert(`Successfully imported ${count} batch(es) into inventory.`);
            loadAllData();
          }}
        />
      )}

      {/* Record Sale Modal */}
      {showSaleModal && (
        <RecordSaleModal
          products={products}
          batches={batches as any}
          preselectedBatchId={modalBatchId}
          preselectedProductId={modalProductId}
          onClose={() => setShowSaleModal(false)}
          onSuccess={() => {
            loadAllData();
          }}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Record Waste Modal */}
      {showWasteModal && (
        <RecordWasteModal
          products={products}
          batches={batches as any}
          preselectedBatchId={modalBatchId}
          preselectedProductId={modalProductId}
          onClose={() => setShowWasteModal(false)}
          onSuccess={() => {
            loadAllData();
          }}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

export default App;
