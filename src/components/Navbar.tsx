import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Save,
  PlusCircle,
  FolderOpen,
  Boxes,
  MapPin,
  Layers,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { MRFDocument } from '../types/mrf';
import { useTheme } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  currentDoc: MRFDocument;
  activeTab: 'builder' | 'preview' | 'guide' | 'catalog' | 'sites';
  setActiveTab: (tab: 'builder' | 'preview' | 'guide' | 'catalog' | 'sites') => void;
  onNewMRF: () => void;
  onOpenWizard: () => void;
  onSaveMRF: () => void;
  onOpenHistory: () => void;
  onOpenDataManager: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onLoadBenchmark?: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDoc,
  activeTab,
  setActiveTab,
  onNewMRF,
  onOpenWizard: _onOpenWizard,
  onSaveMRF,
  onOpenHistory,
  onOpenDataManager,
  onExportExcel,
  onPrint,
  onLoadBenchmark: _onLoadBenchmark,
  isSaving,
}) => {
  const { isDark } = useTheme();

  const statusColor =
    currentDoc.signatures.status === 'Accepted'
      ? isDark
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : currentDoc.signatures.status === 'Rejected'
      ? isDark
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        : 'bg-rose-50 text-rose-800 border-rose-300'
      : isDark
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-amber-50 text-amber-800 border-amber-300';

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-150 ${
        isDark
          ? 'bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md'
          : 'bg-white border-b border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top Utility Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2 gap-4">
          {/* Logo & title */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`font-bold text-lg tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  MRF Generator
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  Nokia &bull; OLT
                </span>
              </div>
              <p
                className={`text-xs hidden sm:block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Material Request Form &bull; Globe Telecom Standard
              </p>
            </div>
          </div>

          {/* Current MRF ID pill and status (Desktop) */}
          <div
            className={`hidden xl:flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap border shrink-0 ${
              isDark
                ? 'bg-slate-800/90 border-slate-700/80 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={currentDoc.header.mrfNumber || 'Untitled Form'}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Active MRF:
            </span>
            <span className="font-mono font-bold max-w-[200px] truncate block">
              {currentDoc.header.mrfNumber || 'Untitled Form'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${statusColor}`}
            >
              {currentDoc.signatures.status}
            </span>
          </div>

          {/* Action Buttons Toolbar with Theme Switcher (Roomy, spaced, never cramped) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Colorway & Theme Switcher (Light / Dark palettes) */}
            <ThemeSelector />

            <button
              type="button"
              onClick={onNewMRF}
              className={`hidden md:inline-flex items-center gap-2 h-10 px-3.5 text-xs font-semibold rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap shrink-0 shadow-2xs ${
                isDark
                  ? 'text-slate-200 bg-slate-800/90 hover:bg-slate-700 border-slate-700/80'
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200'
              }`}
              title="Create new blank MRF"
            >
              <PlusCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>New MRF</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className={`inline-flex items-center gap-2 h-10 px-3.5 text-xs font-semibold rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap shrink-0 shadow-2xs ${
                isDark
                  ? 'text-slate-200 bg-slate-800/90 hover:bg-slate-700 border-slate-700/80'
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200'
              }`}
              title="View saved drafts"
            >
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Saved MRFs</span>
            </button>

            <button
              type="button"
              onClick={onSaveMRF}
              className={`inline-flex items-center gap-2 h-10 px-3.5 text-xs font-semibold rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap shrink-0 shadow-2xs ${
                isDark
                  ? 'text-slate-200 bg-slate-800/90 hover:bg-slate-700 border-slate-700/80'
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200'
              }`}
              title="Save current changes to local draft"
            >
              <Save className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className={`hidden sm:inline-flex items-center gap-2 h-10 px-3.5 text-xs font-semibold rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap shrink-0 shadow-2xs ${
                isDark
                  ? 'text-slate-200 bg-slate-800/90 hover:bg-slate-700 border-slate-700/80'
                  : 'text-slate-700 bg-white hover:bg-slate-100 border-slate-200'
              }`}
              title="Print official form or export to PDF"
            >
              <Printer className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 h-10 px-4.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              title="Export genuine Excel file matching MRF_template.xlsx without XML errors"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export Official .XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation Row */}
      <div
        className={`border-t px-4 sm:px-6 lg:px-8 transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800/80'
            : 'bg-slate-50/80 border-slate-200/80'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'builder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>MRF Form Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Official Sheet Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark
                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60'
                  : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>How To Fill MRF</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'guide'
                    ? 'bg-emerald-700 text-white'
                    : isDark
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Guide &amp; Benchmark
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Items Catalog (459 items)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sites')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'sites'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Mindanao Sites (3,459)</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5 py-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDataManager}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Template & Inventory Data Source"
            >
              Data Sources
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
