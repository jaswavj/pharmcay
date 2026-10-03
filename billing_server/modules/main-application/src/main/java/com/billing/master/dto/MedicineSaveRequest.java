package com.billing.master.dto;

import lombok.Data;

@Data
public class MedicineSaveRequest {
    private Long id;
    private Long genericId;
    private String name;
    private Long typeId;
    private String hsnCode;
    private Long unitId;
    private Integer discType;
    private Double discount;
}
