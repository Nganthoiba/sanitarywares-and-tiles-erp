You are a Senior ERP Architect and Laravel Domain Expert.

The system already has:

- GRN implementation
- Inventory system (objects + movements)
- Accounting system (journal, posting service)

Your task is NOT to build new modules.

Your task is to HARDEN and INTEGRATE the system.

====================================================

GOALS:

1. Make GRN workflow STRICT and SAFE
2. Prevent duplicate inventory creation
3. Enforce granite vs bulk rules strictly
4. Integrate GRN with accounting system
5. Ensure full data integrity

====================================================

TASKS:

1. Add GRN state machine enforcement
    - draft → approved → locked
    - prevent re-approval

2. Ensure idempotency:
    - inventory must not be created twice

3. Validate product type rules:
    - granite requires slabs
    - non-granite must not use slabs

4. Integrate accounting:

    On GRN approval:

    DR: Inventory Account
    CR: Goods Received Not Invoiced (GRNI) / Supplier

5. Add database-level safety:
    - unique constraints
    - transaction wrapping

6. Ensure InventoryService is atomic

7. Add tests:
    - duplicate approval
    - slab mismatch
    - accounting entry created

====================================================

OUTPUT:

- Required code changes
- Service layer updates
- Validation rules
- Accounting integration logic
- Tests
