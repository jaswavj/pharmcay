package com.billing.purchase.dto;

import lombok.Data;

@Data
public class SupplierPurchaseRow {
    private String supplierName;
    private Integer billCount;
    private Double qty;
    private Double netTotal;
}
