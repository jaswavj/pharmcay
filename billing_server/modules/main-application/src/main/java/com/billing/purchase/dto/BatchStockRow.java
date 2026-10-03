package com.billing.purchase.dto;

import lombok.Data;

@Data
public class BatchStockRow {
    private Long id;
    private String name;
    private String expiryDate;
    private Double cost;
    private Double mrp;
    private Double gst;
    private Double qty;
}
