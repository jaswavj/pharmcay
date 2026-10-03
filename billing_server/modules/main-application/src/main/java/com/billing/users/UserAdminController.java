package com.billing.users;

import com.billing.core.response.ResponseDO;
import com.billing.security.PlatformSecurityContext;
import com.billing.users.dto.ChangePasswordRequest;
import com.billing.users.dto.CreateUserRequest;
import com.billing.users.dto.PermissionUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserAdminController {

    private final UserAdminService userAdminService;
    private final PlatformSecurityContext securityContext;

    @GetMapping("/modules")
    public ResponseDO modules() {
        return ok(userAdminService.modules());
    }

    @GetMapping("/list")
    public ResponseDO users() {
        return ok(userAdminService.users());
    }

    @PostMapping
    public ResponseDO createUser(@RequestBody CreateUserRequest request) {
        userAdminService.createUser(request);
        return ok(true);
    }

    @GetMapping("/{id}/permissions")
    public ResponseDO modulePermissions(@PathVariable Long id) {
        return ok(userAdminService.modulePermissions(id));
    }

    @PostMapping("/{id}/permissions")
    public ResponseDO updateModulePermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        userAdminService.updateModulePermissions(id, request);
        return ok(true);
    }

    @PostMapping("/change-password")
    public ResponseDO changePassword(@RequestBody ChangePasswordRequest request) {
        userAdminService.changePassword(currentUserId(), request);
        return ok(true);
    }

    private Long currentUserId() {
        return securityContext.authenticateUser().getId();
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
