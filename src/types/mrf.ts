export interface StockInfo {
  total: number;
  paranaque_mnl: number;
  cebu: number;
  davao: number;
}

export interface CatalogItem {
  id: string;
  code: string;
  description: string;
  uom: string;
  category: string;
  packageNo: string;
  stock: StockInfo;
}

export interface SiteRecord {
  plaid: string;
  siteName: string;
  address: string;
  warehouse: string;
  vendor: string;
  destinationHub?: string;
  province?: string;
  municipality?: string;
  region?: string;
}

export interface MRFLineItem {
  id: string;
  partNumber: string;
  description: string;
  packageNo: string;
  uom: string;
  qtyReq: number | '';
  qtyIssued: number | string;
  qtyReceived: number | '';
  qtyBalance: number | '';
  category?: string;
  remarks?: string;
}

export interface MRFHeader {
  mrfNumber: string;
  fromWarehouse: string;
  date: string;
  destinationCode: string;
  destination: string;
  siteId: string;
  siteAddress: string;
  project: string;
}

export interface Signee {
  name: string;
  title?: string;
  signature?: string;
  date: string;
}

export interface MRFSignatures {
  requestedBy: Signee;
  preparedBy: Signee;
  receivedBy: Signee;
  contactNokiaInhouse?: string;
  contactSubcon?: string;
  status: 'Accepted' | 'Rejected' | 'Pending';
  remarks: string;
}

export type MTFTransferCategory =
  | 'WHSE TO WHSE'
  | 'WHSE TO SITE'
  | 'WHSE TO SUPPLIER'
  | 'SUPPLIER TO WHSE'
  | 'SUPPLIER TO SITE'
  | 'OTHERS'
  | 'SITE TO WHSE'
  | 'SITE TO SITE';

export type MTFMaterialsCategory = 'New' | 'Defective' | 'Repaired';
export type MTFActionDone = 'Processed' | 'Cancelled' | 'None';

export interface MTFItemOverride {
  itemType?: string;
  serialNumber?: string;
  assetTag?: string;
  na?: string;
  status?: string;
}

export interface MTFConfig {
  projectName?: string;
  mtfNumber?: string;
  datePrepared?: string;
  dateExpected?: string;
  transferCategory?: MTFTransferCategory;
  othersText?: string;
  materialsCategory?: MTFMaterialsCategory;
  actionDone?: MTFActionDone;
  originSiteName?: string;
  originAddress?: string;
  destinationPlaid?: string;
  destinationSiteName?: string;
  destinationAddress?: string;
  manualHaulingOrigin?: 'Yes' | 'No' | '';
  manualHaulingDestination?: 'Yes' | 'No' | '';
  remarks?: string;
  requestedByName?: string;
  requestedByDate?: string;
  requestedByContact?: string;
  releasedByName?: string;
  releasedByDate?: string;
  releasedByContact?: string;
  lntpNumber?: string;
  approvedByName?: string;
  approvedByDate?: string;
  approvedByContact?: string;
  processedByName?: string;
  processedByDate?: string;
  processedByContact?: string;
  acknowledgedByName?: string;
  acknowledgedByDate?: string;
  acknowledgedByContact?: string;
  cancellationAdviseName?: string;
  cancellationAdviseDate?: string;
  cancellationAdviseContact?: string;
  approvedForReleaseByName?: string;
  approvedForReleaseByDate?: string;
  approvedForReleaseByContact?: string;
  materialsReceivedByName?: string;
  materialsReceivedByDate?: string;
  materialsReceivedByContact?: string;
  itemOverrides?: Record<string, MTFItemOverride>;
}

export interface MRFDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  header: MRFHeader;
  mainItems: MRFLineItem[];
  localMaterials: MRFLineItem[];
  signatures: MRFSignatures;
  mtf?: MTFConfig;
}
