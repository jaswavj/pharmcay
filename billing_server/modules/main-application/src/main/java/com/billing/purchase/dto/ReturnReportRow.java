package com.billing.purchase.dto;

import lombok.Data;

@Data
public class ReturnReportRow {
    private String returnDate;
    private String retNo;
    private String supplierName;
    private String prNo;
    private String medicineName;
    private String batchName;
    private Double qty;
    private Double cost;
    private Double gst;
    private Double netTotal;
}
