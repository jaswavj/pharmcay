import HttpClientWrapper from '../http-client-wrapper';

export type NamedRow = { id: number; name: string; isActive: number };
export type MedicineRow = {
  id: number;
  genericId: number;
  genericName: string;
  name: string;
  typeId: number;
  typeName: string;
  hsnCode: string;
  unitId: number;
  unitName: string;
  discType: number;
  discount: number;
  isActive: number;
};
export type BatchRow = {
  id: number;
  medicineId: number;
  name: string;
  expiryDate: string;
  cost: number;
  mrp: number;
  gst: number;
  isActive: number;
};
export type SupplierRow = {
  id: number;
  name: string;
  phone: string;
  address: string;
  isActive: number;
};

export class MasterApiService {
  private http = new HttpClientWrapper();

  types = () => this.http.get('/v1/master/types');
  saveType = (payload: { id?: number; name: string }) => this.http.post('/v1/master/types', payload);
  setTypeActive = (id: number, active: boolean) => this.http.post(`/v1/master/types/${id}/active`, { active });

  units = () => this.http.get('/v1/master/units');
  saveUnit = (payload: { id?: number; name: string }) => this.http.post('/v1/master/units', payload);
  setUnitActive = (id: number, active: boolean) => this.http.post(`/v1/master/units/${id}/active`, { active });

  generics = () => this.http.get('/v1/master/generics');
  saveGeneric = (payload: { id?: number; name: string }) => this.http.post('/v1/master/generics', payload);
  setGenericActive = (id: number, active: boolean) => this.http.post(`/v1/master/generics/${id}/active`, { active });

  lookups = () => this.http.get('/v1/master/lookups');
  medicines = () => this.http.get('/v1/master/medicines');
  saveMedicine = (payload: any) => this.http.post('/v1/master/medicines', payload);
  setMedicineActive = (id: number, active: boolean) => this.http.post(`/v1/master/medicines/${id}/active`, { active });

  batches = (medicineId: number) => this.http.get(`/v1/master/batches?medicineId=${medicineId}`);
  saveBatch = (payload: any) => this.http.post('/v1/master/batches', payload);
  setBatchActive = (id: number, active: boolean) => this.http.post(`/v1/master/batches/${id}/active`, { active });

  suppliers = () => this.http.get('/v1/master/suppliers');
  saveSupplier = (payload: { id?: number; name: string; phone: string; address: string }) => this.http.post('/v1/master/suppliers', payload);
  setSupplierActive = (id: number, active: boolean) => this.http.post(`/v1/master/suppliers/${id}/active`, { active });
}

export const masterApi = new MasterApiService();

export const masterData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const masterError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
