import { MRFDocument } from '../types/mrf';
import sitesDataRaw from '../data_sites.json';
import { OFFICIAL_FILLED_MRF_BENCHMARK, ADDITIONAL_FILLED_SAMPLES } from './benchmarkMRF';

const STORAGE_KEY_MRFS = 'blaine_mrf_documents_v2';
const STORAGE_KEY_ACTIVE_ID = 'blaine_mrf_active_id_v2';

export function getTodayDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatMRFDate(dateStr?: string): string {
  if (!dateStr) {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}${dd}${yyyy}`;
  }

  const clean = dateStr.trim();
  // If already MMDDYYYY (8 digits)
  if (/^\d{8}$/.test(clean)) {
    return clean;
  }

  // If YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${mm}${dd}${yyyy}`;
  }

  // Fallback to parse Date
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${mm}${dd}${yyyy}`;
  }

  return '06302026';
}

export function cleanMRFSiteId(siteId?: string): string {
  if (!siteId) return 'MIN1371-GNG-701';
  // Clean e.g. "MIN1371  - GNG_701" -> "MIN1371-GNG-701"
  const cleaned = siteId
    .trim()
    .toUpperCase()
    .replace(/\s*[-_]+\s*/g, '-')
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'MIN1371-GNG-701';
}

export function cleanMRFEntity(entity?: string): string {
  if (!entity) return 'JOHN_CARLO_RABANES';
  const cleaned = entity
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'JOHN_CARLO_RABANES';
}

export interface GenerateMRFParams {
  dateStr?: string; // e.g. "2026-06-30" or "06302026"
  seq?: number | string; // e.g. 4 or "004"
  siteId?: string; // e.g. "MIN1371-GNG-701"
  equipmentType?: string; // e.g. "MF2", "DF16", "FX4", "FX8"
  signeeOrEntity?: string; // e.g. "JOHN_CARLO_RABANES"
}

/**
 * Generates an official MRF Number following the strict required schema:
 * NOKIA-FN_[MMDDYYYY]-[SEQ]_[SITE_ID]_[EQUIPMENT_TYPE]_[SUBCON/WAREHOUSE/ENGINEER]
 * Example: NOKIA-FN_06302026-004_MIN1371-GNG-701_MF2_JOHN_CARLO_RABANES
 */
export function generateMRFNumber(
  paramsOrSiteId?: string | GenerateMRFParams,
  seq: number | string = 1,
  equipmentType = 'MF2',
  signeeOrEntity = 'JOHN_CARLO_RABANES',
  dateStr?: string
): string {
  let p: GenerateMRFParams;

  if (typeof paramsOrSiteId === 'object' && paramsOrSiteId !== null) {
    p = paramsOrSiteId;
  } else {
    p = {
      siteId: paramsOrSiteId,
      seq,
      equipmentType,
      signeeOrEntity,
      dateStr,
    };
  }

  const mmddyyyy = formatMRFDate(p.dateStr);
  const seqStr = String(p.seq !== undefined && p.seq !== null ? p.seq : 1).padStart(3, '0');
  const siteClean = cleanMRFSiteId(p.siteId);
  const equipClean = (p.equipmentType || 'MF2').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'MF2';
  const entityClean = cleanMRFEntity(p.signeeOrEntity);

  return `NOKIA-FN_${mmddyyyy}-${seqStr}_${siteClean}_${equipClean}_${entityClean}`;
}

/**
 * Splits an MRF Name into two lines for spreadsheet rendering.
 * As seen in the official template screenshot:
 * The MRF name is written on the top line (up to ~47 characters, breaking cleanly after a delimiter),
 * and when it exceeds the top line, it automatically continues below on the second line.
 * Example:
 * Line 1 (Top line):    NOKIA-FN_06302026-004_MIN1371-GNG-701_MF2_JOHN_
 * Line 2 (Second line): CARLO_RABANES
 */
export function splitMRFNumber(
  mrfNumber: string,
  maxLine1Chars = 47
): { line1: string; line2: string; isOverflow: boolean } {
  if (!mrfNumber) {
    return { line1: '', line2: '', isOverflow: false };
  }

  const trimmed = mrfNumber.trim();
  if (trimmed.length <= maxLine1Chars) {
    return { line1: trimmed, line2: '', isOverflow: false };
  }

  // Find optimal breaking delimiter ('_' or '-' or ' ') near maxLine1Chars (between 25 and maxLine1Chars - 1)
  let breakIdx = -1;
  for (let i = Math.min(trimmed.length - 1, maxLine1Chars - 1); i >= 20; i--) {
    if (trimmed[i] === '_' || trimmed[i] === '-' || trimmed[i] === ' ') {
      // Include the delimiter on line 1 if '_' or '-'
      breakIdx = i + 1;
      break;
    }
  }

  // Fallback to strict cut if no delimiter found in range
  if (breakIdx <= 0) {
    breakIdx = maxLine1Chars;
  }

  const line1 = trimmed.slice(0, breakIdx);
  const line2 = trimmed.slice(breakIdx);

  return {
    line1,
    line2,
    isOverflow: Boolean(line2.length > 0),
  };
}

/**
 * Parses an MRF Number into its constituent schema components
 */
export function parseMRFNumber(mrf: string) {
  const clean = (mrf || '').trim();
  const parts = clean.split('_');

  // NOKIA-FN, [MMDDYYYY]-[SEQ], [SITE_ID], [EQUIPMENT_TYPE], [SUBCON/WAREHOUSE/ENGINEER]
  const prefix = parts[0] || 'NOKIA-FN';
  const dateSeq = parts[1] || '';
  const [datePart, seqPart] = dateSeq.split('-');

  const siteId = parts[2] || '';
  const equipmentType = parts[3] || 'MF2';
  const entity = parts.slice(4).join('_') || 'JOHN_CARLO_RABANES';

  return {
    prefix,
    dateStr: datePart || '06302026',
    seqStr: seqPart || '001',
    siteId,
    equipmentType,
    signeeOrEntity: entity,
    raw: clean,
  };
}

/**
 * Creates a pristine, unpolluted blank MRF document.
 * Only uses verified site from database (or empty) with NO fake items.
 */
export function createNewMRFDocument(sitePlaid?: string): MRFDocument {
  const dateStr = getTodayDateStr();
  const id = `mrf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Find verified site in database if provided, or default to first verified database site
  const verifiedSites = sitesDataRaw as Array<{
    plaid: string;
    siteName: string;
    address: string;
    warehouse: string;
    vendor: string;
  }>;

  const defaultSite = sitePlaid
    ? verifiedSites.find((s) => s.plaid.toLowerCase() === sitePlaid.toLowerCase())
    : verifiedSites[0];

  const targetSitePlaid = defaultSite ? defaultSite.plaid : 'MIN1371';
  const targetSiteName = defaultSite ? defaultSite.siteName : 'GNG-701';
  // Standard format required: PLAID - SITE NAME (e.g. MIN1371 - GNG-701)
  const targetSiteId = `${targetSitePlaid} - ${targetSiteName}`;
  const targetAddress = defaultSite
    ? defaultSite.address
    : 'HUAWEI CABINET CORNER CUERDORIZAL ST., FRONT OF DMS RTW , GINGOOG CITY';
  const targetWarehouse = defaultSite ? defaultSite.warehouse : 'Paranaque WHS';
  const targetDestination = (defaultSite as any)?.destinationHub || 'CAGAYAN DE ORO';

  const mrfNumber = generateMRFNumber({
    siteId: `${targetSitePlaid}-${targetSiteName}`,
    seq: 4,
    dateStr,
    equipmentType: 'MF2',
    signeeOrEntity: 'JOHN_CARLO_RABANES',
  });

  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    header: {
      mrfNumber,
      fromWarehouse: targetWarehouse || 'Paranaque WHS',
      date: dateStr,
      destinationCode: targetSitePlaid,
      destination: targetDestination,
      siteId: targetSiteId,
      siteAddress: targetAddress,
      project: 'Globe Telecom / Nokia FN OLT Rollout',
    },
    // Start with empty arrays so ONLY user-selected items from database are included!
    mainItems: [],
    localMaterials: [],
    signatures: {
      requestedBy: {
        name: 'JOHN CARLO RABANES',
        title: 'Nokia Inhouse Engineer',
        date: dateStr,
      },
      preparedBy: {
        name: '',
        title: 'Paranaque WHS Supervisor',
        date: dateStr,
      },
      receivedBy: {
        name: '',
        title: 'Site Representative',
        date: dateStr,
      },
      contactNokiaInhouse: 'NOKIA INHOUSE - JOHN CARLO RABANES/09669343065',
      contactSubcon: 'DNA SUBCON - EASTMOND MIRANDA/09543991868',
      status: 'Pending',
      remarks: '',
    },
  };
}

export function loadMRFList(): MRFDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MRFS);
    if (!raw) {
      const defaultDocs = [OFFICIAL_FILLED_MRF_BENCHMARK, ...ADDITIONAL_FILLED_SAMPLES];
      saveMRFList(defaultDocs);
      setActiveMRFId(OFFICIAL_FILLED_MRF_BENCHMARK.id);
      return defaultDocs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [OFFICIAL_FILLED_MRF_BENCHMARK];
  } catch (e) {
    console.error('Error loading MRFs from storage:', e);
    return [OFFICIAL_FILLED_MRF_BENCHMARK];
  }
}

export function saveMRFList(docs: MRFDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MRFS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save MRF list to localStorage:', e);
  }
}

export function getActiveMRFId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
}

export function setActiveMRFId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

export function saveActiveMRF(doc: MRFDocument): void {
  const list = loadMRFList();
  const idx = list.findIndex((item) => item.id === doc.id);
  const updatedDoc = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    list[idx] = updatedDoc;
  } else {
    list.unshift(updatedDoc);
  }
  saveMRFList(list);
  setActiveMRFId(updatedDoc.id);
}

export function deleteMRF(id: string): MRFDocument[] {
  let list = loadMRFList();
  list = list.filter((item) => item.id !== id);
  if (list.length === 0) {
    list = [createNewMRFDocument()];
  }
  saveMRFList(list);
  setActiveMRFId(list[0].id);
  return list;
}
