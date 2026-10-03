import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { confirmDialog } from '../../../components/AppDialog';
import { masterData, masterError } from '../../../api/master/master-api-service';
import { purchaseApi, type PurchaseItem, type PurchaseRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money, today } from './format';

type ReturnLine = {
  itemId: number;
  medicineName: string;
  batchName: string;
  purchased: number;
  returned: number;
  stock: number;
  cost: number;
  gst: number;
  take: boolean;
  qty: string;
};

const returnable = (line: ReturnLine) => Math.max(0, Math.min(line.purchased - line.returned, line.stock));

const toLines = (items: PurchaseItem[]): ReturnLine[] =>
  items.map((item) => {
    const line: ReturnLine = {
      itemId: item.id,
      medicineName: item.medicineName,
      batchName: item.batchName,
      purchased: item.qty,
      returned: item.returnedQty || 0,
      stock: item.stockQty || 0,
      cost: item.cost,
      gst: item.gst,
      take: false,
      qty: '',
    };
    const left = returnable(line);
    line.qty = left > 0 ? String(left) : '';
    return line;
  });

const PurchaseReturnPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [lines, setLines] = useState<ReturnLine[]>([]);
  const [returnDate, setReturnDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const show = () => {
    if (!from || !to) {
      toast.warning('From date and to date are required');
      return;
    }
    if (from > to) {
      toast.warning('From date cannot be after to date');
      return;
    }
    purchaseApi.entries(from, to)
      .then((res) => {
        setPurchases(masterData<PurchaseRow[]>(res) || []);
        setLoaded(true);
      })
      .catch((err) => toast.error(masterError(err, 'Could not load purchases')));
  };

  const selectPurchase = (row: PurchaseRow) => {
    purchaseApi.entry(row.id)
      .then((res) => {
        const next = masterData<PurchaseRow>(res);
        setPurchase(next);
        setReturnDate(today());
        setLines(toLines(next.items || []));
        document.querySelector('.module-content')?.scrollTo({ top: 0 });
      })
      .catch((err) => toast.error(masterError(err, 'Could not load purchase')));
  };

  const patch = (itemId: number, change: Partial<ReturnLine>) => {
    setLines((prev) => prev.map((line) => (line.itemId === itemId ? { ...line, ...change } : line)));
  };

  const save = async () => {
    if (!purchase) return;
    if (!returnDate) {
      toast.warning('Return date is required');
      return;
    }
    const chosen = lines.filter((line) => line.take && returnable(line) > 0.0001);
    if (chosen.length === 0) {
      toast.warning('Select the medicines to return');
      return;
    }
    for (const line of chosen) {
      const qtyN = Number(line.qty);
      const left = returnable(line);
      if (!Number.isFinite(qtyN) || qtyN <= 0 || qtyN > left + 0.0001) {
        toast.warning(`${line.medicineName}: quantity must be more than zero and not more than purchased or stock`);
        return;
      }
    }
    if (!(await confirmDialog(`Return selected medicines from ${purchase.prNo}?`, { title: 'Purchase return', confirmText: 'Return', tone: 'danger' }))) return;
    setBusy(true);
    try {
      const res = await purchaseApi.saveReturn({
        purchaseId: purchase.id,
        returnDate,
        lines: chosen.map((line) => ({ purchaseItemId: line.itemId, qty: Number(line.qty) })),
      });
      const saved = masterData<{ retNo: string }>(res);
      toast.success(`Return ${saved.retNo} saved. Stock updated.`);
      selectPurchase(purchase);
      show();
    } catch (err) {
      toast.error(masterError(err, 'Could not save return'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-undo" /> Purchase return</h2>
      <div className="mst-stack">
        {!purchase && (
          <div className="mst-card">
            <div className="mst-card-h">Purchases between dates</div>
            <div className="mst-card-b mst-form">
              <div className="mst-fg">
                <label>From date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setLoaded(false); setPurchases([]); }} />
              </div>
              <div className="mst-fg">
                <label>To date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={to} onChange={(e) => { setTo(e.target.value); setLoaded(false); setPurchases([]); }} />
              </div>
              <div className="mst-actions">
                <button className="mst-btn mst-btn-primary" type="button" onClick={show}>Show</button>
              </div>
            </div>
          </div>
        )}

        {!purchase && loaded && (
          <div className="mst-card">
            <div className="mst-card-h">Purchased list</div>
            <div className="mst-table-wrap">
              <table className="mst-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Invoice</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 && (
                    <tr><td colSpan={5} className="mst-empty">No purchases in this period</td></tr>
                  )}
                  {purchases.map((row) => (
                    <tr key={row.id} className="mst-click-row" onClick={() => selectPurchase(row)}>
                      <td>{row.prNo}</td>
                      <td>{row.invoiceDate}</td>
                      <td>{row.supplierName}</td>
                      <td>{row.invoiceNo}</td>
                      <td>{money(row.netTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {purchase && (
          <div className="mst-card">
            <div className="mst-card-h">
              <span>{purchase.prNo} — {purchase.supplierName} — {purchase.invoiceNo}</span>
              <button className="mst-btn mst-btn-outline" type="button" onClick={() => { setPurchase(null); setLines([]); }}>Back</button>
            </div>
            <div className="mst-card-b mst-form">
              <div className="mst-fg">
                <label>Return date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
              <div className="mst-fg span-2">
                <div className="mst-table-wrap">
                  <table className="mst-table mst-table-wide">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Medicine</th>
                        <th>Batch</th>
                        <th>Purchased</th>
                        <th>Returned</th>
                        <th>Stock</th>
                        <th>Return qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => {
                        const left = returnable(line);
                        const done = left <= 0.0001;
                        return (
                          <tr key={line.itemId}>
                            <td>
                              <input
                                type="checkbox"
                                checked={line.take}
                                disabled={done}
                                onChange={(e) => patch(line.itemId, { take: e.target.checked })}
                              />
                            </td>
                            <td>{line.medicineName}</td>
                            <td>{line.batchName}</td>
                            <td>{money(line.purchased)}</td>
                            <td>{money(line.returned)}</td>
                            <td>{money(line.stock)}</td>
                            <td>
                              <input
                                className="mst-inp"
                                type="number"
                                min="0"
                                step="0.001"
                                disabled={done || !line.take}
                                value={line.qty}
                                onChange={(e) => patch(line.itemId, { qty: e.target.value })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mst-actions">
                <button className="mst-btn mst-btn-danger" type="button" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save return'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnPage;
