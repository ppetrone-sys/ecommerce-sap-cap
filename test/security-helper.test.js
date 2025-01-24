const {
    XssSecurityError,
    SqlSecurityError,
    NoSqlSecurityError,
} = require("../srv/src/errors/security-errors");

const SecurityHelper = require("../srv/src/helpers/security-helper");

describe("SecurityHelper", () => {
    let securityHelper;

    beforeEach(() => {
        securityHelper = new SecurityHelper();
    });

    /* Tests for the detectXss function
       This suite verifies that the method correctly detects various types of XSS attacks, ranging from simple inline scripts to complex injection patterns.
       It also ensures that safe and harmless inputs are not flagged as threats or throw errors.
    */
    describe("detectXss", () => {
        let testCounter = 0;

        it("[T-XSS-" + (++testCounter) + "] Should throw XssSecurityError for inline script injection", async () => {
            const input = '<script>alert("xss")</script>';
            await expect(securityHelper.detectXss(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-XSS-" + (++testCounter) + "] Should throw XssSecurityError for attribute-based XSS injection", async () => {
            const input = '<img src="x" onerror="alert(\'XSS\')">';
            await expect(securityHelper.detectXss(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-XSS-" + (++testCounter) + "] Should throw XssSecurityError for event handler injection", async () => {
            const input =
                "<button onclick=\"javascript:alert('XSS')\">Click Me</button>";
            await expect(securityHelper.detectXss(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-XSS-" + (++testCounter) + "] Should throw XssSecurityError for incomplete escaping or malformed input", async () => {
            const input =
                '<div><script>console.log("safe")</script><img src="x" onerror="alert(\'XSS\')">';
            await expect(securityHelper.detectXss(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-XSS-" + (++testCounter) + "] Should throw XssSecurityError for complex injection (combination of tags)", async () => {
            const input =
                "<div><img src=x onerror=\"alert('XSS')\"></div><script>document.write('<b>XSS</b>');</script>";
            await expect(securityHelper.detectXss(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-XSS-" + (++testCounter) + "] Should not throw an error when no XSS is detected (normal input)", async () => {
            const input = "normal input from user";
            await expect(
                securityHelper.detectXss(input)
            ).resolves.toBeUndefined();
        });

        it("[T-XSS-" + (++testCounter) + "] Should not throw an error when input is safe HTML", async () => {
            const input = "<div>Hello, world!</div>";
            await expect(
                securityHelper.detectXss(input)
            ).resolves.toBeUndefined();
        });
    });

    /*
        Tests for the detectSqlInjection function
        This suite verifies that the method detects various SQL injection patterns, including typical malicious inputs such as DROP, CREATE, or SELECT statements with boolean-based injections like '1=1'.
        It ensures that harmless inputs, even those resembling SQL queries, do not trigger exceptions.
    */
    describe("detectSqlInjection", () => {
        let testCounter = 0;

        it("[T-SQL-01] Should throw SqlSecurityError when SQL injection is detected (CREATE TABLE)", async () => {
            const input = "CREATE TABLE users";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection is detected (1=1 OR)", async () => {
            const input = "SELECT * FROM users WHERE id = '1 OR 1=1'";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection is detected (DROP TABLE)", async () => {
            const input = "DROP TABLE users";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection is detected (lowercase)", async () => {
            const input =
                "select * from users where username = 'admin' and password = 'password'";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection is detected (uppercase)", async () => {
            const input =
                "SELECT * FROM USERS WHERE USERNAME = 'ADMIN' AND PASSWORD = 'PASSWORD'";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should not throw an error when no SQL injection is detected", async () => {
            const input = "normal input from user";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).resolves.toBeUndefined();
        });

        it("[T-SQL-" + (++testCounter) + "] Should not throw an error when no SQL injection is detected", async () => {
            const input = "normal imput from user";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).resolves.toBeUndefined();
        });

        it("[T-SQL-" + (++testCounter) + "] Should not throw SqlSecurityError when 'insert' keyword is detected.", async () => {
            const input = "status: insert ";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).resolves.toBeUndefined();
        });

        it("[T-SQL-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection pattern is detected, even with 'insert' keyword.", async () => {
            const input = "status: insert SELECT * FROM users WHERE id = '1 OR 1=1'";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).rejects.toThrow(SqlSecurityError);
        });

        it("[T-SQL-" + (++testCounter) + "] Should not throw SqlSecurityError when 'update' keyword is detected.", async () => {
            const input = "update table";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).resolves.toBeUndefined();
        });

        it("[T-SQL-" + (++testCounter) + "] Should not throw SqlSecurityError when 'delete' keyword is detected.", async () => {
            const input = "{status: delete}";
            await expect(
                securityHelper.detectSqlInjection(input)
            ).resolves.toBeUndefined();
        });
    });

    /* 
        Tests for the detectNoSqlInjection function
        This suite ensures that the method identifies NoSQL injection attempts, including malicious operators such as $ne, $or, $gt, or $regex, as well as nested or complex queries. 
        It also verifies that harmless JSON-like inputs or valid queries do not cause false positives.
    */
    describe("detectNoSqlInjection", () => {
        let testCounter = 0;

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected ($ne operator)", async () => {
            const input = '{ "username": { "$ne": null } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected ($gt operator)", async () => {
            const input = '{ "age": { "$gt": "" } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected (lowercase input)", async () => {
            const input = '{ "username": { "$exists": true } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected (uppercase input)", async () => {
            const input = '{ "USERNAME": { "$EXISTS": true } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected (findOne with malicious input)", async () => {
            const input = "bob try to findOne";
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError for dangerous projection injection", async () => {
            const input =
                '{ "username": "admin", "password": { "$regex": ".*" } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError for nested NoSQL injection", async () => {
            const input =
                '{ "$and": [ { "username": { "$ne": "guest" } }, { "role": { "$eq": "admin" } } ] }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError for input with suspicious keys", async () => {
            const input = '{ "key": "value", "$where": "this.key == value" }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw NoSqlSecurityError when NoSQL injection is detected ($or operator)", async () => {
            const input =
                '{ "$or": [{ "username": "admin" }, { "role": "superuser" }] }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should not throw an error when no NoSQL injection is detected (normal input)", async () => {
            const input =
                '{ "username": "normalUser", "password": "securePass123" }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).resolves.toBeUndefined();
        });

        it("[T-NoSQL-" + (++testCounter) + "] Should throw an error when input is not a safe query-like structure", async () => {
            const input = '{ "product": "phone", "price": { "$lt": 1000 } }';
            await expect(
                securityHelper.detectNoSqlInjection(input)
            ).rejects.toThrow(NoSqlSecurityError);
        });
    });

    /* 
        Tests for the detectInjections function
        This suite verifies that the detectInjections method correctly identifies issues from 
        all injection detection methods (XSS, SQL injection, NoSQL injection).
        Each test ensures that the correct exception is thrown for a specific type of injection.
    */
    describe("detectInjections", () => {
        let testCounter = 0;

        it("[T-Hybrid-" + (++testCounter) + "] Should throw XssSecurityError when XSS is detected", async () => {
            const input = '<script>alert("xss")</script>';
            await expect(securityHelper.detectInjections(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-Hybrid-" + (++testCounter) + "] Should throw SqlSecurityError when SQL injection is detected", async () => {
            const input = "SELECT * FROM users WHERE id = '1 OR 1=1'";
            await expect(securityHelper.detectInjections(input)).rejects.toThrow(
                SqlSecurityError
            );
        });

        it("[T-Hybrid-" + (++testCounter) + "] Should throw XssSecurityError when multiple injections exist, prioritizing XSS", async () => {
            const input = '<script>alert("xss")</script> SELECT * FROM users WHERE id = \'1 OR 1=1\'';
            await expect(securityHelper.detectInjections(input)).rejects.toThrow(
                XssSecurityError
            );
        });

        it("[T-Hybrid-" + (++testCounter) + "] Should throw SqlSecurityError when both SQL and NoSQL injections exist", async () => {
            const input = "SELECT * FROM users WHERE id = '1 OR 1=1' { \"$ne\": null }";
            // SQL should be detected first
            await expect(securityHelper.detectInjections(input)).rejects.toThrow(
                SqlSecurityError
            );
        });


        it("[T-Hybrid-" + (++testCounter) + "] Should not throw any error for a safe input", async () => {
            const input = "normal input from user";
            await expect(
                securityHelper.detectInjections(input)
            ).resolves.toBeUndefined();
        });
    });
});
