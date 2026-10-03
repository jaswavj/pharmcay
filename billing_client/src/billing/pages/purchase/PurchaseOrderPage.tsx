import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { masterApi, masterData, masterError, type MedicineRow, type SupplierRow } from '../../../api/master/master-api-service';
import { purchaseApi } from '../../../api/purchase/purchase-api-service';
import SuggestInput from '../master/SuggestInput';
import '../shared/Master.css';
import { money, today } from './format';

type Line = { medicineId: number; medicineName: string; qty: number };

const PurchaseOrderPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [supplierId, setSupplierId] = useState(0);
  const [poDate, setPoDate] = useState(today());
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineId, setMedicineId] = useState(0);
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const medicineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    masterApi.suppliers()
      .then((res) => setSuppliers(masterData<SupplierRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load suppliers')));
    masterApi.medicines()
      .then((res) => setMedicines(masterData<MedicineRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load medicines')));
  }, []);

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
    setLines([...lines, { medicineId: item.id, medicineName: item.name, qty: qtyN }]);
    setMedicineId(0);
    setMedicineQuery('');
    setQty('');
    medicineRef.current?.focus();
  };

  const saveOrder = async () => {
    if (!supplierId) {
      toast.warning('Select a supplier');
      return;
    }
    if (!poDate) {
      toast.warning('Order date is required');
      return;
    }
    if (lines.length === 0) {
      toast.warning('Add at least one medicine');
      return;
    }
    setBusy(true);
    try {
      const res = await purchaseApi.saveOrder({
        supplierId,
        poDate,
        note: note.trim(),
        lines: lines.map((line) => ({ medicineId: line.medicineId, qty: line.qty })),
      });
      const saved = masterData<{ poNo: string }>(res);
      toast.success(`Order ${saved.poNo} saved`);
      setLines([]);
      setNote('');
    } catch (err) {
      toast.error(masterError(err, 'Could not save order'));
    } finally {
      setBusy(false);
    }
  };

  const activeSuppliers = suppliers.filter((row) => row.isActive === 1);
  const activeMedicines = medicines.filter((row) => row.isActive === 1);

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-file-alt" /> Purchase order</h2>
      <div className="mst-stack">
        <form className="mst-card" onSubmit={(e) => e.preventDefault()}>
          <div className="mst-card-h">New order</div>
          <div className="mst-card-b mst-form">
            <div className="mst-fg">
              <label>Supplier <span className="req">*</span></label>
              <select className="mst-sel" value={supplierId || ''} onChange={(e) => setSupplierId(Number(e.target.value))}>
                <option value="">Select</option>
                {activeSuppliers.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}{row.phone ? ` — ${row.phone}` : ''}</option>
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
                <label>Medicine <span className="req">*</span></label>
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
                <label>Quantity <span className="req">*</span></label>
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
            {lines.length > 0 && (
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
                      {lines.map((line) => (
                        <tr key={line.medicineId}>
                          <td>{line.medicineName}</td>
                          <td>{money(line.qty)}</td>
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
            )}
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={saveOrder}>{busy ? 'Saving…' : 'Save order'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderPage;
