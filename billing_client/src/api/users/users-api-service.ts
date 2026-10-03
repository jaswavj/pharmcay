import HttpClientWrapper from '../http-client-wrapper';

export class UsersApiService {
  private http = new HttpClientWrapper();

  modules = () => this.http.get('/v1/users/modules');
  list = () => this.http.get('/v1/users/list');
  create = (payload: any) => this.http.post('/v1/users', payload);

  permissions = (id: number) => this.http.get(`/v1/users/${id}/permissions`);
  savePermissions = (id: number, ids: number[]) => this.http.post(`/v1/users/${id}/permissions`, { ids });

  changePassword = (payload: any) => this.http.post('/v1/users/change-password', payload);
}

export const usersApi = new UsersApiService();

export const usersData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const usersError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
