export const money = (n: number) => (Number.isFinite(Number(n)) ? Number(n).toFixed(3) : '0.000');

export const today = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const lineNet = (qty: number, freeQty: number, cost: number, gst: number, discPer: number) => {
  const billable = Math.max(0, qty - freeQty);
  const afterDisc = billable * cost * (1 - discPer / 100);
  return afterDisc * (1 + gst / 100);
};

export const poStatus = (status: number) => {
  if (status === 1) return 'Approved';
  if (status === 2) return 'Rejected';
  if (status === 3) return 'Received';
  return 'Pending';
};

export const poStatusClass = (status: number) => {
  if (status === 1) return 'on';
  if (status === 2) return 'off';
  if (status === 3) return 'done';
  return 'wait';
};

export const txnLabel = (type: string) => (type === 'PURCHASE_RETURN' ? 'Purchase return' : 'Purchase');
