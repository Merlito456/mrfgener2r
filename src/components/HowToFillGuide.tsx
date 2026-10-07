import React, { useState } from 'react';
import {
  OFFICIAL_FILLED_MRF_BENCHMARK,
  ADDITIONAL_FILLED_SAMPLES,
} from '../utils/benchmarkMRF';
import { MRFDocument } from '../types/mrf';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  HelpCircle,
  Copy,
  Download,
  Info,
  Check,
  Package,
  Wrench,
  FileCheck2,
  FileText,
  BadgeAlert,
  CornerDownRight,
} from 'lucide-react';

interface HowToFillGuideProps {
  onLoadMRF: (doc: MRFDocument) => void;
  onGoToBuilder: () => void;
  onGoToPreview: () => void;
}

export const HowToFillGuide: React.FC<HowToFillGuideProps> = ({
  onLoadMRF,
  onGoToBuilder,
  onGoToPreview,
}) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'header' | 'main' | 'local' | 'quantities' | 'signatures'
  >('overview');
  const [loadedToast, setLoadedToast] = useState<string | null>(null);

  const handleApply = (sample: MRFDocument) => {
    onLoadMRF(sample);
    setLoadedToast(`Loaded ${sample.header.mrfNumber}`);
    setTimeout(() => setLoadedToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {loadedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">{loadedToast} loaded into Editor!</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <FileSpreadsheet className="w-5 h-5 text-blue-300" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Official Benchmark Standards
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Official Filled MRF Reference &amp; Fill-Up Guide
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Standardized operating procedure for completing the Nokia / Globe Telecom Material Request Form (MRF). Follow these structural rules, cell mappings, and pre-filled benchmarks to ensure 100% compliance with warehouse logistics and Excel template specifications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => handleApply(OFFICIAL_FILLED_MRF_BENCHMARK)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Load Official Sample (MIN1371-GNG-701)</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={onGoToBuilder}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-100 text-xs font-medium border border-white/10 transition-colors"
              >
                <span>Edit Current Draft</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onGoToPreview}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-medium border border-blue-400/30 transition-colors"
              >
                <span>View Sheet</span>
                <FileCheck2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Sample Showcase Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Filled MRF Benchmark</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matches <strong className="text-slate-800 dark:text-slate-200 font-mono">NOKIA-FN_06302026-004_MIN1371-GNG-701_MF2_JOHN_CARLO_RABANES.xlsx</strong>:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Official Sample MIN1371-GNG-701 */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Official Standard
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  8 Main Equipment &bull; 16 Local Materials
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                MIN1371 - GNG_701 (MF2 Deployment)
              </h4>
              <p className="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold mt-0.5">
                {OFFICIAL_FILLED_MRF_BENCHMARK.header.mrfNumber}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Origin Warehouse:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Paranaque WHS (Cell B6)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Destination Area:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">CAGAYAN DE ORO (Cells E8:G8)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Site ID:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">MIN1371  - GNG_701 (Cells E10:G10)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Site Address:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">HUAWEI CABINET CORNER CUERDORIZAL ST... (E11:G12)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Requisitioner:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">JOHN CARLO RABANES (A48:A49)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleApply(OFFICIAL_FILLED_MRF_BENCHMARK)}
              className="mt-4 w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Load Exact MIN1371 Sample Into Editor</span>
            </button>
          </div>

          {/* Card 2: Summary of Row Mappings */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 flex flex-col justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Cell Placement Rules
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                Critical Coordinate Corrections
              </h4>
              <ul className="mt-2.5 space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Site ID</strong> is in merged <code>E10:G10</code> (<code>B10</code> is left empty).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Destination</strong> is in merged <code>E8:G8</code> (<code>B8</code> is left empty).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Main Items (Rows 18–25)</strong>: Quantity is in Col D (REQ). Package No (Col C) and Issued/Received/Bal are left empty.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Local Materials (Rows 27–46)</strong>: Quantity is in Col D, and <strong>UOM (pcs, pc, m)</strong> is in Column E!</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Contacts (Rows 47–48)</strong>: Merged <code>D47:G47</code> (Nokia Inhouse) and <code>D48:G48</code> (Subcon).</span>
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-900/60 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Template: SAMPLE (MF-2) &bull; 57 Rows
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Interactive Guide Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-6 py-3 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: '1. Overview & 7 Rules', icon: FileText },
            { id: 'header', label: '2. Form Header (Rows 6-12)', icon: Info },
            { id: 'main', label: '3. Main Equipment (Rows 18-25)', icon: Package },
            { id: 'local', label: '4. Local Materials (Rows 27-46)', icon: Wrench },
            { id: 'quantities', label: '5. Quantities & Balance', icon: CheckCircle2 },
            { id: 'signatures', label: '6. Sign-off & Acceptance', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Standard Fill-Up Architecture for MRF
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  The Material Request Form (MRF) serves as the legal turnover document between Nokia / Globe Telecom Warehouse Logistics and Field Subcontractors. The Excel spreadsheet follows an exact 57-row grid structure:
                </p>
              </div>

              {/* Anatomy Diagram Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/60 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    Exact Row Breakdown in MRF_template.xlsx
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 font-sans">
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0 w-20">Row 2:</span>
                      <span>Header Title: <strong className="text-slate-900 dark:text-white">Material Request Form</strong> (Merged A2:G2) with Nokia Logo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0 w-20">Rows 6–12:</span>
                      <span>Origin Warehouse, Request Date, Destination PLAID, Destination Name, Site ID, and Address box (E11:G12).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0 w-20">Rows 14–17:</span>
                      <span>Column Table Headers: PART NUMBER, DESCRIPTION, PACKAGE NO, WHSE REQ/ISSUED, ALCATEL RECEIVED/BALANCE.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0 w-20">Rows 18–25:</span>
                      <span><strong>Section 1: Main Equipment</strong> (Exactly 8 pre-formatted table rows). Shelves, Fan, Power Modules, NT Cards, LT Boards, and SFPs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0 w-20">Row 26:</span>
                      <span><strong>Section Divider Banner:</strong> <code className="bg-amber-100 dark:bg-amber-950/80 px-1 py-0.5 rounded text-amber-900 dark:text-amber-300">LOCAL MATERIALS/ ACCESSORIES</code> (Merged A26:G26).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-400 shrink-0 w-20">Rows 27–46:</span>
                      <span><strong>Section 2: Local Materials</strong> (Exactly 20 pre-formatted table rows). Patch cords, conduits, breakers, power cables, and installation consumables.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 shrink-0 w-20">Rows 47–56:</span>
                      <span><strong>Sign-off &amp; Authorization Block:</strong> Request by, Prepared by, Received by, <code className="bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.5 rounded text-indigo-900 dark:text-indigo-300">[ X ] Accepted</code> status, and MRF Reference Stamp.</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/60 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    The 7 Golden Rules of Filling the MRF
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">1.</span>
                      <span><strong>Verified Site:</strong> Destination PLAID must match a recognized site from the Blaine SCM Reservation database.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">2.</span>
                      <div>
                        <strong>Official MRF Format &amp; Two-Line Layout:</strong> Sheet name &amp; MRF Number must follow <code className="text-blue-700 dark:text-blue-300 font-mono font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">NOKIA-FN_[MMDDYYYY]-[SEQ]_[SITE_ID]_[EQUIPMENT_TYPE]_[SUBCON/WAREHOUSE/ENGINEER]</code>. In the official spreadsheet template (Rows 56 &amp; 57), the MRF name is written at the top line (F56), and when it exceeds the line (~47 characters), it automatically continues below on the second line (F57).
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">3.</span>
                      <span><strong>Dynamic Main Slot Expansion:</strong> Standard capacity is 8 slots (Rows 18–25). If items exceed 8, the template automatically inserts extra rows with matching borders, heights, and styles, cleanly shifting the Row 26 section divider.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">4.</span>
                      <span><strong>Dynamic Local Slot Expansion:</strong> Standard capacity is 20 slots (Rows 27 to 46). If local materials exceed 20, extra rows are automatically added with identical formatting while preserving authorization blocks.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">5.</span>
                      <span><strong>Balanced Quantities:</strong> Balance formula is <code className="font-mono font-bold">ISSUED - RECEIVED = 0</code> upon complete turnover.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">6.</span>
                      <span><strong>Package No &amp; UOM Placement:</strong> Do not fill Package No (leave blank). All values in the UOM column are copied and placed under the <strong>ISSUED column in WHSE QUANTITY</strong> (e.g., PC, pcs, m).</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">7.</span>
                      <span><strong>Clean Export:</strong> Export using pristine ExcelJS/JSZip direct modification to avoid Excel repair XML warnings.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADER */}
          {activeSection === 'header' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Form Header Block (Excel Rows 6–12)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                The top metadata section identifies who requested the material, where the items will be dispatched, and the exact site location:
              </p>

              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-bold w-28">Cell / Coordinate</th>
                      <th className="py-2.5 px-3 text-left font-bold w-48">Field Label</th>
                      <th className="py-2.5 px-3 text-left font-bold">Standard Value Example</th>
                      <th className="py-2.5 px-3 text-left font-bold">Guidelines &amp; Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">B6</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">FROM:</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Paranaque WHS</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Originating warehouse (e.g. Paranaque WHS, Manila NP WH, Cebu SBF WH, Davao SBF WH, or Nokia WH).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">E6:G6</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">DATE:</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">2026-09-15</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Date of material turnover or MRF generation. Merged across E6 to G6.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">B8</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">DESTINATION CODE:</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">MIN132-BA</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Site PLAID code (e.g. MIN132-BA, NCR2509, VIS2919).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">E8:G8</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">DESTINATION:</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">MIN132-BA Base Station</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Full verified site or hub name. Merged across E8 to G8.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">B10</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">SITE ID :</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">MIN132-BA</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Site identification code. Cell E10 is intentionally left clean to avoid redundant side-by-side text.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">E11:G12</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">SITE ADDRESS :</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">Brgy. Poblacion, Digos City, Davao del Sur, Mindanao</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Dedicated multiline address box. Populated in E11:G12 so long street addresses never truncate.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MAIN EQUIPMENT */}
          {activeSection === 'main' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Main Equipment Section (Excel Rows 18–25)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Max 8 items. Contains primary chassis, shelf, power modules, controller cards, and optical transceivers.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                  Limit: 8 Rows
                </span>
              </div>

              {/* Sample standard MF2 table */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-emerald-50 dark:bg-emerald-950/50 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-2 text-center w-12">Row</th>
                      <th className="py-2 px-3 text-left w-32 font-bold">PART NUMBER</th>
                      <th className="py-2 px-3 text-left font-bold">DESCRIPTION</th>
                      <th className="py-2 px-2 text-center w-24 font-bold">PKG NO</th>
                      <th className="py-2 px-2 text-center w-14 font-bold">REQ</th>
                      <th className="py-2 px-2 text-center w-14 font-bold">ISSUED</th>
                      <th className="py-2 px-2 text-center w-14 font-bold">REC</th>
                      <th className="py-2 px-2 text-center w-14 font-bold">BAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {OFFICIAL_FILLED_MRF_BENCHMARK.mainItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-1.5 px-2 text-center font-bold text-slate-400 dark:text-slate-500">
                          {18 + idx}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">
                          {item.partNumber}
                        </td>
                        <td className="py-1.5 px-3 font-sans text-slate-800 dark:text-slate-200">
                          {item.description}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-600 dark:text-slate-400">
                          {item.packageNo}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-blue-700 dark:text-blue-400">
                          {item.qtyReq}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          {item.qtyIssued}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-indigo-700 dark:text-indigo-400">
                          {item.qtyReceived}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                          {item.qtyBalance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Package Number Rule:</strong> Shelves, power units, and line cards use <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-900 dark:text-blue-200">PKG-01</code>. SFP pluggables and optical transceivers use <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-900 dark:text-blue-200">PKG-02</code>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL MATERIALS */}
          {activeSection === 'local' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Local Materials &amp; Accessories (Excel Rows 27–46)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Max 20 items. Separated from Main Equipment by the Row 26 yellow divider banner: <code className="bg-amber-100 dark:bg-amber-950/80 font-bold px-1 py-0.5 rounded text-amber-900 dark:text-amber-300">LOCAL MATERIALS/ ACCESSORIES</code>.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs">
                  Limit: 20 Rows
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/60 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Fiber &amp; Uplink Cables (<code className="font-mono">PKG-FIBER</code>)
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">Uplink LC-LC:</strong> 2 pcs 8m (or 3m/5m) Simplex patch cord.</li>
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">ODF Downlink SC/UPC-SC/APC:</strong> 16 pcs for 1-card MF2; 32 pcs for 2-card MF2.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/60 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Power &amp; Grounding (<code className="font-mono">PKG-PWR</code>)
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">Positive DC Power Cable:</strong> 2 pcs (10m, 15m, or 20m).</li>
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">Grounding Wire:</strong> 16MM Yellow/Green (5m or 10m). Never in LTC conduit!</li>
                  </ul>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/60 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Conduits &amp; Connectors (<code className="font-mono">PKG-CONDUIT</code>)
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">15 PA LTC + Connectors:</strong> For outdoor uplink if transport is outside. 1 uplink run requires 2 LC-LC cords for 1 SFP (1x distance + 2x connectors). 4 cords = 2 uplinks (2x distance + 4x connectors).</li>
                    <li>&bull; <strong className="text-slate-800 dark:text-slate-200">25 PA LTC + Connectors:</strong> For outdoor DC power cable runs.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/60 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    Consumables &amp; Hardware (<code className="font-mono">PKG-ACC</code>)
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    <li>&bull; Spiral Wrap (1 pack), Velcro tie 2m (1 roll), Labeller tape (1 roll).</li>
                    <li>&bull; Heat Shrinkable tubes: 8mm, 12mm, 16mm (2 pcs each).</li>
                    <li>&bull; Terminal lugs: 10mm2 (6 pcs), 16-10mm2 (2 pcs), 8mm (6 pcs), Cable shoes (4 pcs).</li>
                    <li>&bull; Silicon Sealant: <strong>Omitted</strong> (No available stock in warehouse).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUANTITIES */}
          {activeSection === 'quantities' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Quantity Columns &amp; The Alcatel Balance Formula
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                The four numeric columns tracking warehouse fulfillment and contractor receipt:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">Col D</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white block mt-1">WHSE REQ</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">Quantity requested by the rollout engineer based on site BoQ.</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Col E</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white block mt-1">WHSE ISSUED</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">Quantity officially released from Paranaque / Central Warehouse.</p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">Col F</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white block mt-1">ALCATEL RECEIVED</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">Quantity inspected and verified upon arrival at site.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Col G</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white block mt-1">ALCATEL BALANCE</span>
                  <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 mt-2">BALANCE = ISSUED - RECEIVED</p>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mt-1">Target = 0 (Fulfilled)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Automated Calculation Rule</span>
                </div>
                <p>
                  The MRF Generator automatically calculates <code>qtyBalance = Math.max(0, qtyIssued - qtyReceived)</code> as you type. Clicking &quot;Fulfill All&quot; automatically syncs Issued = Req and Received = Req, setting Balance to 0 across all items!
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SIGNATURES */}
          {activeSection === 'signatures' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Authorization, Sign-off Grid &amp; Acceptance Stamp (Rows 47–56)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Every valid MRF requires three distinct signatories and an official approval stamp:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    1. Request By (Field Engineer)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">The rollout engineer or project lead who surveyed the site and requested the bill of quantities.</p>
                  <div className="mt-3 font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <div><strong>Name:</strong> John Carlo Rabanes</div>
                    <div><strong>Title:</strong> Field Deployment Engineer</div>
                    <div><strong>Row:</strong> A48 &bull; Date: A50</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    2. Prepared By (Warehouse)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">The warehouse supervisor or custodian who staged and released the materials.</p>
                  <div className="mt-3 font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <div><strong>Name:</strong> Paranaque WHS Team</div>
                    <div><strong>Title:</strong> Warehouse Logistics Supervisor</div>
                    <div><strong>Row:</strong> B48 &bull; Date: B51</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    3. Received By (Subcontractor)
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">The authorized installer or subcon representative accepting materials on site.</p>
                  <div className="mt-3 font-mono text-[11px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <div><strong>Name:</strong> Authorized Subcon Rep</div>
                    <div><strong>Title:</strong> Site Acceptance Lead</div>
                    <div><strong>Row:</strong> C48 &bull; Date: C51</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-100 dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">Acceptance Stamp (Cell C54 / C56)</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Official status must be stamped as either <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded font-bold text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">[ X ] Accepted</code> or <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded font-bold text-rose-700 dark:text-rose-400 border border-slate-200 dark:border-slate-700">[ X ] Rejected</code>.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold font-mono shadow-xs">
                    [ X ] Accepted
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono">
                    [ &nbsp; ] Rejected
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
