package com.example.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AuthorizationService extends BaseService {

    private static final String ADMIN = "Admin";

    @Override
    public void init() {
        this.on("isAdmin", this::isAdmin);
        this.on("userRoles", this::getUserRoles);
    }

    public boolean isAdmin(Request req) {
        return req.getUser().is(ADMIN);
    }

    public List<String> getUserRoles(Request req) {
        if (req.getUser() == null || req.getUser().getRoles() == null) {
            return new ArrayList<>();
        }

        Map<String, Object> roles = req.getUser().getRoles();
        List<String> userRoles = new ArrayList<>();
        for (Map.Entry<String, Object> role : roles.entrySet()) {
            if (Boolean.TRUE.equals(role.getValue()) || "1".equals(role.getValue().toString())) {
                userRoles.add(role.getKey());
            }
        }
        return userRoles;
    }
}
