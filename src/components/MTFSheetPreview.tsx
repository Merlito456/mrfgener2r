import React, { useState } from 'react';
import {
  MRFDocument,
  MTFActionDone,
  MTFConfig,
  MTFItemOverride,
  MTFMaterialsCategory,
  MTFTransferCategory,
} from '../types/mrf';
import {
  formatMTFExpectedDate,
  formatMTFLongDate,
  formatMTFShortDate,
  resolveMTFData,
} from '../utils/mtfSync';
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileSpreadsheet,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MTFSheetPreviewProps {
  doc: MRFDocument;
  onChange: (updated: MRFDocument) => void;
  onExportMTF: () => void;
  onPrint: () => void;
  onGoToBuilder: () => void;
}

const TRANSFER_CATEGORIES: MTFTransferCategory[] = [
  'WHSE TO WHSE',
  'WHSE TO SITE',
  'WHSE TO SUPPLIER',
  'SUPPLIER TO WHSE',
  'SUPPLIER TO SITE',
  'OTHERS',
  'SITE TO WHSE',
  'SITE TO SITE',
];

const MATERIALS_CATEGORIES: MTFMaterialsCategory[] = [
  'New',
  'Defective',
  'Repaired',
];

const ACTION_DONE_OPTIONS: MTFActionDone[] = ['None', 'Processed', 'Cancelled'];

const CheckboxCell: React.FC<{ checked: boolean; label: string }> = ({
  checked,
  label,
}) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-900 leading-tight">
    <span
      className={`inline-flex items-center justify-center w-3 h-3 border border-slate-700 text-[9px] font-bold leading-none ${
        checked ? 'bg-slate-900 text-white' : 'bg-white text-transparent'
      }`}
    >
      {checked ? '✓' : ''}
    </span>
    <span>{label}</span>
  </span>
);

export const MTFSheetPreview: React.FC<MTFSheetPreviewProps> = ({
  doc,
  onChange,
  onExportMTF,
  onPrint,
  onGoToBuilder,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);

  const mtf = resolveMTFData(doc);
  const hasCustomOverrides = Boolean(
    doc.mtf && Object.keys(doc.mtf).length > 0
  );

  const updateMTF = (patch: Partial<MTFConfig>) => {
    onChange({
      ...doc,
      mtf: {
        ...(doc.mtf || {}),
        ...patch,
      },
    });
  };

  const updateItemOverride = (
    sourceId: string,
    patch: Partial<MTFItemOverride>
  ) => {
    const currentOverrides = doc.mtf?.itemOverrides || {};
    onChange({
      ...doc,
      mtf: {
        ...(doc.mtf || {}),
        itemOverrides: {
          ...currentOverrides,
          [sourceId]: {
            ...(currentOverrides[sourceId] || {}),
            ...patch,
          },
        },
      },
    });
  };

  const resetMTFOverrides = () => {
    const { mtf: _removed, ...rest } = doc;
    onChange(rest);
  };

  // Pad to minimum 24 rows matching MTF_template.xlsx
  const displayRows = [...mtf.items];
  while (displayRows.length < 24) {
    displayRows.push({
      index: displayRows.length + 1,
      sourceId: `empty_${displayRows.length}`,
      sourceGroup: 'Local Material',
      itemType: '',
      partNumber: '',
      description: '',
      qty: '',
      uom: '',
      serialNumber: '',
      assetTag: '',
      na: '',
      status: '',
    });
  }

  const extraRows = Math.max(0, mtf.items.length - 24);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Top Preview Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Materials Transfer Form (MTF) Generator
            </h3>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            title="Items, destination, warehouse, date, and requestor automatically follow your active MRF"
          >
            <RefreshCw className="w-3 h-3" />
            Synced from MRF ({mtf.items.length} items)
          </span>
          {extraRows > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Auto-Expanded: +{extraRows} rows
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onGoToBuilder}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
            title="Edit source MRF items or site info"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Source MRF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomize((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
              showCustomize
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>MTF Fields &amp; Checkboxes</span>
            {showCustomize ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 font-medium text-slate-700 dark:text-slate-200">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportMTF}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export Official MTF .XLSX</span>
          </button>
        </div>
      </div>

      {/* Collapsible MTF Customization & Override Drawer */}
      {showCustomize && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-5 text-xs no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                MTF-Specific Details &amp; Overrides
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Header, items, and requestor automatically mirror your active MRF. Customize any MTF field below if needed.
              </p>
            </div>
            {hasCustomOverrides && (
              <button
                type="button"
                onClick={resetMTFOverrides}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Overrides to MRF Sync</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                MTF Number (Cell K3)
              </label>
              <input
                type="text"
                value={mtf.mtfNumber}
                onChange={(e) => updateMTF({ mtfNumber: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project Name (Cell C2)
              </label>
              <input
                type="text"
                value={mtf.projectName}
                onChange={(e) => updateMTF({ projectName: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date Prepared (Cell K2)
              </label>
              <input
                type="date"
                value={mtf.datePrepared}
                onChange={(e) => updateMTF({ datePrepared: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date Expected on Destination (J12)
              </label>
              <input
                type="date"
                value={mtf.dateExpected}
                onChange={(e) => updateMTF({ dateExpected: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Origin Site Name (Cell C10)
              </label>
              <input
                type="text"
                value={mtf.originSiteName}
                onChange={(e) => updateMTF({ originSiteName: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Origin Address (Cell C11)
              </label>
              <input
                type="text"
                value={mtf.originAddress}
                onChange={(e) => updateMTF({ originAddress: e.target.value })}
                placeholder="Optional origin warehouse address"
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination PLA ID (Cell J9)
              </label>
              <input
                type="text"
                value={mtf.destinationPlaid}
                onChange={(e) => updateMTF({ destinationPlaid: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Site Name (Cell J10)
              </label>
              <input
                type="text"
                value={mtf.destinationSiteName}
                onChange={(e) =>
                  updateMTF({ destinationSiteName: e.target.value })
                }
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Address (Cell J11)
              </label>
              <input
                type="text"
                value={mtf.destinationAddress}
                onChange={(e) =>
                  updateMTF({ destinationAddress: e.target.value })
                }
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Requestor Name &amp; Title (F45)
              </label>
              <input
                type="text"
                value={mtf.requestedByName}
                onChange={(e) => updateMTF({ requestedByName: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Requestor Contact (F48)
              </label>
              <input
                type="text"
                value={mtf.requestedByContact}
                onChange={(e) =>
                  updateMTF({ requestedByContact: e.target.value })
                }
                placeholder="+639669343065"
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Categories, Action Done, Manual Hauling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transfer Category
              </label>
              <select
                value={mtf.transferCategory}
                onChange={(e) =>
                  updateMTF({
                    transferCategory: e.target.value as MTFTransferCategory,
                  })
                }
                className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {TRANSFER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Materials Category
              </label>
              <select
                value={mtf.materialsCategory}
                onChange={(e) =>
                  updateMTF({
                    materialsCategory: e.target.value as MTFMaterialsCategory,
                  })
                }
                className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {MATERIALS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Action Done
              </label>
              <select
                value={mtf.actionDone}
                onChange={(e) =>
                  updateMTF({ actionDone: e.target.value as MTFActionDone })
                }
                className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {ACTION_DONE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Manual Hauling (Origin)
              </label>
              <select
                value={mtf.manualHaulingOrigin}
                onChange={(e) =>
                  updateMTF({
                    manualHaulingOrigin: e.target.value as 'Yes' | 'No' | '',
                  })
                }
                className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="">Unchecked</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Manual Hauling (Dest.)
              </label>
              <select
                value={mtf.manualHaulingDestination}
                onChange={(e) =>
                  updateMTF({
                    manualHaulingDestination: e.target.value as
                      | 'Yes'
                      | 'No'
                      | '',
                  })
                }
                className="w-full h-9 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="">Unchecked</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Remarks & Signees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comments / Remarks
              </label>
              <input
                type="text"
                value={mtf.remarks}
                onChange={(e) => updateMTF({ remarks: e.target.value })}
                placeholder="Optional transfer notes or instructions"
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                L-NTP Number
              </label>
              <input
                type="text"
                value={mtf.lntpNumber}
                onChange={(e) => updateMTF({ lntpNumber: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Approved By (Requestor IS)
              </label>
              <input
                type="text"
                value={mtf.approvedByName}
                onChange={(e) => updateMTF({ approvedByName: e.target.value })}
                className="w-full h-9 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Optional Serial Number / Asset Tag editor for synced items */}
          {mtf.items.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                Optional Serial Numbers / Asset Tags / Item Types ({mtf.items.length} synced items)
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="py-1.5 px-2.5 w-10">#</th>
                      <th className="py-1.5 px-2.5">Part Number</th>
                      <th className="py-1.5 px-2.5">Description</th>
                      <th className="py-1.5 px-2.5 w-24">Item Type</th>
                      <th className="py-1.5 px-2.5 w-36">Serial Number</th>
                      <th className="py-1.5 px-2.5 w-28">Asset Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {mtf.items.map((item) => (
                      <tr key={item.sourceId}>
                        <td className="py-1 px-2.5 font-mono">{item.index}</td>
                        <td className="py-1 px-2.5 font-mono font-semibold">
                          {item.partNumber}
                        </td>
                        <td className="py-1 px-2.5 max-w-[220px] truncate">
                          {item.description}
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={item.itemType}
                            onChange={(e) =>
                              updateItemOverride(item.sourceId, {
                                itemType: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-[11px]"
                            placeholder="Type"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={item.serialNumber}
                            onChange={(e) =>
                              updateItemOverride(item.sourceId, {
                                serialNumber: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 font-mono text-[11px]"
                            placeholder="Serial #"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={item.assetTag}
                            onChange={(e) =>
                              updateItemOverride(item.sourceId, {
                                assetTag: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 font-mono text-[11px]"
                            placeholder="Asset Tag"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable MTF Sheet Canvas matching MTF_template.xlsx */}
      <div className="overflow-x-auto bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
        <div
          id="mtf-printable-sheet"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-8 w-[1050px] min-w-[1050px] border border-slate-300 print:w-full print:border-none print:shadow-none print:p-0 print:transform-none font-sans"
        >
          {/* Row 1: Header Title */}
          <div className="border-2 border-slate-900">
            <div className="bg-white border-b border-slate-900 px-4 py-2.5 flex items-center justify-between">
              <span className="text-blue-700 font-black text-lg tracking-widest">
                NOKIA
              </span>
              <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase text-center flex-1 pr-14">
                MATERIALS TRANSFER FORM (MTF)
              </h1>
            </div>

            {/* Rows 2-3: Project Name, Date Prepared, MTF Number */}
            <div className="grid grid-cols-12 border-b border-slate-900 text-[11px]">
              <div className="col-span-7 border-r border-slate-900 flex flex-col justify-between">
                <div className="grid grid-cols-7 border-b border-slate-400">
                  <div className="col-span-2 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    PROJECT NAME:
                  </div>
                  <div className="col-span-5 px-2.5 py-1.5 font-semibold text-slate-800">
                    {mtf.projectName}
                  </div>
                </div>
                <div className="px-2.5 py-1 text-[10px] text-slate-400 italic">
                  Synced with MRF: {doc.header.mrfNumber || 'Untitled'}
                </div>
              </div>
              <div className="col-span-5">
                <div className="grid grid-cols-5 border-b border-slate-400">
                  <div className="col-span-2 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    Date Prepared:
                  </div>
                  <div className="col-span-3 px-2.5 py-1.5 font-semibold text-center">
                    {formatMTFShortDate(mtf.datePrepared)}
                  </div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="col-span-2 px-2.5 py-2 font-bold bg-slate-50 border-r border-slate-300 flex items-center">
                    MTF Number:
                  </div>
                  <div className="col-span-3 px-2.5 py-2 font-mono font-bold text-[11px] text-blue-950 bg-blue-50/40 break-all flex items-center justify-center text-center">
                    {mtf.mtfNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Rows 4-7: Transfer Category, Materials Category, Action Done */}
            <div className="grid grid-cols-12 border-b border-slate-900 text-[10px]">
              {/* Transfer Category (cols 1-7) */}
              <div className="col-span-7 border-r border-slate-900 p-2">
                <div className="font-bold text-slate-800 mb-1.5">
                  TRANSFER CATEGORY:
                </div>
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-2">
                  <CheckboxCell
                    checked={mtf.transferCategory === 'WHSE TO WHSE'}
                    label="WHSE TO WHSE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'SUPPLIER TO WHSE'}
                    label="SUPPLIER TO WHSE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'SITE TO WHSE'}
                    label="SITE TO WHSE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'WHSE TO SITE'}
                    label="WHSE TO SITE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'SUPPLIER TO SITE'}
                    label="SUPPLIER TO SITE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'SITE TO SITE'}
                    label="SITE TO SITE"
                  />
                  <CheckboxCell
                    checked={mtf.transferCategory === 'WHSE TO SUPPLIER'}
                    label="WHSE TO SUPPLIER"
                  />
                  <div className="col-span-2 flex items-center gap-1.5">
                    <CheckboxCell
                      checked={mtf.transferCategory === 'OTHERS'}
                      label="OTHERS:"
                    />
                    {mtf.transferCategory === 'OTHERS' && mtf.othersText && (
                      <span className="border-b border-slate-500 px-1 font-semibold">
                        {mtf.othersText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Materials Category (cols 8-9) */}
              <div className="col-span-3 border-r border-slate-900 p-2">
                <div className="font-bold text-slate-800 mb-1.5">
                  MATERIALS CATEGORY:
                </div>
                <div className="flex flex-col gap-1.5">
                  <CheckboxCell
                    checked={mtf.materialsCategory === 'New'}
                    label="New"
                  />
                  <CheckboxCell
                    checked={mtf.materialsCategory === 'Defective'}
                    label="Defective"
                  />
                  <CheckboxCell
                    checked={mtf.materialsCategory === 'Repaired'}
                    label="Repaired"
                  />
                </div>
              </div>

              {/* Action Done (cols 10-12) */}
              <div className="col-span-2 p-2">
                <div className="font-bold text-slate-800 mb-1.5">
                  ACTION DONE:
                </div>
                <div className="flex flex-col gap-1.5">
                  <CheckboxCell
                    checked={mtf.actionDone === 'Processed'}
                    label="Processed"
                  />
                  <CheckboxCell
                    checked={mtf.actionDone === 'Cancelled'}
                    label="Cancelled"
                  />
                </div>
              </div>
            </div>

            {/* Rows 9-14: Origin & Destination Details + Manual Hauling */}
            <div className="grid grid-cols-12 border-b border-slate-900 text-[11px]">
              {/* Left: Origin */}
              <div className="col-span-5 border-r border-slate-900 divide-y divide-slate-300">
                <div className="h-6 bg-slate-50/40" />
                <div className="grid grid-cols-5">
                  <div className="col-span-2 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    ORIGIN_SITE NAME:
                  </div>
                  <div className="col-span-3 px-2.5 py-1.5 font-bold text-slate-900">
                    {mtf.originSiteName}
                  </div>
                </div>
                <div className="grid grid-cols-5 min-h-[40px]">
                  <div className="col-span-2 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    ORIGIN_ADDRESS:
                  </div>
                  <div className="col-span-3 px-2.5 py-1.5 text-slate-800">
                    {mtf.originAddress}
                  </div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="col-span-2 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300 text-[10px]">
                    MANUAL HAULING:*
                  </div>
                  <div className="col-span-3 px-2.5 py-1.5 flex items-center gap-4">
                    <CheckboxCell
                      checked={mtf.manualHaulingOrigin === 'Yes'}
                      label="Yes"
                    />
                    <CheckboxCell
                      checked={mtf.manualHaulingOrigin === 'No'}
                      label="No"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Destination */}
              <div className="col-span-7 divide-y divide-slate-300">
                <div className="grid grid-cols-7">
                  <div className="col-span-3 px-2.5 py-1 font-bold bg-slate-50 border-r border-slate-300">
                    DESTINATION_PLA ID:
                  </div>
                  <div className="col-span-4 px-2.5 py-1 font-mono font-bold text-slate-900">
                    {mtf.destinationPlaid}
                  </div>
                </div>
                <div className="grid grid-cols-7">
                  <div className="col-span-3 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    DESTINATION_SITE NAME:
                  </div>
                  <div className="col-span-4 px-2.5 py-1.5 font-bold text-slate-900">
                    {mtf.destinationSiteName}
                  </div>
                </div>
                <div className="grid grid-cols-7 min-h-[40px]">
                  <div className="col-span-3 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300">
                    DESTINATION_ADDRESS:
                  </div>
                  <div className="col-span-4 px-2.5 py-1.5 text-slate-800 text-[10px] leading-snug">
                    {mtf.destinationAddress}
                  </div>
                </div>
                <div className="grid grid-cols-7">
                  <div className="col-span-3 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300 text-[10px]">
                    DATE EXPECTED ON DESTINATION:
                  </div>
                  <div className="col-span-4 px-2.5 py-1.5 font-semibold text-slate-900">
                    {formatMTFExpectedDate(mtf.dateExpected)}
                  </div>
                </div>
                <div className="grid grid-cols-7">
                  <div className="col-span-3 px-2.5 py-1.5 font-bold bg-slate-50 border-r border-slate-300 text-[10px]">
                    MANUAL HAULING:*
                  </div>
                  <div className="col-span-4 px-2.5 py-1.5 flex items-center gap-5">
                    <CheckboxCell
                      checked={mtf.manualHaulingDestination === 'Yes'}
                      label="Yes"
                    />
                    <CheckboxCell
                      checked={mtf.manualHaulingDestination === 'No'}
                      label="No"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 15: Logistics RFQ Note & Section Banners */}
            <div className="grid grid-cols-15 border-b border-slate-900 text-[10px] font-bold bg-slate-100">
              <div className="col-span-9 px-2.5 py-1 italic font-normal text-slate-700 border-r border-slate-400">
                *Logistics Team to ensure Logistics-RFQ (L-RFQ) is properly filled out.
              </div>
              <div className="col-span-2 px-2 py-1 text-center border-r border-slate-400 bg-blue-100/70">
                REQUESTOR
              </div>
              <div className="col-span-3 px-2 py-1 text-center border-r border-slate-400 bg-amber-100/70">
                ROLL-OUT
              </div>
              <div className="col-span-1 px-1 py-1 text-center bg-slate-200">
                STATUS
              </div>
            </div>

            {/* Rows 16-42: Items Table */}
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-900 font-bold text-center divide-x divide-slate-400">
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[45px]">
                    Item No.
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[85px]">
                    Item Type/Group
                  </th>
                  <th rowSpan={2} className="py-1.5 px-2 w-[135px]">
                    NSB ITEM CODE / PART NUMBER
                  </th>
                  <th rowSpan={2} className="py-1.5 px-2 text-left">
                    DESCRIPTION
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[58px]">
                    SIP/QTY
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[48px]">
                    U/M
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[105px]">
                    SERIAL NUMBER
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[80px]">
                    ASSET TAG
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 w-[42px]">
                    N/A
                  </th>
                  <th className="py-0.5 px-1 w-[68px] border-b border-slate-400">
                    COMPLETE
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-900 font-bold text-center divide-x divide-slate-400">
                  <th className="py-0.5 px-1">OPEN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {displayRows.map((row) => (
                  <tr
                    key={row.sourceId}
                    className="divide-x divide-slate-300 h-[21px] hover:bg-slate-50/70"
                  >
                    <td className="px-1.5 py-0.5 text-center font-mono text-slate-600">
                      {row.index}
                    </td>
                    <td className="px-1.5 py-0.5 text-center text-slate-700">
                      {row.itemType}
                    </td>
                    <td className="px-2 py-0.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {row.partNumber}
                    </td>
                    <td className="px-2 py-0.5 text-slate-900">
                      {row.description}
                    </td>
                    <td className="px-1.5 py-0.5 text-center font-mono font-bold text-slate-900">
                      {row.qty}
                    </td>
                    <td className="px-1.5 py-0.5 text-center font-mono text-slate-700">
                      {row.uom}
                    </td>
                    <td className="px-1.5 py-0.5 font-mono text-slate-700">
                      {row.serialNumber}
                    </td>
                    <td className="px-1.5 py-0.5 font-mono text-slate-700">
                      {row.assetTag}
                    </td>
                    <td className="px-1.5 py-0.5 text-center text-slate-700">
                      {row.na}
                    </td>
                    <td className="px-1.5 py-0.5 text-center text-slate-700">
                      {row.status}
                    </td>
                  </tr>
                ))}

                {/* Row 42 + extra: NOTHING FOLLOWS */}
                <tr className="divide-x divide-slate-300 h-[22px] border-t border-slate-900 bg-slate-50/60">
                  <td className="px-1.5 py-0.5" />
                  <td className="px-1.5 py-0.5" />
                  <td className="px-2 py-0.5" />
                  <td className="px-2 py-0.5 text-center font-bold tracking-wider text-slate-800">
                    NOTHING FOLLOWS
                  </td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>

            {/* Rows 43-60: Remarks & 3x3 Signature Matrix */}
            <div className="grid grid-cols-15 border-t-2 border-slate-900 text-[10px]">
              {/* Left Column: COMMENTS/REMARKS (Cols A-E, rows 43-60) */}
              <div className="col-span-5 border-r border-slate-900 p-2.5 flex flex-col justify-between min-h-[240px]">
                <div>
                  <div className="font-bold text-slate-900 mb-1.5">
                    COMMENTS/REMARKS:
                  </div>
                  <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {mtf.remarks}
                  </div>
                </div>
              </div>

              {/* Right Columns: 3x3 Signature Grid (Cols F-O) */}
              <div className="col-span-10 divide-y divide-slate-900">
                {/* Row 43-48 */}
                <div className="grid grid-cols-3 divide-x divide-slate-900">
                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">REQUESTED BY:</div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (Requestor)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px]">
                        {mtf.requestedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatMTFLongDate(mtf.requestedByDate)}
                        </span>
                      </div>
                      <div>
                        Contact Number:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {mtf.requestedByContact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">RELEASED BY:</div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (ALU Logistics &amp; Whse)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px]">
                        {mtf.releasedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatMTFLongDate(mtf.releasedByDate)}
                        </span>
                      </div>
                      <div>
                        Contact Number:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {mtf.releasedByContact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px] bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">
                        L-NTP Number:
                      </div>
                      <div className="font-mono font-bold text-slate-900 mt-1">
                        {mtf.lntpNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 49-54 */}
                <div className="grid grid-cols-3 divide-x divide-slate-900">
                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">APPROVED BY:</div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (Requestor&apos;s IS)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px]">
                        {mtf.approvedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>Date: {formatMTFLongDate(mtf.approvedByDate)}</div>
                      <div>Contact Number: {mtf.approvedByContact}</div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">
                        MTF PROCESSED BY:
                      </div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (Warehouse/Origin)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px] text-center">
                        {mtf.processedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>Date: {formatMTFLongDate(mtf.processedByDate)}</div>
                      <div>Contact Number: {mtf.processedByContact}</div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">
                        ACKNOWLEDGED BY:
                      </div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (LSP/Forwarder)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px] text-center">
                        {mtf.acknowledgedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date: {formatMTFLongDate(mtf.acknowledgedByDate)}
                      </div>
                      <div>Contact Number: {mtf.acknowledgedByContact}</div>
                    </div>
                  </div>
                </div>

                {/* Row 55-60 */}
                <div className="grid grid-cols-3 divide-x divide-slate-900">
                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">
                        CANCELLATION ADVISE:
                      </div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (Requestor)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px]">
                        {mtf.cancellationAdviseName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date: {formatMTFLongDate(mtf.cancellationAdviseDate)}
                      </div>
                      <div>Contact Number: {mtf.cancellationAdviseContact}</div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">
                        APPROVED FOR RELEASE BY:
                      </div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (ALU Logistics &amp; Whse)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px]">
                        {mtf.approvedForReleaseByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date:{' '}
                        {formatMTFLongDate(mtf.approvedForReleaseByDate)}
                      </div>
                      <div>
                        Contact Number: {mtf.approvedForReleaseByContact}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col justify-between min-h-[82px]">
                    <div>
                      <div className="font-bold text-slate-900">
                        MATERIALS RECEIVED BY:
                      </div>
                      <div className="text-[9px] text-slate-600 mb-1">
                        (Destination)
                      </div>
                      <div className="font-bold text-slate-900 text-[10px] text-center">
                        {mtf.materialsReceivedByName}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1 mt-1">
                      <div className="text-center text-slate-500">
                        Name &amp; Signature
                      </div>
                      <div>
                        Date: {formatMTFLongDate(mtf.materialsReceivedByDate)}
                      </div>
                      <div>
                        Contact Number: {mtf.materialsReceivedByContact}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
