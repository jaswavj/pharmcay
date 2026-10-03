package com.billing.users;

import com.billing.users.dto.ChangePasswordRequest;
import com.billing.users.dto.CreateUserRequest;
import com.billing.users.dto.ModuleData;
import com.billing.users.dto.PermissionUpdateRequest;
import com.billing.users.dto.UserOptionData;
import com.billing.users.dto.UserPermissionsData;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public List<ModuleData> modules() {
        return jdbcTemplate.query(
                "SELECT id, module_name FROM user_modules ORDER BY id",
                (rs, i) -> {
                    ModuleData row = new ModuleData();
                    row.setId(rs.getLong("id"));
                    row.setName(rs.getString("module_name"));
                    return row;
                }
        );
    }

    public List<UserOptionData> users() {
        return jdbcTemplate.query(
                "SELECT id, user_name, IFNULL(fullName,'') AS fullName " +
                        "FROM users WHERE is_active = 1 ORDER BY fullName, user_name",
                (rs, i) -> mapUserOption(rs.getLong("id"), rs.getString("user_name"), rs.getString("fullName"))
        );
    }

    @Transactional
    public void createUser(CreateUserRequest request) {
        String fullName = required(request.getFullName(), "Full name is required");
        String userName = required(request.getUserName(), "Username is required");
        String password = required(request.getPassword(), "Password is required");
        Integer existing = jdbcTemplate.query(
                "SELECT id FROM users WHERE user_name = ?",
                rs -> rs.next() ? rs.getInt(1) : 0,
                userName
        );
        if (existing != null && existing > 0) {
            throw new RuntimeException("Username already exists!");
        }
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO users(user_name, password, is_active, fullName) VALUES (?, ?, 1, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, userName);
            ps.setString(2, passwordEncoder.encode(password));
            ps.setString(3, fullName);
            return ps;
        }, keys);
        Number key = keys.getKey();
        if (key == null) {
            throw new RuntimeException("Failed to create user");
        }
        long uid = key.longValue();
        saveModulePermissions(uid, request.getModuleIds());
    }

    public UserPermissionsData modulePermissions(Long userId) {
        UserPermissionsData data = new UserPermissionsData();
        data.setUserId(userId);
        data.setName(userDisplayName(userId));
        data.setAll(modules());
        data.setSelectedIds(jdbcTemplate.query(
                "SELECT module_id FROM user_permission WHERE uid = ?",
                (rs, i) -> rs.getLong(1),
                userId
        ));
        return data;
    }

    @Transactional
    public void updateModulePermissions(Long userId, PermissionUpdateRequest request) {
        requireUser(userId);
        jdbcTemplate.update("DELETE FROM user_permission WHERE uid = ?", userId);
        saveModulePermissions(userId, request == null ? null : request.getIds());
    }

    @Transactional
    public void changePassword(Long uid, ChangePasswordRequest request) {
        if (request == null) {
            throw new RuntimeException("Missing required parameters.");
        }
        String oldPassword = required(request.getOldPassword(), "Existing password is required");
        String newPassword = required(request.getNewPassword(), "New password is required");
        String confirm = request.getConfirmPassword() == null ? "" : request.getConfirmPassword();
        if (oldPassword.equals(newPassword)) {
            throw new RuntimeException("Old password and new password should not match!");
        }
        if (!confirm.equals(newPassword)) {
            throw new RuntimeException("New password and confirm password should match!");
        }
        List<String> rows = jdbcTemplate.query(
                "SELECT password FROM users WHERE id = ? AND is_active = 1",
                (rs, i) -> rs.getString(1),
                uid
        );
        if (rows.isEmpty() || !passwordEncoder.matches(oldPassword, rows.get(0))) {
            throw new RuntimeException("Your existing password is wrong!");
        }
        jdbcTemplate.update("UPDATE users SET password = ? WHERE id = ?", passwordEncoder.encode(newPassword), uid);
    }

    private void saveModulePermissions(Long uid, List<Long> moduleIds) {
        if (moduleIds == null) {
            return;
        }
        for (Long moduleId : moduleIds) {
            if (moduleId == null) {
                continue;
            }
            jdbcTemplate.update(
                    "INSERT INTO user_permission (uid, module_id, date, time) VALUES (?, ?, NOW(), NOW())",
                    uid, moduleId
            );
        }
    }

    private void requireUser(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ?",
                Integer.class,
                userId
        );
        if (count == null || count == 0) {
            throw new RuntimeException("User not found");
        }
    }

    private String userDisplayName(Long userId) {
        List<UserOptionData> rows = jdbcTemplate.query(
                "SELECT id, user_name, IFNULL(fullName,'') AS fullName FROM users WHERE id = ?",
                (rs, i) -> mapUserOption(rs.getLong("id"), rs.getString("user_name"), rs.getString("fullName")),
                userId
        );
        if (rows.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        return rows.get(0).getName();
    }

    private UserOptionData mapUserOption(Long id, String userName, String fullName) {
        UserOptionData row = new UserOptionData();
        row.setId(id);
        row.setUserName(userName);
        row.setFullName(fullName);
        String display = fullName == null || fullName.isBlank()
                ? userName
                : fullName + " (" + userName + ")";
        row.setName(display);
        return row;
    }

    private String required(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(message);
        }
        return value.trim();
    }
}
