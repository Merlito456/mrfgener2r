import itemsDataRaw from '../data_items.json';
import sitesDataRaw from '../data_sites.json';
import { CatalogItem, SiteRecord } from '../types/mrf';
import ExcelJS from 'exceljs';

export const INITIAL_ITEMS: CatalogItem[] = itemsDataRaw as CatalogItem[];
export const INITIAL_SITES: SiteRecord[] = sitesDataRaw as SiteRecord[];

export function getCategories(items: CatalogItem[] = INITIAL_ITEMS): string[] {
  const cats = new Set<string>();
  items.forEach((it) => {
    if (it.category && it.category !== '-') {
      cats.add(it.category);
    }
  });
  return ['All Categories', ...Array.from(cats).sort()];
}

export function searchCatalog(
  items: CatalogItem[],
  query: string,
  category = 'All Categories'
): CatalogItem[] {
  const cleanQ = query.toLowerCase().trim();
  return items.filter((item) => {
    const matchesCat =
      category === 'All Categories' ||
      item.category.toLowerCase() === category.toLowerCase();

    if (!matchesCat) return false;
    if (!cleanQ) return true;

    return (
      item.code.toLowerCase().includes(cleanQ) ||
      item.description.toLowerCase().includes(cleanQ) ||
      item.category.toLowerCase().includes(cleanQ) ||
      (item.packageNo && item.packageNo.toLowerCase().includes(cleanQ))
    );
  });
}

export function searchSitesList(sites: SiteRecord[], query: string): SiteRecord[] {
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) return sites;
  return sites.filter((s) => {
    return (
      s.plaid.toLowerCase().includes(cleanQ) ||
      s.siteName.toLowerCase().includes(cleanQ) ||
      s.address.toLowerCase().includes(cleanQ) ||
      s.warehouse.toLowerCase().includes(cleanQ)
    );
  });
}

/**
 * Parses an uploaded Excel inventory file (.xlsx) and returns parsed items
 */
export async function parseInventoryXlsxFile(file: File): Promise<{
  items: CatalogItem[];
  sites: SiteRecord[];
}> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const items: CatalogItem[] = [];
  const codeMap = new Map<string, CatalogItem>();

  // Look for 'Material Master List' or first sheet
  const masterSheet =
    wb.getWorksheet('Material Master List') || wb.worksheets[0];

  if (masterSheet) {
    masterSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const code = String(row.getCell(2).value || '').trim();
      const desc = String(row.getCell(3).value || '').trim();
      const uom = String(row.getCell(4).value || 'pc').trim();
      const cat = String(row.getCell(5).value || 'General').trim();

      if (code || desc) {
        const item: CatalogItem = {
          id: `custom_item_${items.length + 1}`,
          code,
          description: desc,
          uom: uom || 'pc',
          category: cat || 'General',
          packageNo: '',
          stock: {
            total: 0,
            paranaque_mnl: 0,
            cebu: 0,
            davao: 0,
          },
        };
        items.push(item);
        if (code) codeMap.set(code.toLowerCase(), item);
      }
    });
  }

  // Parse stock from other sheets if present
  const parseSheetStock = (sheetName: string, codeCol: number, totalCol: number, mnlCol: number) => {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) return;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const code = String(row.getCell(codeCol).value || '').trim();
      if (!code) return;
      const total = Number(row.getCell(totalCol).value) || 0;
      const mnl = Number(row.getCell(mnlCol).value) || 0;

      const existing = codeMap.get(code.toLowerCase());
      if (existing) {
        existing.stock.total = Math.max(existing.stock.total, total);
        existing.stock.paranaque_mnl = Math.max(existing.stock.paranaque_mnl, mnl);
      }
    });
  };

  parseSheetStock('MF2', 2, 7, 8);
  parseSheetStock('FX4-FX8-DF16', 3, 7, 8);
  parseSheetStock('RCO', 2, 6, 7);
  parseSheetStock('ISAM', 2, 6, 7);

  // Parse sites if SCM Reservation exists
  const sites: SiteRecord[] = [];
  const scmSheet = wb.getWorksheet('SCM Reservation');
  if (scmSheet) {
    const seen = new Set<string>();
    scmSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const plaid = String(row.getCell(11).value || '').trim();
      const siteName = String(row.getCell(12).value || '').trim();
      const wh = String(row.getCell(9).value || 'Paranaque WHS').trim();
      if (plaid && plaid !== 'TBD' && !seen.has(plaid)) {
        seen.add(plaid);
        sites.push({
          plaid,
          siteName,
          address: siteName,
          warehouse: wh,
          vendor: String(row.getCell(8).value || 'Nokia').trim(),
        });
      }
    });
  }

  return {
    items: items.length > 0 ? items : INITIAL_ITEMS,
    sites: sites.length > 0 ? sites : INITIAL_SITES,
  };
}
