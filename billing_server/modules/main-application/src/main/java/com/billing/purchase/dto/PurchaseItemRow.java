package com.billing.purchase.dto;

import lombok.Data;

@Data
public class PurchaseItemRow {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private Long batchId;
    private String batchName;
    private Double qty;
    private Double returnedQty;
    private Double stockQty;
    private Double cost;
    private Double gst;
}
