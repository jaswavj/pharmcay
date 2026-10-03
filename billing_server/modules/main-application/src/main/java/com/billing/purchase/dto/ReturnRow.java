package com.billing.purchase.dto;

import lombok.Data;

@Data
public class ReturnRow {
    private Long id;
    private String retNo;
    private String supplierName;
    private String returnDate;
    private String note;
    private Double netTotal;
}
