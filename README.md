# SAP CAP E-Commerce Example

## Abstract
This repository showcases a simple e-commerce application built using SAP Cloud Application Programming Model (CAP) and deployed as a Multi-Target Application (MTA) on SAP Business Technology Platform (BTP). The project highlights best practices for secure application development, including the use of `xs-security`, scopes, roles, and oData annotations for data protection.

---

## Scope
The goal of this project is to demonstrate how to design and implement a secure and interactive e-commerce application using SAP CAP. This project is intended for developers and organizations looking to adopt SAP CAP for building modern, secure cloud-based applications.

---

## Entities
The application is based on the following core entities:

1. **Products**: Represents the available products in the e-commerce platform.
   - Fields:
     - `ID`: Primary key (UUID, auto-generated by CAP).
     - `name`: String (100), not null.
     - `description`: String (500).
     - `price`: Decimal (10, 2), not null.
     - `stock`: Integer, not null.
     - `created_at`: Timestamp, not null (auto-populated on record creation).
     - `updated_on`: Timestamp (auto-updated on record modification).

2. **Orders**: Tracks orders placed by customers.
   - Fields:
     - `ID`: Primary key (UUID, auto-generated by CAP).
     - `customer`: Association to `Customers`, not null.
     - `product`: Association to `Products`, not null.
     - `quantity`: Integer, not null.
     - `order_date`: Timestamp, not null (auto-populated on order creation).
     - `created_at`: Timestamp, not null (auto-populated on record creation).
     - `updated_on`: Timestamp (auto-updated on record modification).

3. **Customers**: Manages customer information.
   - Fields:
     - `ID`: Primary key (UUID, auto-generated by CAP).
     - `name`: String (100), not null.
     - `email`: String (100), not null.
     - `address`: String (200).
     - `phone`: String (15).
     - `created_at`: Timestamp, not null (auto-populated on record creation).
     - `updated_on`: Timestamp (auto-updated on record modification).

---

## Roles
The application defines the following roles:

1. **Admin**:
   - Full access (Create, Read, Update, Delete) to all entities (`Products`, `Orders`, `Customers`).

2. **Inventory Manager**:
   - Full access (Create, Read, Update, Delete) only to the `Products` entity.

3. **Sales Manager**:
   - Full access (Create, Read, Update, Delete) only to the `Orders` entity.

4. **Store Supervisor**:
   - Full access (Create, Read, Update, Delete) to both `Products` and `Orders`.

---

## Features
- Multi-Target Application (MTA) structure for seamless integration with SAP BTP.
- Secure role-based access control using `xs-security`.
- oData annotations for data protection at the entity and field levels.
- Example implementation for learning and adapting SAP CAP best practices.