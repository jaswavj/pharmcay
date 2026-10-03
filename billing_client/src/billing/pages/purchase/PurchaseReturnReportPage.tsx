import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { masterData, masterError } from '../../../api/master/master-api-service';
import { purchaseApi, type ReturnReportRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money, today } from './format';
import ReportModal from './ReportModal';

type ReturnBill = {
  retNo: string;
  returnDate: string;
  supplierName: string;
  prNo: string;
  lines: ReturnReportRow[];
};

const groupReturns = (rows: ReturnReportRow[]): ReturnBill[] => {
  const bills = new Map<string, ReturnBill>();
  rows.forEach((row) => {
    const bill = bills.get(row.retNo) || {
      retNo: row.retNo,
      returnDate: row.returnDate,
      supplierName: row.supplierName,
      prNo: row.prNo,
      lines: [],
    };
    bill.lines.push(row);
    bills.set(row.retNo, bill);
  });
  return [...bills.values()];
};

const sum = (lines: ReturnReportRow[], key: 'qty' | 'netTotal') =>
  lines.reduce((total, row) => total + Number(row[key] || 0), 0);

const PurchaseReturnReportPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<ReturnReportRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<ReturnBill | null>(null);

  const bills = useMemo(() => groupReturns(rows), [rows]);

  const show = () => {
    if (!from || !to) {
      toast.warning('From date and to date are required');
      return;
    }
    if (from > to) {
      toast.warning('From date cannot be after to date');
      return;
    }
    setSelected(null);
    purchaseApi.returnReport(from, to)
      .then((res) => {
        setRows(masterData<ReturnReportRow[]>(res) || []);
        setLoaded(true);
      })
      .catch((err) => toast.error(masterError(err, 'Could not load purchase return report')));
  };

  const qty = sum(rows, 'qty');
  const net = sum(rows, 'netTotal');

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-file-export" /> Purchase return report</h2>
      <div className="mst-stack">
        <div className="mst-card">
          <div className="mst-card-h">Between dates</div>
          <div className="mst-card-b mst-form">
            <div className="mst-fg">
              <label>From date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setLoaded(false); setRows([]); setSelected(null); }} />
            </div>
            <div className="mst-fg">
              <label>To date <span className="req">*</span></label>
              <input className="mst-inp" type="date" value={to} onChange={(e) => { setTo(e.target.value); setLoaded(false); setRows([]); setSelected(null); }} />
            </div>
            <div className="mst-actions">
              <button className="mst-btn mst-btn-primary" type="button" onClick={show}>Show</button>
            </div>
          </div>
        </div>
        {loaded && (
          <div className="mst-card">
            <div className="mst-card-h">Returns</div>
            <div className="mst-table-wrap">
              <table className="mst-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>No</th>
                    <th>Supplier</th>
                    <th>Purchase</th>
                    <th>Qty</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 && (
                    <tr><td colSpan={6} className="mst-empty">No returns in this period</td></tr>
                  )}
                  {bills.map((bill) => (
                    <tr key={bill.retNo} className="mst-click-row" onClick={() => setSelected(bill)}>
                      <td>{bill.returnDate}</td>
                      <td>{bill.retNo}</td>
                      <td>{bill.supplierName}</td>
                      <td>{bill.prNo}</td>
                      <td>{money(sum(bill.lines, 'qty'))}</td>
                      <td>{money(sum(bill.lines, 'netTotal'))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bills.length > 0 && (
              <div className="mst-card-b mst-note">Qty {money(qty)} · Net {money(net)}</div>
            )}
          </div>
        )}
      </div>
      {selected && (
        <ReportModal title={`${selected.retNo} — ${selected.supplierName}`} onClose={() => setSelected(null)}>
          <div className="mst-note" style={{ marginBottom: 10 }}>
            {selected.returnDate}{selected.prNo ? ` · Purchase ${selected.prNo}` : ''}
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

export default PurchaseReturnReportPage;
