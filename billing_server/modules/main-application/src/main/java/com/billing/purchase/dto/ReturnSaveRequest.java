package com.billing.purchase.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReturnSaveRequest {
    private Long purchaseId;
    private String returnDate;
    private String note;
    private List<ReturnLineRequest> lines;
}
