import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { masterApi, masterData, masterError, type SupplierRow } from '../../../api/master/master-api-service';
import { purchaseApi, type PurchaseReportRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money, today } from './format';
import ReportModal from './ReportModal';

type Bill = {
  prNo: string;
  invoiceDate: string;
  invoiceNo: string;
  lines: PurchaseReportRow[];
};

const groupBills = (rows: PurchaseReportRow[]): Bill[] => {
  const bills = new Map<string, Bill>();
  rows.forEach((row) => {
    const bill = bills.get(row.prNo) || {
      prNo: row.prNo,
      invoiceDate: row.invoiceDate,
      invoiceNo: row.invoiceNo,
      lines: [],
    };
    bill.lines.push(row);
    bills.set(row.prNo, bill);
  });
  return [...bills.values()];
};

const sum = (lines: PurchaseReportRow[], key: 'qty' | 'netTotal') =>
  lines.reduce((total, row) => total + Number(row[key] || 0), 0);

const SupplierPurchasePage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [supplierId, setSupplierId] = useState(0);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<PurchaseReportRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Bill | null>(null);

  const bills = useMemo(() => groupBills(rows), [rows]);
  const supplier = suppliers.find((row) => row.id === supplierId);

  useEffect(() => {
    masterApi.suppliers()
      .then((res) => setSuppliers(masterData<SupplierRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load suppliers')));
  }, []);

  const clear = () => {
    setLoaded(false);
    setRows([]);
    setSelected(null);
  };

  const show = () => {
    if (!supplierId) {
      toast.warning('Select a supplier');
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
    setSelected(null);
    purchaseApi.supplierPurchase(from, to, supplierId)
      .then((res) => {
        setRows(masterData<PurchaseReportRow[]>(res) || []);
        setLoaded(true);
      })
      .catch((err) => toast.error(masterError(err, 'Could not load supplier wise purchase')));
  };

  const qty = sum(rows, 'qty');
  const net = sum(rows, 'netTotal');

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-truck" /> Supplier wise purchase</h2>
      <div className="mst-stack">
        <div className="mst-card">
          <div className="mst-card-h">Supplier and dates</div>
          <div className="mst-card-b mst-form">
            <div className="mst-fg span-2">
              <label>Supplier <span className="req">*</span></label>
              <select className="mst-sel" value={supplierId || ''} onChange={(e) => { setSupplierId(Number(e.target.value)); clear(); }}>
                <option value="">Select</option>
                {suppliers.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </div>
            <div className="mst-fg">
              <label>From date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={from} onChange={(e) => { setFrom(e.target.value); clear(); }} />
            </div>
            <div className="mst-fg">
              <label>To date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={to} onChange={(e) => { setTo(e.target.value); clear(); }} />
            </div>
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="button" onClick={show}>Show</button>
            </div>
          </div>
        </div>
        {loaded && (
          <div className="mst-card">
            <div className="mst-card-h">{supplier?.name || 'Purchases'}</div>
            <div className="mst-table-wrap">
              <table className="mst-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>No</th>
                    <th>Invoice</th>
                    <th>Qty</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 && (
                    <tr><td colSpan={5} className="mst-empty">No purchases for this supplier in this period</td></tr>
                  )}
                  {bills.map((bill) => (
                    <tr key={bill.prNo} className="mst-click-row" onClick={() => setSelected(bill)}>
                      <td>{bill.invoiceDate}</td>
                      <td>{bill.prNo}</td>
                      <td>{bill.invoiceNo}</td>
                      <td>{money(sum(bill.lines, 'qty'))}</td>
                      <td>{money(sum(bill.lines, 'netTotal'))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bills.length > 0 && (
              <div className="mst-card-b mst-note">Bills {bills.length} · Qty {money(qty)} · Net {money(net)}</div>
            )}
          </div>
        )}
      </div>
      {selected && (
        <ReportModal title={`${selected.prNo} — ${supplier?.name || ''}`} onClose={() => setSelected(null)}>
          <div className="mst-note" style={{ marginBottom: 10 }}>
            {selected.invoiceDate} · Invoice {selected.invoiceNo}
          </div>
          <div className="mst-table-wrap">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Cost</th>
                  <th>GST %</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {selected.lines.map((line, index) => (
                  <tr key={`${line.batchName}-${index}`}>
                    <td>{line.medicineName}</td>
                    <td>{line.batchName}</td>
                    <td>{money(line.qty)}</td>
                    <td>{money(line.cost)}</td>
                    <td>{money(line.gst)}</td>
                    <td>{money(line.netTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mst-note" style={{ marginTop: 10 }}>
            Qty {money(sum(selected.lines, 'qty'))} · Net {money(sum(selected.lines, 'netTotal'))}
          </div>
        </ReportModal>
      )}
    </div>
  );
};

export default SupplierPurchasePage;
