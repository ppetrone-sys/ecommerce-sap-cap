const cds = require("@sap/cds");
const { sanitize } = require("perfect-express-sanitizer");
const LOG = cds.log("keymapping-logger");


const {
    XssSecurityError,
    SqlSecurityError,
    NoSqlSecurityError,
} = require("../errors/security-errors");

module.exports = class SecurityHelper {
    constructor() { }

    /**
     * Removes keywords defined in `allowedKeys` from a string and trims excess spaces.
     * @param {string} input - The input string to clean.
     * @returns {string} - The cleaned and normalized string.
     */
    clear(input) {
        let allowedKeys = ['insert', 'update', 'delete'];

        try {
            allowedKeys = process.env.ALLOWED_KEYS.split(';');
        } catch(error){
            LOG.error("ALLOWED_KEYS getting failed");
        }

        // Check if input is a string
        if (typeof input !== 'string') {
            LOG.warn("Input is not a string; returning input unchanged.");
            return input;
        }

        return input
            .trim()
            .split(/\s+/)
            .filter(token => !allowedKeys.includes(token.toLowerCase()))
            .join(" ");
    }

    /**
     * Utility function to check if validation should be skipped based on input type.
     * @param {any} value - The input to check.
     * @param {string} context - The context of the validation (e.g., "SQL injection").
     * @returns {boolean} - True if validation should be skipped, false otherwise.
     */
    shouldSkipValidation(value, context) {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
            LOG.info(`Skipping ${context} detection for null, undefined, or empty string input.`);
            return true;
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            LOG.info(`Skipping ${context} detection for non-string input.`);
            return true;
        }

        if (typeof value === 'string' && !isNaN(value.trim())) {
            LOG.info(`Skipping ${context} detection for string input that is a numeric value.`);
            return true;
        }
    
        return false;
    }

    /**
     * Detects potential XSS attacks and throws an error if detected.
     * @param {string} value - Input to validate.
     * @throws {XssSecurityError} - If XSS is detected.
     */
    async detectXss(value) {
        if (this.shouldSkipValidation(value, "XSS")) return;

        let clearInput = this.clear(value);
        const hasXss = await sanitize.detectXss(clearInput);
        if (hasXss) throw new XssSecurityError();
    }

    /**
     * Detects potential SQL injection and throws an error if detected.
     * @param {string} value - Input to validate.
     * @param {number} [sensitivity=5] - Detection sensitivity.
     * @throws {SqlSecurityError} - If SQL injection is detected.
     */
    async detectSqlInjection(value, sensitivity = 5) {
        if (this.shouldSkipValidation(value, "SQL injection")) return;
        console.log('====> detectSqlInjection.sensitivity -> ', sensitivity)
        let clearInput = this.clear(value);
        let hasSqlInjection =
            await sanitize.detectSqlInj(
                clearInput,
                sensitivity
            );

        if (!hasSqlInjection) {
            hasSqlInjection = await sanitize.detectSqlInj(
                clearInput.toLowerCase(),
                sensitivity
            );
        }

        if (hasSqlInjection) 
            throw new SqlSecurityError();
    }

    /**
     * Detects potential NoSQL injection and throws an error if detected.
     * @param {string} value - Input to validate.
     * @param {number} [sensitivity=5] - Detection sensitivity.
     * @throws {NoSqlSecurityError} - If NoSQL injection is detected.
     */
    async detectNoSqlInjection(value, sensitivity = 5) {
        if (this.shouldSkipValidation(value, "NoSQL injection")) return;

        let clearInput = this.clear(value);
        let hasNoSqlInjection =
            await sanitize.detectNoSqlInj(
                clearInput,
                sensitivity
            );

        if (!hasNoSqlInjection) {
            hasNoSqlInjection = await sanitize.detectNoSqlInj(
                clearInput.toLowerCase(),
                sensitivity
            );
        }

        if (hasNoSqlInjection) {
            throw new NoSqlSecurityError();
        }
    }

    /**
     * Checks for XSS, SQL injection, and NoSQL injection in input.
     * @param {string} value - Input to validate.
     * @throws {XssSecurityError|SqlSecurityError|NoSqlSecurityError} - If any injection is detected.
     */
    async detectInjections(value) {
        let sqlSeverity = 3;
        let noSqlSeverity = 3;

        try {
            sqlSeverity = process.env.SQL_SEVERITY;
        } catch(error){
            LOG.error("SQL_SEVERITY getting failed");
        }

        try {
            noSqlSeverity = process.env.NOSQL_SEVERITY;
        } catch(error){
            LOG.error("NOSQL_SEVERITY getting failed");
        }

        await this.detectXss(value);
        await this.detectSqlInjection(value, sqlSeverity);
        await this.detectNoSqlInjection(value, noSqlSeverity);
    }
}