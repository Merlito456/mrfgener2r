import React, { useRef, useState } from 'react';
import { CatalogItem, SiteRecord } from '../types/mrf';
import { parseInventoryXlsxFile } from '../utils/catalog';
import {
  Download,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCatalog: (newItems: CatalogItem[], newSites: SiteRecord[]) => void;
  onSetCustomTemplate: (buffer: ArrayBuffer | null) => void;
  hasCustomTemplate: boolean;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdateCatalog,
  onSetCustomTemplate,
  hasCustomTemplate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inventoryInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInventoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadMessage(null);
    setErrorMessage(null);

    try {
      const { items, sites } = await parseInventoryXlsxFile(file);
      onUpdateCatalog(items, sites);
      setUploadMessage(
        `Successfully loaded ${items.length} items and ${sites.length} sites from "${file.name}"!`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        `Failed to parse Excel file: ${err.message || 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadMessage(null);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      onSetCustomTemplate(buffer);
      setUploadMessage(`Successfully installed custom MRF template: "${file.name}"!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        `Failed to load custom template: ${err.message || 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-white">
                Data Sources &amp; Template Manager
              </h3>
              <p className="text-xs text-slate-400">
                Official files provided via Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Status feedback */}
          {uploadMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Built-in Files */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Official Source Files (Included)
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              Directly loaded from your provided Google Drive folder. You can download the pristine copies below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="/MRF_template.xlsx"
                download="MRF_template.xlsx"
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-slate-800 dark:text-slate-100 font-medium transition-colors"
              >
                <div className="truncate">
                  <span className="font-bold block">MRF_template.xlsx</span>
                  <span className="text-[11px] text-slate-400">Official form template</span>
                </div>
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
              </a>

              <a
                href="/Blaine_Inventory_Report.xlsx"
                download="Blaine-OLT Inventory Report 03112026.xlsx"
                className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-slate-800 dark:text-slate-100 font-medium transition-colors"
              >
                <div className="truncate">
                  <span className="font-bold block truncate">Blaine Inventory Report</span>
                  <span className="text-[11px] text-slate-400">459 items &bull; 368 KB</span>
                </div>
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
              </a>
            </div>
          </div>

          {/* Section 2: Upload new inventory file */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800/40">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Upload Updated Inventory Report (.xlsx)
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              Have an updated stock spreadsheet? Upload it here to instantly refresh the item catalog and warehouse counts in real time.
            </p>

            <input
              type="file"
              ref={inventoryInputRef}
              accept=".xlsx,.xls"
              onChange={handleInventoryUpload}
              className="hidden"
            />

            <button
              disabled={isProcessing}
              onClick={() => inventoryInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Processing Workbook...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Select New Inventory Report (.xlsx)</span>
                </>
              )}
            </button>
          </div>

          {/* Section 3: Custom MRF template upload */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Custom MRF Template (.xlsx)
              </h4>
              {hasCustomTemplate && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Custom Template Active
                </span>
              )}
            </div>
            <p className="text-slate-600 text-xs">
              Upload a customized version of MRF_template.xlsx to override the default template structure.
            </p>

            <input
              type="file"
              ref={templateInputRef}
              accept=".xlsx"
              onChange={handleTemplateUpload}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                disabled={isProcessing}
                onClick={() => templateInputRef.current?.click()}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Upload Custom Template</span>
              </button>

              {hasCustomTemplate && (
                <button
                  onClick={() => {
                    onSetCustomTemplate(null);
                    setUploadMessage('Reset to default official MRF template.');
                  }}
                  className="py-2 px-3 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                >
                  Reset Default
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
