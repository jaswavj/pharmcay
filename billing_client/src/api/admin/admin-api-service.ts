import HttpClientWrapper from '../http-client-wrapper';

export class AdminApiService {
  private http = new HttpClientWrapper();

  company = () => this.http.get('/v1/admin/company');
  saveCompany = (payload: any) => this.http.post('/v1/admin/company', payload);
}

export const adminApi = new AdminApiService();

export const adminData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const adminError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
