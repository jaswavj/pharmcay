import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterApi, masterData, masterError, type NamedRow } from '../../../api/master/master-api-service';
import '../shared/Master.css';

type Kind = 'types' | 'units' | 'generics';

const apiFor = (kind: Kind) => {
  if (kind === 'types') {
    return { list: masterApi.types, save: masterApi.saveType, setActive: masterApi.setTypeActive };
  }
  if (kind === 'units') {
    return { list: masterApi.units, save: masterApi.saveUnit, setActive: masterApi.setUnitActive };
  }
  return { list: masterApi.generics, save: masterApi.saveGeneric, setActive: masterApi.setGenericActive };
};

const NamedMasterPage: React.FC<{ title: string; icon: string; kind: Kind }> = ({ title, icon, kind }) => {
  const api = apiFor(kind);
  const [rows, setRows] = useState<NamedRow[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(0);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.list()
      .then((res) => setRows(masterData<NamedRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load list')));
  };

  useEffect(() => {
    load();
  }, [kind]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, search]);

  const reset = () => {
    setName('');
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
      await api.save({ id: editId || undefined, name: name.trim() });
      toast.success(editId ? 'Updated' : 'Saved');
      reset();
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: NamedRow) => {
    const next = row.isActive !== 1;
    if (!(await confirmDialog(next ? `Unblock ${row.name}?` : `Block ${row.name}?`, { confirmText: next ? 'Unblock' : 'Block', tone: next ? 'primary' : 'danger' }))) return;
    try {
      await api.setActive(row.id, next);
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not update status'));
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className={icon} /> {title}</h2>
      <div className="mst-grid">
        <form className="mst-card" onSubmit={onSubmit}>
          <div className="mst-card-h">{editId ? 'Edit' : 'Add'} {title}</div>
          <div className="mst-card-b mst-form one-col">
            <div className="mst-fg">
              <label>Name <span className="req">*</span></label>
              <input className="mst-inp" value={name} onChange={(e) => setName(e.target.value)} />
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
            <span>{title} list</span>
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
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={3} className="mst-empty">No records</td></tr>
                )}
                {shown.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>
                      <span className={`mst-badge ${row.isActive === 1 ? 'on' : 'off'}`}>
                        {row.isActive === 1 ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td>
                      <button className="mst-icon-btn" type="button" title="Edit" onClick={() => { setEditId(row.id); setName(row.name); }}>
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

export const MedicineTypePage: React.FC = () => <NamedMasterPage title="Medicine Type" icon="fas fa-tags" kind="types" />;
export const UnitPage: React.FC = () => <NamedMasterPage title="Unit" icon="fas fa-balance-scale" kind="units" />;
export const GenericNamePage: React.FC = () => <NamedMasterPage title="Generic Name" icon="fas fa-font" kind="generics" />;

export default NamedMasterPage;
