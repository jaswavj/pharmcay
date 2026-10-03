package com.billing.purchase.dto;

import lombok.Data;

@Data
public class PoItemRow {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private Double qty;
    private Double receivedQty;
    private Double cost;
}
