import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterApi, masterData, masterError, type BatchRow, type MedicineRow } from '../../../api/master/master-api-service';
import '../shared/Master.css';
import SuggestInput from './SuggestInput';

const empty = { id: 0, name: '', expiryDate: '', cost: '', mrp: '', gst: '' };
const money = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');

const BatchPage: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [medicineId, setMedicineId] = useState(0);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    masterApi.medicines()
      .then((res) => setMedicines(masterData<MedicineRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load medicines')));
  }, []);

  const loadBatches = (id: number) => {
    if (!id) {
      setRows([]);
      return;
    }
    masterApi.batches(id)
      .then((res) => setRows(masterData<BatchRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load batches')));
  };

  const selected = medicines.find((item) => item.id === medicineId);

  const pickMedicine = (item: MedicineRow) => {
    setMedicineId(item.id);
    setMedicineQuery(item.name);
    setForm(empty);
    loadBatches(item.id);
  };

  const reset = () => setForm(empty);

  const edit = (row: BatchRow) => {
    setForm({
      id: row.id,
      name: row.name,
      expiryDate: row.expiryDate,
      cost: String(row.cost),
      mrp: String(row.mrp),
      gst: String(row.gst),
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId) {
      toast.warning('Select a medicine first');
      return;
    }
    if (!form.name.trim() || !form.expiryDate) {
      toast.warning('Batch name and expiry date are required');
      return;
    }
    const cost = Number(form.cost);
    const mrp = Number(form.mrp);
    const gst = Number(form.gst);
    if (![cost, mrp, gst].every((n) => Number.isFinite(n) && n >= 0)) {
      toast.warning('Cost, MRP and GST must be zero or more');
      return;
    }
    if (gst > 100) {
      toast.warning('GST must be between 0 and 100');
      return;
    }
    setBusy(true);
    try {
      await masterApi.saveBatch({
        id: form.id || undefined,
        medicineId,
        name: form.name.trim(),
        expiryDate: form.expiryDate,
        cost,
        mrp,
        gst,
      });
      toast.success(form.id ? 'Batch updated' : 'Batch saved');
      reset();
      loadBatches(medicineId);
    } catch (err) {
      toast.error(masterError(err, 'Could not save batch'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: BatchRow) => {
    const next = row.isActive !== 1;
    if (!(await confirmDialog(next ? `Unblock ${row.name}?` : `Block ${row.name}?`, { confirmText: next ? 'Unblock' : 'Block', tone: next ? 'primary' : 'danger' }))) return;
    try {
      await masterApi.setBatchActive(row.id, next);
      loadBatches(medicineId);
    } catch (err) {
      toast.error(masterError(err, 'Could not update status'));
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-layer-group" /> Batch</h2>
      <div className="mst-card" style={{ marginBottom: 12 }}>
        <div className="mst-card-h">Select medicine</div>
        <div className="mst-card-b">
          <div className="mst-fg" style={{ maxWidth: 420 }}>
            <label>Medicine <span className="req">*</span></label>
            <SuggestInput
              value={medicineQuery}
              placeholder="Type at least 2 letters"
              options={medicines.filter((item) => item.isActive === 1 || item.id === medicineId)}
              getLabel={(item) => (item.genericName ? `${item.name} — ${item.genericName}` : item.name)}
              match={(item, query) =>
                item.name.toLowerCase().includes(query) || (item.genericName || '').toLowerCase().includes(query)
              }
              onChange={(value) => {
                setMedicineQuery(value);
                setMedicineId(0);
                setRows([]);
                setForm(empty);
              }}
              onPick={pickMedicine}
            />
            {selected && (
              <div className="mst-note">
                {selected.genericName} · {selected.typeName} · {selected.unitName}
              </div>
            )}
          </div>
        </div>
      </div>

      {medicineId > 0 && (
        <div className="mst-grid mst-grid-wide">
          <form className="mst-card" onSubmit={onSubmit}>
            <div className="mst-card-h">{form.id ? 'Edit batch' : 'Add batch'}</div>
            <div className="mst-card-b mst-form one-col">
              <div className="mst-fg">
                <label>Name <span className="req">*</span></label>
                <input className="mst-inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="mst-fg">
                <label>Expiry date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div className="mst-fg">
                <label>Cost <span className="req">*</span></label>
                <input className="mst-inp" type="number" min="0" step="0.001" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div className="mst-fg">
                <label>MRP <span className="req">*</span></label>
                <input className="mst-inp" type="number" min="0" step="0.001" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div className="mst-fg">
                <label>GST % <span className="req">*</span></label>
                <input className="mst-inp" type="number" min="0" max="100" step="0.01" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
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
            <div className="mst-card-h">Batches for {selected?.name}</div>
            <div className="mst-table-wrap">
              <table className="mst-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Expiry</th>
                    <th className="num">Cost</th>
                    <th className="num">MRP</th>
                    <th className="num">GST %</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="mst-empty">No batches for this medicine</td></tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.expiryDate}</td>
                      <td className="num">{money(row.cost)}</td>
                      <td className="num">{money(row.mrp)}</td>
                      <td className="num">{row.gst}</td>
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
      )}
    </div>
  );
};

export default BatchPage;
