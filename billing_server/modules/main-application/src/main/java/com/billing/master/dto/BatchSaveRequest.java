package com.billing.master.dto;

import lombok.Data;

@Data
public class BatchSaveRequest {
    private Long id;
    private Long medicineId;
    private String name;
    private String expiryDate;
    private Double cost;
    private Double mrp;
    private Double gst;
}
