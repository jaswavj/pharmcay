import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { masterData, masterError } from '../../../api/master/master-api-service';
import { purchaseApi, type StockRow } from '../../../api/purchase/purchase-api-service';
import '../shared/Master.css';
import { money } from './format';

const StockPage: React.FC = () => {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    purchaseApi.stock()
      .then((res) => setRows(masterData<StockRow[]>(res) || []))
      .catch((err) => toast.error(masterError(err, 'Could not load stock')));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      row.medicineName.toLowerCase().includes(q) || row.batchName.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-boxes" /> Stock</h2>
      <div className="mst-card">
        <div className="mst-card-h">
          <span>Current stock</span>
          <div className="mst-search">
            <i className="fas fa-search" />
            <input className="mst-inp" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="mst-table-wrap">
          <table className="mst-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>MRP</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={6} className="mst-empty">No stock yet. Save a purchase entry to add stock.</td></tr>
              )}
              {shown.map((row) => (
                <tr key={row.batchId}>
                  <td>{row.medicineName}</td>
                  <td>{row.batchName}</td>
                  <td>{row.expiryDate}</td>
                  <td>{money(row.qty)}</td>
                  <td>{money(row.cost)}</td>
                  <td>{money(row.mrp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockPage;
