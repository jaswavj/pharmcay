package com.billing.master.dto;

import lombok.Data;

@Data
public class MedicineRow {
    private Long id;
    private Long genericId;
    private String genericName;
    private String name;
    private Long typeId;
    private String typeName;
    private String hsnCode;
    private Long unitId;
    private String unitName;
    private Integer discType;
    private Double discount;
    private Integer isActive;
}
