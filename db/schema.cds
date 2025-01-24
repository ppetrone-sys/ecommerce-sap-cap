namespace ecommerce.cap;


using { cuid, managed } from '@sap/cds/common';

entity Products : cuid, managed {
    name        : String(100) @mandatory;    // Product name
    description : String(500);               // Product description
    price       : Decimal(10, 2) @mandatory; // Product price
    stock       : Integer @mandatory;        // Available stock
}

entity Orders : cuid, managed {
    customer : Association to Customers @mandatory; // Link to customer
    product  : Association to Products @mandatory;  // Link to product
    quantity    : Integer @mandatory;               // Quantity of product ordered
    order_date  : DateTime @mandatory;              // Date of the order
}

entity Customers : cuid, managed {
    name    : String(100) @mandatory; // Customer name
    email   : String(100) @mandatory; // Customer email
    address : String(200);            // Customer address
    phone   : String(15);             // Customer phone number
}