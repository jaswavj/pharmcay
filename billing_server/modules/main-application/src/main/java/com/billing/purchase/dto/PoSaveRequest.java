package com.billing.purchase.dto;

import lombok.Data;

import java.util.List;

@Data
public class PoSaveRequest {
    private Long supplierId;
    private String poDate;
    private String note;
    private List<PoLineRequest> lines;
}
