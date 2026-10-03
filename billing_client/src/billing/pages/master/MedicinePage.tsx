import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterApi, masterData, masterError, type MedicineRow, type NamedRow } from '../../../api/master/master-api-service';
import '../shared/Master.css';
import SuggestInput from './SuggestInput';

const empty = {
  id: 0,
  genericId: 0,
  genericName: '',
  name: '',
  typeId: '',
  hsnCode: '',
  unitId: '',
  discType: 2,
  discount: '0',
};

const MedicinePage: React.FC = () => {
  const [rows, setRows] = useState<MedicineRow[]>([]);
  const [types, setTypes] = useState<NamedRow[]>([]);
  const [units, setUnits] = useState<NamedRow[]>([]);
  const [generics, setGenerics] = useState<NamedRow[]>([]);
  const [form, setForm] = useState(empty);
  const [genericQuery, setGenericQuery] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    masterApi.medicines()
      .then((res) => setRows(masterData<MedicineRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load medicines')));
  };

  useEffect(() => {
    load();
    masterApi.lookups()
      .then((res) => {
        const data = masterData<{ types: NamedRow[]; units: NamedRow[]; generics: NamedRow[] }>(res);
        setTypes(data.types || []);
        setUnits(data.units || []);
        setGenerics(data.generics || []);
      })
      .catch((err) => toast.error(masterError(err, 'Could not load lookups')));
  }, []);

  const activeOf = (list: NamedRow[], selected: string) =>
    list.filter((item) => item.isActive === 1 || String(item.id) === selected);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.genericName, row.typeName, row.hsnCode, row.unitName].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const reset = () => {
    setForm(empty);
    setGenericQuery('');
  };

  const edit = (row: MedicineRow) => {
    setForm({
      id: row.id,
      genericId: row.genericId,
      genericName: row.genericName,
      name: row.name,
      typeId: String(row.typeId),
      hsnCode: row.hsnCode || '',
      unitId: String(row.unitId),
      discType: row.discType === 1 ? 1 : 2,
      discount: String(row.discount ?? 0),
    });
    setGenericQuery(row.genericName);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.genericId) {
      toast.warning('Select a generic name');
      return;
    }
    if (!form.name.trim() || !form.typeId || !form.unitId) {
      toast.warning('Name, type and unit are required');
      return;
    }
    const discount = Number(form.discount);
    if (!Number.isFinite(discount) || discount < 0) {
      toast.warning('Enter a valid discount');
      return;
    }
    if (form.discType === 2 && discount > 100) {
      toast.warning('Discount percent cannot be more than 100');
      return;
    }
    setBusy(true);
    try {
      await masterApi.saveMedicine({
        id: form.id || undefined,
        genericId: form.genericId,
        name: form.name.trim(),
        typeId: Number(form.typeId),
        hsnCode: form.hsnCode.trim(),
        unitId: Number(form.unitId),
        discType: form.discType,
        discount,
      });
      toast.success(form.id ? 'Medicine updated' : 'Medicine saved');
      reset();
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not save medicine'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: MedicineRow) => {
    const next = row.isActive !== 1;
    if (!(await confirmDialog(next ? `Unblock ${row.name}?` : `Block ${row.name}?`, { confirmText: next ? 'Unblock' : 'Block', tone: next ? 'primary' : 'danger' }))) return;
    try {
      await masterApi.setMedicineActive(row.id, next);
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not update status'));
    }
  };

  const discountLabel = (row: MedicineRow) =>
    row.discType === 1 ? `₹${Number(row.discount).toFixed(2)}` : `${Number(row.discount)}%`;

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-capsules" /> Medicine</h2>
      <div className="mst-grid mst-grid-wide">
        <form className="mst-card" onSubmit={onSubmit}>
          <div className="mst-card-h">{form.id ? 'Edit medicine' : 'Add medicine'}</div>
          <div className="mst-card-b mst-form one-col">
            <div className="mst-fg">
              <label>Generic name <span className="req">*</span></label>
              <SuggestInput
                value={genericQuery}
                placeholder="Type at least 2 letters"
                options={generics.filter((item) => item.isActive === 1 || item.id === form.genericId)}
                getLabel={(item) => item.name}
                onChange={(value) => {
                  setGenericQuery(value);
                  setForm({ ...form, genericId: 0, genericName: '' });
                }}
                onPick={(item) => {
                  setForm({ ...form, genericId: item.id, genericName: item.name });
                  setGenericQuery(item.name);
                }}
              />
            </div>
            <div className="mst-fg">
              <label>Name <span className="req">*</span></label>
              <input className="mst-inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="mst-fg">
              <label>Type <span className="req">*</span></label>
              <select className="mst-sel" value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
                <option value="">Select type</option>
                {activeOf(types, form.typeId).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="mst-fg">
              <label>HSN code</label>
              <input className="mst-inp" maxLength={20} value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
            </div>
            <div className="mst-fg">
              <label>Unit <span className="req">*</span></label>
              <select className="mst-sel" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                <option value="">Select unit</option>
                {activeOf(units, form.unitId).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="mst-fg">
              <label>Discount</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="mst-sel"
                  style={{ width: 90 }}
                  value={form.discType}
                  onChange={(e) => setForm({ ...form, discType: Number(e.target.value) })}
                >
                  <option value={2}>%</option>
                  <option value={1}>₹</option>
                </select>
                <input
                  className="mst-inp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </div>
            </div>
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : form.id ? 'Update' : 'Save'}
              </button>
              {form.id > 0 && (
                <button className="mst-btn mst-btn-outline" type="button" onClick={reset}>Cancel</button>
              )}
            </div>
          </div>
        </form>
        <div className="mst-card">
          <div className="mst-card-h">
            <span>Medicines</span>
            <div className="mst-search">
              <i className="fas fa-search" />
              <input className="mst-inp" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="mst-table-wrap">
            <table className="mst-table mst-table-wide">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Generic</th>
                  <th>Type</th>
                  <th>HSN</th>
                  <th>Unit</th>
                  <th className="num">Discount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={8} className="mst-empty">No medicines</td></tr>
                )}
                {shown.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.genericName}</td>
                    <td>{row.typeName}</td>
                    <td>{row.hsnCode || '—'}</td>
                    <td>{row.unitName}</td>
                    <td className="num">{discountLabel(row)}</td>
                    <td>
                      <span className={`mst-badge ${row.isActive === 1 ? 'on' : 'off'}`}>
                        {row.isActive === 1 ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td>
                      <button className="mst-icon-btn" type="button" title="Edit" onClick={() => edit(row)}>
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

export default MedicinePage;
