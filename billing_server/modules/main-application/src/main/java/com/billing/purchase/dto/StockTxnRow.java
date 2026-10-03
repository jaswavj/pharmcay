package com.billing.purchase.dto;

import lombok.Data;

@Data
public class StockTxnRow {
    private String txnDate;
    private String txnType;
    private String refNo;
    private String medicineName;
    private String batchName;
    private Double qtyIn;
    private Double qtyOut;
    private Double balanceQty;
}
