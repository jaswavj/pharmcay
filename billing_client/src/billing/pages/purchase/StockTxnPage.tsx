import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { masterApi, masterData, masterError, type MedicineRow } from '../../../api/master/master-api-service';
import { purchaseApi, type StockTxnRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money, today, txnLabel } from './format';

const StockTxnPage: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [medicineId, setMedicineId] = useState(0);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<StockTxnRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    masterApi.medicines()
      .then((res) => setMedicines(masterData<MedicineRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load medicines')));
  }, []);

  const show = () => {
    if (!medicineId) {
      toast.warning('Select a medicine');
      return;
    }
    if (!from || !to) {
      toast.warning('From date and to date are required');
      return;
    }
    if (from > to) {
      toast.warning('From date cannot be after to date');
      return;
    }
    purchaseApi.stockTransactions(medicineId, from, to)
      .then((res) => {
        setRows(masterData<StockTxnRow[]>(res) || []);
        setLoaded(true);
      })
      .catch((err) => toast.error(masterError(err, 'Could not load stock transactions')));
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-exchange-alt" /> Stock transaction</h2>
      <div className="mst-stack">
        <div className="mst-card">
          <div className="mst-card-h">Select medicine and dates</div>
          <div className="mst-card-b mst-form">
            <div className="mst-fg span-2">
              <label>Medicine <span className="req">*</span></label>
              <select className="mst-sel" value={medicineId || ''} onChange={(e) => { setMedicineId(Number(e.target.value)); setLoaded(false); setRows([]); }}>
                <option value="">Select</option>
                {medicines.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </div>
            <div className="mst-fg">
              <label>From date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setLoaded(false); setRows([]); }} />
            </div>
            <div className="mst-fg">
              <label>To date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={to} onChange={(e) => { setTo(e.target.value); setLoaded(false); setRows([]); }} />
            </div>
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="button" onClick={show}>Show</button>
            </div>
          </div>
        </div>
        {loaded && (
          <div className="mst-card">
            <div className="mst-card-h">Movements</div>
            <div className="mst-table-wrap">
              <table className="mst-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Ref</th>
                    <th>Batch</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="mst-empty">No stock transactions in this period</td></tr>
                  )}
                  {rows.map((row, index) => (
                    <tr key={`${row.txnDate}-${row.refNo}-${row.batchName}-${index}`}>
                      <td>{row.txnDate}</td>
                      <td>{txnLabel(row.txnType)}</td>
                      <td>{row.refNo}</td>
                      <td>{row.batchName}</td>
                      <td>{row.qtyIn > 0 ? <span className="mst-badge on">{money(row.qtyIn)}</span> : money(row.qtyIn)}</td>
                      <td>{row.qtyOut > 0 ? <span className="mst-badge off">{money(row.qtyOut)}</span> : money(row.qtyOut)}</td>
                      <td>{money(row.balanceQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTxnPage;
