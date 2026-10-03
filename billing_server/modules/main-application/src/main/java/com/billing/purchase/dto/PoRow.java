package com.billing.purchase.dto;

import lombok.Data;

import java.util.List;

@Data
public class PoRow {
    private Long id;
    private String poNo;
    private Long supplierId;
    private String supplierName;
    private String poDate;
    private Integer status;
    private String note;
    private Double orderedQty;
    private Double receivedQty;
    private List<PoItemRow> items;
}
