package com.billing.purchase.dto;

import lombok.Data;

@Data
public class PurchaseReportRow {
    private String invoiceDate;
    private String prNo;
    private String supplierName;
    private String invoiceNo;
    private String medicineName;
    private String batchName;
    private Double qty;
    private Double cost;
    private Double gst;
    private Double netTotal;
}
