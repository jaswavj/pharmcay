package com.billing.admin;

import com.billing.admin.dto.CompanyDetailsData;
import com.billing.core.response.ResponseDO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/company")
    public ResponseDO company() {
        return ok(adminService.company());
    }

    @PostMapping("/company")
    public ResponseDO saveCompany(@RequestBody CompanyDetailsData request) {
        adminService.saveCompany(request);
        return ok(true);
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
