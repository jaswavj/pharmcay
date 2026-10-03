import HttpClientWrapper from '../http-client-wrapper';

export type PoItem = { id: number; medicineId: number; medicineName: string; qty: number; receivedQty: number };
export type PoRow = {
  id: number;
  poNo: string;
  supplierId: number;
  supplierName: string;
  poDate: string;
  status: number;
  note: string;
  orderedQty?: number;
  receivedQty?: number;
  items?: PoItem[];
};
export type PurchaseItem = {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchName: string;
  qty: number;
  returnedQty: number;
  stockQty: number;
  cost: number;
  gst: number;
};
export type PurchaseRow = {
  id: number;
  prNo: string;
  supplierName: string;
  poNo: string;
  invoiceNo: string;
  invoiceDate: string;
  netTotal: number;
  items?: PurchaseItem[];
};
export type ReturnRow = {
  id: number;
  retNo: string;
  supplierName: string;
  returnDate: string;
  note: string;
  netTotal: number;
};
export type BatchStock = {
  id: number;
  name: string;
  expiryDate: string;
  cost: number;
  mrp: number;
  gst: number;
  qty: number;
};
export type StockRow = {
  batchId: number;
  medicineName: string;
  batchName: string;
  expiryDate: string;
  qty: number;
  cost: number;
  mrp: number;
};
export type PurchaseReportRow = {
  invoiceDate: string;
  prNo: string;
  supplierName: string;
  invoiceNo: string;
  medicineName: string;
  batchName: string;
  qty: number;
  cost: number;
  gst: number;
  netTotal: number;
};
export type ReturnReportRow = {
  returnDate: string;
  retNo: string;
  supplierName: string;
  prNo: string;
  medicineName: string;
  batchName: string;
  qty: number;
  cost: number;
  gst: number;
  netTotal: number;
};
export type StockTxnRow = {
  txnDate: string;
  txnType: string;
  refNo: string;
  medicineName: string;
  batchName: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
};

export class PurchaseApiService {
  private http = new HttpClientWrapper();

  orders = (status?: number) => this.http.get(status == null ? '/v1/purchase/orders' : `/v1/purchase/orders?status=${status}`);
  openOrders = () => this.http.get('/v1/purchase/open-orders');
  closeOrder = (id: number) => this.http.post(`/v1/purchase/orders/${id}/close`, {});
  order = (id: number) => this.http.get(`/v1/purchase/orders/${id}`);
  saveOrder = (payload: any) => this.http.post('/v1/purchase/orders', payload);
  updateOrder = (id: number, payload: any) => this.http.post(`/v1/purchase/orders/${id}`, payload);
  decide = (id: number, approved: boolean) => this.http.post(`/v1/purchase/orders/${id}/decision`, { approved });

  batches = (medicineId: number) => this.http.get(`/v1/purchase/batches?medicineId=${medicineId}`);
  entries = (from: string, to: string) => this.http.get(`/v1/purchase/entries?from=${from}&to=${to}`);
  entry = (id: number) => this.http.get(`/v1/purchase/entries/${id}`);
  saveEntry = (payload: any) => this.http.post('/v1/purchase/entries', payload);
  purchaseReport = (from: string, to: string) => this.http.get(`/v1/purchase/purchase-report?from=${from}&to=${to}`);
  returnReport = (from: string, to: string) => this.http.get(`/v1/purchase/return-report?from=${from}&to=${to}`);
  supplierPurchase = (from: string, to: string, supplierId: number) =>
    this.http.get(`/v1/purchase/supplier-purchase?from=${from}&to=${to}&supplierId=${supplierId}`);
  returns = () => this.http.get('/v1/purchase/returns');
  saveReturn = (payload: any) => this.http.post('/v1/purchase/returns', payload);
  stock = () => this.http.get('/v1/purchase/stock');
  stockTransactions = (medicineId: number, from: string, to: string) =>
    this.http.get(`/v1/purchase/stock-transactions?medicineId=${medicineId}&from=${from}&to=${to}`);
}

export const purchaseApi = new PurchaseApiService();
