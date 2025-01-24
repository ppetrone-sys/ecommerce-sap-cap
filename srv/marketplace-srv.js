const cds = require("@sap/cds");
const LOG = cds.log("ecommerce-logger");
const AuthorizationService = require("./authorization-service");
const { callProcedure } = require("./src/helpers/db-helper");
const BaseService = require("./base-service");


class MarketplaceService extends BaseService {
    init() {
        this.authorizationService = new AuthorizationService();
        return super.init();
    }

    async exampleAutomaticTransaction() {
        const { Products, Customers } = cds.entities('ecommerce.cap');

        const product = await cds.transaction(req).run(
            SELECT.one.from(Products).where({ ID: 'f27b53d1-72d8-4c94-b842-b56ffb20d0c4' })
        );

        const customer = await cds.transaction(req).run(
            SELECT.one.from(Customers).where({ ID: 'b7d18d1e-3cc3-478b-8b7c-67681b7e2f9f' })
        );

        return {
            product,
            customer
        };
    }

    async exampleNestedTransaction() {
        const { Products, Customers, Orders } = cds.entities('ecommerce.cap');

        const orderId = 'db9a2e77-0dfb-46a8-bf41-f69ad1e3f789';
        const customerId = 'b7d18d1e-3cc3-478b-8b7c-67681b7e2f9f';

        const order = await db.read(Orders).where({ ID: orderId });

        await db.update(Customers, customerId).set({ address: '123 Updated Street' });

        await db.insert(Products).entries({
            name: 'Hardcoded Product',
            description: 'This is a hardcoded product for testing',
            price: 49.99,
            stock: 20,
        });

        return { message: 'Nested transaction completed successfully', order };
    }

    async exampleManualTransaction() {
        const { Products, Orders } = cds.entities('ecommerce.cap');
        const customerId = 'b7d18d1e-3cc3-478b-8b7c-67681b7e2f9f';
        const productId = 'dc32dbdb-89f1-4d3a-ae32-7f0d26c45068';

        // Root transaction
        const db = cds.transaction(this);

        try {
            const quantity = 5;
            // Root transaction - Order creation
            const order = await db.run(
                INSERT.into(Orders).entries({
                    customer: customerId,
                    product_ID: productId,
                    quantity: quantity,
                    order_date: new Date()
                })
            );

            if (!order) throw new Error('Order creation failed!');

            const updateStock = await db.run(
                UPDATE(Products)
                    .set({ stock: { '-=': quantity } })
                    .where({ ID: productId })
            );

            if (updateStock !== 1) throw new Error('Stock update failed!');


            // Commit root transaction
            await db.commit();
            return order;

        } catch (error) {
            // Rollback root transaction and nested ones
            await db.rollback();
            throw error;
        }
    }

    async exampleStoreProcedureTransaction() {
        const { Orders } = cds.entities('ecommerce.cap');

        try {

            await callProcedure("P_STOREPROCEDURETRANSACTION");

            // Hardcoded ID for the order inserted in the stored procedure
            const orderId = 'db9a2e77-0dfb-46a8-bf41-f69ad1e3f999';

            // Query to fetch the inserted order
            const order = await cds.run(
                SELECT.one.from(Orders).where({ ID: orderId })
            );

            if (!order) {
                throw new Error('The requested order could not be retrieved.');
            }

            return {
                message: 'Stored procedure executed successfully',
                order,
            };
        } catch (error) {
            this.handleError(error, req)
        }
    }

    async exampleStoreProcedureTransaction() {
        const { Products, Orders } = cds.entities('ecommerce.cap');
        DELETE.from(Products).where({ id: { '=': 'f27b53d1-72d8-4c94-b842-b56ffb20d0c4' } })
        DELETE.from(Orders).where({ id: { '=': 'db9a2e77-0dfb-46a8-bf41-f69ad1e3f999' } })
    }
}

module.exports = MarketplaceService;
