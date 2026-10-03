package com.billing.purchase.dto;

import lombok.Data;

@Data
public class ReturnLineRequest {
    private Long purchaseItemId;
    private Double qty;
}
