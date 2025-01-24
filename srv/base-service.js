const cds = require("@sap/cds");
const SecurityHelper = require('./src/helpers/security-helper');
const { DatabaseError } = require("./src/errors/db-errors");

class BaseService extends cds.ApplicationService {

    init() {
        this.before("*", async (req) => {
            const securityHelper = new SecurityHelper()
           
            for (const [key, value] of Object.entries(req.data)) {
                await securityHelper.detectInjections(value);
            }
        });

        return super.init()
    }

    /**
     * Handles database and non-database errors. Wraps database errors for the client; re-throws others.
     * @param {Object} error - The captured error.
     * @param {Object} req - The current request object.
     * @throws {Error} Re-throws non-database errors.
     */
    handleError(error, req) {
        if (this.isDatabaseError(error)) {
            const wrappedError = this.handleDatabaseError(error);
            req.error(wrappedError.code, wrappedError.message);
            return
        }

        throw error;
    }

    /**
     * Return a database error by throwing a wrapped DatabaseError instance.
     * @param {Object} error - The raw database error.
     * @throws {Error} A specific or generic DatabaseError.
     */
    handleDatabaseError(error) {
        return DatabaseError.wrapError(error);
    }

    /**
     * Determines if the given error is a database-related error.
     * @param {Object} error - The captured error object.
     * @returns {boolean} True if it is a database error, false otherwise.
     */
    isDatabaseError(error) {
        return error.code && typeof error.code === "number" && error.sqlState;
    }

}

module.exports = BaseService;