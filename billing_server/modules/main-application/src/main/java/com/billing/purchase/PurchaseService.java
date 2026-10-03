package com.billing.purchase;

import com.billing.purchase.dto.BatchStockRow;
import com.billing.purchase.dto.DecisionRequest;
import com.billing.purchase.dto.PoItemRow;
import com.billing.purchase.dto.PoLineRequest;
import com.billing.purchase.dto.PoRow;
import com.billing.purchase.dto.PoSaveRequest;
import com.billing.purchase.dto.PurchaseItemRow;
import com.billing.purchase.dto.PurchaseLineRequest;
import com.billing.purchase.dto.PurchaseReportRow;
import com.billing.purchase.dto.PurchaseRow;
import com.billing.purchase.dto.PurchaseSaveRequest;
import com.billing.purchase.dto.ReturnLineRequest;
import com.billing.purchase.dto.ReturnReportRow;
import com.billing.purchase.dto.ReturnRow;
import com.billing.purchase.dto.ReturnSaveRequest;
import com.billing.purchase.dto.StockRow;
import com.billing.purchase.dto.StockTxnRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final JdbcTemplate jdbcTemplate;

    public List<PoRow> orders(Integer status) {
        String sql = "SELECT p.id, p.po_no, p.supplier_id, s.name AS supplier_name, p.po_date, p.status, p.note " +
                "FROM purchase_order p JOIN supplier s ON s.id = p.supplier_id ";
        if (status == null) {
            sql += "ORDER BY p.id DESC";
            return jdbcTemplate.query(sql, (rs, i) -> mapOrder(rs));
        }
        sql += "WHERE p.status = ? ORDER BY p.id DESC";
        return jdbcTemplate.query(sql, (rs, i) -> mapOrder(rs), status);
    }

    public PoRow order(Long id) {
        List<PoRow> rows = jdbcTemplate.query(
                "SELECT p.id, p.po_no, p.supplier_id, s.name AS supplier_name, p.po_date, p.status, p.note " +
                        "FROM purchase_order p JOIN supplier s ON s.id = p.supplier_id WHERE p.id = ?",
                (rs, i) -> mapOrder(rs),
                id
        );
        if (rows.isEmpty()) {
            throw new RuntimeException("Purchase order not found");
        }
        PoRow row = rows.get(0);
        row.setItems(orderItems(id));
        return row;
    }

    public List<PoRow> openOrders() {
        return jdbcTemplate.query(
                "SELECT p.id, p.po_no, p.supplier_id, s.name AS supplier_name, p.po_date, p.status, p.note, " +
                        "IFNULL(SUM(i.qty), 0) AS ordered_qty, IFNULL(SUM(i.received_qty), 0) AS received_qty " +
                        "FROM purchase_order p JOIN supplier s ON s.id = p.supplier_id " +
                        "LEFT JOIN purchase_order_item i ON i.po_id = p.id " +
                        "WHERE p.status = 1 " +
                        "GROUP BY p.id, p.po_no, p.supplier_id, s.name, p.po_date, p.status, p.note " +
                        "ORDER BY p.id DESC",
                (rs, i) -> {
                    PoRow row = mapOrder(rs);
                    row.setOrderedQty(rs.getDouble("ordered_qty"));
                    row.setReceivedQty(rs.getDouble("received_qty"));
                    return row;
                }
        );
    }

    @Transactional
    public String saveOrder(PoSaveRequest request) {
        if (request == null || request.getLines() == null || request.getLines().isEmpty()) {
            throw new RuntimeException("Add at least one medicine");
        }
        long supplierId = requireActive("supplier", request.getSupplierId(), "Select a supplier");
        LocalDate poDate = parseDate(request.getPoDate(), "Order date");
        String note = trim(request.getNote(), 255);
        Set<Long> seen = new HashSet<>();
        for (PoLineRequest line : request.getLines()) {
            long medicineId = requireActive("medicine", line.getMedicineId(), "Select a medicine");
            if (!seen.add(medicineId)) {
                throw new RuntimeException("Medicine is already on this order");
            }
            qty(line.getQty(), "Quantity");
        }
        long id = insert(
                "INSERT INTO purchase_order (po_no, supplier_id, po_date, status, note) VALUES ('', ?, ?, 0, ?)",
                supplierId, Date.valueOf(poDate), note
        );
        String poNo = "PO" + String.format("%04d", id);
        jdbcTemplate.update("UPDATE purchase_order SET po_no = ? WHERE id = ?", poNo, id);
        for (PoLineRequest line : request.getLines()) {
            jdbcTemplate.update(
                    "INSERT INTO purchase_order_item (po_id, medicine_id, qty, cost) VALUES (?, ?, ?, ?)",
                    id, line.getMedicineId(), qty(line.getQty(), "Quantity"), BigDecimal.ZERO
            );
        }
        return poNo;
    }

    @Transactional
    public void updateOrder(Long id, PoSaveRequest request) {
        if (id == null || id <= 0) {
            throw new RuntimeException("Purchase order not found");
        }
        if (request == null || request.getLines() == null || request.getLines().isEmpty()) {
            throw new RuntimeException("Add at least one medicine");
        }
        Integer status = jdbcTemplate.query(
                "SELECT status FROM purchase_order WHERE id = ? FOR UPDATE",
                rs -> rs.next() ? rs.getInt(1) : null,
                id
        );
        if (status == null) {
            throw new RuntimeException("Purchase order not found");
        }
        if (status != 0) {
            throw new RuntimeException("Only a pending order can be edited");
        }
        long supplierId = requireActive("supplier", request.getSupplierId(), "Select a supplier");
        LocalDate poDate = parseDate(request.getPoDate(), "Order date");
        String note = trim(request.getNote(), 255);
        Set<Long> seen = new HashSet<>();
        for (PoLineRequest line : request.getLines()) {
            long medicineId = requireActive("medicine", line.getMedicineId(), "Select a medicine");
            if (!seen.add(medicineId)) {
                throw new RuntimeException("Medicine is already on this order");
            }
            qty(line.getQty(), "Quantity");
        }
        jdbcTemplate.update(
                "UPDATE purchase_order SET supplier_id = ?, po_date = ?, note = ? WHERE id = ?",
                supplierId, Date.valueOf(poDate), note, id
        );
        jdbcTemplate.update("DELETE FROM purchase_order_item WHERE po_id = ?", id);
        for (PoLineRequest line : request.getLines()) {
            jdbcTemplate.update(
                    "INSERT INTO purchase_order_item (po_id, medicine_id, qty, cost) VALUES (?, ?, ?, ?)",
                    id, line.getMedicineId(), qty(line.getQty(), "Quantity"), BigDecimal.ZERO
            );
        }
    }

    @Transactional
    public void decide(Long id, DecisionRequest request) {
        if (id == null || id <= 0) {
            throw new RuntimeException("Purchase order not found");
        }
        boolean approved = request != null && Boolean.TRUE.equals(request.getApproved());
        Integer status = jdbcTemplate.query(
                "SELECT status FROM purchase_order WHERE id = ? FOR UPDATE",
                rs -> rs.next() ? rs.getInt(1) : null,
                id
        );
        if (status == null) {
            throw new RuntimeException("Purchase order not found");
        }
        if (status != 0) {
            throw new RuntimeException("Only a pending order can be approved or rejected");
        }
        jdbcTemplate.update("UPDATE purchase_order SET status = ? WHERE id = ?", approved ? 1 : 2, id);
    }

    @Transactional
    public void closeOrder(Long id) {
        if (id == null || id <= 0) {
            throw new RuntimeException("Purchase order not found");
        }
        Integer status = jdbcTemplate.query(
                "SELECT status FROM purchase_order WHERE id = ? FOR UPDATE",
                rs -> rs.next() ? rs.getInt(1) : null,
                id
        );
        if (status == null) {
            throw new RuntimeException("Purchase order not found");
        }
        if (status != 1) {
            throw new RuntimeException("Only an open order can be closed");
        }
        jdbcTemplate.update("UPDATE purchase_order SET status = 4 WHERE id = ?", id);
    }

    public List<BatchStockRow> medicineBatches(Long medicineId) {
        if (medicineId == null || medicineId <= 0) {
            throw new RuntimeException("Select a medicine");
        }
        return jdbcTemplate.query(
                "SELECT b.id, b.name, b.expiry_date, b.cost, b.mrp, b.gst, IFNULL(s.qty, 0) AS qty " +
                        "FROM batch b LEFT JOIN stock s ON s.batch_id = b.id " +
                        "WHERE b.medicine_id = ? AND b.is_active = 1 ORDER BY b.expiry_date, b.name",
                (rs, i) -> {
                    BatchStockRow row = new BatchStockRow();
                    row.setId(rs.getLong("id"));
                    row.setName(rs.getString("name"));
                    row.setExpiryDate(rs.getDate("expiry_date").toLocalDate().toString());
                    row.setCost(rs.getDouble("cost"));
                    row.setMrp(rs.getDouble("mrp"));
                    row.setGst(rs.getDouble("gst"));
                    row.setQty(rs.getDouble("qty"));
                    return row;
                },
                medicineId
        );
    }

    public List<PurchaseRow> entries(String from, String to) {
        LocalDate fromDate = parseDate(from, "From date");
        LocalDate toDate = parseDate(to, "To date");
        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException("From date cannot be after to date");
        }
        return jdbcTemplate.query(
                "SELECT p.id, p.pr_no, s.name AS supplier_name, IFNULL(o.po_no, '') AS po_no, " +
                        "p.invoice_no, p.invoice_date, p.net_total " +
                        "FROM purchase p JOIN supplier s ON s.id = p.supplier_id " +
                        "LEFT JOIN purchase_order o ON o.id = p.po_id " +
                        "WHERE p.invoice_date BETWEEN ? AND ? ORDER BY p.invoice_date, p.id",
                (rs, i) -> mapPurchase(rs),
                Date.valueOf(fromDate), Date.valueOf(toDate)
        );
    }

    public PurchaseRow purchase(Long id) {
        List<PurchaseRow> rows = jdbcTemplate.query(
                "SELECT p.id, p.pr_no, s.name AS supplier_name, IFNULL(o.po_no, '') AS po_no, " +
                        "p.invoice_no, p.invoice_date, p.net_total " +
                        "FROM purchase p JOIN supplier s ON s.id = p.supplier_id " +
                        "LEFT JOIN purchase_order o ON o.id = p.po_id WHERE p.id = ?",
                (rs, i) -> mapPurchase(rs),
                id
        );
        if (rows.isEmpty()) {
            throw new RuntimeException("Purchase not found");
        }
        PurchaseRow row = rows.get(0);
        row.setItems(purchaseItems(id));
        return row;
    }

    @Transactional
    public String saveEntry(PurchaseSaveRequest request) {
        if (request == null || request.getLines() == null || request.getLines().isEmpty()) {
            throw new RuntimeException("Add at least one medicine");
        }
        if (request.getPoId() == null || request.getPoId() <= 0) {
            throw new RuntimeException("Select an order");
        }
        long poId = request.getPoId();
        long supplierId = lockOpenOrder(poId);
        String invoiceNo = required(request.getInvoiceNo(), "Invoice number is required");
        if (invoiceNo.length() > 40) {
            throw new RuntimeException("Invoice number must be 40 characters or less");
        }
        LocalDate invoiceDate = parseDate(request.getInvoiceDate(), "Invoice date");
        Integer duplicate = jdbcTemplate.query(
                "SELECT id FROM purchase WHERE supplier_id = ? AND LOWER(invoice_no) = LOWER(?) LIMIT 1",
                rs -> rs.next() ? rs.getInt(1) : 0,
                supplierId, invoiceNo
        );
        if (duplicate != null && duplicate > 0) {
            throw new RuntimeException("This invoice number is already saved for the supplier");
        }
        Set<String> seenBatches = new HashSet<>();
        Set<Long> seenItems = new HashSet<>();
        List<PreparedLine> preparedLines = new ArrayList<>();
        BigDecimal net = BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        for (PurchaseLineRequest line : request.getLines()) {
            if (line == null || line.getPoItemId() == null || line.getPoItemId() <= 0) {
                throw new RuntimeException("Select a medicine from the order");
            }
            if (!seenItems.add(line.getPoItemId())) {
                throw new RuntimeException("Medicine is already on this receipt");
            }
            BigDecimal receiveQty = qty(line.getQty(), "Quantity");
            List<BigDecimal[]> itemRows = jdbcTemplate.query(
                    "SELECT qty, received_qty, medicine_id FROM purchase_order_item WHERE id = ? AND po_id = ? FOR UPDATE",
                    (rs, n) -> new BigDecimal[]{rs.getBigDecimal("qty"), rs.getBigDecimal("received_qty"), BigDecimal.valueOf(rs.getLong("medicine_id"))},
                    line.getPoItemId(), poId
            );
            if (itemRows.isEmpty()) {
                throw new RuntimeException("Medicine is not on this order");
            }
            BigDecimal ordered = itemRows.get(0)[0];
            BigDecimal received = itemRows.get(0)[1] == null ? BigDecimal.ZERO : itemRows.get(0)[1];
            if (itemRows.get(0)[2].longValue() != (line.getMedicineId() == null ? 0 : line.getMedicineId())) {
                throw new RuntimeException("Medicine is not on this order");
            }
            if (received.add(receiveQty).compareTo(ordered) > 0) {
                throw new RuntimeException("Receive quantity is more than the remaining quantity");
            }
            line.setFreeQty(0d);
            line.setDiscPer(0d);
            PreparedLine prepared = preparePurchaseLine(line, seenBatches);
            prepared.itemId = line.getPoItemId();
            preparedLines.add(prepared);
            net = net.add(prepared.net);
        }
        long id = insert(
                "INSERT INTO purchase (pr_no, supplier_id, po_id, invoice_no, invoice_date, net_total) VALUES ('', ?, ?, ?, ?, ?)",
                supplierId, poId, invoiceNo, Date.valueOf(invoiceDate), net
        );
        String prNo = "PE" + String.format("%04d", id);
        jdbcTemplate.update("UPDATE purchase SET pr_no = ? WHERE id = ?", prNo, id);
        for (PreparedLine prepared : preparedLines) {
            long batchId = prepared.batchId;
            if (batchId <= 0) {
                batchId = insert(
                        "INSERT INTO batch (medicine_id, name, expiry_date, cost, mrp, gst, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                        prepared.medicineId, prepared.batchName, Date.valueOf(prepared.expiry), prepared.cost, prepared.mrp, prepared.gst
                );
            } else {
                jdbcTemplate.update(
                        "UPDATE batch SET cost = ?, mrp = ?, gst = ? WHERE id = ?",
                        prepared.cost, prepared.mrp, prepared.gst, batchId
                );
            }
            jdbcTemplate.update(
                    "INSERT INTO purchase_item (purchase_id, medicine_id, batch_id, qty, free_qty, cost, mrp, gst, disc_per, net_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    id, prepared.medicineId, batchId, prepared.qty, prepared.freeQty, prepared.cost, prepared.mrp,
                    prepared.gst, prepared.discPer, prepared.net
            );
            moveStock(batchId, prepared.medicineId, invoiceDate, "PURCHASE", prNo, prepared.qty, BigDecimal.ZERO);
            jdbcTemplate.update(
                    "UPDATE purchase_order_item SET received_qty = received_qty + ? WHERE id = ?",
                    prepared.qty, prepared.itemId
            );
        }
        Integer stillOpen = jdbcTemplate.query(
                "SELECT COUNT(*) FROM purchase_order_item WHERE po_id = ? AND received_qty < qty",
                rs -> rs.next() ? rs.getInt(1) : 0,
                poId
        );
        if (stillOpen == null || stillOpen == 0) {
            jdbcTemplate.update("UPDATE purchase_order SET status = 3 WHERE id = ?", poId);
        }
        return prNo;
    }

    public List<PurchaseReportRow> purchaseReport(String from, String to) {
        LocalDate[] range = dateRange(from, to);
        return purchaseLines(range[0], range[1], null);
    }

    public List<ReturnReportRow> returnReport(String from, String to) {
        LocalDate[] range = dateRange(from, to);
        return jdbcTemplate.query(
                "SELECT r.return_date, r.ret_no, s.name AS supplier_name, IFNULL(p.pr_no, '') AS pr_no, " +
                        "m.name AS medicine_name, b.name AS batch_name, i.qty, i.cost, i.gst, i.net_total " +
                        "FROM purchase_return r JOIN supplier s ON s.id = r.supplier_id " +
                        "LEFT JOIN purchase p ON p.id = r.purchase_id " +
                        "JOIN purchase_return_item i ON i.return_id = r.id " +
                        "JOIN medicine m ON m.id = i.medicine_id JOIN batch b ON b.id = i.batch_id " +
                        "WHERE r.return_date BETWEEN ? AND ? ORDER BY r.return_date, r.id, i.id",
                (rs, i) -> {
                    ReturnReportRow row = new ReturnReportRow();
                    row.setReturnDate(rs.getDate("return_date").toLocalDate().toString());
                    row.setRetNo(rs.getString("ret_no"));
                    row.setSupplierName(rs.getString("supplier_name"));
                    row.setPrNo(rs.getString("pr_no"));
                    row.setMedicineName(rs.getString("medicine_name"));
                    row.setBatchName(rs.getString("batch_name"));
                    row.setQty(rs.getDouble("qty"));
                    row.setCost(rs.getDouble("cost"));
                    row.setGst(rs.getDouble("gst"));
                    row.setNetTotal(rs.getDouble("net_total"));
                    return row;
                },
                Date.valueOf(range[0]), Date.valueOf(range[1])
        );
    }

    public List<PurchaseReportRow> supplierPurchase(String from, String to, Long supplierId) {
        if (supplierId == null || supplierId <= 0) {
            throw new RuntimeException("Select a supplier");
        }
        LocalDate[] range = dateRange(from, to);
        return purchaseLines(range[0], range[1], supplierId);
    }

    private List<PurchaseReportRow> purchaseLines(LocalDate fromDate, LocalDate toDate, Long supplierId) {
        String sql = "SELECT p.invoice_date, p.pr_no, s.name AS supplier_name, p.invoice_no, " +
                "m.name AS medicine_name, b.name AS batch_name, i.qty, i.cost, i.gst, i.net_total " +
                "FROM purchase p JOIN supplier s ON s.id = p.supplier_id " +
                "JOIN purchase_item i ON i.purchase_id = p.id " +
                "JOIN medicine m ON m.id = i.medicine_id JOIN batch b ON b.id = i.batch_id " +
                "WHERE p.invoice_date BETWEEN ? AND ?";
        List<Object> args = new ArrayList<>();
        args.add(Date.valueOf(fromDate));
        args.add(Date.valueOf(toDate));
        if (supplierId != null) {
            sql += " AND p.supplier_id = ?";
            args.add(supplierId);
        }
        sql += " ORDER BY p.invoice_date, p.id, i.id";
        return jdbcTemplate.query(sql, (rs, i) -> mapPurchaseLine(rs), args.toArray());
    }

    private PurchaseReportRow mapPurchaseLine(java.sql.ResultSet rs) throws java.sql.SQLException {
        PurchaseReportRow row = new PurchaseReportRow();
        row.setInvoiceDate(rs.getDate("invoice_date").toLocalDate().toString());
        row.setPrNo(rs.getString("pr_no"));
        row.setSupplierName(rs.getString("supplier_name"));
        row.setInvoiceNo(rs.getString("invoice_no"));
        row.setMedicineName(rs.getString("medicine_name"));
        row.setBatchName(rs.getString("batch_name"));
        row.setQty(rs.getDouble("qty"));
        row.setCost(rs.getDouble("cost"));
        row.setGst(rs.getDouble("gst"));
        row.setNetTotal(rs.getDouble("net_total"));
        return row;
    }

    public List<ReturnRow> returns() {
        return jdbcTemplate.query(
                "SELECT r.id, r.ret_no, s.name AS supplier_name, r.return_date, r.note, r.net_total " +
                        "FROM purchase_return r JOIN supplier s ON s.id = r.supplier_id ORDER BY r.id DESC",
                (rs, i) -> {
                    ReturnRow row = new ReturnRow();
                    row.setId(rs.getLong("id"));
                    row.setRetNo(rs.getString("ret_no"));
                    row.setSupplierName(rs.getString("supplier_name"));
                    row.setReturnDate(rs.getDate("return_date").toLocalDate().toString());
                    row.setNote(nz(rs.getString("note")));
                    row.setNetTotal(rs.getDouble("net_total"));
                    return row;
                }
        );
    }

    @Transactional
    public String saveReturn(ReturnSaveRequest request) {
        if (request == null || request.getLines() == null || request.getLines().isEmpty()) {
            throw new RuntimeException("Select a medicine to return");
        }
        if (request.getPurchaseId() == null || request.getPurchaseId() <= 0) {
            throw new RuntimeException("Select a purchase");
        }
        long purchaseId = request.getPurchaseId();
        List<Long> suppliers = jdbcTemplate.query(
                "SELECT supplier_id FROM purchase WHERE id = ? FOR UPDATE",
                (rs, i) -> rs.getLong("supplier_id"),
                purchaseId
        );
        if (suppliers.isEmpty()) {
            throw new RuntimeException("Purchase not found");
        }
        long supplierId = suppliers.get(0);
        LocalDate returnDate = parseDate(request.getReturnDate(), "Return date");
        String note = trim(request.getNote(), 255);
        Set<Long> seen = new HashSet<>();
        List<PreparedReturn> preparedLines = new ArrayList<>();
        BigDecimal net = BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        for (ReturnLineRequest line : request.getLines()) {
            PreparedReturn prepared = prepareReturnLine(line, purchaseId, seen);
            preparedLines.add(prepared);
            net = net.add(prepared.net);
        }
        long id = insert(
                "INSERT INTO purchase_return (ret_no, supplier_id, purchase_id, return_date, note, net_total) VALUES ('', ?, ?, ?, ?, ?)",
                supplierId, purchaseId, Date.valueOf(returnDate), note, net
        );
        String retNo = "PR" + String.format("%04d", id);
        jdbcTemplate.update("UPDATE purchase_return SET ret_no = ? WHERE id = ?", retNo, id);
        for (PreparedReturn prepared : preparedLines) {
            jdbcTemplate.update(
                    "INSERT INTO purchase_return_item (return_id, purchase_item_id, medicine_id, batch_id, qty, cost, gst, net_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    id, prepared.itemId, prepared.medicineId, prepared.batchId, prepared.qty, prepared.cost, prepared.gst, prepared.net
            );
            moveStock(prepared.batchId, prepared.medicineId, returnDate, "PURCHASE_RETURN", retNo, BigDecimal.ZERO, prepared.qty);
        }
        return retNo;
    }

    public List<StockRow> stock() {
        return jdbcTemplate.query(
                "SELECT b.id AS batch_id, m.name AS medicine_name, b.name AS batch_name, b.expiry_date, s.qty, b.cost, b.mrp " +
                        "FROM stock s JOIN batch b ON b.id = s.batch_id JOIN medicine m ON m.id = b.medicine_id " +
                        "ORDER BY m.name, b.expiry_date, b.name",
                (rs, i) -> {
                    StockRow row = new StockRow();
                    row.setBatchId(rs.getLong("batch_id"));
                    row.setMedicineName(rs.getString("medicine_name"));
                    row.setBatchName(rs.getString("batch_name"));
                    row.setExpiryDate(rs.getDate("expiry_date").toLocalDate().toString());
                    row.setQty(rs.getDouble("qty"));
                    row.setCost(rs.getDouble("cost"));
                    row.setMrp(rs.getDouble("mrp"));
                    return row;
                }
        );
    }

    public List<StockTxnRow> stockTransactions(Long medicineId, String from, String to) {
        if (medicineId == null || medicineId <= 0) {
            throw new RuntimeException("Select a medicine");
        }
        LocalDate fromDate = parseDate(from, "From date");
        LocalDate toDate = parseDate(to, "To date");
        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException("From date cannot be after to date");
        }
        return jdbcTemplate.query(
                "SELECT t.txn_date, t.txn_type, t.ref_no, m.name AS medicine_name, b.name AS batch_name, " +
                        "t.qty_in, t.qty_out, t.balance_qty " +
                        "FROM stock_transaction t JOIN batch b ON b.id = t.batch_id JOIN medicine m ON m.id = t.medicine_id " +
                        "WHERE t.medicine_id = ? AND t.txn_date BETWEEN ? AND ? ORDER BY t.txn_date, t.id",
                (rs, i) -> mapTxn(rs),
                medicineId, Date.valueOf(fromDate), Date.valueOf(toDate)
        );
    }

    private StockTxnRow mapTxn(java.sql.ResultSet rs) throws java.sql.SQLException {
        StockTxnRow row = new StockTxnRow();
        row.setTxnDate(rs.getDate("txn_date").toLocalDate().toString());
        row.setTxnType(rs.getString("txn_type"));
        row.setRefNo(rs.getString("ref_no"));
        row.setMedicineName(rs.getString("medicine_name"));
        row.setBatchName(rs.getString("batch_name"));
        row.setQtyIn(rs.getDouble("qty_in"));
        row.setQtyOut(rs.getDouble("qty_out"));
        row.setBalanceQty(rs.getDouble("balance_qty"));
        return row;
    }

    private long lockOpenOrder(Long poId) {
        List<Object[]> rows = jdbcTemplate.query(
                "SELECT supplier_id, status FROM purchase_order WHERE id = ? FOR UPDATE",
                (rs, i) -> new Object[]{rs.getLong("supplier_id"), rs.getInt("status")},
                poId
        );
        if (rows.isEmpty()) {
            throw new RuntimeException("Purchase order not found");
        }
        int status = (Integer) rows.get(0)[1];
        if (status != 1) {
            throw new RuntimeException("Only an open order can be received");
        }
        return (Long) rows.get(0)[0];
    }

    private PreparedLine preparePurchaseLine(PurchaseLineRequest line, Set<String> seenBatches) {
        if (line == null) {
            throw new RuntimeException("Add at least one medicine");
        }
        PreparedLine prepared = new PreparedLine();
        prepared.medicineId = requireActive("medicine", line.getMedicineId(), "Select a medicine");
        prepared.qty = qty(line.getQty(), "Quantity");
        prepared.freeQty = qtyOrZero(line.getFreeQty(), "Free");
        if (prepared.freeQty.compareTo(prepared.qty) > 0) {
            throw new RuntimeException("Free cannot be more than quantity");
        }
        prepared.cost = money(line.getCost(), "Cost");
        prepared.mrp = money(line.getMrp(), "MRP");
        if (prepared.mrp.signum() <= 0) {
            throw new RuntimeException("MRP is required");
        }
        prepared.gst = percent(line.getGst(), "GST");
        prepared.discPer = percent(line.getDiscPer(), "Discount");
        BigDecimal billable = prepared.qty.subtract(prepared.freeQty);
        BigDecimal costTotal = billable.multiply(prepared.cost);
        BigDecimal afterDisc = costTotal.subtract(costTotal.multiply(prepared.discPer).divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal tax = afterDisc.multiply(prepared.gst).divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        prepared.net = afterDisc.add(tax).setScale(3, RoundingMode.HALF_UP);
        if (line.getBatchId() != null && line.getBatchId() > 0) {
            prepared.batchId = line.getBatchId();
            Integer medicineId = jdbcTemplate.query(
                    "SELECT medicine_id FROM batch WHERE id = ? AND is_active = 1",
                    rs -> rs.next() ? rs.getInt(1) : null,
                    prepared.batchId
            );
            if (medicineId == null || medicineId.longValue() != prepared.medicineId) {
                throw new RuntimeException("Select a batch for this medicine");
            }
            prepared.batchName = "";
            if (!seenBatches.add("id:" + prepared.batchId)) {
                throw new RuntimeException("Batch is already on this purchase");
            }
        } else {
            prepared.batchId = 0;
            prepared.batchName = required(line.getBatchName(), "Batch name is required");
            prepared.expiry = parseDate(line.getExpiryDate(), "Expiry date");
            Integer duplicate = jdbcTemplate.query(
                    "SELECT id FROM batch WHERE medicine_id = ? AND LOWER(name) = LOWER(?) LIMIT 1",
                    rs -> rs.next() ? rs.getInt(1) : 0,
                    prepared.medicineId, prepared.batchName
            );
            if (duplicate != null && duplicate > 0) {
                throw new RuntimeException("Batch name already exists for this medicine");
            }
            if (!seenBatches.add("new:" + prepared.medicineId + ":" + prepared.batchName.toLowerCase())) {
                throw new RuntimeException("Batch is already on this purchase");
            }
        }
        return prepared;
    }

    private PreparedReturn prepareReturnLine(ReturnLineRequest line, long purchaseId, Set<Long> seen) {
        if (line == null || line.getPurchaseItemId() == null || line.getPurchaseItemId() <= 0) {
            throw new RuntimeException("Select a medicine from the purchase");
        }
        if (!seen.add(line.getPurchaseItemId())) {
            throw new RuntimeException("Medicine is already on this return");
        }
        List<Object[]> items = jdbcTemplate.query(
                "SELECT medicine_id, batch_id, qty, cost, gst FROM purchase_item WHERE id = ? AND purchase_id = ? FOR UPDATE",
                (rs, i) -> new Object[]{
                        rs.getLong("medicine_id"),
                        rs.getLong("batch_id"),
                        rs.getBigDecimal("qty"),
                        rs.getBigDecimal("cost"),
                        rs.getBigDecimal("gst")
                },
                line.getPurchaseItemId(), purchaseId
        );
        if (items.isEmpty()) {
            throw new RuntimeException("Medicine is not on this purchase");
        }
        PreparedReturn prepared = new PreparedReturn();
        prepared.itemId = line.getPurchaseItemId();
        prepared.medicineId = (Long) items.get(0)[0];
        prepared.batchId = (Long) items.get(0)[1];
        prepared.qty = qty(line.getQty(), "Quantity");
        BigDecimal purchased = (BigDecimal) items.get(0)[2];
        BigDecimal returned = jdbcTemplate.query(
                "SELECT IFNULL(SUM(qty), 0) FROM purchase_return_item WHERE purchase_item_id = ?",
                rs -> rs.next() ? rs.getBigDecimal(1) : BigDecimal.ZERO,
                prepared.itemId
        );
        if (returned == null) {
            returned = BigDecimal.ZERO;
        }
        if (returned.add(prepared.qty).compareTo(purchased) > 0) {
            throw new RuntimeException("Return quantity is more than the purchased quantity");
        }
        prepared.cost = (BigDecimal) items.get(0)[3];
        prepared.gst = (BigDecimal) items.get(0)[4];
        BigDecimal tax = prepared.qty.multiply(prepared.cost).multiply(prepared.gst)
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        prepared.net = prepared.qty.multiply(prepared.cost).add(tax).setScale(3, RoundingMode.HALF_UP);
        return prepared;
    }

    private PurchaseRow mapPurchase(java.sql.ResultSet rs) throws java.sql.SQLException {
        PurchaseRow row = new PurchaseRow();
        row.setId(rs.getLong("id"));
        row.setPrNo(rs.getString("pr_no"));
        row.setSupplierName(rs.getString("supplier_name"));
        row.setPoNo(rs.getString("po_no"));
        row.setInvoiceNo(rs.getString("invoice_no"));
        row.setInvoiceDate(rs.getDate("invoice_date").toLocalDate().toString());
        row.setNetTotal(rs.getDouble("net_total"));
        return row;
    }

    private List<PurchaseItemRow> purchaseItems(Long purchaseId) {
        return jdbcTemplate.query(
                "SELECT i.id, i.medicine_id, m.name AS medicine_name, i.batch_id, b.name AS batch_name, " +
                        "i.qty, i.cost, i.gst, IFNULL(s.qty, 0) AS stock_qty, " +
                        "IFNULL((SELECT SUM(ri.qty) FROM purchase_return_item ri WHERE ri.purchase_item_id = i.id), 0) AS returned_qty " +
                        "FROM purchase_item i JOIN medicine m ON m.id = i.medicine_id JOIN batch b ON b.id = i.batch_id " +
                        "LEFT JOIN stock s ON s.batch_id = i.batch_id WHERE i.purchase_id = ? ORDER BY i.id",
                (rs, i) -> {
                    PurchaseItemRow row = new PurchaseItemRow();
                    row.setId(rs.getLong("id"));
                    row.setMedicineId(rs.getLong("medicine_id"));
                    row.setMedicineName(rs.getString("medicine_name"));
                    row.setBatchId(rs.getLong("batch_id"));
                    row.setBatchName(rs.getString("batch_name"));
                    row.setQty(rs.getDouble("qty"));
                    row.setReturnedQty(rs.getDouble("returned_qty"));
                    row.setStockQty(rs.getDouble("stock_qty"));
                    row.setCost(rs.getDouble("cost"));
                    row.setGst(rs.getDouble("gst"));
                    return row;
                },
                purchaseId
        );
    }

    private void moveStock(long batchId, long medicineId, LocalDate date, String type, String ref, BigDecimal qtyIn, BigDecimal qtyOut) {
        BigDecimal current = jdbcTemplate.query(
                "SELECT qty FROM stock WHERE batch_id = ? FOR UPDATE",
                rs -> rs.next() ? rs.getBigDecimal(1) : null,
                batchId
        );
        BigDecimal balance = (current == null ? BigDecimal.ZERO : current).add(qtyIn).subtract(qtyOut);
        if (balance.signum() < 0) {
            throw new RuntimeException("Not enough stock to return");
        }
        balance = balance.setScale(3, RoundingMode.HALF_UP);
        if (current == null) {
            jdbcTemplate.update("INSERT INTO stock (batch_id, qty) VALUES (?, ?)", batchId, balance);
        } else {
            jdbcTemplate.update("UPDATE stock SET qty = ? WHERE batch_id = ?", balance, batchId);
        }
        jdbcTemplate.update(
                "INSERT INTO stock_transaction (batch_id, medicine_id, txn_date, txn_type, ref_no, qty_in, qty_out, balance_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                batchId, medicineId, Date.valueOf(date), type, ref, qtyIn, qtyOut, balance
        );
    }

    private List<PoItemRow> orderItems(Long poId) {
        return jdbcTemplate.query(
                "SELECT i.id, i.medicine_id, m.name AS medicine_name, i.qty, i.received_qty, i.cost " +
                        "FROM purchase_order_item i JOIN medicine m ON m.id = i.medicine_id WHERE i.po_id = ? ORDER BY i.id",
                (rs, i) -> {
                    PoItemRow row = new PoItemRow();
                    row.setId(rs.getLong("id"));
                    row.setMedicineId(rs.getLong("medicine_id"));
                    row.setMedicineName(rs.getString("medicine_name"));
                    row.setQty(rs.getDouble("qty"));
                    row.setReceivedQty(rs.getDouble("received_qty"));
                    row.setCost(rs.getDouble("cost"));
                    return row;
                },
                poId
        );
    }

    private PoRow mapOrder(java.sql.ResultSet rs) throws java.sql.SQLException {
        PoRow row = new PoRow();
        row.setId(rs.getLong("id"));
        row.setPoNo(rs.getString("po_no"));
        row.setSupplierId(rs.getLong("supplier_id"));
        row.setSupplierName(rs.getString("supplier_name"));
        row.setPoDate(rs.getDate("po_date").toLocalDate().toString());
        row.setStatus(rs.getInt("status"));
        row.setNote(nz(rs.getString("note")));
        return row;
    }

    private long insert(String sql, Object... args) {
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                if (args[i] == null) {
                    ps.setNull(i + 1, Types.BIGINT);
                } else {
                    ps.setObject(i + 1, args[i]);
                }
            }
            return ps;
        }, keys);
        Number key = keys.getKey();
        if (key == null) {
            throw new RuntimeException("Could not save");
        }
        return key.longValue();
    }

    private long requireActive(String table, Long id, String message) {
        if (id == null || id <= 0) {
            throw new RuntimeException(message);
        }
        Integer active = jdbcTemplate.query(
                "SELECT is_active FROM " + table + " WHERE id = ?",
                rs -> rs.next() ? rs.getInt(1) : null,
                id
        );
        if (active == null) {
            throw new RuntimeException(message);
        }
        if (active != 1) {
            throw new RuntimeException("Selected item is blocked. Unblock it in master first.");
        }
        return id;
    }

    private LocalDate[] dateRange(String from, String to) {
        LocalDate fromDate = parseDate(from, "From date");
        LocalDate toDate = parseDate(to, "To date");
        if (fromDate.isAfter(toDate)) {
            throw new RuntimeException("From date cannot be after to date");
        }
        return new LocalDate[]{fromDate, toDate};
    }

    private LocalDate parseDate(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(label + " is required");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException(label + " is invalid");
        }
    }

    private BigDecimal qty(Double value, String label) {
        if (value == null || value <= 0 || !Double.isFinite(value)) {
            throw new RuntimeException(label + " must be more than zero");
        }
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal qtyOrZero(Double value, String label) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        }
        if (value < 0 || !Double.isFinite(value)) {
            throw new RuntimeException(label + " must be zero or more");
        }
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal money(Double value, String label) {
        if (value == null || value < 0 || !Double.isFinite(value)) {
            throw new RuntimeException(label + " must be zero or more");
        }
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal percent(Double value, String label) {
        if (value == null || value < 0 || value > 100 || !Double.isFinite(value)) {
            throw new RuntimeException(label + " must be between 0 and 100");
        }
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String required(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(message);
        }
        return value.trim();
    }

    private String trim(String value, int max) {
        String text = value == null ? "" : value.trim();
        if (text.length() > max) {
            throw new RuntimeException("Note must be " + max + " characters or less");
        }
        return text;
    }

    private String nz(String value) {
        return value == null ? "" : value;
    }

    private static class PreparedLine {
        private long itemId;
        private long medicineId;
        private long batchId;
        private String batchName;
        private LocalDate expiry;
        private BigDecimal qty;
        private BigDecimal freeQty;
        private BigDecimal cost;
        private BigDecimal mrp;
        private BigDecimal gst;
        private BigDecimal discPer;
        private BigDecimal net;
    }

    private static class PreparedReturn {
        private long itemId;
        private long medicineId;
        private long batchId;
        private BigDecimal qty;
        private BigDecimal cost;
        private BigDecimal gst;
        private BigDecimal net;
    }
}
