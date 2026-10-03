import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterApi, masterData, masterError, type MedicineRow, type SupplierRow } from '../../../api/master/master-api-service';
import { purchaseApi, type PoRow } from '../../../api/purchase/purchase-api-service';
import SuggestInput from '../master/SuggestInput';
import '../shared/Master.css';
import { money } from './format';

type Line = { medicineId: number; medicineName: string; qty: string };

const ApprovePage: React.FC = () => {
  const [orders, setOrders] = useState<PoRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [selected, setSelected] = useState<PoRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [supplierId, setSupplierId] = useState(0);
  const [poDate, setPoDate] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [medicineId, setMedicineId] = useState(0);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const medicineRef = useRef<HTMLInputElement>(null);

  const load = () => {
    purchaseApi.orders(0)
      .then((res) => setOrders(masterData<PoRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load orders')));
  };

  useEffect(() => {
    load();
    masterApi.suppliers()
      .then((res) => setSuppliers(masterData<SupplierRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load suppliers')));
    masterApi.medicines()
      .then((res) => setMedicines(masterData<MedicineRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load medicines')));
  }, []);

  const open = (row: PoRow) => {
    setEditing(false);
    purchaseApi.order(row.id)
      .then((res) => setSelected(masterData<PoRow>(res)))
      .catch((err) => toast.error(masterError(err, 'Could not load order')));
  };

  const beginEdit = (order: PoRow) => {
    setSelected(order);
    setSupplierId(order.supplierId);
    setPoDate(order.poDate);
    setNote(order.note || '');
    setLines((order.items || []).map((item) => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      qty: String(item.qty),
    })));
    setMedicineId(0);
    setMedicineQuery('');
    setQty('');
    setEditing(true);
  };

  const startEdit = () => {
    if (selected) beginEdit(selected);
  };

  const addLine = () => {
    const item = medicines.find((row) => row.id === medicineId);
    const qtyN = Number(qty);
    if (!item) {
      toast.warning('Select a medicine');
      medicineRef.current?.focus();
      return;
    }
    if (!Number.isFinite(qtyN) || qtyN <= 0) {
      toast.warning('Quantity must be more than zero');
      return;
    }
    if (lines.some((line) => line.medicineId === item.id)) {
      toast.warning('Medicine is already on this order');
      return;
    }
    setLines([...lines, { medicineId: item.id, medicineName: item.name, qty: String(qtyN) }]);
    setMedicineId(0);
    setMedicineQuery('');
    setQty('');
    medicineRef.current?.focus();
  };

  const saveEdit = async () => {
    if (!selected) return;
    if (!supplierId || !poDate) {
      toast.warning('Supplier and date are required');
      return;
    }
    if (lines.length === 0) {
      toast.warning('Add at least one medicine');
      return;
    }
    if (lines.some((line) => !Number.isFinite(Number(line.qty)) || Number(line.qty) <= 0)) {
      toast.warning('Quantity must be more than zero');
      return;
    }
    setBusy(true);
    try {
      await purchaseApi.updateOrder(selected.id, {
        supplierId,
        poDate,
        note: note.trim(),
        lines: lines.map((line) => ({ medicineId: line.medicineId, qty: Number(line.qty) })),
      });
      toast.success('Order updated');
      const res = await purchaseApi.order(selected.id);
      setSelected(masterData<PoRow>(res));
      setEditing(false);
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not update order'));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (approved: boolean) => {
    if (!selected) return;
    const verb = approved ? 'Approve' : 'Reject';
    if (!(await confirmDialog(`${verb} ${selected.poNo}?`, { title: verb, confirmText: verb, tone: approved ? 'primary' : 'danger' }))) return;
    setBusy(true);
    try {
      await purchaseApi.decide(selected.id, approved);
      toast.success(approved ? 'Order approved' : 'Order rejected');
      setSelected(null);
      setEditing(false);
      load();
    } catch (err) {
      toast.error(masterError(err, 'Could not update order'));
    } finally {
      setBusy(false);
    }
  };

  const activeSuppliers = suppliers.filter((row) => row.isActive === 1 || row.id === supplierId);
  const activeMedicines = medicines.filter((row) => row.isActive === 1);

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-check-circle" /> Approve</h2>
      <div className="mst-stack">
        <div className="mst-card">
          <div className="mst-card-h">Pending orders</div>
          <div className="mst-table-wrap">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="mst-empty">No pending orders</td></tr>
                )}
                {orders.map((row) => (
                  <tr key={row.id} className="mst-click-row" onClick={() => open(row)}>
                    <td>{row.poNo}</td>
                    <td>{row.poDate}</td>
                    <td>{row.supplierName}</td>
                    <td title={row.note}>{row.note}</td>
                    <td>
                      <button
                        className="mst-icon-btn"
                        type="button"
                        title="Edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          purchaseApi.order(row.id)
                            .then((res) => beginEdit(masterData<PoRow>(res)))
                            .catch((err) => toast.error(masterError(err, 'Could not load order')));
                        }}
                      >
                        <i className="fas fa-pen" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected && createPortal(
          <div className="mst-modal" onMouseDown={() => { if (!editing) { setSelected(null); } }}>
            <div className="mst-modal-box" onMouseDown={(event) => event.stopPropagation()}>
        {!editing && (
          <div className="mst-card">
            <div className="mst-card-h">
              <span>{selected.poNo} — {selected.supplierName}</span>
              <button className="mst-icon-btn" type="button" title="Close" onClick={() => setSelected(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mst-card-b">
              <div className="mst-table-wrap">
                <table className="mst-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((item) => (
                      <tr key={item.medicineId}>
                        <td>{item.medicineName}</td>
                        <td>{money(item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mst-actions" style={{ marginTop: 12 }}>
                <button className="mst-btn mst-btn-outline" type="button" disabled={busy} onClick={startEdit}>Edit</button>
                <button className="mst-btn mst-btn-green" type="button" disabled={busy} onClick={() => decide(true)}>Approve</button>
                <button className="mst-btn mst-btn-danger" type="button" disabled={busy} onClick={() => decide(false)}>Reject</button>
              </div>
            </div>
          </div>
        )}
        {editing && (
          <form className="mst-card" onSubmit={(event) => event.preventDefault()}>
            <div className="mst-card-h">
              <span>Edit {selected.poNo}</span>
              <button className="mst-icon-btn" type="button" title="Close" onClick={() => { setEditing(false); setSelected(null); }}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mst-card-b mst-form">
              <div className="mst-fg">
                <label>Supplier <span className="req">*</span></label>
                <select className="mst-sel" value={supplierId || ''} onChange={(e) => setSupplierId(Number(e.target.value))}>
                  <option value="">Select</option>
                  {activeSuppliers.map((row) => (
                    <option key={row.id} value={row.id}>{row.name}</option>
                  ))}
                </select>
              </div>
              <div className="mst-fg">
                <label>Date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
              </div>
              <div className="mst-fg span-2">
                <label>Note</label>
                <input className="mst-inp" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="mst-line-row">
                <div className="mst-fg">
                  <label>Medicine</label>
                  <SuggestInput
                    inputRef={medicineRef}
                    value={medicineQuery}
                    placeholder="Type at least 2 letters"
                    options={activeMedicines}
                    getLabel={(item) => item.name}
                    onChange={(value) => { setMedicineQuery(value); setMedicineId(0); }}
                    onPick={(item) => { setMedicineId(item.id); setMedicineQuery(item.name); }}
                  />
                </div>
                <div className="mst-fg">
                  <label>Quantity</label>
                  <input
                    className="mst-inp"
                    type="number"
                    min="0"
                    step="0.001"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLine();
                      }
                    }}
                  />
                </div>
                <button className="mst-btn mst-btn-outline" type="button" onClick={addLine}>Add line</button>
              </div>
              <div className="mst-fg span-2">
                <div className="mst-table-wrap">
                  <table className="mst-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 && (
                        <tr><td colSpan={3} className="mst-empty">No lines</td></tr>
                      )}
                      {lines.map((line) => (
                        <tr key={line.medicineId}>
                          <td>{line.medicineName}</td>
                          <td>
                            <input
                              className="mst-inp"
                              type="number"
                              min="0"
                              step="0.001"
                              value={line.qty}
                              onChange={(e) => setLines(lines.map((item) => item.medicineId === line.medicineId ? { ...item, qty: e.target.value } : item))}
                            />
                          </td>
                          <td>
                            <button className="mst-icon-btn danger" type="button" title="Remove" onClick={() => setLines(lines.filter((item) => item.medicineId !== line.medicineId))}>
                              <i className="fas fa-times" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mst-actions">
                <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={saveEdit}>{busy ? 'Saving…' : 'Save'}</button>
                <button className="mst-btn mst-btn-outline" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </form>
        )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ApprovePage;
