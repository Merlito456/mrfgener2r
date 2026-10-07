import JSZip from 'jszip';
import { MRFDocument } from '../types/mrf';
import { splitMRFNumber } from './storage';

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function updateCellInRow(
  rowXml: string,
  cellRef: string,
  styleId: string,
  value: any,
  isNumeric = false
): string {
  // Explicitly match either a self-closing cell tag (<c r="X".../>)
  // or a full cell element (<c r="X"...>...</c>). Never consume subsequent cells!
  const cellRegex = new RegExp(
    '<c r="' + cellRef + '"(?:[^>]*?\\/>|[^>]*?>[\\s\\S]*?<\\/c>)'
  );
  let newCell = '';

  if (value === '' || value === null || value === undefined) {
    newCell = `<c r="${cellRef}" s="${styleId}"/>`;
  } else if (isNumeric && !isNaN(Number(value))) {
    newCell = `<c r="${cellRef}" s="${styleId}"><v>${Number(value)}</v></c>`;
  } else {
    newCell = `<c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(
      value
    )}</t></is></c>`;
  }

  if (cellRegex.test(rowXml)) {
    return rowXml.replace(cellRegex, newCell);
  }

  // If the cell was not present in the row tag, insert it cleanly
  if (rowXml.endsWith('/>')) {
    return rowXml.slice(0, -2) + '>' + newCell + '</row>';
  } else if (rowXml.includes('</row>')) {
    return rowXml.replace('</row>', newCell + '</row>');
  }
  return rowXml;
}

function shiftRowXml(xml: string, targetR: number): string {
  return xml
    .replace(/^<row\s+r="\d+"/, () => `<row r="${targetR}"`)
    .replace(/<c\s+r="([A-Z]+)\d+"/g, (_match, col) => `<c r="${col}${targetR}"`);
}

function expandSheetXmlRows(
  sheetXml: string,
  extraMain: number,
  extraLocal: number
): string {
  if (extraMain <= 0 && extraLocal <= 0) return sheetXml;

  // Accurately capture each row whether self-closing (<row r="X".../>) or pair (<row r="X"...>...</row>)
  const rowRegex = /<row\s+r="(\d+)"(?:[^>]*?\/>|[^>]*?>[\s\S]*?<\/row>)/g;
  const rowsMap = new Map<number, string>();
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(sheetXml)) !== null) {
    const rMatch = m[0].match(/<row\s+r="(\d+)"/);
    if (rMatch) {
      rowsMap.set(Number(rMatch[1]), m[0]);
    }
  }

  function createMainItemRow(rowNum: number): string {
    return `<row r="${rowNum}" spans="1:12" s="24" customFormat="1" ht="14.25" customHeight="1">` +
      `<c r="A${rowNum}" s="55"/><c r="B${rowNum}" s="35"/><c r="C${rowNum}" s="38"/>` +
      `<c r="D${rowNum}" s="39"/><c r="E${rowNum}" s="40"/><c r="F${rowNum}" s="40"/>` +
      `<c r="G${rowNum}" s="40"/><c r="H${rowNum}" s="23"/><c r="I${rowNum}" s="23"/>` +
      `<c r="J${rowNum}" s="23"/><c r="K${rowNum}" s="23"/><c r="L${rowNum}" s="23"/></row>`;
  }

  function createLocalItemRow(rowNum: number): string {
    return `<row r="${rowNum}" spans="1:8" ht="14.25" customHeight="1">` +
      `<c r="A${rowNum}" s="35"/><c r="B${rowNum}" s="35"/><c r="C${rowNum}" s="42"/>` +
      `<c r="D${rowNum}" s="46"/><c r="E${rowNum}" s="43"/><c r="F${rowNum}" s="25"/>` +
      `<c r="G${rowNum}" s="25"/></row>`;
  }

  const newRows: string[] = [];

  // Rows 1..25
  for (let r = 1; r <= 25; r++) {
    if (rowsMap.has(r)) newRows.push(rowsMap.get(r)!);
  }

  // Extra main item rows (26 .. 25 + extraMain)
  for (let i = 1; i <= extraMain; i++) {
    newRows.push(createMainItemRow(25 + i));
  }

  // Row 26 (Section divider "LOCAL MATERIALS/ ACCESSORIES") shifted to 26 + extraMain
  if (rowsMap.has(26)) {
    newRows.push(shiftRowXml(rowsMap.get(26)!, 26 + extraMain));
  }

  // Rows 27..46 shifted by extraMain
  for (let r = 27; r <= 46; r++) {
    if (rowsMap.has(r)) {
      newRows.push(shiftRowXml(rowsMap.get(r)!, r + extraMain));
    }
  }

  // Extra local material rows (47 + extraMain .. 46 + extraMain + extraLocal)
  for (let i = 1; i <= extraLocal; i++) {
    newRows.push(createLocalItemRow(46 + extraMain + i));
  }

  // Rows 47..max shifted by totalShift = extraMain + extraLocal
  const totalShift = extraMain + extraLocal;
  const maxRow = Math.max(...Array.from(rowsMap.keys()));
  for (let r = 47; r <= maxRow; r++) {
    if (rowsMap.has(r)) {
      newRows.push(shiftRowXml(rowsMap.get(r)!, r + totalShift));
    }
  }

  // Replace sheetData
  sheetXml = sheetXml.replace(
    /<sheetData>[\s\S]*?<\/sheetData>/,
    `<sheetData>${newRows.join('')}</sheetData>`
  );

  // Update dimension
  sheetXml = sheetXml.replace(
    /<dimension ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/,
    (_match: string, c1: string, r1: string, c2: string, r2: string) => {
      return `<dimension ref="${c1}${r1}:${c2}${Number(r2) + totalShift}"/>`;
    }
  );

  // Update mergeCells
  sheetXml = sheetXml.replace(
    /<mergeCells count="(\d+)">([\s\S]*?)<\/mergeCells>/,
    (_match: string, count: string, inner: string) => {
      const updatedInner = inner.replace(
        /<mergeCell ref="([^"]+)"\/>/g,
        (_refM: string, ref: string) => {
          const newRef = ref.replace(/([A-Z]+)(\d+)/g, (cellM: string, col: string, rowStr: string) => {
            const row = Number(rowStr);
            if (row === 26) {
              return `${col}${row + extraMain}`;
            } else if (row >= 27 && row <= 46) {
              return `${col}${row + extraMain}`;
            } else if (row >= 47) {
              return `${col}${row + totalShift}`;
            }
            return cellM;
          });
          return `<mergeCell ref="${newRef}"/>`;
        }
      );
      return `<mergeCells count="${count}">${updatedInner}</mergeCells>`;
    }
  );

  return sheetXml;
}

function updateRowInSheet(
  sheetXml: string,
  rowNum: number,
  cellMap: Record<string, { styleId: string; value: any; isNumeric?: boolean }>
): string {
  const rowRegex = new RegExp('<row\\s+r="' + rowNum + '"(?:[^>]*?\\/>|[^>]*?>[\\s\\S]*?<\\/row>)');
  const match = sheetXml.match(rowRegex);
  if (!match) return sheetXml;
  let rowContent = match[0];
  for (const [cellRef, { styleId, value, isNumeric }] of Object.entries(cellMap)) {
    rowContent = updateCellInRow(rowContent, cellRef, styleId, value, Boolean(isNumeric));
  }
  return sheetXml.replace(rowRegex, rowContent);
}

/**
 * Exports the MRF document by directly populating the pristine MRF_template.xlsx.
 * Uses JSZip to ensure ZERO XML errors, preserving all conditional formatting,
 * images, drawings, and fonts without triggering Microsoft Excel repair warnings.
 */
export async function exportMRFToExcel(
  doc: MRFDocument,
  customTemplateBuffer?: ArrayBuffer | null
): Promise<Blob> {
  let templateBuffer: ArrayBuffer;

  if (customTemplateBuffer) {
    templateBuffer = customTemplateBuffer;
  } else {
    const res = await fetch('/MRF_template.xlsx');
    if (!res.ok) {
      throw new Error(`Failed to fetch /MRF_template.xlsx: ${res.statusText}`);
    }
    templateBuffer = await res.arrayBuffer();
  }

  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Update Worksheet (xl/worksheets/sheet1.xml)
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');

  // Sanitize sheet name (max 31 chars, no invalid chars)
  const cleanSheetName = (doc.header.mrfNumber || 'MRF_Form')
    .replace(/[\\/?*:[\]]/g, '_')
    .slice(0, 31);

  // 2. Update Workbook Sheet Name (xl/workbook.xml)
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('string');
    wbXml = wbXml.replace(/name="[^"]*"/, `name="${cleanSheetName}"`);
    zip.file('xl/workbook.xml', wbXml);
  }

  // --- HEADER FIELDS ---
  // Row 6: FROM (B6) and DATE (E6 merged across E6:G6)
  sheetXml = updateRowInSheet(sheetXml, 6, {
    B6: { styleId: '7', value: doc.header.fromWarehouse || 'Paranaque WHS' },
    E6: { styleId: '94', value: doc.header.date || '' },
  });

  // Row 8: B8 is BLANK; DESTINATION in E8 (merged across E8:G8)
  sheetXml = updateRowInSheet(sheetXml, 8, {
    B8: { styleId: '12', value: '' },
    E8: { styleId: '100', value: doc.header.destination || '' },
  });

  // Row 10: B10 is BLANK; SITE ID in E10 (merged across E10:G10)
  sheetXml = updateRowInSheet(sheetXml, 10, {
    B10: { styleId: '16', value: '' },
    E10: { styleId: '100', value: doc.header.siteId || '' },
  });

  // Row 11 & 12: SITE ADDRESS in E11:G12 (the dedicated multiline address box).
  // B12 is left blank.
  sheetXml = updateRowInSheet(sheetXml, 11, {
    E11: { styleId: '95', value: doc.header.siteAddress || '' },
  });
  sheetXml = updateRowInSheet(sheetXml, 12, {
    B12: { styleId: '16', value: '' },
    E12: { styleId: '96', value: '' },
  });

  // Dynamically expand template rows if items exceed standard template capacity (8 main, 20 local)
  const extraMain = Math.max(0, doc.mainItems.length - 8);
  const extraLocal = Math.max(0, doc.localMaterials.length - 20);
  const totalShift = extraMain + extraLocal;

  if (extraMain > 0 || extraLocal > 0) {
    sheetXml = expandSheetXmlRows(sheetXml, extraMain, extraLocal);
  }

  // --- MAIN ITEMS (Rows 18 onwards) ---
  const totalMainSlots = Math.max(8, doc.mainItems.length);
  for (let i = 0; i < totalMainSlots; i++) {
    const rowNum = 18 + i;
    const item = doc.mainItems[i];
    // Copy UOM column value and place under WHSE QUANTITY ISSUED
    const mainIssuedVal = item
      ? (item.qtyIssued !== '' && item.qtyIssued !== undefined ? String(item.qtyIssued) : (item.uom || ''))
      : '';
    const isMainIssuedNumeric = Boolean(mainIssuedVal !== '' && !isNaN(Number(mainIssuedVal)));

    sheetXml = updateRowInSheet(sheetXml, rowNum, {
      [`A${rowNum}`]: { styleId: '55', value: item?.partNumber || '' },
      [`B${rowNum}`]: { styleId: '35', value: item?.description || '' },
      [`C${rowNum}`]: { styleId: '38', value: '' }, // Do not fill Package No.
      [`D${rowNum}`]: {
        styleId: '39',
        value: item && item.qtyReq !== '' ? item.qtyReq : '',
        isNumeric: true,
      },
      [`E${rowNum}`]: {
        styleId: '40',
        value: mainIssuedVal,
        isNumeric: isMainIssuedNumeric,
      },
      [`F${rowNum}`]: {
        styleId: '40',
        value: item && item.qtyReceived !== '' ? item.qtyReceived : '',
        isNumeric: Boolean(item && item.qtyReceived !== '' && !isNaN(Number(item.qtyReceived))),
      },
      [`G${rowNum}`]: {
        styleId: '40',
        value: item && item.qtyBalance !== '' ? item.qtyBalance : '',
        isNumeric: Boolean(item && item.qtyBalance !== '' && !isNaN(Number(item.qtyBalance))),
      },
    });
  }

  // --- LOCAL MATERIALS / ACCESSORIES (Rows 27 + extraMain onwards) ---
  const totalLocalSlots = Math.max(20, doc.localMaterials.length);
  for (let i = 0; i < totalLocalSlots; i++) {
    const rowNum = 27 + extraMain + i;
    const item = doc.localMaterials[i];
    // Copy UOM column value and place under WHSE QUANTITY ISSUED
    const localIssuedVal = item
      ? (item.qtyIssued !== '' && item.qtyIssued !== undefined ? String(item.qtyIssued) : (item.uom || ''))
      : '';
    const isLocalIssuedNumeric = Boolean(localIssuedVal !== '' && !isNaN(Number(localIssuedVal)));

    sheetXml = updateRowInSheet(sheetXml, rowNum, {
      [`A${rowNum}`]: { styleId: '35', value: item?.partNumber || '' },
      [`B${rowNum}`]: { styleId: '35', value: item?.description || '' },
      [`C${rowNum}`]: { styleId: '42', value: '' }, // Do not fill Package No.
      [`D${rowNum}`]: {
        styleId: '46',
        value: item && item.qtyReq !== '' ? item.qtyReq : '',
        isNumeric: true,
      },
      [`E${rowNum}`]: {
        styleId: '43',
        value: localIssuedVal,
        isNumeric: isLocalIssuedNumeric,
      },
      [`F${rowNum}`]: {
        styleId: '25',
        value: item && item.qtyReceived !== '' ? item.qtyReceived : '',
        isNumeric: Boolean(item && item.qtyReceived !== '' && !isNaN(Number(item.qtyReceived))),
      },
      [`G${rowNum}`]: {
        styleId: '25',
        value: item && item.qtyBalance !== '' ? item.qtyBalance : '',
        isNumeric: Boolean(item && item.qtyBalance !== '' && !isNaN(Number(item.qtyBalance))),
      },
    });
  }

  // --- SIGNATURES & AUTHORIZATION (shifted by totalShift) ---
  // Row 47 & 48: Request by (A48), Contacts (D47, D48)
  const contact1 = doc.signatures.contactNokiaInhouse || 'NOKIA INHOUSE - JOHN CARLO RABANES/09669343065';
  const contact2 = doc.signatures.contactSubcon || 'DNA SUBCON - EASTMOND MIRANDA/09543991868';

  const sigRow47 = 47 + totalShift;
  const sigRow48 = 48 + totalShift;
  const sigRow50 = 50 + totalShift;
  const sigRow51 = 51 + totalShift;
  const sigRow54 = 54 + totalShift;
  const sigRow56 = 56 + totalShift;
  const sigRow57 = 57 + totalShift;

  sheetXml = updateRowInSheet(sheetXml, sigRow47, {
    [`B${sigRow47}`]: { styleId: '78', value: 'Prepared by: ' },
    [`C${sigRow47}`]: { styleId: '83', value: 'Received by: ' },
    [`D${sigRow47}`]: { styleId: '89', value: contact1 },
  });

  sheetXml = updateRowInSheet(sheetXml, sigRow48, {
    [`A${sigRow48}`]: {
      styleId: '81',
      value: doc.signatures.requestedBy.name
        ? `Request by: ${doc.signatures.requestedBy.name}`
        : 'Request by: ',
    },
    [`B${sigRow48}`]: {
      styleId: '79',
      value: doc.signatures.preparedBy.name
        ? `Prepared by: ${doc.signatures.preparedBy.name}`
        : 'Prepared by: ',
    },
    [`C${sigRow48}`]: {
      styleId: '84',
      value: doc.signatures.receivedBy.name
        ? `Received by: ${doc.signatures.receivedBy.name}`
        : 'Received by: ',
    },
    [`D${sigRow48}`]: { styleId: '91', value: contact2 },
  });

  sheetXml = updateRowInSheet(sheetXml, sigRow50, {
    [`A${sigRow50}`]: {
      styleId: '30',
      value: doc.signatures.requestedBy.date
        ? `Date: ${doc.signatures.requestedBy.date}`
        : 'Date: ',
    },
  });

  sheetXml = updateRowInSheet(sheetXml, sigRow51, {
    [`B${sigRow51}`]: {
      styleId: '30',
      value: doc.signatures.preparedBy.date
        ? `Date: ${doc.signatures.preparedBy.date}`
        : 'Date',
    },
    [`C${sigRow51}`]: {
      styleId: '65',
      value: doc.signatures.receivedBy.date
        ? `Date: ${doc.signatures.receivedBy.date}`
        : 'Date :',
    },
  });

  // Acceptance status stamp
  sheetXml = updateRowInSheet(sheetXml, sigRow54, {
    [`C${sigRow54}`]: {
      styleId: '1',
      value: doc.signatures.status === 'Accepted' ? '[ X ] Accepted' : 'Accepted',
    },
  });

  // MRF reference: written on top line (F56), and when it exceeds the line it automatically continues below on second line (F57)
  const mrfStr = doc.header.mrfNumber || '';
  const { line1: mrfPart1, line2: mrfPart2 } = splitMRFNumber(mrfStr, 47);

  sheetXml = updateRowInSheet(sheetXml, sigRow56, {
    [`C${sigRow56}`]: {
      styleId: '1',
      value: doc.signatures.status === 'Rejected' ? '[ X ] Rejected' : 'Rejected',
    },
    [`E${sigRow56}`]: {
      styleId: '32',
      value: 'MRF:',
    },
    [`F${sigRow56}`]: {
      styleId: '76',
      value: mrfPart1,
    },
  });

  // Second line (F57 merged across F57:G57)
  sheetXml = updateRowInSheet(sheetXml, sigRow57, {
    [`F${sigRow57}`]: {
      styleId: '77',
      value: mrfPart2 || '',
    },
  });

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  // Generate finalized pristine Excel buffer
  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger browser download if running in client environment
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const url = URL.createObjectURL(outBlob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = doc.header.mrfNumber
      ? `MRF_${doc.header.mrfNumber}.xlsx`
      : `MRF_Document_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return outBlob;
}
