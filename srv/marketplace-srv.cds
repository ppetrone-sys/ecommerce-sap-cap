using ecommerce.cap as db from '../db/schema';

service MarketplaceService {

    @requires: ['Admin']
    @restrict: [{grant: [
        'READ',
        'CREATE',
        'UPDATE',
        'DELETE'
    ]}]
    entity Products  as
        projection on db.Products {
            ID,
            name,
            description,
            price,
            stock
        };

    @requires: [
        'SalesManager',
        'Admin'
    ]
    @restrict: [
        {
            grant: 'READ',
            to   : 'SalesManager'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'Admin'
        }
    ]
    entity Orders    as
        projection on db.Orders {
            ID,
            quantity,
            order_date
        };

    @requires: [
        'InventoryManager',
        'Admin'
    ]
    @restrict: [
        {
            grant: 'READ',
            to   : 'InventoryManager'
        },
        {
            grant: [
                'CREATE',
                'UPDATE',
                'DELETE'
            ],
            to   : 'Admin'
        }
    ]
    entity Customers as
        projection on db.Customers {
            ID,
            name,
            email,
            address,
            phone
        };

    function exampleAutomaticTransaction()      returns {};
    function exampleNestedTransaction()         returns {};
    function exampleManualTransaction()         returns {};
    function exampleStoreProcedureTransaction() returns {};
}
