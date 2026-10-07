import React, { useState, useEffect } from 'react';
import {
  MRFDocument,
  MRFLineItem,
  CatalogItem,
  SiteRecord,
} from '../types/mrf';
import { ItemAutocomplete } from './ItemAutocomplete';
import { SiteAutocomplete } from './SiteAutocomplete';
import { useTheme } from '../utils/theme';
import {
  generateMRFNumber,
  splitMRFNumber,
  parseMRFNumber,
  cleanMRFSiteId,
  cleanMRFEntity,
  formatMRFDate,
} from '../utils/storage';
import {
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Calculator,
  Warehouse,
  AlertTriangle,
  Zap,
  Sparkles,
  Check,
  Copy,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { OFFICIAL_FILLED_MRF_BENCHMARK } from '../utils/benchmarkMRF';

interface MRFFormBuilderProps {
  doc: MRFDocument;
  catalog: CatalogItem[];
  sites: SiteRecord[];
  onChange: (updated: MRFDocument) => void;
  onOpenSites: () => void;
  onOpenWizard?: () => void;
  onOpenGuide?: () => void;
  onLoadSample?: (sample: MRFDocument) => void;
}

const WAREHOUSE_OPTIONS = [
  'Paranaque WHS',
  'Manila NP WH',
  'Cebu SBF WH',
  'Davao SBF WH',
  'Nokia WH',
];

const EQUIPMENT_PRESETS = ['MF2', 'DF16', 'FX4', 'FX8'];
const ENTITY_PRESETS = [
  'JOHN_CARLO_RABANES',
  'DNA_SUBCON',
  'PARANAQUE_WHS',
];

export const MRFFormBuilder: React.FC<MRFFormBuilderProps> = ({
  doc,
  catalog,
  sites,
  onChange,
  onOpenSites,
  onOpenWizard,
  onOpenGuide: _onOpenGuide,
  onLoadSample,
}) => {
  const { isDark } = useTheme();

  const [selectedSitePlaid, setSelectedSitePlaid] = useState(
    doc.header.destinationCode || ''
  );

  // Header update handler
  const updateHeader = (field: keyof typeof doc.header, value: string) => {
    onChange({
      ...doc,
      header: {
        ...doc.header,
        [field]: value,
      },
    });
  };

  // Signatures update handler
  const updateSignatures = (
    section: 'requestedBy' | 'preparedBy' | 'receivedBy',
    field: 'name' | 'title' | 'date',
    value: string
  ) => {
    onChange({
      ...doc,
      signatures: {
        ...doc.signatures,
        [section]: {
          ...doc.signatures[section],
          [field]: value,
        },
      },
    });
  };

  const updateStatus = (status: 'Accepted' | 'Rejected' | 'Pending') => {
    onChange({
      ...doc,
      signatures: {
        ...doc.signatures,
        status,
      },
    });
  };

  // Detect current equipment type from document items
  const detectedEquipment =
    doc.mainItems.find(
      (i) =>
        i.category === 'MF2' ||
        i.description?.toUpperCase().includes('MF-2') ||
        i.description?.toUpperCase().includes('MF2')
    )
      ? 'MF2'
      : doc.mainItems.find(
          (i) =>
            i.description?.toUpperCase().includes('DF16') ||
            i.description?.toUpperCase().includes('DF-16')
        )
      ? 'DF16'
      : doc.mainItems.find(
          (i) =>
            i.description?.toUpperCase().includes('FX4') ||
            i.description?.toUpperCase().includes('FX-4')
        )
      ? 'FX4'
      : doc.mainItems.find(
          (i) =>
            i.description?.toUpperCase().includes('FX8') ||
            i.description?.toUpperCase().includes('FX-8')
        )
      ? 'FX8'
      : 'MF2';

  // Detect current requisitioner/signee/subcon
  const detectedEntity =
    doc.signatures.requestedBy.name ||
    doc.signatures.contactNokiaInhouse
      ?.replace(/^NOKIA INHOUSE\s*-\s*/i, '')
      .split('/')[0] ||
    'JOHN_CARLO_RABANES';

  // Parse currently active MRF number
  const parsedMRF = parseMRFNumber(doc.header.mrfNumber || '');

  // Modular Component USER INPUT States
  const [seqInput, setSeqInput] = useState(() => parsedMRF.seqStr || '004');
  const [siteIdInput, setSiteIdInput] = useState(
    () => parsedMRF.siteId || cleanMRFSiteId(doc.header.siteId) || 'MIN1371-GNG-701'
  );
  const [equipInput, setEquipInput] = useState(
    () => parsedMRF.equipmentType || detectedEquipment || 'MF2'
  );
  const [entityInput, setEntityInput] = useState(
    () => parsedMRF.signeeOrEntity || detectedEntity || 'JOHN_CARLO_RABANES'
  );
  const [dateInput, setDateInput] = useState(
    () => parsedMRF.dateStr || formatMRFDate(doc.header.date) || '06302026'
  );

  // Sync component inputs when doc.header.mrfNumber changes externally
  useEffect(() => {
    const current = parseMRFNumber(doc.header.mrfNumber || '');
    if (current.seqStr && current.seqStr !== seqInput) setSeqInput(current.seqStr);
    if (current.siteId && current.siteId !== siteIdInput) setSiteIdInput(current.siteId);
    if (current.equipmentType && current.equipmentType !== equipInput)
      setEquipInput(current.equipmentType);
    if (current.signeeOrEntity && current.signeeOrEntity !== entityInput)
      setEntityInput(current.signeeOrEntity);
    if (current.dateStr && current.dateStr !== dateInput) setDateInput(current.dateStr);
  }, [doc.header.mrfNumber]);

  // Handler for user editing any component of NOKIA-FN_[MMDDYYYY]-[SEQ]_[SITE_ID]_[EQUIPMENT_TYPE]_[SUBCON/WAREHOUSE/ENGINEER]
  const handleComponentChange = (
    field: 'date' | 'seq' | 'siteId' | 'equip' | 'entity',
    value: string
  ) => {
    let nextDate = dateInput;
    let nextSeq = seqInput;
    let nextSiteId = siteIdInput;
    let nextEquip = equipInput;
    let nextEntity = entityInput;

    if (field === 'date') {
      nextDate = value;
      setDateInput(value);
    } else if (field === 'seq') {
      nextSeq = value;
      setSeqInput(value);
    } else if (field === 'siteId') {
      nextSiteId = value;
      setSiteIdInput(value);
    } else if (field === 'equip') {
      nextEquip = value;
      setEquipInput(value);
    } else if (field === 'entity') {
      nextEntity = value;
      setEntityInput(value);
    }

    const cleanDate = formatMRFDate(nextDate);
    const cleanSeq = nextSeq ? nextSeq.trim().padStart(3, '0') : '001';
    const cleanSite = cleanMRFSiteId(nextSiteId);
    const cleanEquip =
      (nextEquip || 'MF2').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'MF2';
    const cleanEntity = cleanMRFEntity(nextEntity);

    const assembledMRF = `NOKIA-FN_${cleanDate}-${cleanSeq}_${cleanSite}_${cleanEquip}_${cleanEntity}`;
    updateHeader('mrfNumber', assembledMRF);
  };

  // Direct editing of the Full MRF Number string
  const handleFullMRFNumberChange = (raw: string) => {
    updateHeader('mrfNumber', raw);
    const p = parseMRFNumber(raw);
    if (p.dateStr) setDateInput(p.dateStr);
    if (p.seqStr) setSeqInput(p.seqStr);
    if (p.siteId) setSiteIdInput(p.siteId);
    if (p.equipmentType) setEquipInput(p.equipmentType);
    if (p.signeeOrEntity) setEntityInput(p.signeeOrEntity);
  };

  const [copiedMRF, setCopiedMRF] = useState(false);
  const handleCopyMRF = () => {
    if (!doc.header.mrfNumber) return;
    navigator.clipboard.writeText(doc.header.mrfNumber);
    setCopiedMRF(true);
    setTimeout(() => setCopiedMRF(false), 2000);
  };

  // Quick Site selection from verified database sites
  const handleSiteSelect = (found: SiteRecord) => {
    setSelectedSitePlaid(found.plaid);
    const formattedSiteId = `${found.plaid} - ${found.siteName}`;
    const destinationArea = (found as any).destinationHub || 'CAGAYAN DE ORO';
    const cleanSite = cleanMRFSiteId(`${found.plaid}-${found.siteName}`);
    setSiteIdInput(cleanSite);

    const cleanDate = formatMRFDate(doc.header.date);
    const cleanSeq = seqInput ? seqInput.trim().padStart(3, '0') : '001';
    const cleanEquip = (equipInput || detectedEquipment || 'MF2')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    const cleanEntity = cleanMRFEntity(entityInput || detectedEntity);

    const newMRF = `NOKIA-FN_${cleanDate}-${cleanSeq}_${cleanSite}_${cleanEquip}_${cleanEntity}`;

    onChange({
      ...doc,
      header: {
        ...doc.header,
        destinationCode: found.plaid,
        destination: destinationArea,
        siteId: formattedSiteId,
        siteAddress: found.address,
        fromWarehouse: found.warehouse || doc.header.fromWarehouse,
        mrfNumber: newMRF,
      },
    });
  };

  // Line Item Handlers
  const updateItem = (
    listType: 'mainItems' | 'localMaterials',
    index: number,
    field: keyof MRFLineItem,
    value: any
  ) => {
    const list = [...doc[listType]];
    const item = { ...list[index], [field]: value };

    // When UOM is updated, automatically copy and place value under WHSE QUANTITY ISSUED
    if (field === 'uom') {
      item.qtyIssued = value;
    }

    // Auto-calculate balance if req and issued/received are numbers
    if (field === 'qtyIssued' || field === 'qtyReceived' || field === 'qtyReq') {
      const issued =
        typeof item.qtyIssued === 'number'
          ? item.qtyIssued
          : !isNaN(Number(item.qtyIssued)) && item.qtyIssued !== ''
          ? Number(item.qtyIssued)
          : 0;
      const received =
        typeof item.qtyReceived === 'number'
          ? item.qtyReceived
          : !isNaN(Number(item.qtyReceived)) && item.qtyReceived !== ''
          ? Number(item.qtyReceived)
          : 0;
      if (
        typeof item.qtyIssued === 'number' ||
        (!isNaN(Number(item.qtyIssued)) && item.qtyIssued !== '')
      ) {
        item.qtyBalance = Math.max(0, issued - received);
      }
    }

    list[index] = item;
    onChange({ ...doc, [listType]: list });
  };

  const handleSelectItem = (
    listType: 'mainItems' | 'localMaterials',
    index: number,
    catItem: CatalogItem
  ) => {
    const list = [...doc[listType]];
    const finalUom = catItem.uom || (listType === 'mainItems' ? 'PC' : 'pcs');
    list[index] = {
      ...list[index],
      partNumber: catItem.code,
      description: catItem.description,
      uom: finalUom,
      packageNo: '', // Do NOT fill Package No.
      qtyIssued: finalUom,
      category: catItem.category,
    };
    onChange({ ...doc, [listType]: list });
  };

  const addItemRow = (listType: 'mainItems' | 'localMaterials') => {
    const uom = listType === 'mainItems' ? 'PC' : 'pcs';
    const newItem: MRFLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partNumber: '',
      description: '',
      packageNo: '',
      uom: uom,
      qtyReq: 1,
      qtyIssued: uom,
      qtyReceived: '',
      qtyBalance: '',
    };
    onChange({
      ...doc,
      [listType]: [...doc[listType], newItem],
    });
  };

  const removeItemRow = (
    listType: 'mainItems' | 'localMaterials',
    index: number
  ) => {
    const list = [...doc[listType]];
    list.splice(index, 1);
    onChange({ ...doc, [listType]: list });
  };

  // Batch actions
  const handleAutoFillIssuedAll = (listType: 'mainItems' | 'localMaterials') => {
    const list = doc[listType].map((it) => ({
      ...it,
      packageNo: '',
      qtyIssued: it.uom || (listType === 'mainItems' ? 'PC' : 'pcs'),
      qtyReceived: it.qtyReq,
      qtyBalance: 0,
    }));
    onChange({ ...doc, [listType]: list });
  };

  // Calculate stock warning against real database stock
  const getStockWarning = (item: MRFLineItem): number | null => {
    if (!item.partNumber || item.qtyReq === '') return null;
    const cat = catalog.find(
      (c) => c.code.toLowerCase() === item.partNumber.toLowerCase()
    );
    if (!cat) return null;
    const available = cat.stock.paranaque_mnl;
    if (Number(item.qtyReq) > available) {
      return available;
    }
    return null;
  };

  // Summaries
  const sumReq =
    doc.mainItems.reduce((acc, it) => acc + (Number(it.qtyReq) || 0), 0) +
    doc.localMaterials.reduce((acc, it) => acc + (Number(it.qtyReq) || 0), 0);
  const sumIssued =
    doc.mainItems.reduce((acc, it) => acc + (Number(it.qtyIssued) || 0), 0) +
    doc.localMaterials.reduce((acc, it) => acc + (Number(it.qtyIssued) || 0), 0);
  const sumReceived =
    doc.mainItems.reduce((acc, it) => acc + (Number(it.qtyReceived) || 0), 0) +
    doc.localMaterials.reduce((acc, it) => acc + (Number(it.qtyReceived) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Form Header Card (Spacious, Roomy, Anti-Cramp) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 sm:px-8 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-500/25 text-blue-300 border border-blue-400/30">
                Official Document Parameters
              </span>
              <span className="text-xs text-slate-300">
                Matching MRF_template.xlsx structure
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              Material Request Form Editor
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onLoadSample && (
              <button
                type="button"
                onClick={() => onLoadSample(OFFICIAL_FILLED_MRF_BENCHMARK)}
                className="inline-flex items-center gap-2 h-11 px-4.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shadow-sm"
                title="Load official template benchmark (MIN1371 MF2 John Carlo Rabanes)"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Load Sample MRF</span>
              </button>
            )}
            {onOpenWizard && (
              <button
                type="button"
                onClick={onOpenWizard}
                className="inline-flex items-center gap-2 h-11 px-4.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shadow-sm"
                title="Launch guided BoQ generator"
              >
                <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Auto-BoQ Wizard</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSites}
              className="inline-flex items-center gap-2 h-11 px-4.5 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shadow-sm"
            >
              <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Browse Sites ({sites.length.toLocaleString()})</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 text-xs">
          {/* MRF Naming Format: 100% USER INPUT and Two-Line Output */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    MRF Naming Format
                  </h3>
                  <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    NOKIA-FN_[MMDDYYYY]-[SEQ]_[SITE_ID]_[EQUIPMENT_TYPE]_[SUBCON/WAREHOUSE/ENGINEER]
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Written on top line (Row 56). When exceeding ~47 characters, automatically continues below on Row 57.
                </p>
              </div>

              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-300/80 dark:border-emerald-800 self-start sm:self-auto shrink-0">
                User Input Active
              </span>
            </div>

            {/* Primary Full MRF Number Direct User Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  Full MRF Name (Direct User Input)
                </label>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Total: {(doc.header.mrfNumber || '').length} characters
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={doc.header.mrfNumber}
                  onChange={(e) => handleFullMRFNumberChange(e.target.value)}
                  className="flex-1 h-12 px-4.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs transition-all"
                  placeholder="NOKIA-FN_06302026-004_MIN1371-GNG-701_MF2_JOHN_CARLO_RABANES"
                />

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const mmddyyyy = formatMRFDate(dateInput || doc.header.date);
                      const cleanSeq = (seqInput || '001').padStart(3, '0');
                      const cleanSite = cleanMRFSiteId(siteIdInput || doc.header.siteId);
                      const cleanEquip = (equipInput || 'MF2')
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]/g, '');
                      const cleanEntity = cleanMRFEntity(entityInput);
                      const reassembled = `NOKIA-FN_${mmddyyyy}-${cleanSeq}_${cleanSite}_${cleanEquip}_${cleanEntity}`;
                      updateHeader('mrfNumber', reassembled);
                    }}
                    className="h-12 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
                    title="Assemble full name from the 5 component user inputs below"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Format Schema</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMRF}
                    className={`h-12 px-4.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all whitespace-nowrap shadow-2xs ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title="Copy full MRF name to clipboard"
                  >
                    {copiedMRF ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modular Component USER INPUT Grid (Roomy, spaced, responsive) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Modular Component Fields (User Input)
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    Auto-Synchronized
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Type directly into any field below. You can also click the quick presets for equipment and signee.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
                {/* 1. Date [MMDDYYYY] */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Date [MMDDYYYY]
                  </label>
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => handleComponentChange('date', e.target.value)}
                    placeholder="06302026"
                    className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. 06302026
                  </span>
                </div>

                {/* 2. Sequence [SEQ] */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Sequence # [SEQ]
                  </label>
                  <input
                    type="text"
                    value={seqInput}
                    onChange={(e) => handleComponentChange('seq', e.target.value)}
                    placeholder="004"
                    className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. 004, 001
                  </span>
                </div>

                {/* 3. Site ID [SITE_ID] */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. Site ID [SITE_ID]
                  </label>
                  <input
                    type="text"
                    value={siteIdInput}
                    onChange={(e) => handleComponentChange('siteId', e.target.value)}
                    placeholder="MIN1371-GNG-701"
                    className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. MIN1371-GNG-701
                  </span>
                </div>

                {/* 4. Equipment Type [EQUIPMENT_TYPE] */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    4. Equipment Type
                  </label>
                  <input
                    type="text"
                    value={equipInput}
                    onChange={(e) => handleComponentChange('equip', e.target.value)}
                    placeholder="MF2"
                    className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {EQUIPMENT_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleComponentChange('equip', p)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          equipInput.toUpperCase() === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Subcon/Warehouse/Engineer [SUBCON/WAREHOUSE/ENGINEER] */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    5. Subcon / Whse / Engr
                  </label>
                  <input
                    type="text"
                    value={entityInput}
                    onChange={(e) => handleComponentChange('entity', e.target.value)}
                    placeholder="JOHN_CARLO_RABANES"
                    className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {ENTITY_PRESETS.map((ent) => (
                      <button
                        key={ent}
                        type="button"
                        onClick={() => handleComponentChange('entity', ent)}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors truncate max-w-[100px] ${
                          entityInput === ent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={ent}
                      >
                        {ent.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Two-Line Excel Spreadsheet Continuation Output (Rows 56 & 57) */}
            {(() => {
              const split = splitMRFNumber(doc.header.mrfNumber || '', 47);
              return (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Spreadsheet Two-Line Continuation Output (Rows 56 &amp; 57)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Total: {(doc.header.mrfNumber || '').length} chars
                      </span>
                      {split.isOverflow ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Wraps to 2nd Line (Row 57)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Single Line (Row 56)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    {/* Top Line (Row 56) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white shrink-0">
                          Top Line (F56)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {split.line1 || '(empty)'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                        {split.line1.length} / 47 chars
                      </span>
                    </div>

                    {/* Second Line Below (Row 57) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-white shrink-0">
                          2nd Line Below (F57)
                        </span>
                        <span
                          className={`font-bold truncate ${
                            split.isOverflow
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-400 italic font-normal'
                          }`}
                        >
                          {split.line2 ||
                            '(Fits entirely on top line - no continuation on row 57)'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                        {split.line2.length} chars
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2 pt-1">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      {split.isOverflow ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ MRF name exceeds top line length (~47 chars) and automatically breaks cleanly at delimiter to continue on Row 57 (merged F57:G57 in Excel export).
                        </span>
                      ) : (
                        <span>
                          The MRF name currently fits on the top line (F56). When the name exceeds ~47 characters, it will automatically wrap onto the second line below (F57).
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Destination, Warehouse & Site Details (Spacious inputs, clean grids) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {/* Quick Real-Time Search & Select from Verified Sites */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>
                  Load Verified Destination from Database ({sites.length.toLocaleString()} sites)
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Real-Time Search
                </span>
              </label>
              <SiteAutocomplete
                sites={sites}
                selectedPlaid={doc.header.destinationCode || selectedSitePlaid}
                onSelectSite={handleSiteSelect}
                placeholder="Type PLAID (e.g. MIN1371), site name, hub, city, or address..."
              />
            </div>

            {/* FROM Warehouse */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                  FROM Warehouse
                </span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Cell B6
                </span>
              </label>
              <select
                value={doc.header.fromWarehouse}
                onChange={(e) => updateHeader('fromWarehouse', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {WAREHOUSE_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Request Date</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Cells E6:G6
                </span>
              </label>
              <input
                type="date"
                value={doc.header.date}
                onChange={(e) => updateHeader('date', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Destination Area / Hub */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>DESTINATION (Hub / Area)</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Cells E8:G8
                </span>
              </label>
              <input
                type="text"
                value={doc.header.destination}
                onChange={(e) => updateHeader('destination', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. CAGAYAN DE ORO, CEBU, DAVAO"
              />
            </div>

            {/* Site ID & Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>SITE ID (PLAID - Site Name)</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Cells E10:G10
                </span>
              </label>
              <input
                type="text"
                value={doc.header.siteId}
                onChange={(e) => updateHeader('siteId', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. MIN1371  - GNG_701"
              />
            </div>

            {/* Destination Reference Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>PLAID Code (Internal Ref)</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Ref ID
                </span>
              </label>
              <input
                type="text"
                value={doc.header.destinationCode}
                onChange={(e) => updateHeader('destinationCode', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. MIN1371"
              />
            </div>

            {/* Site Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>SITE ADDRESS</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Cells E11:G12 (Multiline Box)
                </span>
              </label>
              <input
                type="text"
                value={doc.header.siteAddress}
                onChange={(e) => updateHeader('siteAddress', e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. PSG-115, Metro Manila"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Equipment Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              1
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Main Equipment &amp; Modules
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {doc.mainItems.length} items (
                  {doc.mainItems.length > 8
                    ? `+${doc.mainItems.length - 8} dynamic rows added`
                    : `${doc.mainItems.length}/8 standard slots`}
                  )
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Primary OLT shelves, NT cards, line boards, and SFPs (Standard Rows 18–25; dynamically expanded if exceeded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => handleAutoFillIssuedAll('mainItems')}
              className={`inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shadow-2xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Set Issued = Req and Received = Req for all items"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-500" />
              <span>Fulfill All</span>
            </button>
            <button
              type="button"
              onClick={() => addItemRow('mainItems')}
              className="inline-flex items-center gap-2 h-10 px-4.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment Row</span>
            </button>
          </div>
        </div>

        {/* Main Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5 font-bold w-12 text-center">#</th>
                <th className="py-3 px-3.5 font-bold min-w-[220px]">PART NUMBER</th>
                <th className="py-3 px-3.5 font-bold min-w-[260px]">DESCRIPTION</th>
                <th className="py-3 px-3.5 font-bold w-24">PACKAGE NO</th>
                <th className="py-3 px-3.5 font-bold w-20 text-center">UOM</th>
                <th
                  className="py-3 px-2.5 font-bold text-center bg-blue-50/70 dark:bg-blue-950/40 border-l border-blue-100 dark:border-blue-900"
                  colSpan={2}
                >
                  WHSE QUANTITY
                </th>
                <th
                  className="py-3 px-2.5 font-bold text-center bg-indigo-50/70 dark:bg-indigo-950/40 border-l border-indigo-100 dark:border-indigo-900"
                  colSpan={2}
                >
                  ALCATEL QUANTITY
                </th>
                <th className="py-3 px-3.5 font-bold w-24 text-center">MNL STOCK</th>
                <th className="py-3 px-2.5 font-bold w-14 text-center">ACT</th>
              </tr>
              <tr className="bg-slate-100/60 dark:bg-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th colSpan={5}></th>
                <th className="py-1 px-2 text-center font-semibold bg-blue-50/80 dark:bg-blue-950/60 border-l border-blue-100 dark:border-blue-900 w-16">
                  REQ
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-blue-50/80 dark:bg-blue-950/60 w-16">
                  ISSUED
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 border-l border-indigo-100 dark:border-indigo-900 w-16">
                  RECEIVED
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 w-16">
                  BALANCE
                </th>
                <th colSpan={2}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {doc.mainItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-10 text-center text-slate-400 dark:text-slate-500"
                  >
                    No items in this section yet. Click &quot;Add Equipment Row&quot; or select from Items Catalog.
                  </td>
                </tr>
              ) : (
                doc.mainItems.map((item, index) => {
                  const stockAlert = getStockWarning(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>

                      {/* Part Number Autocomplete */}
                      <td className="py-3 px-3.5">
                        <ItemAutocomplete
                          value={item.partNumber}
                          items={catalog}
                          placeholder="Search item code..."
                          onSelect={(cat) =>
                            handleSelectItem('mainItems', index, cat)
                          }
                          onChange={(val) =>
                            updateItem('mainItems', index, 'partNumber', val)
                          }
                        />
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem('mainItems', index, 'description', e.target.value)
                          }
                          className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Item description..."
                        />
                      </td>

                      {/* Package No */}
                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.packageNo}
                          onChange={(e) =>
                            updateItem('mainItems', index, 'packageNo', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="—"
                          title="Package No is left blank per guidelines"
                        />
                      </td>

                      {/* UOM */}
                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) =>
                            updateItem('mainItems', index, 'uom', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs uppercase text-center text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          placeholder="PC"
                        />
                      </td>

                      {/* REQ */}
                      <td className="py-3 px-2 bg-blue-50/40 dark:bg-blue-950/20 border-l border-blue-100 dark:border-blue-900/60">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyReq}
                          onChange={(e) =>
                            updateItem(
                              'mainItems',
                              index,
                              'qtyReq',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-blue-200 dark:border-blue-800 rounded-lg font-bold text-center text-blue-950 dark:text-blue-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* ISSUED */}
                      <td className="py-3 px-2 bg-blue-50/40 dark:bg-blue-950/20">
                        <input
                          type="text"
                          value={item.qtyIssued}
                          onChange={(e) =>
                            updateItem('mainItems', index, 'qtyIssued', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          placeholder={item.uom || 'PC'}
                          title="Values in UOM column placed under WHSE QUANTITY issued"
                        />
                      </td>

                      {/* RECEIVED */}
                      <td className="py-3 px-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-l border-indigo-100 dark:border-indigo-900/60">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyReceived}
                          onChange={(e) =>
                            updateItem(
                              'mainItems',
                              index,
                              'qtyReceived',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* BALANCE */}
                      <td className="py-3 px-2 bg-indigo-50/40 dark:bg-indigo-950/20">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyBalance}
                          onChange={(e) =>
                            updateItem(
                              'mainItems',
                              index,
                              'qtyBalance',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-center text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Stock Info */}
                      <td className="py-3 px-3.5 text-center">
                        {stockAlert !== null ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            title={`Requested ${item.qtyReq} exceeds Paranaque stock (${stockAlert})`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>WH: {stockAlert}</span>
                          </span>
                        ) : item.partNumber ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow('mainItems', index)}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Local Materials / Accessories Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              2
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wide">
                  LOCAL MATERIALS / ACCESSORIES
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {doc.localMaterials.length} items (
                  {doc.localMaterials.length > 20
                    ? `+${doc.localMaterials.length - 20} dynamic rows added`
                    : `${doc.localMaterials.length}/20 standard slots`}
                  )
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fiber patch cords, power cables, conduits, and accessories (Standard Rows 27–46; dynamically expanded if exceeded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => handleAutoFillIssuedAll('localMaterials')}
              className={`inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shadow-2xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-500" />
              <span>Fulfill All</span>
            </button>
            <button
              type="button"
              onClick={() => addItemRow('localMaterials')}
              className="inline-flex items-center gap-2 h-10 px-4.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Accessory Row</span>
            </button>
          </div>
        </div>

        {/* Local Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5 font-bold w-12 text-center">#</th>
                <th className="py-3 px-3.5 font-bold min-w-[220px]">PART NUMBER</th>
                <th className="py-3 px-3.5 font-bold min-w-[260px]">DESCRIPTION</th>
                <th className="py-3 px-3.5 font-bold w-24">PACKAGE NO</th>
                <th className="py-3 px-3.5 font-bold w-20 text-center">UOM</th>
                <th
                  className="py-3 px-2.5 font-bold text-center bg-blue-50/70 dark:bg-blue-950/40 border-l border-blue-100 dark:border-blue-900"
                  colSpan={2}
                >
                  WHSE QUANTITY
                </th>
                <th
                  className="py-3 px-2.5 font-bold text-center bg-indigo-50/70 dark:bg-indigo-950/40 border-l border-indigo-100 dark:border-indigo-900"
                  colSpan={2}
                >
                  ALCATEL QUANTITY
                </th>
                <th className="py-3 px-3.5 font-bold w-24 text-center">MNL STOCK</th>
                <th className="py-3 px-2.5 font-bold w-14 text-center">ACT</th>
              </tr>
              <tr className="bg-slate-100/60 dark:bg-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th colSpan={5}></th>
                <th className="py-1 px-2 text-center font-semibold bg-blue-50/80 dark:bg-blue-950/60 border-l border-blue-100 dark:border-blue-900 w-16">
                  REQ
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-blue-50/80 dark:bg-blue-950/60 w-16">
                  ISSUED
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 border-l border-indigo-100 dark:border-indigo-900 w-16">
                  RECEIVED
                </th>
                <th className="py-1 px-2 text-center font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 w-16">
                  BALANCE
                </th>
                <th colSpan={2}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {doc.localMaterials.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-10 text-center text-slate-400 dark:text-slate-500"
                  >
                    No accessories added. Click &quot;Add Accessory Row&quot; or choose from Items Catalog.
                  </td>
                </tr>
              ) : (
                doc.localMaterials.map((item, index) => {
                  const stockAlert = getStockWarning(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3.5">
                        <ItemAutocomplete
                          value={item.partNumber}
                          items={catalog}
                          placeholder="Search accessory code..."
                          onSelect={(cat) =>
                            handleSelectItem('localMaterials', index, cat)
                          }
                          onChange={(val) =>
                            updateItem('localMaterials', index, 'partNumber', val)
                          }
                        />
                      </td>

                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem('localMaterials', index, 'description', e.target.value)
                          }
                          className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Accessory description..."
                        />
                      </td>

                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.packageNo}
                          onChange={(e) =>
                            updateItem('localMaterials', index, 'packageNo', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="—"
                          title="Package No is left blank per guidelines"
                        />
                      </td>

                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) =>
                            updateItem('localMaterials', index, 'uom', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs uppercase text-center text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          placeholder="pcs"
                        />
                      </td>

                      <td className="py-3 px-2 bg-blue-50/40 dark:bg-blue-950/20 border-l border-blue-100 dark:border-blue-900/60">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyReq}
                          onChange={(e) =>
                            updateItem(
                              'localMaterials',
                              index,
                              'qtyReq',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-blue-200 dark:border-blue-800 rounded-lg font-bold text-center text-blue-950 dark:text-blue-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </td>

                      <td className="py-3 px-2 bg-blue-50/40 dark:bg-blue-950/20">
                        <input
                          type="text"
                          value={item.qtyIssued}
                          onChange={(e) =>
                            updateItem('localMaterials', index, 'qtyIssued', e.target.value)
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          placeholder={item.uom || 'pcs'}
                          title="Values in UOM column placed under WHSE QUANTITY issued"
                        />
                      </td>

                      <td className="py-3 px-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-l border-indigo-100 dark:border-indigo-900/60">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyReceived}
                          onChange={(e) =>
                            updateItem(
                              'localMaterials',
                              index,
                              'qtyReceived',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="py-3 px-2 bg-indigo-50/40 dark:bg-indigo-950/20">
                        <input
                          type="number"
                          min="0"
                          value={item.qtyBalance}
                          onChange={(e) =>
                            updateItem(
                              'localMaterials',
                              index,
                              'qtyBalance',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-center text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        {stockAlert !== null ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            title={`Requested ${item.qtyReq} exceeds Paranaque stock (${stockAlert})`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>WH: {stockAlert}</span>
                          </span>
                        ) : item.partNumber ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow('localMaterials', index)}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Form Footer: Totals Bar & Authorization / Signatures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quantities summary card */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-200 mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              Requisition Totals Summary
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              Consolidated counts for Main Equipment &amp; Local Accessories
            </p>

            <div className="grid grid-cols-2 gap-3.5 text-center">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block">Total Requested</span>
                <span className="text-2xl font-bold text-blue-400 font-mono mt-0.5 block">
                  {sumReq}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block">Total Issued</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {sumIssued}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block">Total Received</span>
                <span className="text-2xl font-bold text-indigo-400 font-mono mt-0.5 block">
                  {sumReceived}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block">Fulfillment Rate</span>
                <span className="text-2xl font-bold text-amber-400 font-mono mt-0.5 block">
                  {sumReq > 0 ? Math.round((sumIssued / sumReq) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              General Remarks / Turn-over Notes
            </label>
            <textarea
              rows={2}
              value={doc.signatures.remarks}
              onChange={(e) =>
                onChange({
                  ...doc,
                  signatures: {
                    ...doc.signatures,
                    remarks: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Verified complete upon turnover from Paranaque WHS..."
            />
          </div>
        </div>

        {/* Signatures & Status Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Authorization &amp; Sign-off Grid
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Required signees matching MRF_template.xlsx Rows 47–56
              </p>
            </div>

            {/* Status Stamp Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => updateStatus('Accepted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  doc.signatures.status === 'Accepted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Accepted
              </button>

              <button
                type="button"
                onClick={() => updateStatus('Pending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  doc.signatures.status === 'Pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending
              </button>

              <button
                type="button"
                onClick={() => updateStatus('Rejected')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  doc.signatures.status === 'Rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejected
              </button>
            </div>
          </div>

          {/* Contact Details (Rows 47-48 in template) */}
          <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Nokia Inhouse Contact</span>
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                  Cells D47:G47
                </span>
              </label>
              <input
                type="text"
                value={doc.signatures.contactNokiaInhouse || ''}
                onChange={(e) =>
                  onChange({
                    ...doc,
                    signatures: {
                      ...doc.signatures,
                      contactNokiaInhouse: e.target.value,
                    },
                  })
                }
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NOKIA INHOUSE - JOHN CARLO RABANES/09669343065"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>DNA Subcon Contact</span>
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                  Cells D48:G48
                </span>
              </label>
              <input
                type="text"
                value={doc.signatures.contactSubcon || ''}
                onChange={(e) =>
                  onChange({
                    ...doc,
                    signatures: {
                      ...doc.signatures,
                      contactSubcon: e.target.value,
                    },
                  })
                }
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DNA SUBCON - EASTMOND MIRANDA/09543991868"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mt-5 text-xs">
            {/* Request By */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white block mb-2.5 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Request By
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.requestedBy.name}
                    onChange={(e) =>
                      updateSignatures('requestedBy', 'name', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Requisitioner Name"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.requestedBy.title || ''}
                    onChange={(e) =>
                      updateSignatures('requestedBy', 'title', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Field Engineer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={doc.signatures.requestedBy.date}
                    onChange={(e) =>
                      updateSignatures('requestedBy', 'date', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Prepared By */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white block mb-2.5 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Prepared By (Warehouse)
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.preparedBy.name}
                    onChange={(e) =>
                      updateSignatures('preparedBy', 'name', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Warehouse Personnel"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.preparedBy.title || ''}
                    onChange={(e) =>
                      updateSignatures('preparedBy', 'title', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WHS Supervisor"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={doc.signatures.preparedBy.date}
                    onChange={(e) =>
                      updateSignatures('preparedBy', 'date', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Received By */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white block mb-2.5 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Received By (Site Rep)
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.receivedBy.name}
                    onChange={(e) =>
                      updateSignatures('receivedBy', 'name', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Receiver Name"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={doc.signatures.receivedBy.title || ''}
                    onChange={(e) =>
                      updateSignatures('receivedBy', 'title', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Authorized Receiver"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={doc.signatures.receivedBy.date}
                    onChange={(e) =>
                      updateSignatures('receivedBy', 'date', e.target.value)
                    }
                    className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
