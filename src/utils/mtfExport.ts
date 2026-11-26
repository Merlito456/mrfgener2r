import JSZip from 'jszip';
import { MRFDocument } from '../types/mrf';
import {
  formatMTFLongDate,
  resolveMTFData,
  ResolvedMTFData,
} from './mtfSync';

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toExcelSerialDate(dateStr?: string): number | null {
  const clean = (dateStr || '').trim();
  if (!clean) return null;
  const ymd = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!ymd) return null;
  const y = Number(ymd[1]);
  const m = Number(ymd[2]);
  const d = Number(ymd[3]);
  if (!y || !m || !d) return null;
  const utc = Date.UTC(y, m - 1, d);
  const excelEpoch = Date.UTC(1899, 11, 30);
  return Math.round((utc - excelEpoch) / 86400000);
}

function extractExistingStyle(rowXml: string, cellRef: string, fallbackStyle: string): string {
  const regex = new RegExp(`<c r="${cellRef}"[^>]*s="(\\d+)"`);
  const m = rowXml.match(regex);
  return m ? m[1] : fallbackStyle;
}

function updateCellInRow(
  rowXml: string,
  cellRef: string,
  value: any,
  opts: { fallbackStyle?: string; isNumeric?: boolean } = {}
): string {
  const styleId = extractExistingStyle(rowXml, cellRef, opts.fallbackStyle || '0');
  const cellRegex = new RegExp(
    '<c r="' + cellRef + '"(?:[^>]*?\\/>|[^>]*?>[\\s\\S]*?<\\/c>)'
  );

  let newCell = '';
  if (value === '' || value === null || value === undefined) {
    newCell = `<c r="${cellRef}" s="${styleId}"/>`;
  } else if (opts.isNumeric && !isNaN(Number(value))) {
    newCell = `<c r="${cellRef}" s="${styleId}"><v>${Number(value)}</v></c>`;
  } else {
    newCell = `<c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(
      value
    )}</t></is></c>`;
  }

  if (cellRegex.test(rowXml)) {
    return rowXml.replace(cellRegex, newCell);
  }

  if (rowXml.endsWith('/>')) {
    return rowXml.slice(0, -2) + '>' + newCell + '</row>';
  }
  if (rowXml.includes('</row>')) {
    return rowXml.replace('</row>', newCell + '</row>');
  }
  return rowXml;
}

function updateRowInSheet(
  sheetXml: string,
  rowNum: number,
  cellMap: Record<string, { value: any; fallbackStyle?: string; isNumeric?: boolean }>
): string {
  const rowRegex = new RegExp('<row\\s+r="' + rowNum + '"(?:[^>]*?\\/>|[^>]*?>[\\s\\S]*?<\\/row>)');
  const match = sheetXml.match(rowRegex);
  if (!match) return sheetXml;
  let rowContent = match[0];
  for (const [cellRef, cfg] of Object.entries(cellMap)) {
    rowContent = updateCellInRow(rowContent, cellRef, cfg.value, {
      fallbackStyle: cfg.fallbackStyle,
      isNumeric: cfg.isNumeric,
    });
  }
  return sheetXml.replace(rowRegex, rowContent);
}

function shiftRowXml(xml: string, targetR: number): string {
  return xml
    .replace(/^<row\s+r="\d+"/, () => `<row r="${targetR}"`)
    .replace(/<c\s+r="([A-Z]+)\d+"/g, (_match, col) => `<c r="${col}${targetR}"`);
}

function createExpandedMTFItemRow(rowNum: number, isFinalRow = false): string {
  const dStyle = isFinalRow ? '102' : '101';
  return (
    `<row r="${rowNum}" spans="1:15" ht="12.95" customHeight="1">` +
    `<c r="A${rowNum}" s="46"><v>${rowNum - 17}</v></c>` +
    `<c r="B${rowNum}" s="125"/><c r="C${rowNum}" s="125"/>` +
    `<c r="D${rowNum}" s="${dStyle}"/>` +
    `<c r="E${rowNum}" s="126"/><c r="F${rowNum}" s="127"/>` +
    `<c r="G${rowNum}" s="127"/><c r="H${rowNum}" s="127"/>` +
    `<c r="I${rowNum}" s="128"/>` +
    `<c r="J${rowNum}" s="104"/><c r="K${rowNum}" s="104"/>` +
    `<c r="L${rowNum}" s="52"/><c r="M${rowNum}" s="53"/>` +
    `<c r="N${rowNum}" s="53"/><c r="O${rowNum}" s="52"/>` +
    `</row>`
  );
}

function expandMTFSheetRows(sheetXml: string, extraRows: number): string {
  if (extraRows <= 0) return sheetXml;

  const rowRegex = /<row\s+r="(\d+)"(?:[^>]*?\/>|[^>]*?>[\s\S]*?<\/row>)/g;
  const rowsMap = new Map<number, string>();
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(sheetXml)) !== null) {
    const rMatch = m[0].match(/<row\s+r="(\d+)"/);
    if (rMatch) {
      rowsMap.set(Number(rMatch[1]), m[0]);
    }
  }

  const newRows: string[] = [];

  // Rows 1..40 stay untouched
  for (let r = 1; r <= 40; r++) {
    if (rowsMap.has(r)) newRows.push(rowsMap.get(r)!);
  }

  // Row 41 gets middle-row style (D41 -> style 101) when expanded, then extra rows 42 .. 40+extraRows, and final item row at 41+extraRows
  newRows.push(createExpandedMTFItemRow(41, false));
  for (let i = 1; i <= extraRows; i++) {
    const targetRow = 41 + i;
    newRows.push(createExpandedMTFItemRow(targetRow, i === extraRows));
  }

  // Shift Rows 42..max by extraRows
  const maxRow = Math.max(...Array.from(rowsMap.keys()));
  for (let r = 42; r <= maxRow; r++) {
    if (rowsMap.has(r)) {
      newRows.push(shiftRowXml(rowsMap.get(r)!, r + extraRows));
    }
  }

  sheetXml = sheetXml.replace(
    /<sheetData>[\s\S]*?<\/sheetData>/,
    `<sheetData>${newRows.join('')}</sheetData>`
  );

  // Update dimension
  sheetXml = sheetXml.replace(
    /<dimension ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/,
    (_match, c1, r1, c2, r2) => `<dimension ref="${c1}${r1}:${c2}${Number(r2) + extraRows}"/>`
  );

  // Update mergeCells (shift >= 42 and add B{r}:C{r}, E{r}:I{r} for each extra row)
  sheetXml = sheetXml.replace(
    /<mergeCells count="(\d+)">([\s\S]*?)<\/mergeCells>/,
    (_match, countStr, inner) => {
      const updatedInner = inner.replace(
        /<mergeCell ref="([^"]+)"\/>/g,
        (_refM: string, ref: string) => {
          const newRef = ref.replace(/([A-Z]+)(\d+)/g, (cellM: string, col: string, rowStr: string) => {
            const row = Number(rowStr);
            if (row >= 42) return `${col}${row + extraRows}`;
            return cellM;
          });
          return `<mergeCell ref="${newRef}"/>`;
        }
      );
      let addedMerges = '';
      for (let i = 1; i <= extraRows; i++) {
        const targetRow = 41 + i;
        addedMerges += `<mergeCell ref="B${targetRow}:C${targetRow}"/><mergeCell ref="E${targetRow}:I${targetRow}"/>`;
      }
      const nextCount = Number(countStr) + extraRows * 2;
      return `<mergeCells count="${nextCount}">${updatedInner}${addedMerges}</mergeCells>`;
    }
  );

  return sheetXml;
}

function setCheckboxState(
  drawingXml: string,
  checkBoxName: string,
  checked: boolean,
  uncheckedRId: 'rId1' | 'rId2' = 'rId2'
): string {
  const targetRId = checked ? 'rId3' : uncheckedRId;
  const anchorRegex = new RegExp(
    `(<xdr:twoCellAnchor[\\s\\S]*?name="${checkBoxName}"[\\s\\S]*?r:embed=")(rId\\d+)("[\\s\\S]*?<\\/xdr:twoCellAnchor>)`
  );
  return drawingXml.replace(anchorRegex, `$1${targetRId}$3`);
}

function updateDrawingCheckboxes(drawingXml: string, mtf: ResolvedMTFData): string {
  let xml = drawingXml;
  // Transfer Category checkboxes
  xml = setCheckboxState(xml, 'CheckBox4', mtf.transferCategory === 'WHSE TO WHSE', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox5', mtf.transferCategory === 'WHSE TO SITE', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox6', mtf.transferCategory === 'WHSE TO SUPPLIER', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox1', mtf.transferCategory === 'SUPPLIER TO WHSE', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox2', mtf.transferCategory === 'SUPPLIER TO SITE', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox3', mtf.transferCategory === 'OTHERS', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox10', mtf.transferCategory === 'SITE TO WHSE', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox11', mtf.transferCategory === 'SITE TO SITE', 'rId2');

  // Materials Category checkboxes
  xml = setCheckboxState(xml, 'CheckBox7', mtf.materialsCategory === 'New', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox8', mtf.materialsCategory === 'Defective', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox9', mtf.materialsCategory === 'Repaired', 'rId2');

  // Action Done checkboxes
  xml = setCheckboxState(xml, 'CheckBox16', mtf.actionDone === 'Processed', 'rId2');
  xml = setCheckboxState(xml, 'CheckBox17', mtf.actionDone === 'Cancelled', 'rId2');

  // Manual Hauling Origin (Yes/No)
  xml = setCheckboxState(xml, 'CheckBox12', mtf.manualHaulingOrigin === 'Yes', 'rId1');
  xml = setCheckboxState(xml, 'CheckBox13', mtf.manualHaulingOrigin === 'No', 'rId1');

  // Manual Hauling Destination (Yes/No)
  xml = setCheckboxState(xml, 'CheckBox14', mtf.manualHaulingDestination === 'Yes', 'rId1');
  xml = setCheckboxState(xml, 'CheckBox15', mtf.manualHaulingDestination === 'No', 'rId1');

  return xml;
}

/**
 * Exports the MTF document by directly populating the official MTF_template.xlsx.
 * Follows the active MRFDocument items, destination, warehouse, date, and requestor details.
 */
export async function exportMTFToExcel(
  doc: MRFDocument,
  customTemplateBuffer?: ArrayBuffer | null
): Promise<Blob> {
  let templateBuffer: ArrayBuffer;

  if (customTemplateBuffer) {
    templateBuffer = customTemplateBuffer;
  } else {
    const res = await fetch('/MTF_template.xlsx');
    if (!res.ok) {
      throw new Error(`Failed to fetch /MTF_template.xlsx: ${res.statusText}`);
    }
    templateBuffer = await res.arrayBuffer();
  }

  const mtf = resolveMTFData(doc);
  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Update Worksheet Name (max 31 chars, Excel safe)
  const cleanSheetName = (mtf.mtfNumber || 'MTF_Form')
    .replace(/[\\/?*:[\]]/g, '_')
    .slice(0, 31);
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('string');
    wbXml = wbXml.replace(/name="[^"]*"/, `name="${escapeXml(cleanSheetName)}"`);
    zip.file('xl/workbook.xml', wbXml);
  }

  // 2. Update Checkbox images in xl/drawings/drawing1.xml
  const drawingFile = zip.file('xl/drawings/drawing1.xml');
  if (drawingFile) {
    const drawingXml = await drawingFile.async('string');
    zip.file('xl/drawings/drawing1.xml', updateDrawingCheckboxes(drawingXml, mtf));
  }

  // 3. Patch xl/worksheets/sheet1.xml
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');

  // Remove broken #REF! conditionalFormatting rule present in the original template
  sheetXml = sheetXml.replace(
    /<conditionalFormatting[^>]*>[\s\S]*?<formula>#REF!<\/formula>[\s\S]*?<\/conditionalFormatting>/g,
    ''
  );

  // Row 2: Project Name (C2) & Date Prepared (K2)
  const serialDatePrepared = toExcelSerialDate(mtf.datePrepared);
  sheetXml = updateRowInSheet(sheetXml, 2, {
    C2: { value: mtf.projectName || '[Select Project Name]', fallbackStyle: '148' },
    K2:
      serialDatePrepared !== null
        ? { value: serialDatePrepared, fallbackStyle: '8', isNumeric: true }
        : { value: mtf.datePrepared || '', fallbackStyle: '8' },
  });

  // Row 3: MTF Number (K3)
  sheetXml = updateRowInSheet(sheetXml, 3, {
    K3: { value: mtf.mtfNumber || '', fallbackStyle: '149' },
  });

  // Row 7: Others text if selected
  if (mtf.transferCategory === 'OTHERS' && mtf.othersText) {
    sheetXml = updateRowInSheet(sheetXml, 7, {
      E7: { value: mtf.othersText, fallbackStyle: '24' },
    });
  }

  // Row 9: Destination PLA ID (J9)
  sheetXml = updateRowInSheet(sheetXml, 9, {
    J9: { value: mtf.destinationPlaid || '', fallbackStyle: '134' },
  });

  // Row 10: Origin Site Name (C10) & Destination Site Name (J10)
  sheetXml = updateRowInSheet(sheetXml, 10, {
    C10: { value: mtf.originSiteName || '', fallbackStyle: '33' },
    J10: { value: mtf.destinationSiteName || '', fallbackStyle: '134' },
  });

  // Row 11: Origin Address (C11) & Destination Address (J11)
  sheetXml = updateRowInSheet(sheetXml, 11, {
    C11: { value: mtf.originAddress || '', fallbackStyle: '33' },
    J11: { value: mtf.destinationAddress || '', fallbackStyle: '135' },
  });

  // Row 12: Date Expected on Destination (J12)
  const serialDateExpected = toExcelSerialDate(mtf.dateExpected);
  sheetXml = updateRowInSheet(sheetXml, 12, {
    J12:
      serialDateExpected !== null
        ? { value: serialDateExpected, fallbackStyle: '136', isNumeric: true }
        : { value: mtf.dateExpected || '', fallbackStyle: '136' },
  });

  // Expand rows dynamically if items > 24
  const extraRows = Math.max(0, mtf.items.length - 24);
  if (extraRows > 0) {
    sheetXml = expandMTFSheetRows(sheetXml, extraRows);
  }

  // Populate item rows 18 .. 17 + Math.max(24, mtf.items.length)
  const totalSlots = Math.max(24, mtf.items.length);
  for (let i = 0; i < totalSlots; i++) {
    const rowNum = 18 + i;
    const item = mtf.items[i];
    const hasQty = item && item.qty !== '' && item.qty !== undefined;
    const qtyNumeric = hasQty && !isNaN(Number(item.qty));

    sheetXml = updateRowInSheet(sheetXml, rowNum, {
      [`A${rowNum}`]: { value: i + 1, fallbackStyle: '46', isNumeric: true },
      [`B${rowNum}`]: { value: item?.itemType || '', fallbackStyle: '125' },
      [`D${rowNum}`]: { value: item?.partNumber || '', fallbackStyle: '101' },
      [`E${rowNum}`]: { value: item?.description || '', fallbackStyle: '126' },
      [`J${rowNum}`]: {
        value: hasQty ? item.qty : '',
        fallbackStyle: '104',
        isNumeric: qtyNumeric,
      },
      [`K${rowNum}`]: { value: item?.uom || '', fallbackStyle: '104' },
      [`L${rowNum}`]: { value: item?.serialNumber || '', fallbackStyle: '52' },
      [`M${rowNum}`]: { value: item?.assetTag || '', fallbackStyle: '53' },
      [`N${rowNum}`]: { value: item?.na || '', fallbackStyle: '53' },
      [`O${rowNum}`]: { value: item?.status || '', fallbackStyle: '52' },
    });
  }

  // Footer & Signatures (shifted by extraRows)
  const r44 = 44 + extraRows;
  const r45 = 45 + extraRows;
  const r47 = 47 + extraRows;
  const r48 = 48 + extraRows;
  const r51 = 51 + extraRows;
  const r53 = 53 + extraRows;
  const r54 = 54 + extraRows;
  const r57 = 57 + extraRows;
  const r59 = 59 + extraRows;
  const r60 = 60 + extraRows;

  // Remarks & L-NTP
  if (mtf.remarks) {
    sheetXml = updateRowInSheet(sheetXml, r44, {
      [`A${r44}`]: { value: mtf.remarks, fallbackStyle: '16' },
    });
  }

  sheetXml = updateRowInSheet(sheetXml, r45, {
    [`F${r45}`]: { value: mtf.requestedByName || '', fallbackStyle: '156' },
    [`I${r45}`]: { value: mtf.releasedByName || '', fallbackStyle: '69' },
    [`M${r45}`]: { value: mtf.lntpNumber || '', fallbackStyle: '19' },
  });

  const reqDateText = mtf.requestedByDate ? formatMTFLongDate(mtf.requestedByDate) : '';
  const relDateText = mtf.releasedByDate ? formatMTFLongDate(mtf.releasedByDate) : '';
  sheetXml = updateRowInSheet(sheetXml, r47, {
    [`F${r47}`]: { value: reqDateText ? `Date: ${reqDateText}` : 'Date: ', fallbackStyle: '153' },
    [`I${r47}`]: { value: relDateText ? `Date: ${relDateText}` : 'Date:', fallbackStyle: '62' },
  });

  sheetXml = updateRowInSheet(sheetXml, r48, {
    [`F${r48}`]: {
      value: mtf.requestedByContact
        ? `Contact Number: ${mtf.requestedByContact}`
        : 'Contact Number: ',
      fallbackStyle: '154',
    },
    [`I${r48}`]: {
      value: mtf.releasedByContact
        ? `Contact Number: ${mtf.releasedByContact}`
        : 'Contact Number:',
      fallbackStyle: '80',
    },
  });

  // Row 51-54: APPROVED BY / MTF PROCESSED BY / ACKNOWLEDGED BY
  sheetXml = updateRowInSheet(sheetXml, r51, {
    [`F${r51}`]: { value: mtf.approvedByName || '', fallbackStyle: '56' },
    [`I${r51}`]: { value: mtf.processedByName || 'ROM', fallbackStyle: '89' },
    [`L${r51}`]: { value: mtf.acknowledgedByName || 'ROM / WH&LOG', fallbackStyle: '89' },
  });

  sheetXml = updateRowInSheet(sheetXml, r53, {
    [`F${r53}`]: {
      value: mtf.approvedByDate ? `Date: ${formatMTFLongDate(mtf.approvedByDate)}` : 'Date: ',
      fallbackStyle: '62',
    },
    [`I${r53}`]: {
      value: mtf.processedByDate ? `Date: ${formatMTFLongDate(mtf.processedByDate)}` : 'Date:',
      fallbackStyle: '62',
    },
    [`L${r53}`]: {
      value: mtf.acknowledgedByDate ? `Date: ${formatMTFLongDate(mtf.acknowledgedByDate)}` : 'Date:',
      fallbackStyle: '62',
    },
  });

  sheetXml = updateRowInSheet(sheetXml, r54, {
    [`F${r54}`]: {
      value: mtf.approvedByContact ? `Contact Number: ${mtf.approvedByContact}` : 'Contact Number:',
      fallbackStyle: '80',
    },
    [`I${r54}`]: {
      value: mtf.processedByContact ? `Contact Number: ${mtf.processedByContact}` : 'Contact Number:',
      fallbackStyle: '80',
    },
    [`L${r54}`]: {
      value: mtf.acknowledgedByContact ? `Contact Number: ${mtf.acknowledgedByContact}` : 'Contact Number:',
      fallbackStyle: '80',
    },
  });

  // Row 57-60: CANCELLATION ADVISE / APPROVED FOR RELEASE BY / MATERIALS RECEIVED BY
  sheetXml = updateRowInSheet(sheetXml, r57, {
    [`F${r57}`]: { value: mtf.cancellationAdviseName || '', fallbackStyle: '59' },
    [`I${r57}`]: { value: mtf.approvedForReleaseByName || '', fallbackStyle: '59' },
    [`L${r57}`]: {
      value: mtf.materialsReceivedByName || 'NSB WAREHOUSE PROPONENT',
      fallbackStyle: '89',
    },
  });

  sheetXml = updateRowInSheet(sheetXml, r59, {
    [`F${r59}`]: {
      value: mtf.cancellationAdviseDate
        ? `Date: ${formatMTFLongDate(mtf.cancellationAdviseDate)}`
        : 'Date:',
      fallbackStyle: '62',
    },
    [`I${r59}`]: {
      value: mtf.approvedForReleaseByDate
        ? `Date: ${formatMTFLongDate(mtf.approvedForReleaseByDate)}`
        : 'Date:',
      fallbackStyle: '62',
    },
    [`L${r59}`]: {
      value: mtf.materialsReceivedByDate
        ? `Date: ${formatMTFLongDate(mtf.materialsReceivedByDate)}`
        : 'Date:',
      fallbackStyle: '62',
    },
  });

  sheetXml = updateRowInSheet(sheetXml, r60, {
    [`F${r60}`]: {
      value: mtf.cancellationAdviseContact
        ? `Contact Number: ${mtf.cancellationAdviseContact}`
        : 'Contact Number:',
      fallbackStyle: '80',
    },
    [`I${r60}`]: {
      value: mtf.approvedForReleaseByContact
        ? `Contact Number: ${mtf.approvedForReleaseByContact}`
        : 'Contact Number:',
      fallbackStyle: '80',
    },
    [`L${r60}`]: {
      value: mtf.materialsReceivedByContact
        ? `Contact Number: ${mtf.materialsReceivedByContact}`
        : 'Contact Number:',
      fallbackStyle: '80',
    },
  });

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const url = URL.createObjectURL(outBlob);
    const a = document.createElement('a');
    a.href = url;
    const rawName = (mtf.mtfNumber || `MTF_${new Date().toISOString().slice(0, 10)}`)
      .replace(/[\\/?*:[\]<>|"]/g, '_');
    a.download = rawName.endsWith('.xlsx') ? rawName : `${rawName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return outBlob;
}
