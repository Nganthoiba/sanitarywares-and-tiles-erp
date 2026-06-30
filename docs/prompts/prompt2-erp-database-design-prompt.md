Purpose:

Generate migrations,
foreign keys,
indexes,
constraints,
and relationships.

Example:

Generate the Master Domain database schema
for the Building Materials ERP.

Modules:

- organizations
- branches
- warehouses
- storage_locations
- units
- categories
- brands
- manufacturers
- tax_profiles

Requirements:

1. PostgreSQL optimized.
2. Multi-tenant.
3. Include organization_id.
4. Include foreign keys.
5. Include indexes.
6. Include soft deletes.
7. Explain business purpose.
8. Explain relationships.
9. Generate migration code.
10. Explain scalability considerations.

# ERP DATABASE SCHEMA DESIGN PROMPT

# Version: 1.0

# Project: Tiles - Sanitary Management and Accounting System

You are acting as:

- Principal ERP Architect
- Enterprise Database Architect
- PostgreSQL Database Designer
- Senior Laravel 12 Solution Architect

Your task is to design and generate a complete, production-grade
database schema for a commercial Building Materials ERP.

===========================================================
PROJECT OVERVIEW
===========================================================

System Name:

Tiles - Sanitary Management and Accounting System

This is NOT merely a Tiles ERP.

This is a Building Materials ERP Platform supporting:

- Tiles
- Granite
- Marble
- Quartz
- Sanitaryware
- CP fittings
- Adhesives
- Accessories
- Future product categories

Technology Stack:

Backend:

- Laravel 12
- PHP 8.3+
- PostgreSQL

Frontend:

- React
- Bootstrap 5

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

===========================================================
GENERAL DATABASE RULES
===========================================================

1. Every business table MUST contain:

    organization_id

except system tables.

2. Every table MUST contain:

    created_at
    updated_at

3. Use softDeletes() where appropriate.

4. Every foreign key must have:

    foreign key constraint
    proper indexing

5. Optimize for PostgreSQL.

6. Never optimize merely for CRUD.

7. Design for:
    - Multi branch
    - Multi warehouse
    - SaaS
    - Future scalability

8. Use foreignId() relationships.

9. Use proper composite indexes.

10. Never use database ENUM types.

Use:

    PHP Enums

or
lookup tables

===========================================================
ERP PHILOSOPHY
===========================================================

The ERP models:

BUSINESS ENTITIES

- Organization
- Branch
- Warehouse
- Storage Location
- Product
- Product Variant
- Inventory Object
- Customer
- Supplier
- Invoice

BUSINESS EVENTS

- Purchase
- Sale
- Transfer
- Return
- Damage
- Adjustment
- Payment

Database tables must represent
real business concepts.

===========================================================
INVENTORY PHILOSOPHY
===========================================================

Inventory is NOT a number.

Inventory is a collection of
physical objects.

Examples:

Tiles:

100 boxes

Granite:

BG001
BG002
BG003

Sanitary:

25 pieces

Inventory Behaviors:

STANDARD
CONVERTIBLE
SLAB
SERIAL
BATCH
BUNDLE
ROLL

===========================================================
OUTPUT REQUIREMENTS
===========================================================

For EVERY table generate:

1. Business Purpose
2. Table Structure
3. Column Explanation
4. Primary Keys
5. Foreign Keys
6. Unique Constraints
7. Indexes
8. Composite Indexes
9. Laravel Migration
10. PostgreSQL Optimization Notes
11. Future Scalability Notes
12. Recommended Laravel Relationships

===========================================================
PHASE 1
MASTER DOMAIN
===========================================================

Generate database schema for:

1. organizations
2. branches
3. warehouses
4. storage_locations
5. units
6. categories
7. brands
8. manufacturers
9. tax_profiles

===========================================================
ORGANIZATIONS
===========================================================

Requirements:

- SaaS tenant
- Subscription ready
- Multi-branch capable

Fields to consider:

id
name
legal_name
code
gstin
email
phone
website
address
logo
subscription_plan
subscription_start
subscription_expiry
is_active
created_at
updated_at
deleted_at

===========================================================
BRANCHES
===========================================================

Requirements:

- One organization
- Multiple branches

Examples:

Imphal Branch
Dimapur Branch
Guwahati Branch

===========================================================
WAREHOUSES
===========================================================

Requirements:

- Multiple warehouses per branch

Examples:

Main Warehouse
Granite Yard
Tile Store
Sanitary Store

Warehouse Types:

MAIN
GRANITE_YARD
TILE_STORE
SANITARY_STORE

===========================================================
STORAGE LOCATIONS
===========================================================

Requirements:

Generic storage system.

Examples:

Tile Rack A01
Granite Stand G01
Sanitary Shelf S01

Location Types:

TILE_RACK
GRANITE_STAND
SANITARY_SHELF

===========================================================
UNITS
===========================================================

Requirements:

Examples:

PIECE
BOX
SQFT
SLAB
BAG
KG
METER

Fields:

name
symbol
type
precision

===========================================================
CATEGORIES
===========================================================

Requirements:

Self-referencing hierarchy.

Structure:

Category
↓
Subcategory

Examples:

Tiles
Ceramic
Vitrified

Granite
Indian
Imported

Fields:

parent_id
name
slug
description
sort_order
status

===========================================================
BRANDS
===========================================================

Requirements:

Flat structure.

Examples:

Kajaria
CERA
Johnson
Somany

===========================================================
MANUFACTURERS
===========================================================

Requirements:

Manufacturer master data.

Fields:

name
address
phone
email
website
status

===========================================================
TAX PROFILES
===========================================================

Requirements:

GST support.

Fields:

name
hsn_code
cgst_rate
sgst_rate
igst_rate
effective_from
effective_to
status

Do NOT store tax percentages
directly inside products.

===========================================================
LARAVEL OUTPUT FORMAT
===========================================================

For every table generate:

Migration:

Schema::create(...)

Model:

class Example extends Model

Relationships:

belongsTo()
hasMany()
belongsToMany()

Indexes:

$table->index(...)
$table->unique(...)
$table->foreign(...)

===========================================================
FINAL GOAL
===========================================================

Generate a production-grade,
commercial ERP database schema
that can support:

- 1000+ organizations
- millions of inventory records
- granite slabs
- tile conversions
- multi-branch operations
- multi-warehouse operations
- SaaS subscriptions
- future expansion

Never optimize for CRUD convenience.

Always optimize for:

- ERP correctness
- maintainability
- scalability
- SaaS architecture
- PostgreSQL performance
