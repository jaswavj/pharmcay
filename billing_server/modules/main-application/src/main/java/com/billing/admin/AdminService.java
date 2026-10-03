package com.billing.admin;

import com.billing.admin.dto.CompanyDetailsData;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        ensureBillingTypeColumn();
    }

    public CompanyDetailsData company() {
        List<CompanyDetailsData> rows = jdbcTemplate.query(
                "SELECT id, shop_name, address, gstin, print_type, IFNULL(billing_type, 1) AS billing_type, printer_name, bank_details, barcode_printer FROM company_details LIMIT 1",
                (rs, i) -> {
                    CompanyDetailsData data = new CompanyDetailsData();
                    data.setId(rs.getLong("id"));
                    data.setShopName(nz(rs.getString("shop_name")));
                    data.setAddress(nz(rs.getString("address")));
                    data.setGstin(nz(rs.getString("gstin")));
                    data.setPrintType(rs.getInt("print_type"));
                    data.setBillingType(normalizeBillingType(rs.getInt("billing_type")));
                    data.setPrinterName(nz(rs.getString("printer_name")));
                    data.setBankDetails(nz(rs.getString("bank_details")));
                    data.setBarcodePrinter(nz(rs.getString("barcode_printer")));
                    return data;
                }
        );
        if (rows.isEmpty()) {
            CompanyDetailsData empty = new CompanyDetailsData();
            empty.setPrintType(1);
            empty.setBillingType(1);
            empty.setShopName("");
            empty.setAddress("");
            empty.setGstin("");
            empty.setPrinterName("");
            empty.setBankDetails("");
            empty.setBarcodePrinter("");
            return empty;
        }
        return rows.get(0);
    }

    @Transactional
    public void saveCompany(CompanyDetailsData request) {
        String shopName = required(request.getShopName(), "Please fill all required fields");
        String address = required(request.getAddress(), "Please fill all required fields");
        int printType = request.getPrintType() == null ? 1 : request.getPrintType();
        if (printType != 1 && printType != 2) {
            throw new RuntimeException("Invalid print type");
        }
        String printerName = nz(request.getPrinterName()).trim();
        if (printType == 1 && printerName.isEmpty()) {
            throw new RuntimeException("Printer name is required for thermal printing");
        }
        String gstin = nz(request.getGstin()).trim().toUpperCase();
        if (!gstin.isEmpty() && gstin.length() != 15) {
            throw new RuntimeException("GSTIN must be 15 characters");
        }
        String bankDetails = nz(request.getBankDetails()).trim();
        String barcodePrinter = nz(request.getBarcodePrinter()).trim();
        int billingType = normalizeBillingType(request.getBillingType());
        Long id = jdbcTemplate.query("SELECT id FROM company_details LIMIT 1", rs -> rs.next() ? rs.getLong(1) : null);
        if (id != null) {
            jdbcTemplate.update(
                    "UPDATE company_details SET shop_name=?, address=?, gstin=?, print_type=?, billing_type=?, printer_name=?, bank_details=?, barcode_printer=? WHERE id=?",
                    shopName, address, gstin, printType, billingType, printerName, bankDetails, barcodePrinter, id
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO company_details (shop_name, address, gstin, print_type, billing_type, printer_name, bank_details, barcode_printer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    shopName, address, gstin, printType, billingType, printerName, bankDetails, barcodePrinter
            );
        }
    }

    private void ensureBillingTypeColumn() {
        try {
            Integer found = jdbcTemplate.query(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company_details' AND COLUMN_NAME = 'billing_type'",
                    rs -> rs.next() ? rs.getInt(1) : 0
            );
            if (found == null || found == 0) {
                jdbcTemplate.execute("ALTER TABLE company_details ADD COLUMN billing_type INT NOT NULL DEFAULT 1");
            }
        } catch (Exception ignored) {
            // existing databases keep Type (1) until the column can be added
        }
    }

    private int normalizeBillingType(Integer billingType) {
        return billingType != null && billingType == 2 ? 2 : 1;
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
