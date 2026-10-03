package com.billing.master;

import com.billing.master.dto.BatchRow;
import com.billing.master.dto.BatchSaveRequest;
import com.billing.master.dto.MedicineRow;
import com.billing.master.dto.MedicineSaveRequest;
import com.billing.master.dto.NamedRow;
import com.billing.master.dto.NamedSaveRequest;
import com.billing.master.dto.SupplierRow;
import com.billing.master.dto.SupplierSaveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MasterService {

    private static final Map<String, String> NAMED_TABLES = Map.of(
            "types", "medicine_type",
            "units", "unit",
            "generics", "generic_name"
    );

    private final JdbcTemplate jdbcTemplate;

    public List<NamedRow> namedList(String kind) {
        String table = table(kind);
        return jdbcTemplate.query(
                "SELECT id, name, is_active FROM " + table + " ORDER BY name",
                (rs, i) -> {
                    NamedRow row = new NamedRow();
                    row.setId(rs.getLong("id"));
                    row.setName(rs.getString("name"));
                    row.setIsActive(rs.getInt("is_active"));
                    return row;
                }
        );
    }

    @Transactional
    public void saveNamed(String kind, NamedSaveRequest request) {
        String table = table(kind);
        String name = required(request == null ? null : request.getName(), "Name is required");
        Long id = request.getId();
        Integer duplicate = jdbcTemplate.query(
                "SELECT id FROM " + table + " WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1",
                rs -> rs.next() ? rs.getInt(1) : 0,
                name, id == null ? 0 : id
        );
        if (duplicate != null && duplicate > 0) {
            throw new RuntimeException("Name already exists");
        }
        if (id != null && id > 0) {
            int updated = jdbcTemplate.update("UPDATE " + table + " SET name = ? WHERE id = ?", name, id);
            if (updated == 0) {
                throw new RuntimeException("Record not found");
            }
            return;
        }
        jdbcTemplate.update("INSERT INTO " + table + " (name, is_active) VALUES (?, 1)", name);
    }

    @Transactional
    public void setNamedActive(String kind, Long id, boolean active) {
        String table = table(kind);
        int updated = jdbcTemplate.update("UPDATE " + table + " SET is_active = ? WHERE id = ?", active ? 1 : 0, id);
        if (updated == 0) {
            throw new RuntimeException("Record not found");
        }
    }

    public Map<String, List<NamedRow>> lookups() {
        return Map.of(
                "types", namedList("types"),
                "units", namedList("units"),
                "generics", namedList("generics")
        );
    }

    public List<MedicineRow> medicines() {
        return jdbcTemplate.query(
                "SELECT m.id, m.generic_id, g.name AS generic_name, m.name, m.type_id, t.name AS type_name, " +
                        "m.hsn_code, m.unit_id, u.name AS unit_name, m.disc_type, m.discount, m.is_active " +
                        "FROM medicine m " +
                        "JOIN generic_name g ON g.id = m.generic_id " +
                        "JOIN medicine_type t ON t.id = m.type_id " +
                        "JOIN unit u ON u.id = m.unit_id " +
                        "ORDER BY m.name",
                (rs, i) -> {
                    MedicineRow row = new MedicineRow();
                    row.setId(rs.getLong("id"));
                    row.setGenericId(rs.getLong("generic_id"));
                    row.setGenericName(rs.getString("generic_name"));
                    row.setName(rs.getString("name"));
                    row.setTypeId(rs.getLong("type_id"));
                    row.setTypeName(rs.getString("type_name"));
                    row.setHsnCode(nz(rs.getString("hsn_code")));
                    row.setUnitId(rs.getLong("unit_id"));
                    row.setUnitName(rs.getString("unit_name"));
                    row.setDiscType(rs.getInt("disc_type") == 1 ? 1 : 2);
                    row.setDiscount(rs.getDouble("discount"));
                    row.setIsActive(rs.getInt("is_active"));
                    return row;
                }
        );
    }

    @Transactional
    public void saveMedicine(MedicineSaveRequest request) {
        if (request == null) {
            throw new RuntimeException("Medicine details are required");
        }
        String name = required(request.getName(), "Medicine name is required");
        long genericId = requireActive("generic_name", request.getGenericId(), "Select a generic name");
        long typeId = requireActive("medicine_type", request.getTypeId(), "Select a medicine type");
        long unitId = requireActive("unit", request.getUnitId(), "Select a unit");
        String hsn = request.getHsnCode() == null ? "" : request.getHsnCode().trim();
        if (hsn.length() > 20) {
            throw new RuntimeException("HSN code must be 20 characters or less");
        }
        int discType = request.getDiscType() != null && request.getDiscType() == 1 ? 1 : 2;
        BigDecimal discount = money(request.getDiscount() == null ? 0 : request.getDiscount(), "Discount");
        if (discType == 2 && discount.doubleValue() > 100) {
            throw new RuntimeException("Discount percent cannot be more than 100");
        }
        Long id = request.getId();
        Integer duplicate = jdbcTemplate.query(
                "SELECT id FROM medicine WHERE LOWER(name) = LOWER(?) AND generic_id = ? AND id <> ? LIMIT 1",
                rs -> rs.next() ? rs.getInt(1) : 0,
                name, genericId, id == null ? 0 : id
        );
        if (duplicate != null && duplicate > 0) {
            throw new RuntimeException("This medicine already exists for the selected generic");
        }
        if (id != null && id > 0) {
            int updated = jdbcTemplate.update(
                    "UPDATE medicine SET generic_id=?, name=?, type_id=?, hsn_code=?, unit_id=?, disc_type=?, discount=? WHERE id=?",
                    genericId, name, typeId, hsn, unitId, discType, discount, id
            );
            if (updated == 0) {
                throw new RuntimeException("Medicine not found");
            }
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO medicine (generic_id, name, type_id, hsn_code, unit_id, disc_type, discount, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
                genericId, name, typeId, hsn, unitId, discType, discount
        );
    }

    @Transactional
    public void setMedicineActive(Long id, boolean active) {
        int updated = jdbcTemplate.update("UPDATE medicine SET is_active = ? WHERE id = ?", active ? 1 : 0, id);
        if (updated == 0) {
            throw new RuntimeException("Medicine not found");
        }
    }

    public List<BatchRow> batches(Long medicineId) {
        if (medicineId == null || medicineId <= 0) {
            throw new RuntimeException("Select a medicine");
        }
        return jdbcTemplate.query(
                "SELECT id, medicine_id, name, expiry_date, cost, mrp, gst, is_active FROM batch WHERE medicine_id = ? ORDER BY expiry_date, name",
                (rs, i) -> {
                    BatchRow row = new BatchRow();
                    row.setId(rs.getLong("id"));
                    row.setMedicineId(rs.getLong("medicine_id"));
                    row.setName(rs.getString("name"));
                    row.setExpiryDate(rs.getDate("expiry_date").toLocalDate().toString());
                    row.setCost(rs.getDouble("cost"));
                    row.setMrp(rs.getDouble("mrp"));
                    row.setGst(rs.getDouble("gst"));
                    row.setIsActive(rs.getInt("is_active"));
                    return row;
                },
                medicineId
        );
    }

    @Transactional
    public void saveBatch(BatchSaveRequest request) {
        if (request == null) {
            throw new RuntimeException("Batch details are required");
        }
        long medicineId = requireActive("medicine", request.getMedicineId(), "Select a medicine");
        String name = required(request.getName(), "Batch name is required");
        LocalDate expiry = parseDate(request.getExpiryDate());
        BigDecimal cost = money(request.getCost(), "Cost");
        BigDecimal mrp = money(request.getMrp(), "MRP");
        BigDecimal gst = percent(request.getGst(), "GST");
        Long id = request.getId();
        Integer duplicate = jdbcTemplate.query(
                "SELECT id FROM batch WHERE medicine_id = ? AND LOWER(name) = LOWER(?) AND id <> ? LIMIT 1",
                rs -> rs.next() ? rs.getInt(1) : 0,
                medicineId, name, id == null ? 0 : id
        );
        if (duplicate != null && duplicate > 0) {
            throw new RuntimeException("Batch name already exists for this medicine");
        }
        if (id != null && id > 0) {
            int updated = jdbcTemplate.update(
                    "UPDATE batch SET medicine_id=?, name=?, expiry_date=?, cost=?, mrp=?, gst=? WHERE id=?",
                    medicineId, name, expiry, cost, mrp, gst, id
            );
            if (updated == 0) {
                throw new RuntimeException("Batch not found");
            }
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO batch (medicine_id, name, expiry_date, cost, mrp, gst, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                medicineId, name, expiry, cost, mrp, gst
        );
    }

    @Transactional
    public void setBatchActive(Long id, boolean active) {
        int updated = jdbcTemplate.update("UPDATE batch SET is_active = ? WHERE id = ?", active ? 1 : 0, id);
        if (updated == 0) {
            throw new RuntimeException("Batch not found");
        }
    }

    public List<SupplierRow> suppliers() {
        return jdbcTemplate.query(
                "SELECT id, name, phone, address, is_active FROM supplier ORDER BY name",
                (rs, i) -> {
                    SupplierRow row = new SupplierRow();
                    row.setId(rs.getLong("id"));
                    row.setName(rs.getString("name"));
                    row.setPhone(nz(rs.getString("phone")));
                    row.setAddress(nz(rs.getString("address")));
                    row.setIsActive(rs.getInt("is_active"));
                    return row;
                }
        );
    }

    @Transactional
    public void saveSupplier(SupplierSaveRequest request) {
        if (request == null) {
            throw new RuntimeException("Supplier details are required");
        }
        String name = required(request.getName(), "Name is required");
        String phone = request.getPhone() == null ? "" : request.getPhone().trim();
        String address = request.getAddress() == null ? "" : request.getAddress().trim();
        if (phone.length() > 20) {
            throw new RuntimeException("Phone number must be 20 characters or less");
        }
        if (address.length() > 500) {
            throw new RuntimeException("Address must be 500 characters or less");
        }
        Long id = request.getId();
        Integer duplicate = jdbcTemplate.query(
                "SELECT id FROM supplier WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1",
                rs -> rs.next() ? rs.getInt(1) : 0,
                name, id == null ? 0 : id
        );
        if (duplicate != null && duplicate > 0) {
            throw new RuntimeException("Name already exists");
        }
        if (id != null && id > 0) {
            int updated = jdbcTemplate.update(
                    "UPDATE supplier SET name = ?, phone = ?, address = ? WHERE id = ?",
                    name, phone, address, id
            );
            if (updated == 0) {
                throw new RuntimeException("Supplier not found");
            }
            return;
        }
        jdbcTemplate.update("INSERT INTO supplier (name, phone, address, is_active) VALUES (?, ?, ?, 1)", name, phone, address);
    }

    @Transactional
    public void setSupplierActive(Long id, boolean active) {
        int updated = jdbcTemplate.update("UPDATE supplier SET is_active = ? WHERE id = ?", active ? 1 : 0, id);
        if (updated == 0) {
            throw new RuntimeException("Supplier not found");
        }
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

    private String table(String kind) {
        String table = NAMED_TABLES.get(kind);
        if (table == null) {
            throw new RuntimeException("Unknown master");
        }
        return table;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException("Expiry date is required");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Expiry date is invalid");
        }
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

    private String nz(String value) {
        return value == null ? "" : value;
    }
}
