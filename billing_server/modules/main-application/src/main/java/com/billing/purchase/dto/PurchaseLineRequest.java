package com.billing.purchase.dto;

import lombok.Data;

@Data
public class PurchaseLineRequest {
    private Long poItemId;
    private Long medicineId;
    private Long batchId;
    private String batchName;
    private String expiryDate;
    private Double qty;
    private Double freeQty;
    private Double cost;
    private Double mrp;
    private Double gst;
    private Double discPer;
}
