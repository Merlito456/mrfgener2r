import ExcelJS from 'exceljs';
import { CatalogItem, MRFDocument, MRFLineItem, SiteRecord } from '../types/mrf';
import { getTodayDateStr } from './storage';

function formatExcelDateValue(val: Date): string {
  const yyyy = val.getUTCFullYear();
  const mm = String(val.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(val.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function unwrapCellValue(raw: any): string {
  if (raw === null || raw === undefined) return '';
  if (raw instanceof Date) {
    return formatExcelDateValue(raw);
  }
  if (typeof raw === 'object') {
    if ('result' in raw && raw.result !== undefined) {
      return unwrapCellValue(raw.result);
    }
    if ('richText' in raw && Array.isArray(raw.richText)) {
      return raw.richText.map((part: any) => part?.text || '').join('').trim();
    }
    if ('text' in raw && typeof raw.text === 'string') {
      return raw.text.trim();
    }
    if ('error' in raw) {
      return '';
    }
  }
  return String(raw).trim();
}

function getCellText(ws: ExcelJS.Worksheet, row: number, col: number | string): string {
  const cell = ws.getRow(row).getCell(col);
  return unwrapCellValue(cell.value);
}

function parseOptionalNumber(text: string): number | '' {
  const clean = text.trim();
  if (!clean) return '';
  const n = Number(clean);
  return !isNaN(n) && isFinite(n) ? n : '';
}

function isLikelyUom(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  if (!isNaN(Number(clean))) return false;
  return /^[a-zA-Z]{1,10}\.?$/.test(clean);
}

function stripLabelPrefix(text: string, prefixes: string[]): string {
  let out = text.trim();
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix}\\s*:?\\s*`, 'i');
    if (regex.test(out)) {
      out = out.replace(regex, '').trim();
      break;
    }
  }
  return out;
}

/**
 * Parses an uploaded official MRF Excel (.xlsx) workbook into an MRFDocument
 * so it can be edited, previewed, and immediately converted into an MTF.
 */
export async function parseMRFXlsxFile(
  file: File,
  catalog: CatalogItem[] = [],
  sites: SiteRecord[] = []
): Promise<MRFDocument> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  if (wb.worksheets.length === 0) {
    throw new Error('The uploaded Excel workbook contains no worksheets.');
  }

  // Pick the worksheet that looks like an MRF sheet (or fallback to first sheet)
  const ws =
    wb.worksheets.find((sheet) => {
      for (let r = 1; r <= Math.min(sheet.rowCount, 30); r++) {
        const a = getCellText(sheet, r, 'A').toUpperCase();
        const b = getCellText(sheet, r, 'B').toUpperCase();
        if (
          a.includes('MATERIAL REQUEST FORM') ||
          (a === 'PART NUMBER' && b.includes('DESCRIPTION'))
        ) {
          return true;
        }
      }
      return false;
    }) || wb.worksheets[0];

  const catalogByCode = new Map<string, CatalogItem>();
  catalog.forEach((item) => {
    if (item.code) catalogByCode.set(item.code.toLowerCase(), item);
  });

  // Locate structural anchor rows dynamically so expanded/shifted MRFs parse cleanly
  let tableHeaderEndRow = 17;
  let localDividerRow = -1;
  let signatureStartRow = -1;

  const maxScanRows = Math.max(ws.rowCount, 80);
  for (let r = 1; r <= maxScanRows; r++) {
    const a = getCellText(ws, r, 'A').toUpperCase();
    const b = getCellText(ws, r, 'B').toUpperCase();
    const d = getCellText(ws, r, 'D').toUpperCase();

    if (a === 'PART NUMBER' && (d === 'REQ' || b.includes('DESCRIPTION'))) {
      tableHeaderEndRow = r;
    } else if (a.includes('LOCAL MATERIALS') || b.includes('LOCAL MATERIALS')) {
      localDividerRow = r;
    } else if (
      signatureStartRow === -1 &&
      r > (localDividerRow > 0 ? localDividerRow : 20) &&
      (a.startsWith('SIGNATURE') ||
        a.startsWith('REQUEST BY') ||
        b.startsWith('PREPARED BY'))
    ) {
      signatureStartRow = r;
    }
  }

  const mainStartRow = tableHeaderEndRow + 1;
  const mainEndRow = localDividerRow > mainStartRow ? localDividerRow - 1 : 25;
  const localStartRow = localDividerRow > 0 ? localDividerRow + 1 : 27;
  const localEndRow =
    signatureStartRow > localStartRow ? signatureStartRow - 1 : Math.max(localStartRow + 19, 46);

  // Header fields
  const fromWarehouse = getCellText(ws, 6, 'B') || 'Paranaque WHS';
  const rawDate = getCellText(ws, 6, 'E') || getTodayDateStr();
  const destinationCodeCell = getCellText(ws, 8, 'B');
  const destination = getCellText(ws, 8, 'E');
  const siteIdCell = getCellText(ws, 10, 'E') || getCellText(ws, 10, 'B');
  const siteAddress =
    getCellText(ws, 11, 'E') ||
    getCellText(ws, 12, 'E') ||
    getCellText(ws, 12, 'B');

  // Parse line items helper
  const parseLineItemRow = (
    rowNum: number,
    group: 'main' | 'local',
    idx: number
  ): MRFLineItem | null => {
    const partNumber = getCellText(ws, rowNum, 'A');
    const description = getCellText(ws, rowNum, 'B');
    const packageNo = getCellText(ws, rowNum, 'C');
    const reqText = getCellText(ws, rowNum, 'D');
    const issuedText = getCellText(ws, rowNum, 'E');
    const receivedText = getCellText(ws, rowNum, 'F');
    const balanceText = getCellText(ws, rowNum, 'G');

    if (!partNumber && !description && !reqText) {
      return null;
    }

    const catMatch = partNumber
      ? catalogByCode.get(partNumber.toLowerCase())
      : undefined;
    const defaultUom = group === 'main' ? 'PC' : 'pcs';
    const inferredUom = isLikelyUom(issuedText)
      ? issuedText
      : catMatch?.uom || defaultUom;

    const qtyReq = parseOptionalNumber(reqText);
    const qtyIssuedNum = parseOptionalNumber(issuedText);
    const qtyIssued: number | string =
      qtyIssuedNum !== '' ? qtyIssuedNum : issuedText || inferredUom;

    return {
      id: `imp_${group}_${idx}_${Date.now().toString(36)}`,
      partNumber,
      description,
      packageNo,
      uom: inferredUom,
      qtyReq,
      qtyIssued,
      qtyReceived: parseOptionalNumber(receivedText),
      qtyBalance: parseOptionalNumber(balanceText),
      category:
        catMatch?.category && catMatch.category !== '-'
          ? catMatch.category
          : group === 'main'
          ? 'Equipment'
          : 'Local Accessories',
    };
  };

  const mainItems: MRFLineItem[] = [];
  for (let r = mainStartRow; r <= mainEndRow; r++) {
    const item = parseLineItemRow(r, 'main', mainItems.length + 1);
    if (item) mainItems.push(item);
  }

  const localMaterials: MRFLineItem[] = [];
  for (let r = localStartRow; r <= localEndRow; r++) {
    const item = parseLineItemRow(r, 'local', localMaterials.length + 1);
    if (item) localMaterials.push(item);
  }

  if (mainItems.length === 0 && localMaterials.length === 0) {
    throw new Error(
      'No MRF line items were found in this Excel file. Please upload a valid Material Request Form (.xlsx).'
    );
  }

  // Parse signatures & MRF Number block
  const sigBase = signatureStartRow > 0 ? signatureStartRow : 47;
  let contactNokiaInhouse = '';
  let contactSubcon = '';
  let requestedByName = '';
  let preparedByName = '';
  let receivedByName = '';
  let requestedByDate = '';
  let preparedByDate = '';
  let receivedByDate = '';
  let status: 'Accepted' | 'Rejected' | 'Pending' = 'Pending';
  let mrfLine1 = '';
  let mrfLine2 = '';

  const scanSigEnd = Math.min(maxScanRows + 5, sigBase + 16);
  for (let r = sigBase; r <= scanSigEnd; r++) {
    const a = getCellText(ws, r, 'A');
    const b = getCellText(ws, r, 'B');
    const c = getCellText(ws, r, 'C');
    const d = getCellText(ws, r, 'D');
    const e = getCellText(ws, r, 'E');
    const f = getCellText(ws, r, 'F');

    if (/^NOKIA INHOUSE/i.test(d)) contactNokiaInhouse = d;
    if (/SUBCON/i.test(d) && !contactSubcon) contactSubcon = d;

    if (/^Request by/i.test(a) && !requestedByName) {
      requestedByName = stripLabelPrefix(a, ['Request by']);
    }
    if (/^Prepared by/i.test(b)) {
      const val = stripLabelPrefix(b, ['Prepared by']);
      if (val) preparedByName = val;
    }
    if (/^Received by/i.test(c)) {
      const val = stripLabelPrefix(c, ['Received by']);
      if (val) receivedByName = val;
    }

    if (/^Date/i.test(a) && !requestedByDate) {
      requestedByDate = stripLabelPrefix(a, ['Date']);
    }
    if (/^Date/i.test(b) && !preparedByDate) {
      preparedByDate = stripLabelPrefix(b, ['Date']);
    }
    if (/^Date/i.test(c) && !receivedByDate) {
      receivedByDate = stripLabelPrefix(c, ['Date']);
    }

    if (/\[?\s*x\s*\]?\s*accepted/i.test(c)) {
      status = 'Accepted';
    } else if (/\[?\s*x\s*\]?\s*rejected/i.test(c)) {
      status = 'Rejected';
    }

    if (/^MRF\s*:?$/i.test(e)) {
      mrfLine1 = f || getCellText(ws, r, 'G');
      mrfLine2 = getCellText(ws, r + 1, 'F') || getCellText(ws, r + 1, 'G');
    }
  }

  const combinedMrfNumber = `${mrfLine1}${mrfLine2}`.trim();
  const fileBaseName = file.name.replace(/\.(xlsx|xls)$/i, '').trim();
  const mrfNumber =
    combinedMrfNumber ||
    (/^NOKIA-/i.test(ws.name) ? ws.name : '') ||
    fileBaseName ||
    'MRF_IMPORTED';

  // Infer destination PLAID from header cell, siteId, or MRF number
  const inferredPlaid =
    destinationCodeCell ||
    siteIdCell.match(/^([A-Z]{2,5}\d+)/i)?.[1]?.toUpperCase() ||
    mrfNumber.match(/_([A-Z]{2,5}\d+)[-_]/i)?.[1]?.toUpperCase() ||
    '';

  const matchedSite = inferredPlaid
    ? sites.find((s) => s.plaid.toLowerCase() === inferredPlaid.toLowerCase())
    : undefined;

  const resolvedSiteId =
    siteIdCell ||
    (matchedSite ? `${matchedSite.plaid} - ${matchedSite.siteName}` : inferredPlaid);

  const resolvedDestination =
    destination || (matchedSite as any)?.destinationHub || '';

  const resolvedAddress = siteAddress || matchedSite?.address || '';

  return {
    id: `mrf_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    header: {
      mrfNumber,
      fromWarehouse,
      date: rawDate,
      destinationCode: inferredPlaid,
      destination: resolvedDestination,
      siteId: resolvedSiteId,
      siteAddress: resolvedAddress,
      project: 'Globe Telecom / Nokia FN OLT Rollout',
    },
    mainItems,
    localMaterials,
    signatures: {
      requestedBy: {
        name: requestedByName,
        title: 'Nokia Inhouse Engineer',
        date: requestedByDate || rawDate,
      },
      preparedBy: {
        name: preparedByName,
        title: 'Paranaque WHS Supervisor',
        date: preparedByDate || rawDate,
      },
      receivedBy: {
        name: receivedByName,
        title: 'Site Representative',
        date: receivedByDate || rawDate,
      },
      contactNokiaInhouse:
        contactNokiaInhouse || 'NOKIA INHOUSE - JOHN CARLO RABANES/09669343065',
      contactSubcon:
        contactSubcon || 'DNA SUBCON - EASTMOND MIRANDA/09543991868',
      status,
      remarks: `Imported from ${file.name} (${mainItems.length} main, ${localMaterials.length} local items).`,
    },
  };
}
