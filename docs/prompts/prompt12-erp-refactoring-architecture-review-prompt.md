You are acting as:

- Chief Software Architect
- Principal ERP Architect
- Enterprise Solution Architect
- Domain Driven Design Expert
- Senior Laravel 12 Architect
- Senior React Architect
- PostgreSQL Performance Architect
- Security Architect
- DevOps Architect

Your task is to perform a complete
architectural review, refactoring,
optimization, and future scalability
assessment of a commercial
Building Materials ERP.

=========================================================
PROJECT
=========================================================

System:

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
- Future business domains

Technology:

Backend:

- Laravel 12
- PHP 8.3+
- PostgreSQL

Frontend:

- React
- Bootstrap 5
- TanStack Query

Architecture:

- DDD
- Modular Monolith
- Event Driven
- Multi-tenant SaaS

=========================================================
PRIMARY OBJECTIVE
=========================================================

Review the entire ERP architecture
and determine:

1. What is correct.
2. What is incorrect.
3. What can be simplified.
4. What can be optimized.
5. What can be scaled.
6. What should be refactored.
7. What should be redesigned.

Never preserve poor architecture
for backward compatibility.

=========================================================
REVIEW DOMAINS
=========================================================

Review:

Master Domain

Security Domain

Product Domain

Inventory Domain

Purchase Domain

Sales Domain

Accounting Domain

Workflow Domain

Reporting Domain

Subscription Domain

=========================================================
DATABASE REVIEW
=========================================================

Analyze:

- table design
- normalization
- denormalization
- foreign keys
- indexes
- composite indexes
- constraints
- naming conventions
- partitioning
- soft deletes
- audit columns

Review:

- PostgreSQL optimization
- query performance
- future scalability

Detect:

- duplicate tables
- missing relationships
- unnecessary tables
- missing indexes
- incorrect constraints

=========================================================
MULTI TENANCY REVIEW
=========================================================

Verify:

organization_id

exists in all business tables.

Review:

- tenant isolation
- row security
- data leakage risks
- branch isolation
- warehouse isolation

=========================================================
DDD REVIEW
=========================================================

Review:

Bounded Contexts

Examples:

Master

Product

Inventory

Purchase

Sales

Accounting

Workflow

Determine:

- coupling
- cohesion
- aggregate boundaries
- ownership rules

=========================================================
LARAVEL MODEL REVIEW
=========================================================

Analyze:

- relationships
- scopes
- casts
- accessors
- mutators
- observers
- traits

Detect:

- fat models
- duplicated logic
- circular relationships
- missing relationships

=========================================================
SERVICE LAYER REVIEW
=========================================================

Review:

- business logic
- transaction handling
- exception handling
- DTO usage
- authorization
- validation
- audit logging

Detect:

- service coupling
- duplicate services
- missing services

=========================================================
EVENT ARCHITECTURE REVIEW
=========================================================

Review:

- events
- listeners
- subscribers
- queue usage

Detect:

- synchronous coupling
- missing events
- event duplication
- event storms

=========================================================
WORKFLOW REVIEW
=========================================================

Review:

- workflow definitions
- workflow engine
- condition engine
- action engine
- approval engine

Detect:

- hardcoded workflows
- missing abstractions
- workflow bottlenecks

=========================================================
INVENTORY REVIEW
=========================================================

Review:

- inventory objects
- inventory movements
- reservations
- allocations
- transfers
- snapshots
- valuation

Verify support for:

Tiles

Granite

Marble

Sanitaryware

=========================================================
GRANITE REVIEW
=========================================================

Review:

- slab handling
- remnants
- transfers
- allocations
- cuts
- valuation

Detect:

- area inconsistencies
- stock leakage
- allocation errors

=========================================================
PURCHASE REVIEW
=========================================================

Review:

PO

GRN

Supplier Invoice

Purchase Return

Verify:

Inventory creation
occurs only via GRN.

=========================================================
SALES REVIEW
=========================================================

Review:

Quotation

Sales Order

Reservation

Allocation

Dispatch

Invoice

Return

Verify:

Inventory reduction
occurs only during dispatch.

=========================================================
ACCOUNTING REVIEW
=========================================================

Review:

- chart of accounts
- journals
- journal entries
- ledgers
- payments
- receipts

Verify:

Double entry accounting.

Detect:

- imbalance risks
- direct balance updates
- accounting violations

=========================================================
REPORTING REVIEW
=========================================================

Review:

- reports
- dashboards
- aggregates
- snapshots
- materialized views

Detect:

- expensive queries
- missing indexes
- report bottlenecks

=========================================================
API REVIEW
=========================================================

Review:

- routes
- controllers
- requests
- resources
- policies

Detect:

- fat controllers
- duplicated APIs
- security vulnerabilities
- N+1 queries

=========================================================
REACT REVIEW
=========================================================

Review:

- module structure
- pages
- components
- hooks
- services
- stores
- validations

Detect:

- duplicated components
- business logic in UI
- prop drilling
- performance issues

=========================================================
SECURITY REVIEW
=========================================================

Review:

- RBAC
- permissions
- policies
- authentication
- authorization
- tenancy isolation

Detect:

- privilege escalation
- insecure APIs
- data leaks
- missing validations

=========================================================
PERFORMANCE REVIEW
=========================================================

Review:

- queries
- indexes
- joins
- caching
- queues
- events
- React rendering

Detect:

- N+1 problems
- full table scans
- memory leaks
- event bottlenecks

=========================================================
SCALABILITY REVIEW
=========================================================

Evaluate support for:

- 1000+ organizations
- 100+ branches
- millions of inventory objects
- millions of transactions
- large granite inventories
- large reporting workloads

=========================================================
MAINTAINABILITY REVIEW
=========================================================

Evaluate:

- code duplication
- complexity
- readability
- module isolation
- naming consistency
- future extensibility

=========================================================
AUDIT REVIEW
=========================================================

Verify:

who

when

what

before

after

reason

ip

device

are properly tracked.

=========================================================
REFACTORING ANALYSIS
=========================================================

Classify findings:

CRITICAL

HIGH

MEDIUM

LOW

For each issue provide:

Problem

Risk

Impact

Recommendation

Migration Strategy

=========================================================
ARCHITECTURAL SCORECARD
=========================================================

Rate each domain:

Database .......... /10

DDD ............... /10

Models ............ /10

Services .......... /10

Events ............ /10

Inventory ......... /10

Workflow .......... /10

Purchase .......... /10

Sales ............. /10

Accounting ........ /10

Reporting ......... /10

Security .......... /10

React ............. /10

Performance ....... /10

Scalability ....... /10

Maintainability ... /10

=========================================================
OUTPUT FORMAT
=========================================================

Generate:

1. Executive Summary
2. Architecture Diagram
3. Domain Review
4. Database Review
5. Service Review
6. Event Review
7. Workflow Review
8. Inventory Review
9. Accounting Review
10. API Review
11. React Review
12. Security Review
13. Performance Review
14. Scalability Review
15. Technical Debt
16. Refactoring Plan
17. Migration Strategy
18. Architectural Scorecard
19. Future Roadmap

=========================================================
FINAL GOAL
=========================================================

Transform the ERP into an
enterprise-grade system supporting:

- Multi-tenant SaaS
- Multi-branch
- Multi-warehouse
- Granite slabs
- Tile conversions
- Event-driven architecture
- Workflow engine
- Double-entry accounting
- Business intelligence
- Audit trails
- Millions of transactions

Never optimize for CRUD.

Always optimize for:

- ERP correctness
- Domain integrity
- Maintainability
- Scalability
- Security
- Performance
- Long-term architecture
