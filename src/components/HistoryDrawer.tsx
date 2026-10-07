import React, { useState } from 'react';
import { MRFDocument } from '../types/mrf';
import {
  FolderOpen,
  X,
  Trash2,
  Copy,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedDocs: MRFDocument[];
  activeDocId: string;
  onSelectDoc: (doc: MRFDocument) => void;
  onDuplicateDoc: (doc: MRFDocument) => void;
  onDeleteDoc: (id: string) => void;
  onExportExcel: (doc: MRFDocument) => void;
  onLoadBenchmark?: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedDocs,
  activeDocId,
  onSelectDoc,
  onDuplicateDoc,
  onDeleteDoc,
  onExportExcel,
  onLoadBenchmark,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = savedDocs.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.header.mrfNumber.toLowerCase().includes(q) ||
      d.header.siteId.toLowerCase().includes(q) ||
      d.header.destination.toLowerCase().includes(q) ||
      d.header.destinationCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-white">Saved MRF Drafts</h3>
              <p className="text-xs text-slate-400">
                {savedDocs.length} forms stored in local browser cache
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

        {/* Search & Benchmark quick action */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved MRFs..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {onLoadBenchmark && (
            <button
              onClick={() => {
                onLoadBenchmark();
                onClose();
              }}
              className="w-full py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>+ Restore Official Benchmark (MIN132-BA)</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No saved MRFs found matching your search.
            </div>
          ) : (
            filtered.map((doc) => {
              const isActive = doc.id === activeDocId;
              const totalItems = doc.mainItems.length + doc.localMaterials.length;
              return (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border text-xs transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {doc.header.mrfNumber || 'Untitled MRF'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        doc.signatures.status === 'Accepted'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : doc.signatures.status === 'Rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {doc.signatures.status}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                    {doc.header.destinationCode} &bull; {doc.header.destination}
                  </p>

                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-400 text-[11px] mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {doc.header.date}
                    </span>
                    <span>&bull;</span>
                    <span>{totalItems} items</span>
                    <span>&bull;</span>
                    <span>{doc.header.fromWarehouse}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onSelectDoc(doc);
                        onClose();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors"
                    >
                      Open &amp; Edit
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onExportExcel(doc)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                        title="Quick download XLSX"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                        title="Duplicate draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDoc(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
