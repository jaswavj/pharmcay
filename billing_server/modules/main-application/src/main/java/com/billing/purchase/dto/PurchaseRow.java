package com.billing.purchase.dto;

import lombok.Data;

import java.util.List;

@Data
public class PurchaseRow {
    private Long id;
    private String prNo;
    private String supplierName;
    private String poNo;
    private String invoiceNo;
    private String invoiceDate;
    private Double netTotal;
    private List<PurchaseItemRow> items;
}
