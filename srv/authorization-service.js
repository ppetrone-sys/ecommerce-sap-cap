const cds = require("@sap/cds/libx/_runtime/cds")
const BaseService = require("./base-service");

const ROLES = {
    ADMIN: "Admin",
    INVENTORY_MANAGER: "InventoryManager",
    SALES_MANAGER: "SalesManager",
    STORE_SUPERVISOR: "StoreSupervisor"
};

class AuthorizationService extends BaseService {
    init() {
        this.logger = cds.log("user")
        this.on("isAdmin", this.isAdmin)
        this.on("userRoles", this.getUserRoles)
        return super.init()
    }

    /**
     * Checks if the user has the admin role.
     */
    isAdmin = async (req) => {
        return req.user.is(ROLES.ADMIN);
    }

    /**
     * Retrieves all roles assigned to the logged-in user.
     * @param {Object} req - The incoming request object.
     * @returns {Array<string>} An array of roles assigned to the user.
     */
    getUserRoles = async (req) => {
        if (!req.user || !req.user.roles) {
            return [];
        }

        return Object.keys(req.user.roles).filter(role => req.user.roles[role] === 1 || req.user.roles[role] === true);
    };
}
module.exports = AuthorizationService