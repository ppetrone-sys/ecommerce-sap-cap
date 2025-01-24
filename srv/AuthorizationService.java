package com.example.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AuthorizationService extends BaseService {

    private static final String ADMIN = "Admin";
    private static final String INVENTORY_MANAGER = "InventoryManager";
    private static final String SALES_MANAGER = "SalesManager";
    private static final String STORE_SUPERVISOR = "StoreSupervisor";

    @Override
    public void init() {
        this.on("isAdmin", this::isAdmin);
        this.on("InventoryManager", this::isAdmin);
        this.on("SalesManager", this::isAdmin);
        this.on("StoreSupervisor", this::isAdmin);
        this.on("userRoles", this::getUserRoles);
    }

    public boolean isAdmin(Request req) {
        return req.getUser().is(ADMIN);
    }

    public boolean isInventoryManager(Request req) {
        return req.getUser().is(INVENTORY_MANAGER);
    }

    public boolean isSalesManager(Request req) {
    	System.out.println("User: " + req.getUser().getId() + " accessing liek as sales manager" );
        if (!isTrustedIp(req.getIp())) {
            return false; // Reject if the IP is not trusted
        }
        return req.getUser().is(SALES_MANAGER);
    }
    
    private boolean isTrustedIp(String ip) {
        // Example logic for trusted IP check
        List<String> trustedIps = List.of("192.168.1.1", "192.168.1.2");
        return trustedIps.contains(ip);
    }

    public boolean isStoreSupervisor(Request req) {
        return req.getUser().is(STORE_SUPERVISOR);
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
