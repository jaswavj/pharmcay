package com.billing.purchase.dto;

import lombok.Data;

@Data
public class StockRow {
    private Long batchId;
    private String medicineName;
    private String batchName;
    private String expiryDate;
    private Double qty;
    private Double cost;
    private Double mrp;
}
