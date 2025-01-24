class SecurityError extends Error {
    constructor(message, code = 400) {
        super(message);
        this.name = "SecurityException";
        this.code = code;
    }
}

class XssSecurityError extends SecurityError {
    constructor(message = "Potential XSS attack detected") {
        super(message, 400);
        this.name = "XssSecurityException";
    }
}

class SqlSecurityError extends SecurityError {
    constructor(message = "Potential SQL injection detected") {
        super(message, 400);
        this.name = "SqlSecurityException";
    }
}

class NoSqlSecurityError extends SecurityError {
    constructor(message = "Potential NoSQL injection detected") {
        super(message, 400);
        this.name = "NoSqlSecurityException";
    }
}

module.exports = {
    SecurityError,
    XssSecurityError,
    SqlSecurityError,
    NoSqlSecurityError,
};