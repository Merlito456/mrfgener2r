import {
  MRFDocument,
  MRFLineItem,
  MTFActionDone,
  MTFMaterialsCategory,
  MTFTransferCategory,
} from '../types/mrf';

export interface ResolvedMTFItem {
  index: number;
  sourceId: string;
  sourceGroup: 'Main Equipment' | 'Local Material';
  itemType: string;
  partNumber: string;
  description: string;
  qty: number | string;
  uom: string;
  serialNumber: string;
  assetTag: string;
  na: string;
  status: string;
}

export interface ResolvedMTFData {
  projectName: string;
  mtfNumber: string;
  datePrepared: string;
  dateExpected: string;
  transferCategory: MTFTransferCategory;
  othersText: string;
  materialsCategory: MTFMaterialsCategory;
  actionDone: MTFActionDone;
  originSiteName: string;
  originAddress: string;
  destinationPlaid: string;
  destinationSiteName: string;
  destinationAddress: string;
  manualHaulingOrigin: 'Yes' | 'No' | '';
  manualHaulingDestination: 'Yes' | 'No' | '';
  remarks: string;
  lntpNumber: string;
  requestedByName: string;
  requestedByDate: string;
  requestedByContact: string;
  releasedByName: string;
  releasedByDate: string;
  releasedByContact: string;
  approvedByName: string;
  approvedByDate: string;
  approvedByContact: string;
  processedByName: string;
  processedByDate: string;
  processedByContact: string;
  acknowledgedByName: string;
  acknowledgedByDate: string;
  acknowledgedByContact: string;
  cancellationAdviseName: string;
  cancellationAdviseDate: string;
  cancellationAdviseContact: string;
  approvedForReleaseByName: string;
  approvedForReleaseByDate: string;
  approvedForReleaseByContact: string;
  materialsReceivedByName: string;
  materialsReceivedByDate: string;
  materialsReceivedByContact: string;
  items: ResolvedMTFItem[];
}

export function formatMTFDateMMDDYY(dateStr?: string): string {
  const clean = (dateStr || '').trim();
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const yy = ymdMatch[1].slice(-2);
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${mm}${dd}${yy}`;
  }
  if (/^\d{8}$/.test(clean)) {
    return `${clean.slice(0, 4)}${clean.slice(6, 8)}`;
  }
  const parsed = new Date(clean || Date.now());
  if (!isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const yy = String(parsed.getFullYear()).slice(-2);
    return `${mm}${dd}${yy}`;
  }
  return '063026';
}

export function formatMTFLongDate(dateStr?: string): string {
  const clean = (dateStr || '').trim();
  if (!clean) return '';
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  let parsed: Date;
  if (ymdMatch) {
    parsed = new Date(
      Number(ymdMatch[1]),
      Number(ymdMatch[2]) - 1,
      Number(ymdMatch[3])
    );
  } else {
    parsed = new Date(clean);
  }
  if (isNaN(parsed.getTime())) return clean;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMTFShortDate(dateStr?: string): string {
  const clean = (dateStr || '').trim();
  if (!clean) return '';
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  let parsed: Date;
  if (ymdMatch) {
    parsed = new Date(
      Number(ymdMatch[1]),
      Number(ymdMatch[2]) - 1,
      Number(ymdMatch[3])
    );
  } else {
    parsed = new Date(clean);
  }
  if (isNaN(parsed.getTime())) return clean;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
}

export function formatMTFExpectedDate(dateStr?: string): string {
  const clean = (dateStr || '').trim();
  if (!clean) return '';
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  let parsed: Date;
  if (ymdMatch) {
    parsed = new Date(
      Number(ymdMatch[1]),
      Number(ymdMatch[2]) - 1,
      Number(ymdMatch[3])
    );
  } else {
    parsed = new Date(clean);
  }
  if (isNaN(parsed.getTime())) return clean;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parsed.getDate()}-${months[parsed.getMonth()]}-${parsed.getFullYear()}`;
}

export function extractSiteSlugForMTF(siteId?: string, destinationCode?: string): string {
  const raw = (siteId || '').trim();
  const plaid =
    (destinationCode || '').trim().toUpperCase() ||
    (raw.match(/^([A-Z]{2,5}\d+)/i)?.[1]?.toUpperCase() || '');
  let slug = raw.toUpperCase();

  if (plaid && slug.startsWith(plaid)) {
    slug = slug.slice(plaid.length).replace(/^[\s\-_]+/, '');
  } else if (slug.includes(' - ')) {
    slug = slug.split(' - ').slice(1).join(' ');
  }

  const cleaned = slug
    .replace(/[_]+/g, '-')
    .replace(/[^A-Z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '');

  if (cleaned) return cleaned;
  return plaid || 'SITE';
}

export function generateMTFNumber(
  siteId?: string,
  dateStr?: string,
  destinationCode?: string
): string {
  const siteSlug = extractSiteSlugForMTF(siteId, destinationCode);
  const mmddyy = formatMTFDateMMDDYY(dateStr);
  return `MTF_NOKIA FN_${siteSlug}_${mmddyy}`;
}

export function mapWarehouseToOriginSite(warehouse?: string): string {
  const w = (warehouse || '').trim().toLowerCase();
  if (!w) return 'NOKIA - PARANAQUE WAREHOUSE';
  if (w.includes('davao')) return 'NOKIA - SBF DAVAO WAREHOUSE';
  if (w.includes('cebu')) return 'NOKIA - SBF CEBU WAREHOUSE';
  if (w.includes('paranaque') || w.includes('para\u00f1aque')) return 'NOKIA - PARANAQUE WAREHOUSE';
  if (w.includes('manila')) return 'NOKIA - MANILA NP WAREHOUSE';
  if (w.includes('nokia')) return 'NOKIA WAREHOUSE';
  return warehouse!.trim().toUpperCase();
}

export function extractMTFPhone(contactStr?: string): string {
  const raw = (contactStr || '').trim();
  if (!raw) return '';
  const match = raw.match(/(?:\+?63|0)9\d{9}/);
  if (!match) return '';
  const num = match[0];
  if (num.startsWith('09')) return `+63${num.slice(1)}`;
  if (num.startsWith('63')) return `+${num}`;
  return num;
}

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatMTFRequestorName(name?: string): string {
  const raw = (name || '').trim();
  if (!raw) return '';
  if (/^nsb\b/i.test(raw)) return raw;
  return `NSB OLT ${toTitleCase(raw)}`;
}

export function resolveMTFData(doc: MRFDocument): ResolvedMTFData {
  const m = doc.mtf || {};
  const datePrepared = m.datePrepared ?? (doc.header.date || '');
  const mtfNumber =
    m.mtfNumber ??
    generateMTFNumber(doc.header.siteId, datePrepared, doc.header.destinationCode);

  const originSiteName =
    m.originSiteName ?? mapWarehouseToOriginSite(doc.header.fromWarehouse);

  const inferredPlaid =
    (doc.header.destinationCode || '').trim() ||
    (doc.header.siteId || '').match(/^([A-Z]{2,5}\d+)/i)?.[1]?.toUpperCase() ||
    '';

  const destinationPlaid = m.destinationPlaid ?? inferredPlaid;

  const destinationSiteName =
    m.destinationSiteName ?? (doc.header.siteId || '');

  const destinationAddress =
    m.destinationAddress ?? (doc.header.siteAddress || '');

  const requestedByName =
    m.requestedByName ?? formatMTFRequestorName(doc.signatures.requestedBy?.name);

  const requestedByDate =
    m.requestedByDate ?? (doc.signatures.requestedBy?.date || datePrepared);

  const requestedByContact =
    m.requestedByContact ?? extractMTFPhone(doc.signatures.contactNokiaInhouse);

  const releasedByName =
    m.releasedByName ?? (doc.signatures.preparedBy?.name || '');

  const releasedByDate =
    m.releasedByDate ?? (doc.signatures.preparedBy?.name ? doc.signatures.preparedBy?.date || '' : '');

  const materialsReceivedByName =
    m.materialsReceivedByName ??
    (doc.signatures.receivedBy?.name || 'NSB WAREHOUSE PROPONENT');

  const materialsReceivedByDate =
    m.materialsReceivedByDate ?? (doc.signatures.receivedBy?.name ? doc.signatures.receivedBy?.date || '' : '');

  const combinedSource: Array<{ item: MRFLineItem; group: 'Main Equipment' | 'Local Material' }> = [
    ...doc.mainItems
      .filter((it) => it.partNumber || it.description || it.qtyReq !== '')
      .map((item) => ({ item, group: 'Main Equipment' as const })),
    ...doc.localMaterials
      .filter((it) => it.partNumber || it.description || it.qtyReq !== '')
      .map((item) => ({ item, group: 'Local Material' as const })),
  ];

  const overrides = m.itemOverrides || {};
  const items: ResolvedMTFItem[] = combinedSource.map(({ item, group }, idx) => {
    const ov = overrides[item.id] || {};
    return {
      index: idx + 1,
      sourceId: item.id,
      sourceGroup: group,
      itemType: ov.itemType ?? '',
      partNumber: item.partNumber || '',
      description: item.description || '',
      qty: item.qtyReq !== '' && item.qtyReq !== undefined ? item.qtyReq : '',
      uom: item.uom || '',
      serialNumber: ov.serialNumber ?? '',
      assetTag: ov.assetTag ?? '',
      na: ov.na ?? '',
      status: ov.status ?? '',
    };
  });

  return {
    projectName: m.projectName ?? (doc.header.project || '[Select Project Name]'),
    mtfNumber,
    datePrepared,
    dateExpected: m.dateExpected ?? '',
    transferCategory: m.transferCategory ?? 'WHSE TO SITE',
    othersText: m.othersText ?? '',
    materialsCategory: m.materialsCategory ?? 'New',
    actionDone: m.actionDone ?? 'None',
    originSiteName,
    originAddress: m.originAddress ?? '',
    destinationPlaid,
    destinationSiteName,
    destinationAddress,
    manualHaulingOrigin: m.manualHaulingOrigin ?? '',
    manualHaulingDestination: m.manualHaulingDestination ?? '',
    remarks: m.remarks ?? (doc.signatures.remarks || ''),
    lntpNumber: m.lntpNumber ?? '',
    requestedByName,
    requestedByDate,
    requestedByContact,
    releasedByName,
    releasedByDate,
    releasedByContact: m.releasedByContact ?? '',
    approvedByName: m.approvedByName ?? '',
    approvedByDate: m.approvedByDate ?? '',
    approvedByContact: m.approvedByContact ?? '',
    processedByName: m.processedByName ?? 'ROM',
    processedByDate: m.processedByDate ?? '',
    processedByContact: m.processedByContact ?? '',
    acknowledgedByName: m.acknowledgedByName ?? 'ROM / WH&LOG',
    acknowledgedByDate: m.acknowledgedByDate ?? '',
    acknowledgedByContact: m.acknowledgedByContact ?? '',
    cancellationAdviseName: m.cancellationAdviseName ?? '',
    cancellationAdviseDate: m.cancellationAdviseDate ?? '',
    cancellationAdviseContact: m.cancellationAdviseContact ?? '',
    approvedForReleaseByName: m.approvedForReleaseByName ?? '',
    approvedForReleaseByDate: m.approvedForReleaseByDate ?? '',
    approvedForReleaseByContact: m.approvedForReleaseByContact ?? '',
    materialsReceivedByName,
    materialsReceivedByDate,
    materialsReceivedByContact: m.materialsReceivedByContact ?? '',
    items,
  };
}
