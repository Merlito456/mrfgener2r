import React, { useState } from 'react';
import { MRFDocument } from '../types/mrf';
import { splitMRFNumber } from '../utils/storage';
import { Download, Printer, ZoomIn, ZoomOut, FileSpreadsheet } from 'lucide-react';

interface MRFSheetPreviewProps {
  doc: MRFDocument;
  onExportExcel: () => void;
  onPrint: () => void;
}

export const MRFSheetPreview: React.FC<MRFSheetPreviewProps> = ({
  doc,
  onExportExcel,
  onPrint,
}) => {
  const [zoom, setZoom] = useState<number>(100);

  // Template ensures minimum 8 main item slots and 20 local material slots
  const mainItemsSlots = [...doc.mainItems];
  while (mainItemsSlots.length < 8) {
    mainItemsSlots.push({
      id: `empty_main_${mainItemsSlots.length}`,
      partNumber: '',
      description: '',
      packageNo: '',
      uom: '',
      qtyReq: '',
      qtyIssued: '',
      qtyReceived: '',
      qtyBalance: '',
    });
  }

  const localItemsSlots = [...doc.localMaterials];
  while (localItemsSlots.length < 20) {
    localItemsSlots.push({
      id: `empty_local_${localItemsSlots.length}`,
      partNumber: '',
      description: '',
      packageNo: '',
      uom: '',
      qtyReq: '',
      qtyIssued: '',
      qtyReceived: '',
      qtyBalance: '',
    });
  }

  const extraMain = Math.max(0, doc.mainItems.length - 8);
  const extraLocal = Math.max(0, doc.localMaterials.length - 20);
  const mrfSplit = splitMRFNumber(doc.header.mrfNumber || '', 47);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Top Preview Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Official Template Spreadsheet Preview
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            Sheet: {doc.header.mrfNumber || 'MRF_Form'}
          </span>
          {mrfSplit.isOverflow && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              title="The MRF name is written on the top line and automatically continues on the second line below"
            >
              Two-Line MRF ({mrfSplit.line1.length} + {mrfSplit.line2.length} chars)
            </span>
          )}
          {(extraMain > 0 || extraLocal > 0) && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ✨ Auto-Expanded: {extraMain > 0 ? `+${extraMain} Main` : ''}
              {extraMain > 0 && extraLocal > 0 ? ', ' : ''}
              {extraLocal > 0 ? `+${extraLocal} Local` : ''} rows
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
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
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export Official .XLSX</span>
          </button>
        </div>
      </div>

      {/* The Printable Spreadsheet Canvas */}
      <div className="overflow-x-auto bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
        <div
          id="mrf-printable-sheet"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-10 w-[950px] min-w-[950px] border border-slate-300 print:w-full print:border-none print:shadow-none print:p-0 print:transform-none"
        >
          {/* Header Title: Material Request Form (Row 2 merged) */}
          <div className="border-b-2 border-slate-800 pb-3 mb-6 flex items-center justify-between">
            <div>
              <span className="text-blue-700 font-extrabold text-xl tracking-wider block font-sans">
                NOKIA
              </span>
            </div>
            <div className="text-center flex-1 pr-16">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase font-sans">
                Material Request Form
              </h1>
            </div>
          </div>

          {/* Form Metadata Block (Rows 6-12) */}
          <div className="border border-slate-400 text-xs mb-6 divide-y divide-slate-300 font-sans">
            {/* Row 6: FROM & DATE */}
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700">
                FROM:
              </div>
              <div className="col-span-4 px-3 py-2 font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
                {doc.header.fromWarehouse || 'Paranaque WHS'}
              </div>
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700 text-right">
                DATE:
              </div>
              <div className="col-span-4 px-3 py-2 font-mono text-center font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                {doc.header.date}
              </div>
            </div>

            {/* Row 8: DESTINATION CODE & DESTINATION */}
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700">
                DESTINATION CODE:
              </div>
              <div className="col-span-4 px-3 py-2 font-mono font-bold text-slate-400">
                {/* Left side blank in official template */}
              </div>
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700 text-right">
                DESTINATON:
              </div>
              <div className="col-span-4 px-3 py-2 font-bold text-slate-900 truncate underline decoration-slate-400 underline-offset-4">
                {doc.header.destination}
              </div>
            </div>

            {/* Row 10: SITE ID */}
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700">
                SITE ID :
              </div>
              <div className="col-span-4 px-3 py-2 font-mono font-bold text-slate-400">
                {/* Left side blank in official template */}
              </div>
              <div className="col-span-2 px-3 py-2 bg-slate-50 font-bold text-slate-700 text-right">
                SITE ID:
              </div>
              <div className="col-span-4 px-3 py-2 font-mono font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                {doc.header.siteId}
              </div>
            </div>

            {/* Row 12: SITE ADDRESS */}
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-2 px-3 py-2.5 bg-slate-50 font-bold text-slate-700">
                SITE ADDRESS :
              </div>
              <div className="col-span-4 px-3 py-2.5 text-slate-400">
                {/* Left side blank in official template */}
              </div>
              <div className="col-span-2 px-3 py-2.5 bg-slate-50 font-bold text-slate-700 text-right">
                SITE ADDRESS :
              </div>
              <div className="col-span-4 px-3 py-2.5 text-slate-900 text-[11px] font-semibold leading-relaxed underline decoration-slate-400 underline-offset-4">
                {doc.header.siteAddress}
              </div>
            </div>
          </div>

          {/* Table: Rows 14 to 46 */}
          <div className="border border-slate-400 overflow-hidden text-[11px] mb-6">
            <table className="w-full border-collapse">
              <thead>
                {/* Header Rows 14-17 */}
                <tr className="border-b border-slate-400 font-bold bg-emerald-50/50 text-center text-slate-900 divide-x divide-slate-400">
                  <th rowSpan={2} className="py-2 px-2 w-[180px] text-left">
                    PART NUMBER
                  </th>
                  <th rowSpan={2} className="py-2 px-2 w-[340px] text-left">
                    DESCRIPTION
                  </th>
                  <th rowSpan={2} className="py-2 px-2 w-[90px]">
                    PACKAGE NO
                  </th>
                  <th colSpan={2} className="py-1 px-2 border-b border-slate-400 bg-emerald-100/60">
                    WHSE
                  </th>
                  <th colSpan={2} className="py-1 px-2 border-b border-slate-400 bg-emerald-100/60">
                    ALCATEL
                  </th>
                </tr>
                <tr className="border-b-2 border-slate-500 font-bold bg-emerald-50/30 text-center text-slate-800 divide-x divide-slate-400">
                  <th className="py-1 px-2 w-[70px]">REQ</th>
                  <th className="py-1 px-2 w-[70px]">ISSUED</th>
                  <th className="py-1 px-2 w-[70px]">RECEIVED</th>
                  <th className="py-1 px-2 w-[70px]">BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* Main Items (Rows 18-25 or expanded beyond) */}
                {mainItemsSlots.map((item, idx) => (
                  <tr
                    key={item.id || `main_${idx}`}
                    className="divide-x divide-slate-300 h-[22px] hover:bg-slate-50/50"
                  >
                    <td className="px-2 py-0.5 font-mono text-left font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.partNumber}
                    </td>
                    <td className="px-2 py-0.5 text-left text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.description}
                    </td>
                    <td className="px-2 py-0.5 text-center font-mono text-slate-400">
                      {/* Package No is not filled */}
                    </td>
                    <td className="px-2 py-0.5 text-center font-bold text-slate-900 font-mono">
                      {item.qtyReq}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-800 font-mono font-medium">
                      {item.qtyIssued || item.uom || ''}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-800 font-mono">
                      {item.qtyReceived}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-700 font-mono">
                      {item.qtyBalance}
                    </td>
                  </tr>
                ))}

                {/* Section Divider Banner (Row 26) */}
                <tr className="border-y-2 border-slate-500 bg-amber-300 text-slate-900 font-bold text-center tracking-wide">
                  <td colSpan={7} className="py-1 uppercase text-xs font-black">
                    LOCAL MATERIALS/ ACCESSORIES
                  </td>
                </tr>

                {/* Local Materials Items (Rows 27-46 or expanded beyond) */}
                {localItemsSlots.map((item, idx) => (
                  <tr
                    key={item.id || `local_${idx}`}
                    className="divide-x divide-slate-300 h-[22px] hover:bg-slate-50/50"
                  >
                    <td className="px-2 py-0.5 font-mono text-left font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.partNumber}
                    </td>
                    <td className="px-2 py-0.5 text-left text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.description}
                    </td>
                    <td className="px-2 py-0.5 text-center font-mono text-slate-400">
                      {/* Package No is not filled */}
                    </td>
                    <td className="px-2 py-0.5 text-center font-bold text-slate-900 font-mono">
                      {item.qtyReq}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-800 font-mono font-medium">
                      {item.qtyIssued || item.uom || ''}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-400 font-mono">
                      {item.qtyReceived !== '' ? item.qtyReceived : ''}
                    </td>
                    <td className="px-2 py-0.5 text-center text-slate-400 font-mono">
                      {item.qtyBalance !== '' ? item.qtyBalance : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contact Information Bar (Rows 47-48) */}
          <div className="border border-slate-400 text-xs font-sans mb-3 divide-y divide-slate-300 bg-slate-50">
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-3 px-3 py-1.5 font-bold text-slate-700">
                Nokia Inhouse Contact:
              </div>
              <div className="col-span-9 px-3 py-1.5 font-mono font-bold text-blue-900">
                {doc.signatures.contactNokiaInhouse || 'NOKIA INHOUSE - JOHN CARLO RABANES/09669343065'}
              </div>
            </div>
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-3 px-3 py-1.5 font-bold text-slate-700">
                Subcon Contact:
              </div>
              <div className="col-span-9 px-3 py-1.5 font-mono font-bold text-indigo-900">
                {doc.signatures.contactSubcon || 'DNA SUBCON - EASTMOND MIRANDA/09543991868'}
              </div>
            </div>
          </div>

          {/* Signatures & Approvals (Rows 47-56) */}
          <div className="border border-slate-400 text-xs font-sans">
            <div className="grid grid-cols-12 divide-x divide-slate-400">
              {/* Column 1: Request by */}
              <div className="col-span-4 p-3 flex flex-col justify-between h-32">
                <div>
                  <div className="font-bold text-slate-800 mb-1">Request by:</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {doc.signatures.requestedBy.name || ''}
                  </div>
                  {doc.signatures.requestedBy.title && (
                    <div className="text-[11px] text-slate-500">
                      {doc.signatures.requestedBy.title}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-800">
                    {doc.signatures.requestedBy.date || ''}
                  </span>
                </div>
              </div>

              {/* Column 2: Prepared by */}
              <div className="col-span-4 p-3 flex flex-col justify-between h-32">
                <div>
                  <div className="font-bold text-slate-800 mb-1">Prepared by:</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {doc.signatures.preparedBy.name || ''}
                  </div>
                  {doc.signatures.preparedBy.title && (
                    <div className="text-[11px] text-slate-500">
                      {doc.signatures.preparedBy.title}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-800">
                    {doc.signatures.preparedBy.date || ''}
                  </span>
                </div>
              </div>

              {/* Column 3: Received by & Acceptance Stamp */}
              <div className="col-span-4 p-3 flex flex-col justify-between h-32 bg-slate-50/50">
                <div>
                  <div className="font-bold text-slate-800 mb-1">Received by:</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {doc.signatures.receivedBy.name || ''}
                  </div>
                  {doc.signatures.receivedBy.title && (
                    <div className="text-[11px] text-slate-500">
                      {doc.signatures.receivedBy.title}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-800">
                    {doc.signatures.receivedBy.date || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status bar & Official Two-Line MRF Reference (Rows 54-57) */}
            <div className="border-t border-slate-400 p-3 bg-slate-50/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4 font-sans">
              {/* Left Column: Acceptance & Rejection Status checkboxes (Rows 54 & 56) */}
              <div className="flex flex-col gap-2 pt-0.5">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Status:</span>
                <div className="flex flex-col gap-1.5 text-xs font-semibold">
                  <span
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border ${
                      doc.signatures.status === 'Accepted'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-2xs'
                        : 'text-slate-500 border-slate-300 bg-white/70'
                    }`}
                  >
                    <span className="font-mono font-bold">[ {doc.signatures.status === 'Accepted' ? 'X' : ' '} ]</span> Accepted
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border ${
                      doc.signatures.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold shadow-2xs'
                        : 'text-slate-500 border-slate-300 bg-white/70'
                    }`}
                  >
                    <span className="font-mono font-bold">[ {doc.signatures.status === 'Rejected' ? 'X' : ' '} ]</span> Rejected
                  </span>
                </div>
              </div>

              {/* Right Column: MRF Name written on top line and automatically continuing on second line below */}
              <div className="flex items-start gap-2.5 sm:max-w-[490px] w-full sm:w-auto">
                <span className="font-bold text-slate-800 text-xs pt-1 select-none shrink-0 font-sans">
                  MRF:
                </span>
                <div className="flex-1 min-w-[320px] max-w-[460px] flex flex-col space-y-1.5">
                  {/* Top Line (Row 56, Cell F56) */}
                  <div className="relative group">
                    <div className="border-b-2 border-slate-800 pb-0.5 min-h-[22px] flex items-center justify-between bg-white/90 px-2 rounded-t-xs">
                      <span className="font-mono text-[11px] font-bold text-blue-950 tracking-tight select-all">
                        {mrfSplit.line1 || '\u00A0'}
                      </span>
                      {mrfSplit.isOverflow && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
                          Top Line
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Below / Second Line (Row 57, Cell F57) */}
                  <div className="relative group">
                    <div className="border-b-2 border-slate-800 pb-0.5 min-h-[22px] flex items-center justify-between bg-white/90 px-2 rounded-t-xs">
                      <span className="font-mono text-[11px] font-bold text-blue-950 tracking-tight select-all">
                        {mrfSplit.line2 || '\u00A0'}
                      </span>
                      {mrfSplit.isOverflow && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0 ml-2">
                          2nd Line (Continuation)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Explanatory subtitle pill */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="italic">
                      {mrfSplit.isOverflow
                        ? 'Exceeds top line (47 chars) · automatically continues below'
                        : 'Official single-line MRF name (under 47 chars)'}
                    </span>
                    <span className="font-mono font-medium text-slate-600">
                      Total: {(doc.header.mrfNumber || '').length} chars
                    </span>
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
