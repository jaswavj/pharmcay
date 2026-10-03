import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { alertDialog, confirmDialog } from '../../../components/AppDialog';
import { masterData, masterError } from '../../../api/master/master-api-service';
import { purchaseApi, type BatchStock, type PoRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money, today } from './format';

type ReceiveLine = {
  itemId: number;
  medicineId: number;
  medicineName: string;
  ordered: number;
  received: number;
  take: boolean;
  qty: string;
  batchMode: 'existing' | 'new';
  batchId: number;
  batchName: string;
  expiryDate: string;
  cost: string;
  mrp: string;
  gst: string;
  batches: BatchStock[];
};

const latestBatch = (batches: BatchStock[]) =>
  batches.reduce<BatchStock | null>((best, row) => (!best || row.id > best.id ? row : best), null);

const PurchaseEntryPage: React.FC = () => {
  const [orders, setOrders] = useState<PoRow[]>([]);
  const [order, setOrder] = useState<PoRow | null>(null);
  const [lines, setLines] = useState<ReceiveLine[]>([]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const loadOrders = () => {
    purchaseApi.openOrders()
      .then((res) => setOrders(masterData<PoRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load orders')));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const selectOrder = (row: PoRow) => {
    purchaseApi.order(row.id)
      .then(async (res) => {
        const next = masterData<PoRow>(res);
        const items = next.items || [];
        const batchLists = await Promise.all(items.map((item) =>
          purchaseApi.batches(item.medicineId)
            .then((batchRes) => masterData<BatchStock[]>(batchRes) || [])
            .catch(() => [] as BatchStock[])
        ));
        setOrder(next);
        setInvoiceNo('');
        setInvoiceDate(today());
        document.querySelector('.module-content')?.scrollTo({ top: 0 });
        setLines(items.map((item, index) => {
          const batches = batchLists[index];
          const sample = latestBatch(batches);
          const received = item.receivedQty || 0;
          const remaining = Math.max(0, item.qty - received);
          return {
            itemId: item.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            ordered: item.qty,
            received,
            take: false,
            qty: remaining > 0 ? String(remaining) : '',
            batchMode: 'new',
            batchId: 0,
            batchName: '',
            expiryDate: '',
            cost: sample ? String(sample.cost) : '',
            mrp: sample ? String(sample.mrp) : '',
            gst: sample ? String(sample.gst) : '',
            batches,
          };
        }));
      })
      .catch((err) => toast.error(masterError(err, 'Could not load order')));
  };

  const patch = (itemId: number, change: Partial<ReceiveLine>) => {
    setLines((prev) => prev.map((line) => (line.itemId === itemId ? { ...line, ...change } : line)));
  };

  const typeBatch = (line: ReceiveLine, value: string) => {
    const batch = line.batches.find((row) => row.name.toLowerCase() === value.trim().toLowerCase());
    if (batch) {
      patch(line.itemId, {
        batchMode: 'existing',
        batchId: batch.id,
        batchName: value,
        expiryDate: batch.expiryDate,
        cost: String(batch.cost),
        mrp: String(batch.mrp),
        gst: String(batch.gst),
      });
      return;
    }
    patch(line.itemId, {
      batchMode: 'new',
      batchId: 0,
      batchName: value,
      expiryDate: line.batchMode === 'existing' ? '' : line.expiryDate,
    });
  };

  const save = async () => {
    if (!order) return;
    if (!invoiceNo.trim() || !invoiceDate) {
      toast.warning('Invoice number and date are required');
      return;
    }
    const chosen = lines.filter((line) => line.take && line.ordered - line.received > 0);
    if (chosen.length === 0) {
      toast.warning('Select the medicines to receive');
      return;
    }
    for (const line of chosen) {
      const qtyN = Number(line.qty);
      const remaining = line.ordered - line.received;
      if (!Number.isFinite(qtyN) || qtyN <= 0 || qtyN > remaining + 0.0001) {
        toast.warning(`${line.medicineName}: quantity must be more than zero and not more than remaining`);
        return;
      }
      const named = line.batches.find((row) => row.name.toLowerCase() === line.batchName.trim().toLowerCase());
      if (!line.batchName.trim() || (!named && !line.expiryDate)) {
        toast.warning(`${line.medicineName}: batch name and expiry date are required`);
        return;
      }
      const mrpN = Number(line.mrp);
      const costN = Number(line.cost || 0);
      const gstN = Number(line.gst || 0);
      if (!Number.isFinite(mrpN) || mrpN <= 0) {
        toast.warning(`${line.medicineName}: MRP is required`);
        return;
      }
      if (![costN, gstN].every((n) => Number.isFinite(n) && n >= 0) || gstN > 100) {
        toast.warning(`${line.medicineName}: cost and GST must be valid`);
        return;
      }
    }
    if (!(await confirmDialog(`Receive selected medicines on invoice ${invoiceNo.trim()}?`, { title: 'Save receipt', confirmText: 'Save' }))) return;
    setBusy(true);
    try {
      const res = await purchaseApi.saveEntry({
        poId: order.id,
        invoiceNo: invoiceNo.trim(),
        invoiceDate,
        lines: chosen.map((line) => {
          const named = line.batches.find((row) => row.name.toLowerCase() === line.batchName.trim().toLowerCase());
          const batchId = line.batchMode === 'existing' ? line.batchId : named?.id;
          return {
          poItemId: line.itemId,
          medicineId: line.medicineId,
          batchId: batchId || undefined,
          batchName: line.batchName.trim(),
          expiryDate: line.expiryDate,
          qty: Number(line.qty),
          cost: Number(line.cost || 0),
          mrp: Number(line.mrp),
          gst: Number(line.gst || 0),
          };
        }),
      });
      const saved = masterData<{ prNo: string }>(res);
      toast.success(`Purchase ${saved.prNo} saved. Stock updated.`);
      const listRes = await purchaseApi.openOrders();
      const nextOrders = masterData<PoRow[]>(listRes) || [];
      setOrders(nextOrders);
      const stillOpen = nextOrders.some((row) => row.id === order.id);
      if (stillOpen) selectOrder(order);
      else setOrder(null);
    } catch (err) {
      toast.error(masterError(err, 'Could not save purchase'));
    } finally {
      setBusy(false);
    }
  };

  const closeOrder = async () => {
    if (!order) return;
    await alertDialog(`Close ${order.poNo}? Remaining quantity will not be received.`, 'Close order');
    if (!(await confirmDialog(`Confirm close ${order.poNo}?`, { title: 'Confirm close', confirmText: 'Close order', tone: 'danger' }))) return;
    setBusy(true);
    try {
      await purchaseApi.closeOrder(order.id);
      toast.success('Order closed');
      setOrder(null);
      loadOrders();
    } catch (err) {
      toast.error(masterError(err, 'Could not close order'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-dolly" /> Purchase entry</h2>
      <div className="mst-stack">
        {!order && <div className="mst-card">
          <div className="mst-card-h">Approved and partial orders</div>
          <div className="mst-table-wrap">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="mst-empty">No open orders</td></tr>
                )}
                {orders.map((row) => (
                  <tr key={row.id} className="mst-click-row" onClick={() => selectOrder(row)}>
                    <td>{row.poNo}</td>
                    <td>{row.poDate}</td>
                    <td>{row.supplierName}</td>
                    <td>{money(row.orderedQty || 0)}</td>
                    <td>{money(row.receivedQty || 0)}</td>
                    <td>
                      <span className={`mst-badge ${(row.receivedQty || 0) > 0 ? 'wait' : 'on'}`}>
                        {(row.receivedQty || 0) > 0 ? 'Partial' : 'Approved'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

        {order && (
          <div className="mst-card">
            <div className="mst-card-h">
              <span>{order.poNo} — {order.supplierName}</span>
              <button className="mst-btn mst-btn-outline" type="button" onClick={() => { setOrder(null); setLines([]); }}>Back</button>
            </div>
            <div className="mst-card-b mst-form">
              <div className="mst-fg">
                <label>Invoice number <span className="req">*</span></label>
                <input className="mst-inp" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </div>
              <div className="mst-fg">
                <label>Invoice date <span className="req">*</span></label>
                <input className="mst-inp" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="mst-fg span-2">
                <div className="mst-table-wrap">
                  <table className="mst-table mst-table-wide">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Medicine</th>
                        <th>Ordered</th>
                        <th>Received</th>
                        <th>Receive</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                        <th>Cost</th>
                        <th>MRP</th>
                        <th>GST %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => {
                        const remaining = line.ordered - line.received;
                        const done = remaining <= 0.0001;
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
                            <td>{money(line.ordered)}</td>
                            <td>{money(line.received)}</td>
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
                            <td>
                              <input
                                className="mst-inp"
                                placeholder="Batch name"
                                disabled={done || !line.take}
                                value={line.batchName}
                                onChange={(e) => typeBatch(line, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="mst-inp"
                                type="date"
                                disabled={done || !line.take || line.batchMode !== 'new'}
                                value={line.expiryDate}
                                onChange={(e) => patch(line.itemId, { expiryDate: e.target.value })}
                              />
                            </td>
                            <td>
                              <input className="mst-inp" type="number" min="0" step="0.001" disabled={done || !line.take} value={line.cost} onChange={(e) => patch(line.itemId, { cost: e.target.value })} />
                            </td>
                            <td>
                              <input className="mst-inp" type="number" min="0" step="0.001" disabled={done || !line.take} value={line.mrp} onChange={(e) => patch(line.itemId, { mrp: e.target.value })} />
                            </td>
                            <td>
                              <input className="mst-inp" type="number" min="0" max="100" step="0.01" disabled={done || !line.take} value={line.gst} onChange={(e) => patch(line.itemId, { gst: e.target.value })} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mst-actions">
                <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save receipt'}</button>
                <button className="mst-btn mst-btn-danger" type="button" disabled={busy} onClick={closeOrder}>Close order</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseEntryPage;
