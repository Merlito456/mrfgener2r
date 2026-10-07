import React, { useState, useMemo } from 'react';
import {
  MRFAutomationInput,
  generateAutomatedBoQ,
  createAutomatedMRFDocument,
} from '../utils/mrfRules';
import { MRFDocument, SiteRecord } from '../types/mrf';
import { SiteAutocomplete } from './SiteAutocomplete';
import { useTheme } from '../utils/theme';
import {
  Sparkles,
  Zap,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Boxes,
  ShieldCheck,
  Building,
  Trees,
  Sliders,
  Cable,
  Power,
  Layers,
  X,
  Info,
  Check,
} from 'lucide-react';

interface MRFAutomationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SiteRecord[];
  onGenerateMRF: (doc: MRFDocument) => void;
}

export const MRFAutomationWizard: React.FC<MRFAutomationWizardProps> = ({
  isOpen,
  onClose,
  sites,
  onGenerateMRF,
}) => {
  const { theme, isDark } = useTheme();

  // Wizard state answering the 8 questions
  const [formData, setFormData] = useState<MRFAutomationInput>({
    equipmentType: 'MF2', // Q1
    environment: 'Outdoor', // Q2
    transportOutside: true, // Q3
    transportDistance: 8, // Q3
    patchcordCount: 2, // How many patch cords needed (customizable)
    tappingPointConfig: 'two_same_rs', // Q4
    distanceToRS1: 8, // Q4
    distanceToRS2: 8, // Q4
    groundingDistance: 10, // Q5
    needChangeBreakers: false, // Q6
    breakerCount: 1, // Q6
    breakerRating: '16A', // Q6
    downlinkDistance: 2, // Q7
    ltCardCount: 1, // Q8
    swStaged: false, // User decides if SW STAGED (3FE76353AA-S) or standard (3FE76353AA)
    sitePlaid: sites[0]?.plaid || 'NCR2509',
    fromWarehouse: 'Paranaque WHS',
    requisitionerName: '',
    requisitionerTitle: 'Field Engineer',
  });

  // Live generated BoQ based on user answers
  const liveBoQ = useMemo(() => {
    return generateAutomatedBoQ(formData);
  }, [formData]);

  if (!isOpen) return null;

  const totalMainCount = liveBoQ.mainItems.length;
  const totalLocalCount = liveBoQ.localMaterials.length;
  const totalUnits =
    liveBoQ.mainItems.reduce((acc, it) => acc + (Number(it.qtyReq) || 0), 0) +
    liveBoQ.localMaterials.reduce((acc, it) => acc + (Number(it.qtyReq) || 0), 0);

  const handleFinish = () => {
    const doc = createAutomatedMRFDocument(formData);
    onGenerateMRF(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className={`rounded-2xl shadow-2xl border max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${theme.colors.bgCard} ${theme.colors.border} ${theme.colors.textPrimary} transition-colors`}>
        {/* Wizard Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Automated MRF Generator Wizard
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  8 Guided Questions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Answer the 8 site deployment parameters &bull; Instantly resolves exact parts from database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${theme.colors.bgCardSubtle} ${theme.colors.border}`}>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Quick Presets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  equipmentType: 'MF2',
                  environment: 'Outdoor',
                  transportOutside: true,
                  transportDistance: 8,
                  tappingPointConfig: 'two_same_rs',
                  distanceToRS1: 8,
                  groundingDistance: 10,
                  needChangeBreakers: false,
                  downlinkDistance: 2,
                  ltCardCount: 1,
                }))
              }
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-medium border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-2xs"
            >
              Outdoor MF2 (1-Card)
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  equipmentType: 'MF2',
                  environment: 'Indoor',
                  transportOutside: false,
                  transportDistance: 5,
                  tappingPointConfig: 'two_same_rs',
                  distanceToRS1: 8,
                  groundingDistance: 5,
                  needChangeBreakers: false,
                  downlinkDistance: 2,
                  ltCardCount: 2,
                }))
              }
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-medium border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-2xs"
            >
              Indoor MF2 Full (2-Card)
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  equipmentType: 'MF2',
                  environment: 'Outdoor',
                  transportOutside: true,
                  transportDistance: 8,
                  tappingPointConfig: 'two_separated',
                  distanceToRS1: 12,
                  distanceToRS2: 15,
                  groundingDistance: 15,
                  needChangeBreakers: true,
                  breakerCount: 2,
                  breakerRating: '16A',
                  downlinkDistance: 2,
                  ltCardCount: 1,
                }))
              }
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-medium border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-2xs"
            >
              Outdoor Dual RS + Breakers
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  equipmentType: 'DF16',
                  environment: 'Outdoor',
                  transportOutside: false,
                  transportDistance: 5,
                  tappingPointConfig: 'two_same_rs',
                  distanceToRS1: 8,
                  groundingDistance: 10,
                  needChangeBreakers: false,
                  downlinkDistance: 2,
                }))
              }
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 font-medium border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-2xs"
            >
              Outdoor DF16 Chassis
            </button>
          </div>
        </div>

        {/* Wizard Main: Left 8 Questions, Right Live BoQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Form: The 8 Questions */}
          <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[620px] space-y-6 bg-slate-50/40 dark:bg-slate-900/40">
            {/* Question 1 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  What equipment to install?
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                  Refer to Database
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'MF2', label: 'MF2', name: 'Nokia Lightspan MF-2', desc: '2U OLT Shelf, Fan, dual DC Power, NT' },
                  { id: 'DF16', label: 'DF16', name: 'Nokia DF-16GM', desc: '16GM Shelf, DC Power, GPON/XGS optics' },
                  { id: 'FX4', label: 'FX4', name: '7360 ISAM FX-4', desc: '4-slot OLT, 1280G NT, GPON Line card' },
                  { id: 'FX8', label: 'FX8', name: '7360 ISAM FX-8', desc: '8-slot ETSI shelf, dual NT, 16p optics' },
                ].map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        equipmentType: eq.id as any,
                      }))
                    }
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.equipmentType === eq.id
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20 dark:ring-blue-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{eq.label}</span>
                      {formData.equipmentType === eq.id && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {eq.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  Is the site Outdoor or Indoor?
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Purpose: Determines LTC &amp; Connectors
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                <strong>Purpose:</strong> To determine if the site needs to use LTC and Connectors. <strong>25 PA</strong> for power cable and <strong>15 PA</strong> for uplink cable.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, environment: 'Outdoor' }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    formData.environment === 'Outdoor'
                      ? 'border-amber-600 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20 dark:ring-amber-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Trees className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Outdoor Site
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                      Enables metallic LTC conduits + connectors for weather protection (No sealant used).
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, environment: 'Indoor' }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    formData.environment === 'Indoor'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 dark:ring-blue-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Building className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Indoor Site
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                      No LTC conduit or connectors needed &bull; Cable tray internal routing.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Question 3 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  Transport Equipment Location &amp; Distance
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Purpose: 15 PA LTC + 2x Connectors
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                <strong>Purpose:</strong> For outdoor, if Transport Equipment is outside Proposed OLT Proposal, use the <strong>15 PA LTC</strong> and <strong>2x 15 PA Connectors</strong>. The distance chooses 3m, 5m, or 8m patch cords.
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    Located outside Proposed OLT Proposal?
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="transportOutside"
                        checked={formData.transportOutside}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, transportOutside: true }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Yes (Outside)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="transportOutside"
                        checked={!formData.transportOutside}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, transportOutside: false }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-600 dark:text-slate-400">No (Inside/Adjacent)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Uplink Distance to Transport Equipment:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 5, 8] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            transportDistance: d,
                          }))
                        }
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          formData.transportDistance === d
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {d}m LC-LC Patch Cord
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question: Uplink Patch Cords & ESFP Transceivers */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700 bg-blue-50/40 dark:bg-blue-950/30 p-3.5 rounded-lg border border-blue-100 dark:border-blue-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        &bull;
                      </span>
                      <span>Uplink Optical Transceivers (ESFP) &amp; LC-LC Patch Cords</span>
                    </label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      MAXIMUM OF 2 ESFPs
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <strong>Rule:</strong> 1 run of uplink requires <strong>two LC-LC patch cords for 1 ESFP</strong>. If you input <strong>4 cords</strong>, it means <strong>two uplinks (2 runs)</strong>, requiring <strong>2 ESFPs</strong> and doubling LTC conduit to <strong>2x the route distance</strong> with <strong>4 connectors</strong>.
                  </p>

                  {/* ESFP Transceiver Selection Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>10G Optical Transceivers (ESFP 3FE62600AA):</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Cap: Max 2 Units</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { count: 0, label: '0 ESFPs', sub: 'No uplink', cords: 0 },
                        { count: 1, label: '1 ESFP', sub: '1 Run (2 Cords)', cords: 2 },
                        { count: 2, label: '2 ESFPs (MAX)', sub: '2 Runs (4 Cords)', cords: 4 },
                      ].map((opt) => {
                        const currentEsfp = typeof formData.esfpCount === 'number'
                          ? formData.esfpCount
                          : (typeof formData.patchcordCount === 'number'
                              ? (formData.patchcordCount === 0 ? 0 : Math.min(2, Math.max(1, Math.ceil(formData.patchcordCount / 2))))
                              : 2);
                        const isSelected = currentEsfp === opt.count;
                        return (
                          <button
                            key={opt.count}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                esfpCount: opt.count,
                                patchcordCount: opt.cords,
                              }))
                            }
                            className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="font-bold text-xs block">{opt.label}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              {opt.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Patch Cord Count Buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      LC-LC Patch Cords Required (2 cords per ESFP):
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { cords: 0, label: '0 Cords (0 ESFP)', esfps: 0 },
                        { cords: 2, label: '2 Cords (1 Run / 1 ESFP)', esfps: 1 },
                        { cords: 4, label: '4 Cords (2 Runs / 2 ESFPs [MAX])', esfps: 2 },
                      ].map((item) => {
                        const isSel = formData.patchcordCount === item.cords;
                        return (
                          <button
                            key={item.cords}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                patchcordCount: item.cords,
                                esfpCount: item.esfps,
                              }))
                            }
                            className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                              isSel
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Outdoor Conduit Logic Display */}
                  {formData.environment === 'Outdoor' && formData.transportOutside && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-950 dark:text-blue-200 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">Conduit &amp; Gland Connector Calculation:</span>
                        <span className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                          {Math.min(2, Math.ceil((formData.patchcordCount ?? 2) / 2))} Uplink Run(s) &bull; Max 2 ESFPs
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300">
                        &bull; <strong>15 PA LTC Conduit:</strong>{' '}
                        <span className="font-bold text-blue-800 dark:text-blue-300 font-mono">
                          {(formData.patchcordCount ?? 2) > 0 ? Math.min(2, Math.ceil((formData.patchcordCount ?? 2) / 2)) * formData.transportDistance : 0}m
                        </span>{' '}
                        ({Math.min(2, Math.ceil((formData.patchcordCount ?? 2) / 2))} run(s) &times; {formData.transportDistance}m route distance)
                      </div>
                      <div className="text-slate-700 dark:text-slate-300">
                        &bull; <strong>15 PA Connectors:</strong>{' '}
                        <span className="font-bold text-blue-800 dark:text-blue-300 font-mono">
                          {(formData.patchcordCount ?? 2) > 0 ? Math.min(2, Math.ceil((formData.patchcordCount ?? 2) / 2)) * 2 : 0} pcs
                        </span>{' '}
                        ({Math.min(2, Math.ceil((formData.patchcordCount ?? 2) / 2))} run(s) &times; 2 connectors: 1 at OLT gland entry, 1 at Transport cabinet gland entry)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Question 4 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  Power Tapping Point (Rectifier System / RS)
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Power cable + 25 PA LTC &amp; Connectors
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                <strong>Purpose:</strong> Is tapping point separated from OLT location? If yes both (2) or just 1?
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li><strong>For 2:</strong> Powercable exceeds bigger distance (2x). Outdoor: 2x 25 PA LTC &amp; 4x connector.</li>
                  <li><strong>For 1:</strong> Powercable longer than distance (10m, 15m, 20m). Outdoor: 25 PA LTC &amp; 4x connector.</li>
                  <li><strong>For 2 (Same RS):</strong> Both cables laid together in 25 PA LTC &amp; uses 2x 25 PA Connector.</li>
                </ul>
              </div>

              {/* 3 Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tappingPointConfig: 'two_same_rs',
                    }))
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.tappingPointConfig === 'two_same_rs'
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500/20 font-bold text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="block font-bold">Same RS (Bundled)</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1 leading-tight">
                    Cables laid together in 1x 25 PA LTC + 2x Connectors
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tappingPointConfig: 'one_separated',
                    }))
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.tappingPointConfig === 'one_separated'
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500/20 font-bold text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="block font-bold">1 Separated RS</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1 leading-tight">
                    Single cable run + 25 PA LTC + 4x Connectors
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tappingPointConfig: 'two_separated',
                    }))
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.tappingPointConfig === 'two_separated'
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500/20 font-bold text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="block font-bold">2 Separated RS</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1 leading-tight">
                    RS1 &amp; RS2 &bull; 2x 25 PA LTC + 4x Connectors
                  </p>
                </button>
              </div>

              {/* Distance inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.tappingPointConfig === 'two_separated'
                      ? 'Distance OLT to RS1 (Meters):'
                      : 'Distance to RS Tapping Point (Meters):'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.distanceToRS1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          distanceToRS1: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[8, 12, 18].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, distanceToRS1: m }))
                          }
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[10px] font-semibold rounded text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600"
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Available in DB: 10m, 15m, 20m power cables
                  </span>
                </div>

                {formData.tappingPointConfig === 'two_separated' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Distance OLT to RS2 (Meters):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.distanceToRS2 || 8}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            distanceToRS2: Number(e.target.value) || 1,
                          }))
                        }
                        className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {[8, 12, 18].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, distanceToRS2: m }))
                            }
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[10px] font-semibold rounded text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600"
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Cable selected exceeds max(RS1, RS2)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Question 5 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    5
                  </span>
                  How long is the grounding cable?
                </label>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900">
                  Will NOT use LTC
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                <strong>Rule:</strong> Grounding cable will <strong>not</strong> use LTC. Same logic with the power cable, use items that exceed its given distance (5m, 15m, continuous).
              </div>
              <div className="flex items-center gap-3 text-xs">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.groundingDistance}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      groundingDistance: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  {[5, 10, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, groundingDistance: d }))
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                        formData.groundingDistance === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d} Meters
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question 6 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    6
                  </span>
                  Does RS need change breakers?
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Purpose: Auto load breaker from database
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  Change circuit breaker on Rectifier System?
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="needChangeBreakers"
                      checked={formData.needChangeBreakers}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          needChangeBreakers: true,
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="needChangeBreakers"
                      checked={!formData.needChangeBreakers}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          needChangeBreakers: false,
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 dark:text-slate-400">No</span>
                  </label>
                </div>
              </div>

              {formData.needChangeBreakers && (
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      How Many Breakers?
                    </label>
                    <select
                      value={formData.breakerCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          breakerCount: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={1}>1 Breaker</option>
                      <option value={2}>2 Breakers</option>
                      <option value={3}>3 Breakers</option>
                      <option value={4}>4 Breakers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rating:
                    </label>
                    <select
                      value={formData.breakerRating}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          breakerRating: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="16A">16A (Schneider 1P)</option>
                      <option value="20A">20A (Schneider 1P)</option>
                      <option value="25A">25A (Schneider 1P)</option>
                      <option value="32A">32A (Schneider 1P)</option>
                      <option value="63A">63A (Nader 1P)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Question 7 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    7
                  </span>
                  How long is the Downlink cable?
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  SC/UPC - SC/APC ODF Patch Cords
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                <strong>Suggestion:</strong> <strong>2m</strong> if the ODF is just below the equipment.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[1.5, 2, 3, 5, 8, 10, 15].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, downlinkDistance: len }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      formData.downlinkDistance === len
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {len}m {len === 2 && '⭐ (Suggested)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 8 */}
            {formData.equipmentType === 'MF2' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      8
                    </span>
                    How many LT Cards (For MF2)?
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Universal Dummy Plate logic
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                  <strong>Rule:</strong>
                  <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                    <li>If <strong>2:</strong> uses 16 GPON + 16 XGPON (32 ports total). No dummy plate.</li>
                    <li>If <strong>1:</strong> uses 8 GPON + 8 XGPON (16 ports total) + <strong>universal dummy plate</strong>.</li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, ltCardCount: 1 }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      formData.ltCardCount === 1
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 dark:ring-blue-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        1 LT Card (16 ports)
                      </span>
                      {formData.ltCardCount === 1 && (
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Includes 8 GPON + 8 XGPON optics &bull; <strong>+ Universal dummy plate</strong> &bull; 16 downlink patch cords
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, ltCardCount: 2 }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      formData.ltCardCount === 2
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 dark:ring-blue-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        2 LT Cards (32 ports Full)
                      </span>
                      {formData.ltCardCount === 2 && (
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Includes 16 GPON + 16 XGPON optics &bull; No dummy plate &bull; 32 downlink patch cords
                    </p>
                  </button>
                </div>

                {/* SW Staged Decision for Line Board */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Line Board Staging: Lightspan MF 16port Multi-PON (LWLT-C)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose whether to use the pre-staged software variant from the database
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      {formData.swStaged ? '3FE76353AA-S' : '3FE76353AA'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, swStaged: false }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all flex items-center justify-between ${
                        !formData.swStaged
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold">Standard (Non-Staged)</div>
                        <div className={`text-[10px] ${!formData.swStaged ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          Product Code: 3FE76353AA
                        </div>
                      </div>
                      {!formData.swStaged && <CheckCircle className="w-4 h-4 text-white shrink-0 ml-1" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, swStaged: true }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all flex items-center justify-between ${
                        formData.swStaged
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold">SW STAGED (Pre-configured)</div>
                        <div className={`text-[10px] ${formData.swStaged ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          Product Code: 3FE76353AA-S
                        </div>
                      </div>
                      {formData.swStaged && <CheckCircle className="w-4 h-4 text-white shrink-0 ml-1" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Site Selector from Verified Database */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-2 pb-16">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Load Verified Destination from Database ({sites.length.toLocaleString()} sites)
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 normal-case">
                  Real-Time Search
                </span>
              </label>
              <SiteAutocomplete
                sites={sites}
                selectedPlaid={formData.sitePlaid || ''}
                onSelectSite={(site) =>
                  setFormData((prev) => ({ ...prev, sitePlaid: site.plaid }))
                }
                placeholder="Type PLAID (e.g. MIN1371), site name, hub, city, or address..."
              />
            </div>
          </div>

          {/* Right Panel: Live BoQ Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-50/90 dark:bg-slate-900/90 overflow-y-auto max-h-[620px] flex flex-col justify-between border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live BoQ Preview
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Matches official MRF_template.xlsx slots
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                    {totalMainCount + totalLocalCount} Items
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                    ({totalUnits} units total)
                  </span>
                </div>
              </div>

              {/* Explanations summary pill */}
              <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Rule Logic Applied:</span>
                </div>
                <div className="text-[11px] text-blue-800 dark:text-blue-300 space-y-0.5 pl-5">
                  {Object.entries(liveBoQ.explanations).map(([k, text]) => (
                    <div key={k}>&bull; {text}</div>
                  ))}
                </div>
              </div>

              {/* Main Items */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/60">
                    Section 1: Main Equipment ({totalMainCount}/8 slots)
                  </span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {liveBoQ.mainItems.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs hover:border-blue-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block">
                          {item.partNumber}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded text-xs border border-blue-200 dark:border-blue-800">
                        Qty: {item.qtyReq}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Materials */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/60">
                    Section 2: Local Accessories ({totalLocalCount}/20 slots)
                  </span>
                </div>
                <div className="space-y-1.5 mt-2 max-h-56 overflow-y-auto pr-1">
                  {liveBoQ.localMaterials.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs hover:border-amber-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block">
                          {item.partNumber}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded text-xs border border-amber-200 dark:border-amber-800">
                        Qty: {item.qtyReq}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Finish Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Generate Complete MRF</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
