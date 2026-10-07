import React, { useState, useEffect } from 'react';
import { useTheme } from './utils/theme';
import { Navbar } from './components/Navbar';
import { MRFFormBuilder } from './components/MRFFormBuilder';
import { MRFSheetPreview } from './components/MRFSheetPreview';
import { CatalogExplorer } from './components/CatalogExplorer';
import { SitesDirectory } from './components/SitesDirectory';
import { HistoryDrawer } from './components/HistoryDrawer';
import { DataManagerModal } from './components/DataManagerModal';
import { MRFAutomationWizard } from './components/MRFAutomationWizard';
import { HowToFillGuide } from './components/HowToFillGuide';
import {
  MRFDocument,
  CatalogItem,
  SiteRecord,
  MRFLineItem,
} from './types/mrf';
import { INITIAL_ITEMS, INITIAL_SITES } from './utils/catalog';
import {
  loadMRFList,
  saveActiveMRF,
  createNewMRFDocument,
  deleteMRF,
  generateMRFNumber,
  getActiveMRFId,
  setActiveMRFId,
} from './utils/storage';
import { OFFICIAL_FILLED_MRF_BENCHMARK } from './utils/benchmarkMRF';
import { exportMRFToExcel } from './utils/excelExport';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const { theme } = useTheme();
  // Catalog & Sites data directly from Blaine inventory database
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_ITEMS);
  const [sites, setSites] = useState<SiteRecord[]>(INITIAL_SITES);

  // Saved documents & Active document
  const [savedDocs, setSavedDocs] = useState<MRFDocument[]>(() => loadMRFList());
  const [currentDoc, setCurrentDoc] = useState<MRFDocument>(() => {
    const list = loadMRFList();
    const activeId = getActiveMRFId();
    const found = list.find((d) => d.id === activeId);
    return found || list[0] || createNewMRFDocument();
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'builder' | 'preview' | 'guide' | 'catalog' | 'sites'
  >('builder');

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [customTemplateBuffer, setCustomTemplateBuffer] =
    useState<ArrayBuffer | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Sync active MRF to storage whenever it changes
  useEffect(() => {
    saveActiveMRF(currentDoc);
  }, [currentDoc]);

  // Actions
  const handleNewMRF = () => {
    const newDoc = createNewMRFDocument();
    setCurrentDoc(newDoc);
    setSavedDocs((prev) => [newDoc, ...prev]);
    setActiveMRFId(newDoc.id);
    setActiveTab('builder');
    showToast('Created new blank Material Request Form', 'info');
  };

  const handleSaveMRF = () => {
    saveActiveMRF(currentDoc);
    setSavedDocs(loadMRFList());
    showToast(`Saved draft: ${currentDoc.header.mrfNumber || 'MRF Form'}`);
  };

  const handleSelectDoc = (doc: MRFDocument) => {
    setCurrentDoc(doc);
    setActiveMRFId(doc.id);
    setActiveTab('builder');
    showToast(`Loaded MRF: ${doc.header.mrfNumber}`);
  };

  const handleDuplicateDoc = (doc: MRFDocument) => {
    const dup: MRFDocument = {
      ...doc,
      id: `mrf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        ...doc.header,
        mrfNumber: generateMRFNumber({
          siteId: doc.header.siteId || 'COPY',
          dateStr: doc.header.date,
          seq: 2,
          equipmentType: 'MF2',
          signeeOrEntity: doc.signatures.requestedBy.name || 'JOHN_CARLO_RABANES',
        }),
      },
    };
    setCurrentDoc(dup);
    setSavedDocs((prev) => [dup, ...prev]);
    setActiveMRFId(dup.id);
    showToast(`Duplicated into ${dup.header.mrfNumber}`);
  };

  const handleDeleteDoc = (id: string) => {
    const remaining = deleteMRF(id);
    setSavedDocs(remaining);
    if (currentDoc.id === id) {
      setCurrentDoc(remaining[0]);
    }
    showToast('Deleted MRF draft', 'info');
  };

  const handleExportExcel = async (docToExport = currentDoc) => {
    try {
      showToast('Exporting official MRF template without XML errors...', 'info');
      await exportMRFToExcel(docToExport, customTemplateBuffer);
      showToast('Downloaded official MRF Excel (.xlsx) file!');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e: any) {
      console.error('Export failed:', e);
      showToast(`Export error: ${e.message || 'Failed to generate Excel'}`, 'error');
    }
  };

  const handlePrint = () => {
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleSelectSite = (site: SiteRecord) => {
    const formattedSiteId = `${site.plaid} - ${site.siteName}`;
    const destinationArea = (site as any).destinationHub || 'CAGAYAN DE ORO';
    setCurrentDoc((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        destinationCode: site.plaid,
        destination: destinationArea,
        siteId: formattedSiteId,
        siteAddress: site.address,
        fromWarehouse: site.warehouse || prev.header.fromWarehouse,
        mrfNumber: generateMRFNumber({
          siteId: `${site.plaid}-${site.siteName}`,
          dateStr: prev.header.date,
          seq: 1,
          equipmentType: 'MF2',
          signeeOrEntity: prev.signatures.requestedBy.name || 'JOHN_CARLO_RABANES',
        }),
      },
    }));
    setActiveTab('builder');
    showToast(`Applied verified destination: ${formattedSiteId}`);
  };

  const handleAddMainItem = (catItem: CatalogItem) => {
    const itemUom = catItem.uom || 'PC';
    const newItem: MRFLineItem = {
      id: `mi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partNumber: catItem.code,
      description: catItem.description,
      packageNo: '', // Do not fill Package No
      uom: itemUom,
      qtyReq: 1,
      qtyIssued: itemUom, // Values in UOM column copied and placed under issued column in WHSE QUANTITY
      qtyReceived: '',
      qtyBalance: '',
      category: catItem.category,
    };
    setCurrentDoc((prev) => ({
      ...prev,
      mainItems: [...prev.mainItems, newItem],
    }));
    showToast(`Added ${catItem.code} to Main Equipment!`);
  };

  const handleAddLocalMaterial = (catItem: CatalogItem) => {
    const itemUom = catItem.uom || 'pcs';
    const newItem: MRFLineItem = {
      id: `lm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partNumber: catItem.code,
      description: catItem.description,
      packageNo: '', // Do not fill Package No
      uom: itemUom,
      qtyReq: 1,
      qtyIssued: itemUom, // Values in UOM column copied and placed under issued column in WHSE QUANTITY
      qtyReceived: '',
      qtyBalance: '',
      category: catItem.category,
    };
    setCurrentDoc((prev) => ({
      ...prev,
      localMaterials: [...prev.localMaterials, newItem],
    }));
    showToast(`Added ${catItem.code} to Local Accessories!`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${theme.colors.bgApp} ${theme.colors.textPrimary} transition-colors duration-150`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/30'
                : toast.type === 'error'
                ? 'bg-slate-900 text-rose-400 border-rose-500/30'
                : 'bg-slate-900 text-blue-300 border-blue-500/30'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        currentDoc={currentDoc}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewMRF={handleNewMRF}
        onOpenWizard={() => setIsWizardOpen(true)}
        onSaveMRF={handleSaveMRF}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenDataManager={() => setIsDataManagerOpen(true)}
        onExportExcel={() => handleExportExcel(currentDoc)}
        onPrint={handlePrint}
        onLoadBenchmark={() => {
          setCurrentDoc(OFFICIAL_FILLED_MRF_BENCHMARK);
          saveActiveMRF(OFFICIAL_FILLED_MRF_BENCHMARK);
          showToast(`Loaded benchmark: ${OFFICIAL_FILLED_MRF_BENCHMARK.header.mrfNumber}`);
        }}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'builder' && (
          <MRFFormBuilder
            doc={currentDoc}
            catalog={catalog}
            sites={sites}
            onChange={setCurrentDoc}
            onOpenSites={() => setActiveTab('sites')}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenGuide={() => setActiveTab('guide')}
            onLoadSample={(sample) => {
              setCurrentDoc(sample);
              saveActiveMRF(sample);
              showToast(`Loaded: ${sample.header.mrfNumber}`);
            }}
          />
        )}

        {activeTab === 'preview' && (
          <MRFSheetPreview
            doc={currentDoc}
            onExportExcel={() => handleExportExcel(currentDoc)}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'guide' && (
          <HowToFillGuide
            onLoadMRF={(doc) => {
              setCurrentDoc(doc);
              saveActiveMRF(doc);
              showToast(`Applied ${doc.header.mrfNumber}`);
            }}
            onGoToBuilder={() => setActiveTab('builder')}
            onGoToPreview={() => setActiveTab('preview')}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogExplorer
            items={catalog}
            onAddMainItem={handleAddMainItem}
            onAddLocalMaterial={handleAddLocalMaterial}
          />
        )}

        {activeTab === 'sites' && (
          <SitesDirectory
            sites={sites}
            activeSitePlaid={currentDoc.header.destinationCode}
            onSelectSite={handleSelectSite}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">MRF Generator</span>
            <span>&bull;</span>
            <span>Nokia &bull; Globe Telecom OLT Logistics Management</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Paranaque WHS Hub</span>
            <span>&bull;</span>
            <span>Official Template: MRF_template.xlsx</span>
            <span>&bull;</span>
            <span>Inventory Database: 459 verified items</span>
          </div>
        </div>
      </footer>

      {/* Saved Drafts History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        savedDocs={savedDocs}
        activeDocId={currentDoc.id}
        onSelectDoc={handleSelectDoc}
        onDuplicateDoc={handleDuplicateDoc}
        onDeleteDoc={handleDeleteDoc}
        onExportExcel={handleExportExcel}
        onLoadBenchmark={() => {
          setCurrentDoc(OFFICIAL_FILLED_MRF_BENCHMARK);
          saveActiveMRF(OFFICIAL_FILLED_MRF_BENCHMARK);
          setSavedDocs(loadMRFList());
          showToast(`Restored benchmark: ${OFFICIAL_FILLED_MRF_BENCHMARK.header.mrfNumber}`);
        }}
      />

      {/* Data Sources and Template Modal */}
      <DataManagerModal
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
        onUpdateCatalog={(newItems, newSites) => {
          setCatalog(newItems);
          setSites(newSites);
          showToast(`Updated catalog with ${newItems.length} items!`);
        }}
        onSetCustomTemplate={(buf) => setCustomTemplateBuffer(buf)}
        hasCustomTemplate={Boolean(customTemplateBuffer)}
      />

      {/* Guided 8-Question MRF Automation Wizard */}
      <MRFAutomationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        sites={sites}
        onGenerateMRF={(newDoc) => {
          setCurrentDoc(newDoc);
          setSavedDocs((prev) => [newDoc, ...prev]);
          setActiveMRFId(newDoc.id);
          setActiveTab('preview');
          showToast(`Generated complete MRF for ${newDoc.header.destinationCode} (${newDoc.header.mrfNumber})!`);
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        }}
      />
    </div>
  );
}
