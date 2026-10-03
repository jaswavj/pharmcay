package com.billing.master.dto;

import lombok.Data;

@Data
public class SupplierRow {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private Integer isActive;
}
