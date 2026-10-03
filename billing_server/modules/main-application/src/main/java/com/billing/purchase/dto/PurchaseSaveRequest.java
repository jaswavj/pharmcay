package com.billing.purchase.dto;

import lombok.Data;

import java.util.List;

@Data
public class PurchaseSaveRequest {
    private Long supplierId;
    private Long poId;
    private String invoiceNo;
    private String invoiceDate;
    private List<PurchaseLineRequest> lines;
}
