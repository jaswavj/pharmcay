package com.billing.purchase.dto;

import lombok.Data;

@Data
public class PoLineRequest {
    private Long medicineId;
    private Double qty;
    private Double cost;
}
