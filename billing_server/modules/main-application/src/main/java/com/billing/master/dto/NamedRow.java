package com.billing.master.dto;

import lombok.Data;

@Data
public class NamedRow {
    private Long id;
    private String name;
    private Integer isActive;
}
