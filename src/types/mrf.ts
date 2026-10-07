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

export interface MRFDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  header: MRFHeader;
  mainItems: MRFLineItem[];
  localMaterials: MRFLineItem[];
  signatures: MRFSignatures;
}
