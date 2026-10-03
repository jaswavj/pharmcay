package com.billing.master.dto;

import lombok.Data;

@Data
public class BatchRow {
    private Long id;
    private Long medicineId;
    private String name;
    private String expiryDate;
    private Double cost;
    private Double mrp;
    private Double gst;
    private Integer isActive;
}
