import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterApi, masterData, masterError, type SupplierRow } from '../../../api/master/master-api-service';
import '../shared/Master.css';

const SupplierPage: React.FC = () => {
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [editId, setEditId] = useState(0);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    masterApi.suppliers()
      .then((res) => setRows(masterData<SupplierRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load suppliers')));
  };

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      row.name.toLowerCase().includes(q)
      || (row.phone || '').toLowerCase().includes(q)
      || (row.address || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const reset = () => {
    setName('');
    setPhone('');
    setAddress('');
    setEditId(0);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Name is required');
      return;
    }
    setBusy(true);
    try {
      await masterApi.saveSupplier({ id: editId || undefined, name: name.trim(), phone: phone.trim(), address: address.trim() });
      toast.success(editId ? 'Updated' : 'Saved');
      reset();
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not save supplier'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: SupplierRow) => {
    const next = row.isActive !== 1;
    if (!(await confirmDialog(next ? `Unblock ${row.name}?` : `Block ${row.name}?`, { confirmText: next ? 'Unblock' : 'Block', tone: next ? 'primary' : 'danger' }))) return;
    try {
      await masterApi.setSupplierActive(row.id, next);
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not update status'));
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-truck" /> Supplier</h2>
      <div className="mst-grid">
        <form className="mst-card" onSubmit={onSubmit}>
          <div className="mst-card-h">{editId ? 'Edit' : 'Add'} supplier</div>
          <div className="mst-card-b mst-form one-col">
            <div className="mst-fg">
              <label>Name <span className="req">*</span></label>
              <input className="mst-inp" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mst-fg">
              <label>Phone number</label>
              <input className="mst-inp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="mst-fg">
              <label>Address</label>
              <textarea className="mst-area" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editId ? 'Update' : 'Save'}
              </button>
              {editId > 0 && (
                <button className="mst-btn mst-btn-outline" type="button" onClick={reset}>Cancel</button>
              )}
            </div>
          </div>
        </form>
        <div className="mst-card">
          <div className="mst-card-h">
            <span>Supplier list</span>
            <div className="mst-search">
              <i className="fas fa-search" />
              <input className="mst-inp" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="mst-table-wrap">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={5} className="mst-empty">No records</td></tr>
                )}
                {shown.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.phone}</td>
                    <td title={row.address}>{row.address}</td>
                    <td>
                      <span className={`mst-badge ${row.isActive === 1 ? 'on' : 'off'}`}>
                        {row.isActive === 1 ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td>
                      <button className="mst-icon-btn" type="button" title="Edit" onClick={() => { setEditId(row.id); setName(row.name); setPhone(row.phone || ''); setAddress(row.address || ''); }}>
                        <i className="fas fa-pen" />
                      </button>
                      <button className="mst-icon-btn danger" type="button" title={row.isActive === 1 ? 'Block' : 'Unblock'} onClick={() => toggle(row)}>
                        <i className={`fas ${row.isActive === 1 ? 'fa-ban' : 'fa-unlock'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPage;
