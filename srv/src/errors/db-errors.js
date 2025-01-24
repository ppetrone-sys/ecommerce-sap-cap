const cds = require("@sap/cds");
const { v4: uuidv4 } = require("uuid");
const LOG = cds.log("keymapping-logger");

class DatabaseError extends Error {
    constructor({ message = "Database error occurred", code = 400, options = {} }) {
        super(message, options);
        this.name = "DatabaseError";
        this.code = code;
        this.options = options;
        this.timestamp = options.timestamp
    }

    /**
     * Converts the current error instance into a custom error object suitable for client responses.
     * @returns {Object} A formatted error object containing code, message, and additional details.
     */
    toCustomError() {
        const detailedMessage = [
            this.message || "An error occurred.",
            this.options?.logId ? `Log ID: ${this.options.logId}` : "",
            this.options?.timestamp ? `Timestamp: ${this.options.timestamp}` : "",
        ]
            .filter(Boolean)
            .join(" | ");

        return {
            code: this.code || 500,
            message: detailedMessage || "Internal Server Error",
            detail: this.options
        };
    }

    /**
     * Wrap a raw database error into a formatted custom error object.
     * Logs the original error and assigns a unique log ID and timestamp for tracking.
     * @param {Object} dbError - The raw database error.
     * @returns {Object} A formatted error object ready for the client.
     */
    static wrapError(dbError) {
        const HANA_ERROR_MAPPING = {
            301: { class: DuplicateKeyError, message: "Duplicate key found", code: 409 },
            305: { class: ResourceNotFoundError, message: "Resource not found", code: 404 }
        };

        const logInfo = { logId: 'db-error-' + uuidv4(), timestamp: new Date().toISOString() }

        DatabaseError.logDatabaseError(logInfo, dbError);

        const mappedError = HANA_ERROR_MAPPING[dbError.code];
        if (mappedError) {
            return new mappedError.class({ options: logInfo }).toCustomError();
        }

        return DatabaseError.createDatabaseError(logInfo);
    }

    /**
     * @param {Object} logInfo - The log details containing logId and timestamp.
     * @param {Object} dbError - The raw database error object.
     * @returns {void}
     */
    static logDatabaseError(logInfo, dbError) {
        const logError = {
            logId: logInfo.logId,
            timestamp: logInfo.timestamp,
            message: dbError.message,
            dbCode: dbError.code,
            stack: dbError.stack
        };
        LOG.info(logError);
    }

    /**
     * Create a fallback DatabaseError for unmapped errors.
     * @param {Object} logInfo - The log details containing logId and timestamp.
     * @returns {Object} A fallback error object.
     */
    static createDatabaseError(logInfo) {
        return new DatabaseError({
            message: "Unexpected database error occurred. Contact support with the log ID",
            code: 400,
            options: logInfo,
        }).toCustomError();
    }
}


class DuplicateKeyError extends DatabaseError {
    constructor({ options = {} }) {
        super({ message: "Duplicate key found", code: 409, options });
        this.name = "DuplicateKeyError";
    }
}

class ResourceNotFoundError extends DatabaseError {
    constructor({ options = {} }) {
        super({ message: "Resource not found", code: 404, options });
        this.name = "ResourceNotFoundError";
    }
}

module.exports = {
    DatabaseError,
    DuplicateKeyError,
    ResourceNotFoundError
};
